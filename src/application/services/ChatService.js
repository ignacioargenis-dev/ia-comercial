const { LLMResponse } = require('../../domain/entities/Lead');
const { ZodError } = require('zod');

/**
 * Servicio de Chat (Capa de Aplicación)
 * 
 * Orquesta la generación de respuestas con IA, validación y reintentos.
 * NO conoce detalles de OpenAI ni de la base de datos.
 * Depende de abstracciones inyectadas.
 */
class ChatService {
  /**
   * Constructor con inyección de dependencias
   * @param {Object} dependencies - Dependencias
   * @param {OpenAIClient} dependencies.openAIClient - Cliente de OpenAI
   */
  constructor({ openAIClient }) {
    this.openAIClient = openAIClient;
    this.MAX_REINTENTOS = 3;
  }

  /**
   * Generar respuesta estructurada validada
   * @param {Array} conversationHistory - Historial de mensajes
   * @param {string} channel - Canal de origen (web, whatsapp, instagram)
   * @param {number} attempt - Número de intento actual
   * @returns {Promise<LLMResponse>} Respuesta validada del LLM
   */
  async generateResponse(conversationHistory, channel = 'web', attempt = 1) {
    try {
      // Llamar a OpenAI para obtener respuesta
      const rawResponse = await this.openAIClient.generateStructuredResponse(conversationHistory, channel, attempt);

      // Intentar parsear y validar el JSON
      try {
        const jsonParsed = JSON.parse(rawResponse);
        
        // Validar con Zod y crear instancia de LLMResponse
        const llmResponse = new LLMResponse(jsonParsed);
        
        console.log(`✅ Respuesta JSON válida obtenida - Estado del lead: ${llmResponse.getLead().estado}`);
        
        return llmResponse;

      } catch (error) {
        return await this.handleValidationError(error, rawResponse, conversationHistory, attempt);
      }

    } catch (error) {
      return await this.handleAPIError(error, conversationHistory, attempt);
    }
  }

  /**
   * Manejar errores de validación
   * @param {Error} error - Error de validación
   * @param {string} rawResponse - Respuesta raw del LLM
   * @param {Array} conversationHistory - Historial de conversación
   * @param {number} attempt - Número de intento
   * @returns {Promise<LLMResponse>}
   * @private
   */
  async handleValidationError(error, rawResponse, conversationHistory, attempt) {
    if (error instanceof ZodError) {
      console.warn(`⚠️ Validación Zod falló (intento ${attempt}/${this.MAX_REINTENTOS}):`, error.errors);
      
      if (attempt < this.MAX_REINTENTOS) {
        // Construir mensaje de corrección
        const correctionMessage = this.buildCorrectionMessage(error, rawResponse);
        
        // Agregar al historial
        conversationHistory.push({
          role: 'assistant',
          content: rawResponse
        });
        conversationHistory.push({
          role: 'user',
          content: correctionMessage
        });
        
        // Reintentar
        return await this.generateResponse(conversationHistory, channel, attempt + 1);
      }
    } else if (error instanceof SyntaxError) {
      console.warn(`⚠️ JSON inválido (intento ${attempt}/${this.MAX_REINTENTOS}):`, error.message);
      
      if (attempt < this.MAX_REINTENTOS) {
        conversationHistory.push({
          role: 'assistant',
          content: rawResponse
        });
        conversationHistory.push({
          role: 'user',
          content: 'ERROR: Tu respuesta anterior no es un JSON válido. Recuerda que debes responder SOLO con un objeto JSON siguiendo la estructura exacta especificada.'
        });
        
        return await this.generateResponse(conversationHistory, channel, attempt + 1);
      }
    }
    
    // Se agotaron los reintentos
    throw new Error(`No se pudo obtener una respuesta JSON válida después de ${this.MAX_REINTENTOS} intentos`);
  }

  /**
   * Manejar errores de API
   * @param {Error} error - Error de API
   * @param {Array} conversationHistory - Historial de conversación
   * @param {number} attempt - Número de intento
   * @returns {Promise<LLMResponse>}
   * @private
   */
  async handleAPIError(error, conversationHistory, attempt) {
    console.error('Error al generar respuesta:', error);
    
    if (attempt >= this.MAX_REINTENTOS) {
      throw error;
    }
    
    // Backoff exponencial
    console.warn(`⚠️ Error de API (intento ${attempt}/${this.MAX_REINTENTOS}), reintentando...`);
    await this.openAIClient.wait(1000 * attempt);
    
    return await this.generateResponse(conversationHistory, channel, attempt + 1);
  }

  /**
   * Construir mensaje de corrección basado en errores Zod
   * @param {ZodError} zodError - Error de Zod
   * @param {string} originalJSON - JSON original que falló
   * @returns {string} Mensaje de corrección
   * @private
   */
  buildCorrectionMessage(zodError, originalJSON) {
    const errores = zodError.errors.map(err => {
      return `- Campo "${err.path.join('.')}" ${err.message}`;
    }).join('\n');

    return `ERROR DE VALIDACIÓN: Tu respuesta JSON anterior no cumple con el contrato requerido.

Errores encontrados:
${errores}

JSON recibido:
${originalJSON}

Por favor, corrige tu respuesta y asegúrate de seguir EXACTAMENTE la estructura especificada en las instrucciones del sistema.`;
  }
}

module.exports = ChatService;

