const express = require('express');
const router = express.Router();
const container = require('../../container');

/**
 * Router de WhatsApp Cloud API (Capa HTTP / Infraestructura)
 * 
 * Responsabilidades:
 * - Recibir webhooks de Meta/WhatsApp
 * - Validar verificación del webhook
 * - Procesar mensajes entrantes
 * - Enviar respuestas por WhatsApp
 * 
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

/**
 * GET /api/whatsapp/webhook
 * 
 * Verificación del webhook de WhatsApp (requerido por Meta)
 * 
 * Meta envía una solicitud GET para verificar el webhook con:
 * - hub.mode=subscribe
 * - hub.verify_token=<tu_token>
 * - hub.challenge=<challenge_string>
 * 
 * Debes responder con el challenge si el token coincide.
 */
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Verificación de webhook WhatsApp recibida');

    const whatsappClient = container.getWhatsAppClient();
    const validChallenge = whatsappClient.validateWebhookVerification(mode, token, challenge);

    if (validChallenge) {
      return res.status(200).send(validChallenge);
    }

    res.sendStatus(403);
  } catch (error) {
    console.error('❌ Error en verificación de webhook:', error);
    res.sendStatus(500);
  }
});

/**
 * POST /api/whatsapp/webhook
 * 
 * Recepción de mensajes entrantes de WhatsApp
 * 
 * Meta envía notificaciones cuando:
 * - Llega un nuevo mensaje
 * - Cambia el estado de un mensaje enviado
 * - El usuario lee un mensaje
 * 
 * Siempre responder 200 para evitar reintentos de Meta.
 */
router.post('/webhook', async (req, res) => {
  // Responder inmediatamente a Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    // Validar que es una notificación de WhatsApp Business
    if (body.object !== 'whatsapp_business_account') {
      console.log('ℹ️  Notificación no es de WhatsApp Business');
      return;
    }

    // Obtener servicios del contenedor
    const whatsappClient = container.getWhatsAppClient();
    const handleIncomingMessage = container.getHandleIncomingMessageUseCase();

    // Procesar cada entry del webhook
    for (const entry of body.entry || []) {
      // Extraer mensaje del webhook
      const messageData = whatsappClient.extractMessageFromWebhook(entry);

      if (!messageData) {
        continue; // No hay mensaje válido para procesar
      }

      const { from, messageId, text, name } = messageData;

      console.log(`📱 WhatsApp - Mensaje de ${name} (${from}): "${text}"`);

      try {
        // Marcar como leído inmediatamente
        await whatsappClient.markAsRead(messageId);

        // Procesar mensaje usando la INTERFAZ UNIFICADA
        const result = await handleIncomingMessage.execute({
          message: text,
          sessionId: `whatsapp_${from}`, // Prefijo para evitar colisiones con otros canales
          channel: 'whatsapp',
          senderId: from, // Número de teléfono del usuario
          metadata: {
            name,
            messageId,
            timestamp: messageData.timestamp
          }
        });

        if (result.success) {
          // Enviar respuesta por WhatsApp
          await whatsappClient.sendTextMessage(from, result.respuesta);

          // Los logs ya están en HandleIncomingMessage, no duplicar aquí
          
        } else {
          // Si hubo error, enviar mensaje de fallback
          await whatsappClient.sendTextMessage(
            from, 
            result.respuesta || 'Disculpa, tuve un problema. ¿Podrías intentar nuevamente?'
          );
        }

      } catch (messageError) {
        console.error(`❌ Error al procesar mensaje de ${from}:`, messageError);
        
        // Intentar enviar mensaje de error al usuario
        try {
          await whatsappClient.sendTextMessage(
            from,
            'Disculpa, tuve un problema técnico. Por favor, intenta nuevamente en unos momentos.'
          );
        } catch (sendError) {
          console.error('❌ Error al enviar mensaje de error:', sendError);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general en webhook de WhatsApp:', error);
    // Ya respondimos 200, solo logueamos el error
  }
});

/**
 * POST /api/whatsapp/send
 * 
 * Endpoint auxiliar para enviar mensajes manualmente por WhatsApp
 * Útil para testing y envío manual de seguimientos
 */
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    // Validar entrada
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Los campos "to" y "message" son requeridos'
      });
    }

    const whatsappClient = container.getWhatsAppClient();

    // Verificar configuración
    if (!whatsappClient.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp no está configurado',
        details: 'Configura WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en .env'
      });
    }

    // Enviar mensaje
    const result = await whatsappClient.sendTextMessage(to, message);

    res.json({
      success: true,
      data: result,
      message: `Mensaje enviado a ${to}`
    });

  } catch (error) {
    console.error('❌ Error al enviar mensaje manual:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje por WhatsApp',
      details: error.message
    });
  }
});

/**
 * GET /api/whatsapp/status
 * 
 * Verificar el estado de configuración de WhatsApp
 */
router.get('/status', async (req, res) => {
  try {
    const whatsappClient = container.getWhatsAppClient();
    
    const configured = whatsappClient.isConfigured();

    if (!configured) {
      return res.json({
        success: true,
        configured: false,
        message: 'WhatsApp no está configurado',
        missing: [
          !process.env.WHATSAPP_PHONE_NUMBER_ID && 'WHATSAPP_PHONE_NUMBER_ID',
          !process.env.WHATSAPP_ACCESS_TOKEN && 'WHATSAPP_ACCESS_TOKEN',
          !process.env.WHATSAPP_VERIFY_TOKEN && 'WHATSAPP_VERIFY_TOKEN'
        ].filter(Boolean)
      });
    }

    // Intentar obtener info del número
    try {
      const phoneInfo = await whatsappClient.getPhoneNumberInfo();
      
      res.json({
        success: true,
        configured: true,
        phoneNumber: phoneInfo.display_phone_number,
        verifiedName: phoneInfo.verified_name,
        quality: phoneInfo.quality_rating,
        message: 'WhatsApp configurado correctamente ✅'
      });
    } catch (error) {
      res.json({
        success: true,
        configured: true,
        error: 'No se pudo obtener información del número',
        details: error.message,
        message: 'WhatsApp configurado pero con problemas de conexión ⚠️'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al verificar estado de WhatsApp',
      details: error.message
    });
  }
});

module.exports = router;

