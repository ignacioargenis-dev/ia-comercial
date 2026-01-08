const Logger = require('../../logging/Logger');

/**
 * Middleware de Manejo de Errores Global
 * 
 * Captura y maneja todos los errores no capturados en la aplicación,
 * proporcionando respuestas consistentes y logging adecuado.
 */

/**
 * Clase de error personalizado para errores de dominio/negocio
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Errores específicos del dominio
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, true);
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} no encontrado`, 404, true);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, true);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, originalError) {
    super(`Error en servicio externo: ${service}`, 503, true);
    this.service = service;
    this.originalError = originalError;
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes') {
    super(message, 429, true);
  }
}

/**
 * Determinar si un error es operacional (esperado) o de programación
 * @param {Error} error - Error a evaluar
 * @returns {boolean}
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Formatear respuesta de error para el cliente
 * @param {Error} error - Error
 * @param {boolean} isDevelopment - Si está en desarrollo
 * @returns {Object}
 */
function formatErrorResponse(error, isDevelopment) {
  const response = {
    success: false,
    error: error.message || 'Error interno del servidor'
  };

  // En desarrollo, incluir más detalles
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error.details || {};
  }

  // Si es ValidationError, incluir detalles de validación
  if (error instanceof ValidationError) {
    response.validationErrors = error.details;
  }

  return response;
}

/**
 * Middleware de manejo de errores
 * Debe ser el último middleware en la cadena
 */
function errorHandler(err, req, res, next) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Determinar código de estado
  let statusCode = err.statusCode || 500;

  // Si es error de Mongoose/Base de datos
  if (err.name === 'CastError') {
    statusCode = 400;
    err.message = 'ID inválido';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    err.message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    err.message = 'Token expirado';
  }

  // Logging
  const errorContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    statusCode,
    errorName: err.name,
    isOperational: isOperationalError(err)
  };

  if (statusCode >= 500) {
    Logger.error('Server Error', { ...errorContext, error: err });
  } else if (statusCode >= 400) {
    Logger.warn('Client Error', errorContext);
  }

  // Si es error no operacional (bug), loguear con más detalle
  if (!isOperationalError(err)) {
    Logger.error('Unhandled Error (Possible Bug)', {
      ...errorContext,
      stack: err.stack
    });
  }

  // Enviar respuesta
  res.status(statusCode).json(formatErrorResponse(err, isDevelopment));
}

/**
 * Middleware para rutas no encontradas
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError('Ruta');
  error.statusCode = 404;
  next(error);
}

/**
 * Wrapper async para capturar errores en funciones async
 * Evita tener que usar try/catch en cada handler
 * 
 * Uso:
 * router.get('/ruta', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Manejador de promesas no rechazadas
 */
function handleUnhandledRejection() {
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Promise Rejection', {
      reason: reason,
      promise: promise
    });

    // En producción, podríamos querer cerrar gracefully
    if (process.env.NODE_ENV === 'production') {
      // Dar tiempo para que los logs se escriban
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });
}

/**
 * Manejador de excepciones no capturadas
 */
function handleUncaughtException() {
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', { error });

    // Las excepciones no capturadas son críticas
    // Debemos cerrar el proceso
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Inicializar manejadores globales
 */
function initializeGlobalHandlers() {
  handleUnhandledRejection();
  handleUncaughtException();
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  initializeGlobalHandlers,
  // Clases de error
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ExternalServiceError,
  RateLimitError,
  // Utilidades
  isOperationalError
};

