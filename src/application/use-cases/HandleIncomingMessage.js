const Logger = require('../../infrastructure/logging/Logger');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFAZ UNIFICADA DE MENSAJERÍA MULTI-CANAL
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este caso de uso es la ÚNICA entrada para procesar mensajes de TODOS los canales:
 * - Web Chat
 * - Instagram DM
 * - WhatsApp
 * - Simulación (Demos)
 * 
 * RESPONSABILIDADES:
 * - Validación consistente de entrada
 * - Logging estructurado por canal
 * - Procesamiento con IA
 * - Clasificación de leads
 * - Guardado en BD
 * - Notificaciones
 * - Manejo de errores
 * 
 * FLUJO UNIFICADO:
 * 1. [CANAL] Mensaje recibido → Log
 * 2. Validar entrada
 * 3. Procesar con IA (ProcessChatMessage)
 * 4. Clasificar lead
 * 5. Guardar en BD con canal correcto
 * 6. Notificar si es caliente
 * 7. [CANAL] Respuesta enviada → Log
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
class HandleIncomingMessage {
  constructor({ processChatMessage }) {
    this.processChatMessage = processChatMessage;
  }

  /**
   * INTERFAZ UNIFICADA: Procesar mensaje entrante de cualquier canal
   * 
   * @param {Object} params
   * @param {string} params.message - Texto del mensaje (requerido)
   * @param {string} params.sessionId - ID de sesión/conversación (requerido)
   * @param {string} params.channel - Canal: 'web' | 'instagram' | 'whatsapp' (requerido)
   * @param {string} params.senderId - ID del usuario en el canal (opcional)
   * @param {Object} params.metadata - Metadata adicional del canal (opcional)
   * 
   * @returns {Promise<Object>} {
   *   success: boolean,
   *   respuesta: string,
   *   lead: Object,
   *   channel: string,
   *   sessionId: string,
   *   conversacionCompleta: boolean,
   *   leadGuardado: boolean
   * }
   */
  async execute({ message, sessionId, channel = 'web', senderId, metadata = {} }) {
    const startTime = Date.now();
    const channelIcon = this.getChannelIcon(channel);
    const channelName = channel.toUpperCase();

    try {
      // ═══════════════════════════════════════════════════════════════
      // PASO 1: LOG DE ENTRADA
      // ═══════════════════════════════════════════════════════════════
      
      Logger.info(`${channelIcon} [${channelName}] Mensaje recibido`, {
        channel,
        sessionId,
        senderId: senderId || 'unknown',
        messageLength: message?.length || 0,
        preview: message?.substring(0, 50) || '',
        metadata
      });

      // ═══════════════════════════════════════════════════════════════
      // PASO 2: VALIDACIÓN DE ENTRADA
      // ═══════════════════════════════════════════════════════════════

      // Validar mensaje
      if (!message || typeof message !== 'string' || message.trim() === '') {
        Logger.warn(`${channelIcon} [${channelName}] Mensaje vacío o inválido`, {
          channel,
          sessionId,
          messageType: typeof message
        });

        return {
          success: false,
          error: 'Mensaje vacío o inválido',
          respuesta: 'Por favor, envía un mensaje con texto.',
          channel,
          sessionId
        };
      }

      // Validar sessionId
      if (!sessionId || typeof sessionId !== 'string') {
        Logger.warn(`${channelIcon} [${channelName}] SessionId inválido`, {
          channel,
          hasSessionId: !!sessionId,
          sessionIdType: typeof sessionId
        });

        return {
          success: false,
          error: 'SessionId requerido',
          respuesta: 'Error de sesión. Por favor, inicia una nueva conversación.',
          channel,
          sessionId: sessionId || 'unknown'
        };
      }

      // ═══════════════════════════════════════════════════════════════
      // PASO 3: PROCESAMIENTO CON IA
      // ═══════════════════════════════════════════════════════════════

      Logger.info(`${channelIcon} [${channelName}] Procesando con IA...`, {
        channel,
        sessionId
      });

      const result = await this.processChatMessage.execute({
        message: message.trim(),
        sessionId,
        channel,
        metadata: {
          ...metadata,
          senderId
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // PASO 4: LOG DE SALIDA
      // ═══════════════════════════════════════════════════════════════

      const duration = Date.now() - startTime;

      Logger.info(`${channelIcon} [${channelName}] Respuesta enviada`, {
        channel,
        sessionId,
        senderId: senderId || 'unknown',
        responseLength: result.respuesta?.length || 0,
        leadId: result.lead?.id,
        leadState: result.lead?.estado,
        leadCompleto: result.lead?.estaCompleto(),
        conversacionCompleta: result.conversacionCompleta,
        leadGuardado: result.leadGuardado,
        duration: `${duration}ms`
      });

      // ═══════════════════════════════════════════════════════════════
      // PASO 5: RETORNAR RESULTADO UNIFICADO
      // ═══════════════════════════════════════════════════════════════

      return {
        success: true,
        respuesta: result.respuesta,
        lead: result.lead,
        channel,
        sessionId,
        conversacionCompleta: result.conversacionCompleta,
        leadGuardado: result.leadGuardado,
        metadata: {
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // ═══════════════════════════════════════════════════════════════
      // MANEJO DE ERRORES
      // ═══════════════════════════════════════════════════════════════

      const duration = Date.now() - startTime;

      Logger.error(`${channelIcon} [${channelName}] Error al procesar mensaje`, {
        channel,
        sessionId,
        senderId: senderId || 'unknown',
        error: error.message,
        errorType: error.constructor.name,
        stack: error.stack,
        duration: `${duration}ms`
      });

      // Respuesta de fallback amigable
      return {
        success: false,
        error: error.message,
        respuesta: 'Disculpa, tuve un problema al procesar tu mensaje. ¿Podrías intentar nuevamente?',
        channel,
        sessionId
      };
    }
  }

  /**
   * Obtener ícono del canal para logs
   * @param {string} channel - Canal
   * @returns {string} Emoji del canal
   * @private
   */
  getChannelIcon(channel) {
    const icons = {
      'web': '🌐',
      'instagram': '📸',
      'whatsapp': '💚',
      'simulate': '🎭'
    };
    return icons[channel] || '📨';
  }

  /**
   * Validar que un mensaje es procesable
   * @param {string} message - Mensaje a validar
   * @returns {boolean}
   */
  isValidMessage(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }

    const trimmed = message.trim();
    
    // Mensaje debe tener al menos 1 carácter
    if (trimmed.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Obtener mensaje de bienvenida según canal
   * @param {string} channel - Canal (web, whatsapp, instagram)
   * @returns {string}
   */
  getWelcomeMessage(channel) {
    const welcomeMessages = {
      web: '¡Hola! Bienvenido a nuestro chat. ¿En qué puedo ayudarte hoy?',
      whatsapp: '¡Hola! Gracias por contactarnos por WhatsApp. ¿En qué puedo ayudarte? 😊',
      instagram: '¡Hola! Gracias por escribirnos por Instagram. ¿En qué puedo ayudarte? 📸'
    };

    return welcomeMessages[channel] || welcomeMessages.web;
  }
}

module.exports = HandleIncomingMessage;

