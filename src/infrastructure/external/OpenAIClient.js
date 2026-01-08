const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const businessConfig = require('../config/BusinessConfigLoader');
const Logger = require('../logging/Logger');
const { ExternalServiceError } = require('../http/middleware/errorHandler');

/**
 * Cliente de OpenAI (Capa de Infraestructura)
 * 
 * Encapsula toda la comunicación con la API de OpenAI con:
 * - Manejo robusto de errores
 * - Reintentos automáticos con backoff exponencial
 * - Timeouts configurables
 * - Validación de respuestas
 * - Logging detallado
 * - Carga dinámica de prompts desde configuración
 */
class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: parseInt(process.env.OPENAI_TIMEOUT) || 30000, // 30 segundos por defecto
      maxRetries: 0 // Manejaremos los reintentos manualmente
    });

    // Configuración de reintentos
    this.maxRetries = parseInt(process.env.OPENAI_MAX_RETRIES) || 3;
    this.baseDelay = parseInt(process.env.OPENAI_BASE_DELAY) || 1000; // 1 segundo
    this.maxDelay = parseInt(process.env.OPENAI_MAX_DELAY) || 10000; // 10 segundos

    // Cargar configuración del negocio
    this.businessConfig = businessConfig;
    
    // Cargar y preparar el system prompt dinámicamente
    this.systemPrompt = this.loadSystemPrompt();
    
    Logger.info('OpenAI Client initialized', {
      timeout: this.client.timeout,
      maxRetries: this.maxRetries
    });
  }

  /**
   * Cargar el prompt del sistema dinámicamente
   * Combina el prompt base con la configuración del negocio
   * @returns {string}
   * @private
   */
  loadSystemPrompt() {
    const promptPath = path.join(process.cwd(), 'prompts', 'systemPrompt.txt');
    
    // Cargar prompt base si existe
    let basePrompt = '';
    if (fs.existsSync(promptPath)) {
      basePrompt = fs.readFileSync(promptPath, 'utf-8');
    }
    
    // Generar prompt dinámico desde configuración
    const dynamicPrompt = this.businessConfig.generateSystemPrompt();
    
    // Combinar: primero el contexto de negocio, luego las reglas técnicas
    const fullPrompt = `
${dynamicPrompt}

${basePrompt}
    `.trim();
    
    console.log('✅ Prompt del sistema cargado dinámicamente');
    console.log(`   Negocio: ${this.businessConfig.getBusinessInfo().name}`);
    console.log(`   Servicios: ${this.businessConfig.getServices().length}`);
    
    return fullPrompt;
  }

  /**
   * Recargar configuración y prompt (útil en desarrollo)
   */
  reloadConfig() {
    this.businessConfig.reload();
    this.systemPrompt = this.loadSystemPrompt();
    console.log('✅ Configuración y prompt recargados');
  }

  /**
   * Generar respuesta estructurada en JSON con manejo robusto de errores
   * @param {Array} conversationHistory - Historial de la conversación
   * @param {string} channel - Canal de origen (web, whatsapp, instagram)
   * @param {number} attempt - Número de intento actual (interno)
   * @returns {Promise<string>} JSON string con la respuesta
   * @throws {ExternalServiceError} Si falla después de todos los reintentos
   */
  async generateStructuredResponse(conversationHistory, channel = 'web', attempt = 1) {
    const startTime = Date.now();

    try {
      // Determinar si es el primer mensaje (solo 1 mensaje de usuario en el historial)
      const isFirstMessage = conversationHistory.filter(m => m.role === 'user').length === 1;
      
      // Adaptar prompt según el canal y si es primer mensaje
      const adaptedPrompt = this.adaptPromptForChannel(this.systemPrompt, channel, isFirstMessage);
      
      const messages = [
        {
          role: 'system',
          content: adaptedPrompt
        },
        ...conversationHistory
      ];

      Logger.debug('OpenAI request', {
        attempt,
        messagesCount: messages.length,
        model: 'gpt-4o-mini'
      });

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" } // Forzar respuesta JSON
      });

      const response = completion.choices[0].message.content;
      const duration = Date.now() - startTime;

      // Validar que la respuesta es JSON válido
      try {
        JSON.parse(response);
      } catch (parseError) {
        Logger.error('OpenAI returned invalid JSON', {
          attempt,
          duration,
          response: response.substring(0, 200)
        });
        throw new Error('Respuesta de OpenAI no es JSON válido');
      }

      Logger.externalAPI('OpenAI', 'generateResponse', true, duration, {
        attempt,
        tokensUsed: completion.usage?.total_tokens
      });

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Determinar si el error es retriable
      const isRetriable = this.isRetriableError(error);
      
      Logger.error('OpenAI request failed', {
        attempt,
        maxRetries: this.maxRetries,
        duration,
        error: error.message,
        errorType: error.constructor.name,
        isRetriable
      });

      // Si podemos reintentar y no hemos excedido el máximo
      if (isRetriable && attempt < this.maxRetries) {
        const delay = this.calculateBackoffDelay(attempt);
        
        Logger.warn(`Retrying OpenAI request in ${delay}ms`, {
          attempt: attempt + 1,
          maxRetries: this.maxRetries
        });

        await this.wait(delay);
        return await this.generateStructuredResponse(conversationHistory, channel, attempt + 1);
      }

      // Si no podemos reintentar, lanzar error
      const externalError = new ExternalServiceError('OpenAI', error);
      externalError.attempts = attempt;
      externalError.duration = duration;
      throw externalError;
    }
  }

  /**
   * Determinar si un error es retriable
   * @param {Error} error - Error de OpenAI
   * @returns {boolean}
   * @private
   */
  isRetriableError(error) {
    // Errores de red y timeouts son retriables
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Rate limits son retriables
    if (error.status === 429) {
      return true;
    }

    // Errores del servidor (5xx) son retriables
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Errores de autenticación no son retriables
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    // Por defecto, no reintentar
    return false;
  }

  /**
   * Calcular delay con backoff exponencial
   * @param {number} attempt - Número de intento
   * @returns {number} Delay en milisegundos
   * @private
   */
  calculateBackoffDelay(attempt) {
    // Backoff exponencial: 1s, 2s, 4s, 8s...
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    
    // Agregar jitter (variación aleatoria) para evitar thundering herd
    const jitter = Math.random() * 1000;
    
    // Limitar al máximo configurado
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  /**
   * Validar y parsear respuesta JSON del LLM
   * @param {string} jsonString - String JSON a parsear
   * @returns {Object} Objeto parseado
   * @throws {Error} Si no se puede parsear o falta estructura esperada
   */
  parseAndValidateResponse(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);

      // Validar estructura esperada
      if (!parsed.reply || typeof parsed.reply !== 'string') {
        throw new Error('Respuesta sin campo "reply" válido');
      }

      if (!parsed.lead || typeof parsed.lead !== 'object') {
        throw new Error('Respuesta sin campo "lead" válido');
      }

      return parsed;

    } catch (error) {
      Logger.error('Failed to parse LLM response', {
        error: error.message,
        response: jsonString?.substring(0, 200)
      });

      // Intentar recuperar con respuesta por defecto
      return {
        reply: 'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentar reformularlo?',
        lead: {
          nombre: null,
          telefono: null,
          servicio: null,
          comuna: null,
          urgencia: null,
          estado: 'frio',
          notas: 'Error al parsear respuesta del LLM'
        }
      };
    }
  }

  /**
   * Adaptar prompt según el canal de mensajería
   * @param {string} basePrompt - Prompt base del sistema
   * @param {string} channel - Canal (web, whatsapp, instagram)
   * @returns {string} Prompt adaptado
   * @private
   */
  adaptPromptForChannel(basePrompt, channel, isFirstMessage = false) {
    // Para canales de mensajería directa (WhatsApp, Instagram)
    if (channel === 'whatsapp' || channel === 'instagram') {
      let messagingInstructions = `

═══════════════════════════════════════════════════════════════
⚠️  MODO CONVERSACIÓN CORTA - ${channel.toUpperCase()}
═══════════════════════════════════════════════════════════════

REGLAS ESPECIALES PARA MENSAJERÍA DIRECTA:

1. BREVEDAD EXTREMA:
   - Máximo 2 líneas por mensaje
   - Sin párrafos largos
   - Directo al punto

2. UNA PREGUNTA A LA VEZ:
   - Pregunta SOLO por UN dato por mensaje
   - Orden: nombre → teléfono → servicio → comuna → urgencia
   - No pidas múltiples datos juntos

3. ESTILO:
   - Cercano y profesional
   - Usa emojis con moderación (máximo 1 por mensaje)
   - Tono conversacional pero efectivo

4. FLUJO OPTIMIZADO:
   Mensaje 1: Saludo + pedir SOLO nombre
   Mensaje 2: Agradecer + pedir SOLO teléfono
   Mensaje 3: Confirmar + pedir SOLO servicio
   Mensaje 4: Entender servicio + pedir SOLO comuna
   Mensaje 5: Registrar ubicación + consultar urgencia
   Mensaje 6: Confirmar registro + próximos pasos

5. EJEMPLOS DE RESPUESTAS CORRECTAS:

   ❌ MAL (muy largo):
   "¡Hola! Gracias por contactarnos. Para poder ayudarte mejor, necesito algunos datos. ¿Podrías decirme tu nombre completo, número de teléfono y qué servicio necesitas?"
   
   ✅ BIEN:
   "¡Hola! 👋 Para ayudarte, ¿cuál es tu nombre?"
   
   ❌ MAL (múltiples preguntas):
   "Perfecto Juan. ¿Me das tu teléfono y me cuentas qué servicio necesitas?"
   
   ✅ BIEN:
   "Perfecto Juan. ¿Me das tu número de teléfono?"

6. CIERRE OPTIMIZADO:
   Cuando tengas todos los datos:
   "Ya registré tus datos ✅ Un asesor te contactará en breve."

7. MANTENER LÓGICA:
   - Sigue extrayendo los mismos datos (nombre, teléfono, servicio, comuna, urgencia)
   - Mantén la clasificación (frío/tibio/caliente)
   - Usa el mismo formato JSON de respuesta

═══════════════════════════════════════════════════════════════
`;

      // INSTRUCCIONES ESPECIALES PARA PRIMER MENSAJE EN INSTAGRAM
      if (channel === 'instagram' && isFirstMessage) {
        messagingInstructions += `

🎯 PRIMER MENSAJE EN INSTAGRAM - OPTIMIZACIÓN ESPECIAL:
════════════════════════════════════════════════════════

⚠️  MUY IMPORTANTE: Este es el PRIMER mensaje del usuario en Instagram.
Tu respuesta debe ser ESPECIALMENTE optimizada para convertir.

OBJETIVO: Convertir mensajes en leads reales desde el primer contacto.

CARACTERÍSTICAS DEL MENSAJE INICIAL:
✓ Cercano pero profesional
✓ Corto (máximo 2 líneas)
✓ Orientado a acción inmediata
✓ Preguntar directamente por el servicio (no por nombre todavía)

ESTRUCTURA IDEAL PARA PRIMER MENSAJE:

OPCIÓN 1 (Si dicen "Hola" o saludo simple):
{
  "reply": "Hola 👋 Gracias por escribirnos. ¿Qué servicio estás buscando hoy?",
  "lead": { "nombre": null, "telefono": null, "servicio": null, "comuna": null, "estado": "frio" }
}

OPCIÓN 2 (Si preguntan sobre servicios):
{
  "reply": "¡Hola! 👋 Ofrecemos instalación, mantenimiento y reparación. ¿Cuál te interesa?",
  "lead": { "nombre": null, "telefono": null, "servicio": null, "comuna": null, "estado": "frio" }
}

OPCIÓN 3 (Si mencionan necesidad específica):
{
  "reply": "¡Perfecto! 👍 ¿En qué comuna estás para ayudarte mejor?",
  "lead": { "nombre": null, "telefono": null, "servicio": "[lo que mencionaron]", "comuna": null, "estado": "tibio" }
}

❌ EVITA EN EL PRIMER MENSAJE:
- Presentaciones largas tipo "Soy el asistente de..."
- Pedir nombre de inmediato (primero servicio, luego datos)
- Mensajes genéricos sin pregunta concreta
- Múltiples preguntas juntas
- Más de 2 líneas

✅ USA EN EL PRIMER MENSAJE:
- Emoji de bienvenida 👋
- Agradecimiento breve
- Pregunta directa y concreta
- Enfoque en acción

EJEMPLOS ESPECÍFICOS PARA INSTAGRAM:

Usuario: "Hola"
Respuesta: "Hola 👋 Gracias por escribirnos. ¿Qué servicio estás buscando hoy?"

Usuario: "Info"
Respuesta: "¡Hola! Ofrecemos instalación, mantenimiento y reparación. ¿Cuál necesitas?"

Usuario: "Precio de instalación"
Respuesta: "¡Perfecto! Para darte el mejor precio, ¿en qué comuna estás?"

Usuario: "Necesito técnico"
Respuesta: "Listo 👍 ¿Qué servicio necesitas: instalación, reparación o mantenimiento?"

════════════════════════════════════════════════════════
`;
      }
      
      return messagingInstructions + '\n\n' + basePrompt;
    }
    
    // Para web, usar prompt normal
    return basePrompt;
  }

  /**
   * Validar salud de la conexión con OpenAI
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      
      // Hacer una llamada simple para verificar conectividad
      await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      });

      const duration = Date.now() - startTime;
      
      Logger.info('OpenAI health check passed', { duration });
      return true;

    } catch (error) {
      Logger.error('OpenAI health check failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Esperar un tiempo determinado (para backoff)
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise<void>}
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = OpenAIClient;

