const express = require('express');
const router = express.Router();
const { z } = require('zod');
const container = require('../../container');

/**
 * Router de Chat (Capa HTTP / Infraestructura)
 * 
 * Responsabilidad: Manejar requests/responses HTTP
 * Delega la lógica de negocio a los casos de uso
 */

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
 * Procesa mensajes del usuario y devuelve respuestas estructuradas
 */
router.post('/', async (req, res) => {
  try {
    // 1. Validar entrada
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

    // 2. Obtener caso de uso UNIFICADO desde el contenedor
    const handleIncomingMessage = container.getHandleIncomingMessageUseCase();

    // 3. Ejecutar caso de uso UNIFICADO (misma interfaz que todos los canales)
    const resultado = await handleIncomingMessage.execute({
      message,
      sessionId,
      channel: 'web',
      senderId: sessionId, // Para web, sessionId es también el identificador
      metadata: {
        userAgent: req.headers['user-agent'],
        ip: req.ip
      }
    });

    // 4. Responder
    if (!resultado.success) {
      return res.status(400).json({
        success: false,
        error: resultado.error || 'Error al procesar mensaje',
        message: resultado.respuesta
      });
    }

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
          canal: resultado.lead.canal,
          completo: resultado.lead.estaCompleto(),
          prioridad: resultado.lead.getNivelPrioridad()
        },
        conversacionCompleta: resultado.conversacionCompleta,
        leadGuardado: resultado.leadGuardado
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
 * Reiniciar conversación (limpiar historial)
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

    // Por ahora, simplemente responder OK
    // En una implementación más completa, podríamos marcar la conversación como inactiva
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

    // Obtener repositorio de conversaciones
    const conversationRepository = container.getConversationRepository();
    const conversacion = conversationRepository.findBySessionId(sessionId);
    
    if (!conversacion) {
      return res.status(404).json({
        success: false,
        error: 'Conversación no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        sessionId,
        mensajes: conversacion.historial?.length || 0,
        canal: conversacion.canal,
        leadId: conversacion.lead_id,
        historial: conversacion.historial
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

