const express = require('express');
const router = express.Router();
const logger = require('../../logging/Logger');
const { asyncHandler } = require('../middleware/errorHandler');
const container = require('../../container');

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENDPOINTS DE SIMULACIÓN PARA DEMOS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Estos endpoints permiten simular mensajes de diferentes canales sin
 * necesitar acceso a las APIs reales (Instagram, WhatsApp, etc.).
 * 
 * Útil para:
 * - Demostraciones comerciales
 * - Testing sin configurar APIs externas
 * - Desarrollo local
 * - Validación de flujos
 * 
 * IMPORTANTE: Solo usar en desarrollo/demos, NO en producción con usuarios reales.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * @route POST /api/simulate/instagram
 * @desc Simular mensaje desde Instagram (sin usar Meta API)
 * 
 * Este endpoint permite demostrar el flujo completo de Instagram sin necesitar
 * configurar la API real de Meta. Procesa el mensaje con el mismo flujo de IA
 * y guarda el lead con canal="instagram".
 * 
 * Request Body:
 * {
 *   "message": "Hola, necesito información sobre instalación",
 *   "senderId": "demo_user_123"  // Opcional, genera uno automático si no se provee
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "respuesta": "¡Hola! Soy el asistente virtual...",
 *     "lead": {
 *       "id": 123,
 *       "nombre": "...",
 *       "estado": "tibio",
 *       "canal": "instagram"
 *     },
 *     "metadata": {
 *       "sessionId": "instagram_demo_user_123",
 *       "canal": "instagram",
 *       "simulacion": true
 *     }
 *   }
 * }
 */
router.post('/instagram', asyncHandler(async (req, res) => {
  const { message, senderId } = req.body;

  // Validación básica
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'El campo "message" es requerido y debe ser un string no vacío'
    });
  }

  // Generar senderId si no se provee
  const userId = senderId || `demo_user_${Date.now()}`;
  const sessionId = `instagram_${userId}`;

  logger.info('📸 Simulación de Instagram iniciada', {
    sessionId,
    messageLength: message.length,
    preview: message.substring(0, 50)
  });

  try {
    // Obtener caso de uso del contenedor
    const handleIncomingMessage = container.getHandleIncomingMessage();

    // Procesar mensaje con la INTERFAZ UNIFICADA (mismo flujo que Instagram real)
    const result = await handleIncomingMessage.execute({
      message: message.trim(),
      sessionId: sessionId,
      channel: 'instagram',  // ← Canal Instagram
      senderId: userId,  // ID del usuario simulado
      metadata: {
        platform: 'instagram',
        simulation: true,  // Marcar como simulación
        timestamp: Date.now()
      }
    });

    logger.info('✅ Simulación de Instagram completada', {
      sessionId,
      leadId: result.lead?.id,
      leadState: result.lead?.estado,
      hasResponse: !!result.respuesta
    });

    // Responder con el mismo formato que el flujo real
    res.json({
      success: true,
      data: {
        respuesta: result.respuesta,
        lead: result.lead ? {
          id: result.lead.id,
          nombre: result.lead.nombre,
          telefono: result.lead.telefono,
          servicio: result.lead.servicio,
          comuna: result.lead.comuna,
          estado: result.lead.estado,
          canal: result.lead.canal,  // Debe ser "instagram"
          instagram_id: result.lead.instagram_id,  // ← AGREGADO
          completo: result.lead.estaCompleto()
        } : null,
        metadata: {
          sessionId: sessionId,
          canal: 'instagram',
          simulacion: true,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error en simulación de Instagram', {
      sessionId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error al procesar el mensaje simulado',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route POST /api/simulate/whatsapp
 * @desc Simular mensaje desde WhatsApp (sin usar WhatsApp Cloud API)
 * 
 * Similar al endpoint de Instagram, pero para WhatsApp.
 */
router.post('/whatsapp', asyncHandler(async (req, res) => {
  const { message, phoneNumber } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'El campo "message" es requerido y debe ser un string no vacío'
    });
  }

  const userId = phoneNumber || `demo_phone_${Date.now()}`;
  const sessionId = `whatsapp_${userId}`;

  logger.info('💚 Simulación de WhatsApp iniciada', {
    sessionId,
    messageLength: message.length
  });

  try {
    const handleIncomingMessage = container.getHandleIncomingMessage();

    const result = await handleIncomingMessage.execute({
      message: message.trim(),
      sessionId: sessionId,
      channel: 'whatsapp',
      senderId: userId,
      metadata: {
        phoneNumber: userId,
        platform: 'whatsapp',
        simulation: true,
        timestamp: Date.now()
      }
    });

    logger.info('✅ Simulación de WhatsApp completada', {
      sessionId,
      leadId: result.lead?.id,
      leadState: result.lead?.estado
    });

    res.json({
      success: true,
      data: {
        respuesta: result.respuesta,
        lead: result.lead ? {
          id: result.lead.id,
          nombre: result.lead.nombre,
          telefono: result.lead.telefono,
          servicio: result.lead.servicio,
          comuna: result.lead.comuna,
          estado: result.lead.estado,
          canal: result.lead.canal,
          completo: result.lead.estaCompleto()
        } : null,
        metadata: {
          sessionId: sessionId,
          canal: 'whatsapp',
          simulacion: true,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error en simulación de WhatsApp', {
      sessionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error al procesar el mensaje simulado'
    });
  }
}));

/**
 * @route POST /api/simulate/web
 * @desc Simular mensaje desde Web (alias del endpoint de chat normal)
 * 
 * Este endpoint es un alias del /api/chat normal, pero con respuesta
 * en el mismo formato que los otros endpoints de simulación.
 */
router.post('/web', asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'El campo "message" es requerido y debe ser un string no vacío'
    });
  }

  const finalSessionId = sessionId || `web_demo_${Date.now()}`;

  logger.info('🌐 Simulación de Web iniciada', {
    sessionId: finalSessionId,
    messageLength: message.length
  });

  try {
    const handleIncomingMessage = container.getHandleIncomingMessage();

    const result = await handleIncomingMessage.execute({
      message: message.trim(),
      sessionId: finalSessionId,
      channel: 'web',
      senderId: finalSessionId,
      metadata: {
        platform: 'web',
        simulation: true,
        timestamp: Date.now()
      }
    });

    logger.info('✅ Simulación de Web completada', {
      sessionId: finalSessionId,
      leadId: result.lead?.id,
      leadState: result.lead?.estado
    });

    res.json({
      success: true,
      data: {
        respuesta: result.respuesta,
        lead: result.lead ? {
          id: result.lead.id,
          nombre: result.lead.nombre,
          telefono: result.lead.telefono,
          servicio: result.lead.servicio,
          comuna: result.lead.comuna,
          estado: result.lead.estado,
          canal: result.lead.canal,
          completo: result.lead.estaCompleto()
        } : null,
        metadata: {
          sessionId: finalSessionId,
          canal: 'web',
          simulacion: true,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('❌ Error en simulación de Web', {
      sessionId: finalSessionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Error al procesar el mensaje simulado'
    });
  }
}));

/**
 * @route GET /api/simulate/status
 * @desc Obtener estado de las simulaciones
 * 
 * Endpoint de utilidad para verificar que el módulo de simulación está activo.
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'Módulo de simulación activo',
    availableEndpoints: [
      {
        method: 'POST',
        path: '/api/simulate/instagram',
        description: 'Simular mensaje desde Instagram'
      },
      {
        method: 'POST',
        path: '/api/simulate/whatsapp',
        description: 'Simular mensaje desde WhatsApp'
      },
      {
        method: 'POST',
        path: '/api/simulate/web',
        description: 'Simular mensaje desde Web'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

