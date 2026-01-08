const winston = require('winston');
const path = require('path');

/**
 * Sistema de Logging Estructurado
 * 
 * Proporciona logging consistente en toda la aplicación con:
 * - Niveles: error, warn, info, debug
 * - Formato JSON estructurado
 * - Logs en archivos rotados
 * - Contexto enriquecido (timestamps, request IDs, etc.)
 * - Diferentes transports según entorno
 */

// Definir formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Agregar metadata si existe
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      // Filtrar campos internos de winston
      const cleanMetadata = { ...metadata };
      delete cleanMetadata.timestamp;
      delete cleanMetadata.level;
      delete cleanMetadata.message;
      
      const metadataStr = JSON.stringify(cleanMetadata, null, 2);
      if (metadataStr !== '{}') {
        msg += `\n${metadataStr}`;
      }
    }
    
    return msg;
  })
);

// Crear directorio de logs si no existe
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurar transports
const transports = [
  // Consola (siempre activa)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info'
  })
];

// En producción, agregar archivos de log
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Todos los logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: customFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Solo errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: customFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  );
}

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  // No salir en errores no manejados
  exitOnError: false
});

/**
 * Logger mejorado con métodos convenientes
 */
class Logger {
  /**
   * Log de información general
   * @param {string} message - Mensaje
   * @param {Object} metadata - Metadata adicional
   */
  static info(message, metadata = {}) {
    logger.info(message, metadata);
  }

  /**
   * Log de advertencias
   * @param {string} message - Mensaje
   * @param {Object} metadata - Metadata adicional
   */
  static warn(message, metadata = {}) {
    logger.warn(message, metadata);
  }

  /**
   * Log de errores
   * @param {string} message - Mensaje
   * @param {Error|Object} error - Error o metadata
   */
  static error(message, error = {}) {
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: error.stack,
        ...error
      });
    } else {
      logger.error(message, error);
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   * @param {string} message - Mensaje
   * @param {Object} metadata - Metadata adicional
   */
  static debug(message, metadata = {}) {
    logger.debug(message, metadata);
  }

  /**
   * Log de request HTTP
   * @param {Object} req - Request de Express
   * @param {number} statusCode - Código de respuesta
   * @param {number} duration - Duración en ms
   */
  static http(req, statusCode, duration) {
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    });
  }

  /**
   * Log de operación de base de datos
   * @param {string} operation - Operación (SELECT, INSERT, etc.)
   * @param {string} table - Tabla
   * @param {number} duration - Duración en ms
   * @param {Object} metadata - Metadata adicional
   */
  static database(operation, table, duration, metadata = {}) {
    logger.debug('Database Operation', {
      operation,
      table,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Log de llamada a API externa
   * @param {string} service - Servicio (OpenAI, WhatsApp, etc.)
   * @param {string} operation - Operación
   * @param {boolean} success - Si fue exitoso
   * @param {number} duration - Duración en ms
   * @param {Object} metadata - Metadata adicional
   */
  static externalAPI(service, operation, success, duration, metadata = {}) {
    const level = success ? 'info' : 'error';
    logger.log(level, `External API: ${service}`, {
      service,
      operation,
      success,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Log de procesamiento de lead
   * @param {string} action - Acción (created, updated, contacted, etc.)
   * @param {number} leadId - ID del lead
   * @param {Object} metadata - Metadata adicional
   */
  static lead(action, leadId, metadata = {}) {
    logger.info(`Lead ${action}`, {
      leadId,
      action,
      ...metadata
    });
  }

  /**
   * Log de conversación
   * @param {string} sessionId - ID de sesión
   * @param {string} channel - Canal (web, whatsapp)
   * @param {string} message - Mensaje
   * @param {Object} metadata - Metadata adicional
   */
  static conversation(sessionId, channel, message, metadata = {}) {
    logger.info('Conversation', {
      sessionId,
      channel,
      messagePreview: message.substring(0, 100),
      ...metadata
    });
  }

  /**
   * Log de seguimiento automático
   * @param {string} action - Acción (sent, failed, scheduled)
   * @param {number} leadId - ID del lead
   * @param {string} type - Tipo (caliente, tibio)
   * @param {Object} metadata - Metadata adicional
   */
  static followUp(action, leadId, type, metadata = {}) {
    logger.info(`Follow-up ${action}`, {
      leadId,
      type,
      action,
      ...metadata
    });
  }

  /**
   * Log de notificación
   * @param {string} type - Tipo (email, whatsapp, webhook)
   * @param {boolean} success - Si fue exitoso
   * @param {Object} metadata - Metadata adicional
   */
  static notification(type, success, metadata = {}) {
    const level = success ? 'info' : 'warn';
    logger.log(level, `Notification ${success ? 'sent' : 'failed'}`, {
      type,
      success,
      ...metadata
    });
  }

  /**
   * Log de inicio de sistema
   * @param {string} component - Componente (server, scheduler, etc.)
   * @param {Object} metadata - Metadata adicional
   */
  static systemStart(component, metadata = {}) {
    logger.info(`System started: ${component}`, {
      component,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      ...metadata
    });
  }

  /**
   * Log de shutdown de sistema
   * @param {string} component - Componente
   * @param {Object} metadata - Metadata adicional
   */
  static systemStop(component, metadata = {}) {
    logger.info(`System stopping: ${component}`, {
      component,
      ...metadata
    });
  }

  /**
   * Log de métrica de performance
   * @param {string} operation - Operación
   * @param {number} duration - Duración en ms
   * @param {Object} metadata - Metadata adicional
   */
  static performance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'debug';
    logger.log(level, `Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      slow: duration > 1000,
      ...metadata
    });
  }

  /**
   * Log de validación fallida
   * @param {string} field - Campo
   * @param {string} reason - Razón
   * @param {Object} metadata - Metadata adicional
   */
  static validation(field, reason, metadata = {}) {
    logger.warn('Validation failed', {
      field,
      reason,
      ...metadata
    });
  }

  /**
   * Obtener instancia de Winston (para casos avanzados)
   * @returns {winston.Logger}
   */
  static getWinstonLogger() {
    return logger;
  }
}

module.exports = Logger;

