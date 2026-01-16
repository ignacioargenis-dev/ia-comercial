const express = require('express');
const router = express.Router();
const CommercialStrategy = require('../../../domain/entities/CommercialStrategy');
const PromptGeneratorService = require('../../../application/services/PromptGeneratorService');
const container = require('../../container');
const fs = require('fs').promises;
const path = require('path');

/**
 * GET /api/commercial-strategy
 * Obtener la estrategia comercial activa
 */
router.get('/', async (req, res) => {
  try {
    const repository = container.getCommercialStrategyRepository();
    const strategy = repository.getActive();
    
    const promptGenerator = new PromptGeneratorService();
    const summary = promptGenerator.generateStrategySummary(strategy);

    res.json({
      success: true,
      data: {
        strategy: strategy.toJSON(),
        summary: summary
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estrategia comercial:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la estrategia comercial',
      details: error.message
    });
  }
});

/**
 * PUT /api/commercial-strategy
 * Actualizar la estrategia comercial
 */
router.put('/', async (req, res) => {
  try {
    const {
      mainObjective,
      hotLeadCriteria,
      hotLeadActions,
      insistenceLevel,
      communicationTone
    } = req.body;

    // Validar que se proporcionaron los campos requeridos
    if (!mainObjective || !insistenceLevel || !communicationTone) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: mainObjective, insistenceLevel, communicationTone'
      });
    }

    // Crear nueva estrategia
    const newStrategy = new CommercialStrategy({
      mainObjective,
      hotLeadCriteria: hotLeadCriteria || {},
      hotLeadActions: hotLeadActions || {},
      insistenceLevel,
      communicationTone,
      updatedBy: 'dashboard_user'
    });

    // Validar estrategia
    if (!newStrategy.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Estrategia comercial inválida. Verifica los valores de los campos.'
      });
    }

    // Guardar en base de datos
    const repository = container.getCommercialStrategyRepository();
    repository.save(newStrategy);

    // Generar nuevo prompt y guardarlo
    const promptGenerator = new PromptGeneratorService();
    const generatedPrompt = promptGenerator.generatePrompt(newStrategy);
    
    const promptPath = path.join(process.cwd(), 'prompts', 'systemPrompt.txt');
    await fs.writeFile(promptPath, generatedPrompt, 'utf8');

    // Generar resumen
    const summary = promptGenerator.generateStrategySummary(newStrategy);

    console.log('✅ Estrategia comercial actualizada y prompt regenerado');

    res.json({
      success: true,
      message: 'Estrategia comercial actualizada exitosamente',
      data: {
        strategy: newStrategy.toJSON(),
        summary: summary,
        promptGenerated: true
      }
    });

  } catch (error) {
    console.error('❌ Error al actualizar estrategia comercial:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la estrategia comercial',
      details: error.message
    });
  }
});

/**
 * GET /api/commercial-strategy/preview-prompt
 * Vista previa del prompt que se generaría con la configuración actual
 */
router.post('/preview-prompt', async (req, res) => {
  try {
    const {
      mainObjective,
      hotLeadCriteria,
      hotLeadActions,
      insistenceLevel,
      communicationTone
    } = req.body;

    const previewStrategy = new CommercialStrategy({
      mainObjective,
      hotLeadCriteria,
      hotLeadActions,
      insistenceLevel,
      communicationTone
    });

    if (!previewStrategy.isValid()) {
      return res.status(400).json({
        success: false,
        error: 'Configuración inválida'
      });
    }

    const promptGenerator = new PromptGeneratorService();
    const previewPrompt = promptGenerator.generatePrompt(previewStrategy);

    res.json({
      success: true,
      data: {
        prompt: previewPrompt,
        length: previewPrompt.length,
        lines: previewPrompt.split('\n').length
      }
    });
  } catch (error) {
    console.error('❌ Error al generar preview:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar vista previa',
      details: error.message
    });
  }
});

/**
 * GET /api/commercial-strategy/history
 * Obtener historial de estrategias
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const repository = container.getCommercialStrategyRepository();
    const history = repository.getHistory(limit);

    res.json({
      success: true,
      data: {
        history: history.map(s => s.toJSON()),
        count: history.length
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el historial',
      details: error.message
    });
  }
});

/**
 * GET /api/commercial-strategy/options
 * Obtener opciones disponibles para cada campo de configuración
 */
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: {
      mainObjective: [
        { value: 'generar_leads', label: 'Generar Leads', description: 'Capturar datos de contacto de prospectos interesados' },
        { value: 'agendar_reuniones', label: 'Agendar Reuniones', description: 'Coordinar reuniones y demos con clientes potenciales' },
        { value: 'calificar_clientes', label: 'Calificar Clientes', description: 'Identificar y clasificar leads por nivel de interés' },
        { value: 'vender_directamente', label: 'Vender Directamente', description: 'Cerrar ventas y concretar negocios inmediatamente' }
      ],
      hotLeadCriteria: [
        { key: 'pidePrecio', label: 'Cliente pide precio' },
        { key: 'pideCita', label: 'Cliente pide agendar' },
        { key: 'dejaTelefono', label: 'Cliente deja teléfono' },
        { key: 'mencionaUrgencia', label: 'Cliente menciona urgencia' },
        { key: 'consultaDisponibilidad', label: 'Cliente consulta disponibilidad' }
      ],
      hotLeadActions: [
        { key: 'enviarEmail', label: 'Enviar email de notificación' },
        { key: 'enviarWhatsApp', label: 'Enviar mensaje por WhatsApp' },
        { key: 'mostrarCTA', label: 'Mostrar CTA inmediato en chat' },
        { key: 'derivarHumano', label: 'Derivar inmediatamente a humano' }
      ],
      insistenceLevel: [
        { value: 'bajo', label: 'Bajo', description: 'Informativo - No presiona al cliente' },
        { value: 'medio', label: 'Medio', description: 'Persuasivo - Guía la conversación' },
        { value: 'alto', label: 'Alto', description: 'Orientado a cierre - Busca compromiso rápido' }
      ],
      communicationTone: [
        { value: 'profesional', label: 'Profesional', description: 'Formal y corporativo' },
        { value: 'cercano', label: 'Cercano', description: 'Amigable y conversacional' },
        { value: 'directo', label: 'Directo', description: 'Conciso y va al punto' }
      ]
    }
  });
});

module.exports = router;

