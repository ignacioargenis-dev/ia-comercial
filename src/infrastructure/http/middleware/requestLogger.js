const Logger = require('../../logging/Logger');

/**
 * Middleware de Logging de Requests HTTP
 * 
 * Loguea todas las requests entrantes con:
 * - Método, URL, IP
 * - Código de respuesta
 * - Duración de la request
 * - User agent
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Guardar el método original res.json
  const originalJson = res.json;

  // Override res.json para capturar cuando se envía la respuesta
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    Logger.http(req, res.statusCode, duration);

    // Llamar al método original
    return originalJson.call(this, data);
  };

  // También capturar res.send
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    Logger.http(req, res.statusCode, duration);

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware para agregar request ID
 * Útil para rastrear requests específicas en los logs
 */
function requestId(req, res, next) {
  // Generar un ID único para esta request
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Agregarlo a los headers de respuesta
  res.setHeader('X-Request-ID', req.id);
  
  next();
}

module.exports = {
  requestLogger,
  requestId
};

