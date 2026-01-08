const express = require('express');
const router = express.Router();
const container = require('../../container');

/**
 * Rutas para el sistema de seguimientos automáticos
 */

/**
 * GET /api/followups/stats
 * Obtener estadísticas de seguimientos
 */
router.get('/stats', async (req, res) => {
  try {
    const followUpService = container.getFollowUpService();
    const stats = followUpService.getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener stats de seguimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de seguimientos',
      details: error.message
    });
  }
});

/**
 * GET /api/followups/lead/:id/history
 * Obtener historial de seguimientos de un lead
 */
router.get('/lead/:id/history', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const followUpService = container.getFollowUpService();
    
    const history = followUpService.getFollowUpHistory(leadId);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error al obtener historial de seguimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener historial de seguimientos',
      details: error.message
    });
  }
});

/**
 * POST /api/followups/lead/:id/send
 * Enviar seguimiento manual a un lead
 */
router.post('/lead/:id/send', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const followUpService = container.getFollowUpService();
    
    const success = await followUpService.sendManualFollowUp(leadId);

    if (success) {
      res.json({
        success: true,
        message: `Seguimiento enviado exitosamente a lead #${leadId}`
      });
    } else {
      res.json({
        success: false,
        message: `No se pudo enviar seguimiento a lead #${leadId}`
      });
    }
  } catch (error) {
    console.error('Error al enviar seguimiento manual:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar seguimiento',
      details: error.message
    });
  }
});

/**
 * GET /api/followups/scheduler/status
 * Obtener estado del planificador
 */
router.get('/scheduler/status', async (req, res) => {
  try {
    const scheduler = container.getFollowUpScheduler();
    const status = scheduler.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error al obtener estado del scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado del planificador',
      details: error.message
    });
  }
});

/**
 * POST /api/followups/scheduler/run-now
 * Ejecutar seguimientos manualmente (útil para testing)
 */
router.post('/scheduler/run-now', async (req, res) => {
  try {
    const scheduler = container.getFollowUpScheduler();
    
    // Ejecutar en segundo plano
    scheduler.runNow().then(() => {
      console.log('✅ Seguimientos ejecutados manualmente');
    }).catch(error => {
      console.error('❌ Error al ejecutar seguimientos:', error);
    });

    res.json({
      success: true,
      message: 'Seguimientos en ejecución...'
    });
  } catch (error) {
    console.error('Error al ejecutar seguimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al ejecutar seguimientos',
      details: error.message
    });
  }
});

/**
 * GET /api/followups/lead/:id/next
 * Obtener próxima fecha de seguimiento para un lead
 */
router.get('/lead/:id/next', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const followUpService = container.getFollowUpService();
    const leadRepository = container.getLeadRepository();
    
    const lead = leadRepository.findById(leadId);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: `Lead #${leadId} no encontrado`
      });
    }

    const nextDate = followUpService.getNextFollowUpDate(lead);

    res.json({
      success: true,
      data: {
        leadId: lead.id,
        estado: lead.estado,
        contactado: lead.contactado,
        nextFollowUpDate: nextDate,
        needsFollowUp: followUpService.needsFollowUp(lead)
      }
    });
  } catch (error) {
    console.error('Error al obtener próxima fecha de seguimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener próxima fecha de seguimiento',
      details: error.message
    });
  }
});

module.exports = router;

