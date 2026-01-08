const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { z } = require('zod');

/**
 * Schema de validación para la petición del chat
 */
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'El mensaje no puede estar vacío'),
  sessionId: z.string().min(1, 'El sessionId es requerido')
});

/**
 * POST /chat
 * Endpoint para el chat web
 * Recibe mensajes del usuario y devuelve respuestas estructuradas del asistente
 */
router.post('/', async (req, res) => {
  try {
    // Validar datos de entrada con Zod
    const validacion = ChatRequestSchema.safeParse(req.body);
    
    if (!validacion.success) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: validacion.error.errors.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message
        }))
      });
    }

    const { message, sessionId } = validacion.data;

    // Procesar mensaje con IA (ahora retorna respuesta estructurada)
    const resultado = await aiService.procesarMensaje(sessionId, message, 'web');

    // Responder con éxito incluyendo datos estructurados del lead
    res.json({
      success: true,
      data: {
        respuesta: resultado.respuesta,
        sessionId: sessionId,
        lead: {
          nombre: resultado.lead.nombre,
          telefono: resultado.lead.telefono,
          servicio: resultado.lead.servicio,
          comuna: resultado.lead.comuna,
          estado: resultado.lead.estado,
          completo: resultado.lead.estaCompleto(),
          prioridad: resultado.lead.getNivelPrioridad()
        },
        conversacionCompleta: resultado.conversacionCompleta
      }
    });

  } catch (error) {
    console.error('Error en /chat:', error);
    
    // Diferenciar errores de validación de otros errores
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Error de validación en la respuesta del asistente',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje. Por favor intenta nuevamente.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /chat/reset
 * Reiniciar conversación
 */
router.post('/reset', async (req, res) => {
  try {
    // Validar sessionId
    const schema = z.object({
      sessionId: z.string().min(1, 'El sessionId es requerido')
    });
    
    const validacion = schema.safeParse(req.body);
    
    if (!validacion.success) {
      return res.status(400).json({
        success: false,
        error: 'El sessionId es requerido',
        details: validacion.error.errors
      });
    }

    const { sessionId } = validacion.data;
    
    aiService.reiniciarConversacion(sessionId);

    res.json({
      success: true,
      message: 'Conversación reiniciada'
    });

  } catch (error) {
    console.error('Error en /chat/reset:', error);
    res.status(500).json({
      success: false,
      error: 'Error al reiniciar la conversación'
    });
  }
});

/**
 * GET /chat/session/:sessionId
 * Obtener información de una sesión de chat
 */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'El sessionId es requerido'
      });
    }

    // Obtener conversación del servicio
    const conversacion = aiService.obtenerConversacion(sessionId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        mensajes: conversacion.length,
        historial: conversacion
      }
    });

  } catch (error) {
    console.error('Error en /chat/session:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la sesión'
    });
  }
});

module.exports = router;
