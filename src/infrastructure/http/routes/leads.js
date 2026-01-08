const express = require('express');
const router = express.Router();
const container = require('../../container');

/**
 * Router de Leads (Capa HTTP / Infraestructura)
 * 
 * Responsabilidad: Manejar requests/responses HTTP
 * Delega la lógica de negocio a los casos de uso
 */

/**
 * GET /leads
 * Obtener todos los leads con filtros opcionales
 */
router.get('/', (req, res) => {
  try {
    const { estado, contactado, canal } = req.query;
    
    // Preparar filtros
    const filtros = {};
    if (estado) filtros.estado = estado;
    if (contactado !== undefined) {
      filtros.contactado = contactado === 'true' || contactado === '1';
    }
    if (canal) filtros.canal = canal;

    // Obtener caso de uso
    const getLeads = container.getGetLeadsUseCase();
    
    // Ejecutar
    const leads = getLeads.execute(filtros);
    
    // Convertir a formato simple para respuesta
    const leadsJSON = leads.map(lead => ({
      id: lead.id,
      nombre: lead.nombre,
      telefono: lead.telefono,
      servicio: lead.servicio,
      comuna: lead.comuna,
      urgencia: lead.urgencia,
      estado: lead.estado,
      contactado: lead.contactado ? 1 : 0,
      notas: lead.notas,
      canal: lead.canal,
      instagram_id: lead.instagram_id,
      fecha_creacion: lead.fecha
    }));

    res.json({
      success: true,
      data: leadsJSON
    });

  } catch (error) {
    console.error('Error en GET /leads:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener leads'
    });
  }
});

/**
 * GET /leads/estadisticas
 * Obtener estadísticas de leads
 */
router.get('/estadisticas', (req, res) => {
  try {
    // Obtener caso de uso
    const getStatistics = container.getGetLeadStatisticsUseCase();
    
    // Ejecutar
    const stats = getStatistics.execute();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error en GET /leads/estadisticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /leads/:id
 * Obtener un lead por ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    // Obtener caso de uso
    const getLeads = container.getGetLeadsUseCase();
    
    // Ejecutar
    const lead = getLeads.executeById(id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        id: lead.id,
        nombre: lead.nombre,
        telefono: lead.telefono,
        servicio: lead.servicio,
        comuna: lead.comuna,
        urgencia: lead.urgencia,
        estado: lead.estado,
        contactado: lead.contactado ? 1 : 0,
        notas: lead.notas,
        canal: lead.canal,
        fecha_creacion: lead.fecha
      }
    });

  } catch (error) {
    console.error('Error en GET /leads/:id:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el lead'
    });
  }
});

/**
 * PUT /leads/:id/contactado
 * Marcar un lead como contactado
 */
router.put('/:id/contactado', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    // Obtener caso de uso
    const markAsContacted = container.getMarkLeadAsContactedUseCase();
    
    // Ejecutar
    const updated = markAsContacted.execute(id);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Lead marcado como contactado'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

  } catch (error) {
    console.error('Error en PUT /leads/:id/contactado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al marcar lead como contactado'
    });
  }
});

/**
 * PATCH /leads/:id
 * Actualizar un lead (marcar como contactado)
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    // Obtener caso de uso
    const markAsContacted = container.getMarkLeadAsContactedUseCase();
    
    // Ejecutar
    const updated = markAsContacted.execute(id);
    
    if (updated) {
      res.json({
        success: true,
        message: 'Lead actualizado correctamente'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

  } catch (error) {
    console.error('Error en PATCH /leads/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al actualizar lead'
    });
  }
});

module.exports = router;

