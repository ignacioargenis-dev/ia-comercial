const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../../logging/Logger');
const { asyncHandler } = require('../middleware/errorHandler');
const container = require('../../container');

/**
 * Rutas de Sistema (Capa HTTP / Infraestructura)
 * 
 * Endpoints para gestionar configuraciones del sistema:
 * - Obtener y actualizar el prompt del sistema
 * - Recargar configuraciones
 */

const PROMPT_PATH = path.join(__dirname, '../../../../prompts/systemPrompt.txt');

/**
 * @route GET /api/system/prompt
 * @desc Obtener el prompt del sistema actual
 */
router.get('/prompt', asyncHandler(async (req, res) => {
  try {
    // Leer el archivo del prompt
    const prompt = fs.readFileSync(PROMPT_PATH, 'utf8');
    
    logger.info('System prompt retrieved', {
      size: prompt.length
    });
    
    res.json({
      success: true,
      data: {
        prompt: prompt,
        lastModified: fs.statSync(PROMPT_PATH).mtime
      }
    });
    
  } catch (error) {
    logger.error('Error reading system prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al leer el prompt del sistema',
      details: error.message
    });
  }
}));

/**
 * @route PUT /api/system/prompt
 * @desc Actualizar el prompt del sistema
 */
router.put('/prompt', asyncHandler(async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Validar que el prompt no esté vacío
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El prompt no puede estar vacío'
      });
    }
    
    // Validar longitud mínima (al menos 100 caracteres)
    if (prompt.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: 'El prompt es demasiado corto. Debe tener al menos 100 caracteres.'
      });
    }
    
    // Hacer backup del prompt anterior
    const backupPath = path.join(__dirname, '../../../../prompts/systemPrompt.backup.txt');
    const currentPrompt = fs.readFileSync(PROMPT_PATH, 'utf8');
    fs.writeFileSync(backupPath, currentPrompt, 'utf8');
    
    // Guardar el nuevo prompt
    fs.writeFileSync(PROMPT_PATH, prompt, 'utf8');
    
    logger.info('System prompt updated', {
      oldSize: currentPrompt.length,
      newSize: prompt.length,
      backup: backupPath
    });
    
    // Recargar el prompt en el OpenAIClient
    try {
      const openAIClient = container.getOpenAIClient();
      openAIClient.reloadConfig();
      logger.info('OpenAI client reloaded with new prompt');
    } catch (reloadError) {
      logger.warn('Could not reload OpenAI client', { error: reloadError.message });
    }
    
    res.json({
      success: true,
      message: 'Prompt actualizado correctamente',
      data: {
        backup: backupPath,
        size: prompt.length
      }
    });
    
  } catch (error) {
    logger.error('Error updating system prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el prompt del sistema',
      details: error.message
    });
  }
}));

/**
 * @route POST /api/system/prompt/restore
 * @desc Restaurar el prompt desde el backup
 */
router.post('/prompt/restore', asyncHandler(async (req, res) => {
  try {
    const backupPath = path.join(__dirname, '../../../../prompts/systemPrompt.backup.txt');
    
    // Verificar que existe el backup
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró un backup del prompt'
      });
    }
    
    // Leer el backup
    const backupPrompt = fs.readFileSync(backupPath, 'utf8');
    
    // Restaurar
    fs.writeFileSync(PROMPT_PATH, backupPrompt, 'utf8');
    
    logger.info('System prompt restored from backup');
    
    // Recargar el prompt en el OpenAIClient
    try {
      const openAIClient = container.getOpenAIClient();
      openAIClient.reloadConfig();
    } catch (reloadError) {
      logger.warn('Could not reload OpenAI client', { error: reloadError.message });
    }
    
    res.json({
      success: true,
      message: 'Prompt restaurado desde el backup correctamente'
    });
    
  } catch (error) {
    logger.error('Error restoring system prompt', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Error al restaurar el prompt del sistema',
      details: error.message
    });
  }
}));

module.exports = router;

