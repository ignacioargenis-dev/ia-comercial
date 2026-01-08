const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const leadsService = require('./leadsService');
const notificationService = require('./notificationService');
const { LLMResponse, LLMResponseSchema } = require('../models/Lead');
const { ZodError } = require('zod');

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Leer el prompt del sistema
const systemPromptPath = path.join(__dirname, '../prompts/systemPrompt.txt');
let systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');

// Reemplazar variables del prompt
systemPrompt = systemPrompt.replace(/{BUSINESS_NAME}/g, process.env.BUSINESS_NAME || 'Nuestro Negocio');

/**
 * Servicio de IA para gestionar conversaciones con respuestas estructuradas
 */
class AIService {
  
  constructor() {
    // Cache de conversaciones en memoria para mejor rendimiento
    this.conversacionesCache = new Map();
    // Número máximo de reintentos para obtener JSON válido
    this.MAX_REINTENTOS = 3;
  }

  /**
   * Procesar mensaje del usuario
   */
  async procesarMensaje(sessionId, mensaje, canal = 'web') {
    try {
      // Obtener o crear historial de conversación
      let conversacion = this.obtenerConversacion(sessionId);
      
      // Agregar mensaje del usuario
      conversacion.push({
        role: 'user',
        content: mensaje
      });

      // Llamar a OpenAI con reintentos para obtener respuesta válida
      const llmResponse = await this.generarRespuestaEstructurada(conversacion);

      // Agregar respuesta del asistente al historial (solo el reply)
      conversacion.push({
        role: 'assistant',
        content: JSON.stringify({
          reply: llmResponse.getRespuesta(),
          lead: llmResponse.getLead().toJSON()
        })
      });

      // Guardar conversación en base de datos
      leadsService.guardarConversacion(sessionId, conversacion, canal);
      
      // Actualizar cache
      this.conversacionesCache.set(sessionId, conversacion);

      // Analizar y guardar lead si está completo
      await this.procesarYGuardarLead(sessionId, llmResponse.getLead());

      return {
        respuesta: llmResponse.getRespuesta(),
        lead: llmResponse.getLead(),
        conversacionCompleta: llmResponse.getLead().estaCompleto()
      };

    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      throw new Error('Error al procesar el mensaje. Por favor intenta nuevamente.');
    }
  }

  /**
   * Generar respuesta estructurada usando OpenAI con validación y reintentos
   */
  async generarRespuestaEstructurada(conversacion, intento = 1) {
    try {
      const mensajes = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...conversacion
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: mensajes,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" } // Forzar respuesta JSON
      });

      const contenidoRaw = completion.choices[0].message.content;

      // Intentar parsear y validar el JSON
      try {
        const jsonParsed = JSON.parse(contenidoRaw);
        
        // Validar con Zod y crear instancia de LLMResponse
        const llmResponse = new LLMResponse(jsonParsed);
        
        console.log(`✅ Respuesta JSON válida obtenida - Estado del lead: ${llmResponse.getLead().estado}`);
        
        return llmResponse;

      } catch (error) {
        // Error de validación
        if (error instanceof ZodError) {
          console.warn(`⚠️ Validación Zod falló (intento ${intento}/${this.MAX_REINTENTOS}):`, error.errors);
          
          if (intento < this.MAX_REINTENTOS) {
            // Agregar mensaje de corrección al historial
            const mensajeCorreccion = this.construirMensajeCorreccion(error, contenidoRaw);
            conversacion.push({
              role: 'assistant',
              content: contenidoRaw
            });
            conversacion.push({
              role: 'user',
              content: mensajeCorreccion
            });
            
            // Reintentar
            return await this.generarRespuestaEstructurada(conversacion, intento + 1);
          }
        } else if (error instanceof SyntaxError) {
          console.warn(`⚠️ JSON inválido (intento ${intento}/${this.MAX_REINTENTOS}):`, error.message);
          
          if (intento < this.MAX_REINTENTOS) {
            // Agregar mensaje de corrección
            conversacion.push({
              role: 'assistant',
              content: contenidoRaw
            });
            conversacion.push({
              role: 'user',
              content: 'ERROR: Tu respuesta anterior no es un JSON válido. Recuerda que debes responder SOLO con un objeto JSON siguiendo la estructura exacta especificada en las instrucciones.'
            });
            
            // Reintentar
            return await this.generarRespuestaEstructurada(conversacion, intento + 1);
          }
        }
        
        // Si llegamos aquí, se agotaron los reintentos
        throw new Error(`No se pudo obtener una respuesta JSON válida después de ${this.MAX_REINTENTOS} intentos`);
      }

    } catch (error) {
      console.error('Error al generar respuesta estructurada:', error);
      
      // Si es el último intento, lanzar error
      if (intento >= this.MAX_REINTENTOS) {
        throw error;
      }
      
      // Si hay error de API, reintentar
      console.warn(`⚠️ Error de API (intento ${intento}/${this.MAX_REINTENTOS}), reintentando...`);
      await this.esperar(1000 * intento); // Backoff exponencial
      return await this.generarRespuestaEstructurada(conversacion, intento + 1);
    }
  }

  /**
   * Construir mensaje de corrección basado en errores de validación Zod
   */
  construirMensajeCorreccion(zodError, jsonOriginal) {
    const errores = zodError.errors.map(err => {
      return `- Campo "${err.path.join('.')}" ${err.message}`;
    }).join('\n');

    return `ERROR DE VALIDACIÓN: Tu respuesta JSON anterior no cumple con el contrato requerido.

Errores encontrados:
${errores}

JSON recibido:
${jsonOriginal}

Por favor, corrige tu respuesta y asegúrate de seguir EXACTAMENTE la estructura especificada en las instrucciones del sistema.`;
  }

  /**
   * Función auxiliar para esperar (para backoff)
   */
  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtener historial de conversación
   */
  obtenerConversacion(sessionId) {
    // Intentar obtener del cache primero
    if (this.conversacionesCache.has(sessionId)) {
      return this.conversacionesCache.get(sessionId);
    }

    // Si no está en cache, buscar en base de datos
    const conversacionDB = leadsService.obtenerConversacion(sessionId);
    
    if (conversacionDB && conversacionDB.historial) {
      this.conversacionesCache.set(sessionId, conversacionDB.historial);
      return conversacionDB.historial;
    }

    // Si no existe, crear nueva conversación
    return [];
  }

  /**
   * Procesar y guardar lead si está completo
   */
  async procesarYGuardarLead(sessionId, leadInstance) {
    try {
      // Verificar si ya existe un lead asociado a esta conversación
      const conversacionDB = leadsService.obtenerConversacion(sessionId);
      if (conversacionDB && conversacionDB.lead_id) {
        return; // Ya se guardó el lead
      }

      // Verificar si el lead tiene datos completos
      if (leadInstance.estaCompleto()) {
        // Crear el lead en la base de datos
        const lead = leadsService.crearLead({
          nombre: leadInstance.nombre,
          telefono: leadInstance.telefono,
          servicio: leadInstance.servicio,
          comuna: leadInstance.comuna,
          estado: leadInstance.estado,
          notas: `Lead capturado vía ${conversacionDB?.canal || 'web'}`
        });

        // Asociar conversación con lead
        leadsService.asociarConversacionConLead(sessionId, lead.id);

        console.log(`✅ Lead guardado: ${leadInstance.toString()}`);

        // Enviar notificaciones según prioridad
        if (leadInstance.esCaliente()) {
          await notificationService.notificarLeadCaliente(lead);
        } else if (leadInstance.esTibio()) {
          await notificationService.notificarLeadTibio(lead);
        } else {
          await notificationService.notificarLeadFrio(lead);
        }

        return lead;
      } else {
        console.log(`ℹ️ Lead incompleto, continuando conversación - ${leadInstance.toString()}`);
      }

    } catch (error) {
      console.error('Error al procesar y guardar lead:', error);
      // No lanzar error para no interrumpir la conversación
    }
  }

  /**
   * Limpiar cache de conversación (útil para testing o limpieza)
   */
  limpiarCache(sessionId = null) {
    if (sessionId) {
      this.conversacionesCache.delete(sessionId);
    } else {
      this.conversacionesCache.clear();
    }
  }

  /**
   * Reiniciar conversación
   */
  reiniciarConversacion(sessionId) {
    this.limpiarCache(sessionId);
    return true;
  }
}

module.exports = new AIService();
