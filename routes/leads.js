const express = require('express');
const router = express.Router();
const leadsService = require('../services/leadsService');

/**
 * GET /leads
 * Obtener todos los leads
 * Query params opcionales: estado, contactado
 */
router.get('/', (req, res) => {
  try {
    const filtros = {};

    if (req.query.estado) {
      filtros.estado = req.query.estado;
    }

    if (req.query.contactado !== undefined) {
      filtros.contactado = req.query.contactado === 'true' || req.query.contactado === '1';
    }

    const leads = leadsService.obtenerTodos(filtros);

    res.json({
      success: true,
      data: leads,
      total: leads.length
    });

  } catch (error) {
    console.error('Error al obtener leads:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los leads'
    });
  }
});

/**
 * GET /leads/estadisticas
 * Obtener estadísticas de leads
 */
router.get('/estadisticas', (req, res) => {
  try {
    const estadisticas = leadsService.obtenerEstadisticas();

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
});

/**
 * GET /leads/estado/:estado
 * Obtener leads por estado (frio, tibio, caliente)
 */
router.get('/estado/:estado', (req, res) => {
  try {
    const estado = req.params.estado.toLowerCase();

    // Validar que el estado sea válido
    if (!['frio', 'tibio', 'caliente'].includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido. Debe ser: frio, tibio o caliente'
      });
    }

    const leads = leadsService.obtenerPorEstado(estado);

    res.json({
      success: true,
      data: leads,
      total: leads.length
    });

  } catch (error) {
    console.error('Error al obtener leads por estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los leads'
    });
  }
});

/**
 * GET /leads/:id
 * Obtener un lead específico por ID
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

    const lead = leadsService.obtenerPorId(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Error al obtener lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el lead'
    });
  }
});

/**
 * PUT /leads/:id
 * Actualizar un lead
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    const datos = req.body;

    // Validar que al menos haya un campo para actualizar
    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay datos para actualizar'
      });
    }

    const actualizado = leadsService.actualizar(id, datos);

    if (!actualizado) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    // Obtener el lead actualizado
    const lead = leadsService.obtenerPorId(id);

    res.json({
      success: true,
      message: 'Lead actualizado correctamente',
      data: lead
    });

  } catch (error) {
    console.error('Error al actualizar lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el lead'
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

    const actualizado = leadsService.marcarContactado(id);

    if (!actualizado) {
      return res.status(404).json({
        success: false,
        error: 'Lead no encontrado'
      });
    }

    // Obtener el lead actualizado
    const lead = leadsService.obtenerPorId(id);

    res.json({
      success: true,
      message: 'Lead marcado como contactado',
      data: lead
    });

  } catch (error) {
    console.error('Error al marcar lead como contactado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al marcar el lead como contactado'
    });
  }
});

/**
 * POST /leads
 * Crear un lead manualmente (útil para testing o ingreso manual)
 */
router.post('/', (req, res) => {
  try {
    const { nombre, telefono, servicio, comuna, urgencia, estado, notas } = req.body;

    // Validar campos requeridos
    if (!nombre || !telefono) {
      return res.status(400).json({
        success: false,
        error: 'Los campos nombre y telefono son requeridos'
      });
    }

    const lead = leadsService.crearLead({
      nombre,
      telefono,
      servicio,
      comuna,
      urgencia,
      estado: estado || 'frio',
      notas
    });

    res.status(201).json({
      success: true,
      message: 'Lead creado correctamente',
      data: lead
    });

  } catch (error) {
    console.error('Error al crear lead:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el lead'
    });
  }
});

module.exports = router;

