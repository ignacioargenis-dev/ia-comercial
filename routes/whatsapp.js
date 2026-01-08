const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const axios = require('axios');
const { z } = require('zod');

/**
 * Schema de validación para envío manual de mensajes
 */
const SendMessageSchema = z.object({
  to: z.string().min(1, 'El número de destino es requerido'),
  message: z.string().min(1, 'El mensaje es requerido')
});

/**
 * GET /whatsapp/webhook
 * Verificación del webhook de WhatsApp
 * Meta/Facebook llama este endpoint para verificar el webhook
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verificar que sea una petición de verificación
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook de WhatsApp verificado');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Token de verificación inválido');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * POST /whatsapp/webhook
 * Recepción de mensajes de WhatsApp
 * Meta/Facebook envía los mensajes aquí
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Verificar que sea una notificación de WhatsApp
    if (body.object === 'whatsapp_business_account') {
      
      // Iterar sobre las entradas (pueden ser múltiples)
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          
          // Verificar que sea un mensaje
          if (change.value.messages) {
            const mensaje = change.value.messages[0];
            const from = mensaje.from; // Número del remitente
            const messageId = mensaje.id;
            const messageType = mensaje.type;

            // Solo procesar mensajes de texto por ahora
            if (messageType === 'text') {
              const textoMensaje = mensaje.text.body;

              console.log(`📱 Mensaje de WhatsApp recibido de ${from}: ${textoMensaje}`);

              // Procesar mensaje con IA (ahora retorna respuesta estructurada)
              // Usar el número de teléfono como sessionId
              const resultado = await aiService.procesarMensaje(from, textoMensaje, 'whatsapp');

              // Log de información del lead
              console.log(`📊 Lead - Estado: ${resultado.lead.estado}, Completo: ${resultado.lead.estaCompleto()}`);

              // Enviar respuesta por WhatsApp
              await enviarMensajeWhatsApp(from, resultado.respuesta);

              // Marcar mensaje como leído
              await marcarComoLeido(messageId);
            }
          }
        }
      }

      // Responder rápido a Meta (200 OK)
      res.sendStatus(200);

    } else {
      res.sendStatus(404);
    }

  } catch (error) {
    console.error('Error en webhook de WhatsApp:', error);
    // Siempre responder 200 para evitar que Meta reintente
    res.sendStatus(200);
  }
});

/**
 * Enviar mensaje por WhatsApp usando Cloud API
 */
async function enviarMensajeWhatsApp(to, mensaje) {
  try {
    if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.log('⚠️  Credenciales de WhatsApp no configuradas. Mensaje no enviado.');
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: mensaje
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Mensaje de WhatsApp enviado:', response.data);
    return response.data;

  } catch (error) {
    console.error('Error al enviar mensaje de WhatsApp:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Marcar mensaje como leído
 */
async function marcarComoLeido(messageId) {
  try {
    if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error al marcar como leído:', error.response?.data || error.message);
  }
}

/**
 * POST /whatsapp/send
 * Endpoint auxiliar para enviar mensajes manualmente (útil para testing)
 */
router.post('/send', async (req, res) => {
  try {
    // Validar entrada con Zod
    const validacion = SendMessageSchema.safeParse(req.body);
    
    if (!validacion.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: validacion.error.errors.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message
        }))
      });
    }

    const { to, message } = validacion.data;
    const resultado = await enviarMensajeWhatsApp(to, message);

    res.json({
      success: true,
      data: resultado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al enviar mensaje',
      details: error.message
    });
  }
});

module.exports = router;
