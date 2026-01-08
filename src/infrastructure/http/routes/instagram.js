const express = require('express');
const router = express.Router();
const logger = require('../../logging/Logger');
const { asyncHandler } = require('../middleware/errorHandler');
const container = require('../../container');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INSTAGRAM MESSAGING API - WEBHOOK HANDLER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Este módulo maneja la integración con Instagram Messaging API de Meta.
 * 
 * CONFIGURACIÓN EN META DEVELOPERS (https://developers.facebook.com):
 * ───────────────────────────────────────────────────────────────────────────
 * 
 * 1. Crear App de Instagram Messaging:
 *    - Ir a https://developers.facebook.com/apps
 *    - Crear nueva app → Tipo: "Empresa"
 *    - Agregar producto "Instagram" (Messenger API for Instagram)
 * 
 * 2. Generar Page Access Token:
 *    - En "Instagram Basic Display" → Settings
 *    - Agregar cuenta de Instagram Business
 *    - Generar token con permisos: instagram_basic, instagram_manage_messages
 *    - Copiar token a variable IG_PAGE_TOKEN en .env
 * 
 * 3. Configurar Webhook:
 *    - URL del Callback: https://tu-dominio.com/api/instagram/webhook
 *    - Token de Verificación: Define un string único (IG_VERIFY_TOKEN en .env)
 *    - Suscripciones requeridas:
 *      ✓ messages           - Mensajes entrantes
 *      ✓ messaging_postbacks - Respuestas de botones (opcional)
 * 
 * 4. Probar Webhook:
 *    - Click en "Test" para que Meta verifique tu endpoint
 *    - Debe retornar 200 OK con el challenge
 * 
 * 5. Activar App en Producción:
 *    - Completar "App Review" de Meta
 *    - Solicitar permisos: instagram_manage_messages
 *    - Enviar para revisión
 * 
 * PERMISOS REQUERIDOS:
 * ───────────────────────────────────────────────────────────────────────────
 * - instagram_basic              - Acceso básico a perfil
 * - instagram_manage_messages    - Enviar y recibir mensajes
 * - pages_manage_metadata        - Leer información de página
 * 
 * LIMITACIONES DE LA API:
 * ───────────────────────────────────────────────────────────────────────────
 * - Solo mensajes de texto (no imágenes/videos sin permisos adicionales)
 * - Ventana de mensajería de 24 horas después del primer contacto
 * - Rate limits: 200 llamadas/hora por usuario, 4800 llamadas/día por app
 * 
 * VARIABLES DE ENTORNO REQUERIDAS (.env):
 * ───────────────────────────────────────────────────────────────────────────
 * IG_PAGE_TOKEN=EAAxxxxx...        # Page Access Token de Meta
 * IG_VERIFY_TOKEN=mi_token_123     # Token personalizado para verificación
 * 
 * REFERENCIAS:
 * ───────────────────────────────────────────────────────────────────────────
 * - Documentación oficial: https://developers.facebook.com/docs/messenger-platform
 * - Instagram Graph API: https://developers.facebook.com/docs/instagram-api
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * @route GET /api/instagram/webhook
 * @desc Verificación del webhook por parte de Meta (Webhook Challenge)
 * 
 * Este endpoint es llamado por Meta al configurar el webhook para verificar
 * que el servidor es válido y está bajo tu control.
 * 
 * Parámetros esperados (query string):
 * - hub.mode: Debe ser "subscribe"
 * - hub.verify_token: Debe coincidir con IG_VERIFY_TOKEN
 * - hub.challenge: Número enviado por Meta que debemos retornar
 * 
 * Respuesta exitosa: 200 OK con el challenge
 * Respuesta fallida: 403 Forbidden
 */
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.IG_VERIFY_TOKEN;
  
  // Extraer parámetros del query string
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Log de intento de verificación
  logger.info('📸 Instagram webhook verification attempt', {
    mode,
    hasToken: !!token,
    hasChallenge: !!challenge,
    tokenMatch: token === VERIFY_TOKEN
  });

  // Validaciones de seguridad
  
  // 1. Verificar que el token de verificación esté configurado
  if (!VERIFY_TOKEN) {
    logger.error('❌ IG_VERIFY_TOKEN not configured in .env');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Webhook verification token not configured'
    });
  }

  // 2. Verificar que todos los parámetros estén presentes
  if (!mode || !token || !challenge) {
    logger.warn('❌ Instagram verification failed: Missing parameters', {
      hasMode: !!mode,
      hasToken: !!token,
      hasChallenge: !!challenge
    });
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required parameters: hub.mode, hub.verify_token, or hub.challenge'
    });
  }

  // 3. Verificar el modo (debe ser "subscribe")
  if (mode !== 'subscribe') {
    logger.warn('❌ Instagram verification failed: Invalid mode', { mode });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid hub.mode. Expected "subscribe"'
    });
  }

  // 4. Verificar el token de verificación
  if (token !== VERIFY_TOKEN) {
    logger.warn('❌ Instagram verification failed: Token mismatch');
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid verify token'
    });
  }

  // ✅ Verificación exitosa - Retornar el challenge
  logger.info('✅ Instagram webhook verified successfully');
  res.status(200).send(challenge);
});

/**
 * @route POST /api/instagram/webhook
 * @desc Recepción de eventos desde Instagram (Mensajes, reacciones, etc.)
 * 
 * Este endpoint recibe eventos de Instagram cuando:
 * - Un usuario envía un mensaje a tu cuenta de Instagram Business
 * - Un usuario responde a una historia
 * - Ocurren otros eventos suscritos
 * 
 * IMPORTANTE:
 * - Siempre responder 200 OK en menos de 5 segundos o Meta reintentará
 * - Procesar eventos de forma asíncrona después de responder
 * - Manejar múltiples eventos en un solo payload
 * - Validar que los datos vengan en el formato esperado
 * 
 * Estructura del payload de Meta:
 * {
 *   "object": "instagram",
 *   "entry": [
 *     {
 *       "id": "instagram-page-id",
 *       "time": 1234567890,
 *       "messaging": [
 *         {
 *           "sender": { "id": "user-instagram-scoped-id" },
 *           "recipient": { "id": "page-instagram-id" },
 *           "timestamp": 1234567890,
 *           "message": {
 *             "mid": "message-id",
 *             "text": "Hola, necesito información"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const body = req.body;

  // PASO 1: Responder inmediatamente a Meta (CRÍTICO)
  // Meta espera respuesta en < 5 segundos o reintentará el evento
  res.status(200).send('EVENT_RECEIVED');

  // PASO 2: Validar estructura básica del payload
  if (!body || typeof body !== 'object') {
    logger.warn('📸 Instagram webhook: Invalid payload (not an object)', {
      bodyType: typeof body
    });
    return; // Ya respondimos 200, solo salimos
  }

  // PASO 3: Verificar que sea un evento de Instagram
  if (body.object !== 'instagram') {
    logger.debug('📸 Instagram webhook: Ignored non-instagram event', {
      object: body.object
    });
    return;
  }

  // PASO 4: Verificar que haya entries
  if (!Array.isArray(body.entry) || body.entry.length === 0) {
    logger.warn('📸 Instagram webhook: No entries in payload');
    return;
  }

  logger.info('📸 Instagram webhook received', {
    entries: body.entry.length,
    timestamp: new Date().toISOString()
  });

  // PASO 5: Procesar eventos de forma asíncrona
  // Usamos Promise.allSettled para no fallar si un mensaje falla
  try {
    const processingPromises = [];

    for (const entry of body.entry) {
      // Validar estructura del entry
      if (!entry || typeof entry !== 'object') {
        logger.warn('📸 Instagram webhook: Invalid entry structure');
        continue;
      }

      // Procesar array de mensajes en este entry
      if (Array.isArray(entry.messaging)) {
        for (const messaging of entry.messaging) {
          // Sanitizar y procesar cada mensaje
          processingPromises.push(
            handleInstagramMessage(messaging, entry.id, entry.time)
          );
        }
      }
    }

    // Esperar a que todos los mensajes se procesen
    // (o fallen individualmente sin afectar a otros)
    const results = await Promise.allSettled(processingPromises);

    // Log de resultados
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('📸 Instagram webhook processing completed', {
      total: results.length,
      successful,
      failed
    });

    // Log de errores individuales
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('📸 Instagram message processing failed', {
          index,
          error: result.reason?.message || result.reason
        });
      }
    });

  } catch (error) {
    // Error crítico en el procesamiento general
    logger.error('❌ Instagram webhook: Critical error in processing', {
      error: error.message,
      stack: error.stack
    });
  }
}));

/**
 * Procesar mensaje individual de Instagram
 * 
 * Esta función sanitiza, valida y procesa cada mensaje recibido.
 * Maneja diferentes tipos de eventos y errores de forma robusta.
 * 
 * @param {Object} messaging - Objeto messaging de Instagram
 * @param {string} entryId - ID del entry (para logging)
 * @param {number} entryTime - Timestamp del entry (para logging)
 */
async function handleInstagramMessage(messaging, entryId, entryTime) {
  // ═══════════════════════════════════════════════════════════════
  // PASO 1: VALIDACIÓN Y SANITIZACIÓN DEL PAYLOAD
  // ═══════════════════════════════════════════════════════════════

  // Validar estructura básica del messaging object
  if (!messaging || typeof messaging !== 'object') {
    logger.warn('📸 Invalid messaging object', { entryId });
    return;
  }

  // Extraer datos con validación
  const senderId = messaging.sender?.id;
  const recipientId = messaging.recipient?.id;
  const timestamp = messaging.timestamp || entryTime;

  // Validar que tengamos al menos el sender ID
  if (!senderId || typeof senderId !== 'string') {
    logger.warn('📸 Message ignored: Missing or invalid sender ID', {
      entryId,
      hasSender: !!messaging.sender,
      senderType: typeof messaging.sender?.id
    });
    return;
  }

  // ═══════════════════════════════════════════════════════════════
  // PASO 2: IDENTIFICAR TIPO DE EVENTO
  // ═══════════════════════════════════════════════════════════════

  const message = messaging.message;

  // Manejar diferentes tipos de eventos
  
  // Caso 1: Mensaje de texto (el que procesamos)
  if (message && message.text && typeof message.text === 'string') {
    // ✅ Procesar mensaje de texto
    await processTextMessage(senderId, recipientId, message, timestamp);
    return;
  }

  // Caso 2: Mensaje con adjuntos (imágenes, videos, etc.)
  if (message && message.attachments && Array.isArray(message.attachments)) {
    logger.info('📸 Instagram message with attachments (not supported yet)', {
      senderId,
      attachmentCount: message.attachments.length,
      types: message.attachments.map(a => a.type)
    });
    
    // Responder que no soportamos adjuntos todavía
    try {
      const instagramService = container.getInstagramService();
      await instagramService.sendMessage(
        senderId,
        'Por el momento solo podemos procesar mensajes de texto. Por favor escribe tu consulta. 📝'
      );
    } catch (error) {
      logger.error('Failed to send attachment notification', { senderId });
    }
    return;
  }

  // Caso 3: Postback (respuesta de botón)
  if (messaging.postback) {
    logger.debug('📸 Instagram postback received (ignored)', {
      senderId,
      payload: messaging.postback.payload
    });
    return;
  }

  // Caso 4: Evento de lectura/entrega
  if (messaging.read || messaging.delivery) {
    logger.debug('📸 Instagram read/delivery event (ignored)', { senderId });
    return;
  }

  // Caso 5: Evento desconocido
  logger.warn('📸 Unknown Instagram event type', {
    senderId,
    keys: Object.keys(messaging)
  });
}

/**
 * Procesar mensaje de texto de Instagram
 * 
 * @param {string} senderId - Instagram Scoped ID del usuario
 * @param {string} recipientId - ID de la página
 * @param {Object} message - Objeto mensaje
 * @param {number} timestamp - Timestamp del mensaje
 * @private
 */
async function processTextMessage(senderId, recipientId, message, timestamp) {
  // Extraer y sanitizar texto del mensaje
  let messageText = message.text || '';
  const messageId = message.mid;

  // Sanitización del texto
  messageText = sanitizeMessageText(messageText);

  // Validar que el texto no esté vacío después de sanitizar
  if (!messageText || messageText.trim().length === 0) {
    logger.warn('📸 Message ignored: Empty text after sanitization', {
      senderId,
      originalLength: message.text?.length || 0
    });
    return;
  }

  // Validar longitud máxima (protección contra spam)
  const MAX_MESSAGE_LENGTH = 2000;
  if (messageText.length > MAX_MESSAGE_LENGTH) {
    logger.warn('📸 Message too long, truncating', {
      senderId,
      originalLength: messageText.length,
      truncatedTo: MAX_MESSAGE_LENGTH
    });
    messageText = messageText.substring(0, MAX_MESSAGE_LENGTH);
  }

  logger.info('💬 Instagram text message received', {
    senderId,
    messageId,
    textLength: messageText.length,
    preview: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
  });

  try {
    // ═══════════════════════════════════════════════════════════════
    // PROCESAMIENTO DEL MENSAJE CON IA
    // ═══════════════════════════════════════════════════════════════

    // Obtener servicios del contenedor
    const handleIncomingMessage = container.getHandleIncomingMessage();
    const instagramService = container.getInstagramService();

    // Generar sessionId único basado en el sender
    const sessionId = `instagram_${senderId}`;

    // Procesar mensaje con la INTERFAZ UNIFICADA (mismo flujo que todos los canales)
    const result = await handleIncomingMessage.execute({
      message: messageText,
      sessionId: sessionId,
      channel: 'instagram',
      senderId: senderId, // ID del usuario en Instagram
      metadata: {
        recipientId,
        messageId,
        timestamp,
        platform: 'instagram'
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // ENVIAR RESPUESTA AL USUARIO
    // ═══════════════════════════════════════════════════════════════

    if (result.success && result.respuesta && typeof result.respuesta === 'string') {
      await instagramService.sendMessage(senderId, result.respuesta);
      
      // Los logs ya están en HandleIncomingMessage, no duplicar
      
    } else if (!result.success) {
      // Enviar mensaje de error
      await instagramService.sendMessage(
        senderId,
        result.respuesta || 'Disculpa, tuve un problema al procesar tu mensaje.'
      );
    }

  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // MANEJO DE ERRORES
    // ═══════════════════════════════════════════════════════════════

    logger.error('❌ Error processing Instagram message', {
      senderId,
      messageId,
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack
    });

    // Intentar enviar mensaje de error al usuario
    // (solo si no es un error de configuración)
    if (error.message && !error.message.includes('not configured')) {
      try {
        const instagramService = container.getInstagramService();
        await instagramService.sendMessage(
          senderId,
          'Disculpa, tuve un problema al procesar tu mensaje. Por favor intenta nuevamente en unos momentos. 🙏'
        );
      } catch (sendError) {
        logger.error('❌ Failed to send error message to Instagram user', {
          senderId,
          originalError: error.message,
          sendError: sendError.message
        });
      }
    }

    // Re-lanzar el error para que Promise.allSettled lo capture
    throw error;
  }
}

/**
 * Sanitizar texto del mensaje
 * 
 * Limpia el texto de caracteres potencialmente peligrosos o inválidos.
 * 
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 * @private
 */
function sanitizeMessageText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Eliminar caracteres de control (excepto nuevas líneas y tabs)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalizar espacios en blanco
  text = text.replace(/\s+/g, ' ');

  // Eliminar espacios al inicio y final
  text = text.trim();

  // Eliminar emojis problemáticos que podrían causar issues
  // (dejamos los emojis normales, solo removemos surrogates huérfanos)
  text = text.replace(/[\uD800-\uDFFF]/g, '');

  return text;
}

module.exports = router;

