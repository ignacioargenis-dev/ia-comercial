const { z } = require('zod');
const Logger = require('../logging/Logger');
const { ValidationError } = require('../http/middleware/errorHandler');

/**
 * Validador de Inputs del Usuario
 * 
 * Proporciona validaciones robustas para todos los inputs:
 * - Mensajes de chat
 * - Datos de leads
 * - Números de teléfono
 * - Emails
 * - Comunas
 */
class InputValidator {
  /**
   * Validar mensaje de chat
   * @param {string} message - Mensaje del usuario
   * @returns {Object} { valid, sanitized, errors }
   */
  static validateChatMessage(message) {
    const errors = [];

    // Verificar que sea string
    if (typeof message !== 'string') {
      errors.push('El mensaje debe ser texto');
      return { valid: false, sanitized: '', errors };
    }

    // Sanitizar
    let sanitized = message.trim();

    // Validar longitud
    if (sanitized.length === 0) {
      errors.push('El mensaje no puede estar vacío');
    }

    if (sanitized.length > 2000) {
      errors.push('El mensaje es demasiado largo (máximo 2000 caracteres)');
      sanitized = sanitized.substring(0, 2000);
    }

    // Detectar posibles ataques de inyección
    const suspiciousPatterns = [
      /<script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        Logger.validation('message', 'Suspicious pattern detected', {
          pattern: pattern.toString(),
          messagePreview: sanitized.substring(0, 50)
        });
        // Eliminar el contenido sospechoso
        sanitized = sanitized.replace(pattern, '');
      }
    }

    // Limitar caracteres especiales repetidos (posible spam)
    sanitized = sanitized.replace(/(.)\1{10,}/g, '$1$1$1');

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validar número de teléfono chileno
   * @param {string} phone - Número de teléfono
   * @returns {Object} { valid, formatted, errors }
   */
  static validatePhoneNumber(phone) {
    const errors = [];

    if (!phone || typeof phone !== 'string') {
      errors.push('Número de teléfono requerido');
      return { valid: false, formatted: '', errors };
    }

    // Limpiar el número
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Remover + si existe
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Si empieza con 56 (código de Chile), dejarlo
    // Si empieza con 9 y tiene 9 dígitos, agregar 56
    if (cleaned.startsWith('9') && cleaned.length === 9) {
      cleaned = '56' + cleaned;
    }

    // Validar formato
    const phoneRegex = /^56\d{9}$/; // Formato: 56912345678

    if (!phoneRegex.test(cleaned)) {
      errors.push('Número de teléfono inválido. Formato esperado: +56912345678');
      Logger.validation('phone', 'Invalid phone format', { phone });
    }

    return {
      valid: errors.length === 0,
      formatted: cleaned,
      errors
    };
  }

  /**
   * Validar email
   * @param {string} email - Email
   * @returns {Object} { valid, normalized, errors }
   */
  static validateEmail(email) {
    const errors = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email requerido');
      return { valid: false, normalized: '', errors };
    }

    // Normalizar (lowercase, trim)
    const normalized = email.trim().toLowerCase();

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      errors.push('Email inválido');
      Logger.validation('email', 'Invalid email format', { email: normalized });
    }

    // Validar longitud
    if (normalized.length > 254) {
      errors.push('Email demasiado largo');
    }

    return {
      valid: errors.length === 0,
      normalized,
      errors
    };
  }

  /**
   * Validar nombre
   * @param {string} name - Nombre
   * @returns {Object} { valid, sanitized, errors }
   */
  static validateName(name) {
    const errors = [];

    if (!name || typeof name !== 'string') {
      errors.push('Nombre requerido');
      return { valid: false, sanitized: '', errors };
    }

    // Sanitizar
    let sanitized = name.trim();

    // Validar longitud
    if (sanitized.length < 2) {
      errors.push('Nombre demasiado corto (mínimo 2 caracteres)');
    }

    if (sanitized.length > 100) {
      errors.push('Nombre demasiado largo (máximo 100 caracteres)');
      sanitized = sanitized.substring(0, 100);
    }

    // Validar caracteres permitidos (letras, espacios, tildes)
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nameRegex.test(sanitized)) {
      errors.push('Nombre contiene caracteres no permitidos');
      Logger.validation('name', 'Invalid characters', { name: sanitized });
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validar comuna chilena
   * @param {string} comuna - Comuna
   * @param {Array<string>} allowedComunas - Lista de comunas permitidas
   * @returns {Object} { valid, normalized, errors }
   */
  static validateComuna(comuna, allowedComunas = []) {
    const errors = [];

    if (!comuna || typeof comuna !== 'string') {
      errors.push('Comuna requerida');
      return { valid: false, normalized: '', errors };
    }

    // Normalizar
    const normalized = comuna.trim();

    // Si hay lista de comunas permitidas, validar
    if (allowedComunas.length > 0) {
      const found = allowedComunas.some(
        c => c.toLowerCase() === normalized.toLowerCase()
      );

      if (!found) {
        errors.push(`Comuna "${normalized}" no está en nuestra área de cobertura`);
        Logger.validation('comuna', 'Out of coverage', {
          comuna: normalized,
          allowedComunas
        });
      }
    }

    return {
      valid: errors.length === 0,
      normalized,
      errors
    };
  }

  /**
   * Validar sessionId
   * @param {string} sessionId - Session ID
   * @returns {Object} { valid, sanitized, errors }
   */
  static validateSessionId(sessionId) {
    const errors = [];

    if (!sessionId || typeof sessionId !== 'string') {
      errors.push('Session ID requerido');
      return { valid: false, sanitized: '', errors };
    }

    // Sanitizar
    const sanitized = sessionId.trim();

    // Validar longitud
    if (sanitized.length < 5) {
      errors.push('Session ID inválido');
    }

    if (sanitized.length > 200) {
      errors.push('Session ID demasiado largo');
    }

    // Validar caracteres (solo alfanuméricos, guiones, underscores)
    const sessionIdRegex = /^[a-zA-Z0-9\-_]+$/;
    if (!sessionIdRegex.test(sanitized)) {
      errors.push('Session ID contiene caracteres no permitidos');
      Logger.validation('sessionId', 'Invalid characters', {
        sessionId: sanitized
      });
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Validar objeto Lead completo
   * @param {Object} leadData - Datos del lead
   * @returns {Object} { valid, sanitized, errors }
   */
  static validateLead(leadData) {
    const errors = {};
    const sanitized = {};

    // Validar nombre
    if (leadData.nombre) {
      const nameValidation = this.validateName(leadData.nombre);
      if (!nameValidation.valid) {
        errors.nombre = nameValidation.errors;
      }
      sanitized.nombre = nameValidation.sanitized;
    }

    // Validar teléfono
    if (leadData.telefono) {
      const phoneValidation = this.validatePhoneNumber(leadData.telefono);
      if (!phoneValidation.valid) {
        errors.telefono = phoneValidation.errors;
      }
      sanitized.telefono = phoneValidation.formatted;
    }

    // Validar email (si existe)
    if (leadData.email) {
      const emailValidation = this.validateEmail(leadData.email);
      if (!emailValidation.valid) {
        errors.email = emailValidation.errors;
      }
      sanitized.email = emailValidation.normalized;
    }

    // Validar servicio
    if (leadData.servicio) {
      sanitized.servicio = leadData.servicio.trim();
      if (sanitized.servicio.length > 200) {
        errors.servicio = ['Servicio demasiado largo'];
      }
    }

    // Validar comuna
    if (leadData.comuna) {
      sanitized.comuna = leadData.comuna.trim();
    }

    // Validar estado
    const validEstados = ['frio', 'tibio', 'caliente'];
    if (leadData.estado && !validEstados.includes(leadData.estado)) {
      errors.estado = ['Estado inválido'];
    } else {
      sanitized.estado = leadData.estado;
    }

    // Validar notas
    if (leadData.notas) {
      sanitized.notas = leadData.notas.trim();
      if (sanitized.notas.length > 1000) {
        sanitized.notas = sanitized.notas.substring(0, 1000);
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      sanitized,
      errors
    };
  }

  /**
   * Crear un ValidationError con los errores encontrados
   * @param {Object} errors - Objeto de errores
   * @throws {ValidationError}
   */
  static throwValidationError(errors) {
    throw new ValidationError('Errores de validación', errors);
  }

  /**
   * Rate limiting básico por IP
   * Previene spam y abuso
   */
  static createRateLimiter() {
    const requests = new Map();
    const WINDOW_MS = 60000; // 1 minuto
    const MAX_REQUESTS = 60; // 60 requests por minuto

    return (ip) => {
      const now = Date.now();
      const userRequests = requests.get(ip) || [];

      // Filtrar requests antiguas
      const recentRequests = userRequests.filter(
        timestamp => now - timestamp < WINDOW_MS
      );

      if (recentRequests.length >= MAX_REQUESTS) {
        Logger.warn('Rate limit exceeded', { ip, requests: recentRequests.length });
        return false;
      }

      recentRequests.push(now);
      requests.set(ip, recentRequests);

      // Limpiar entradas antiguas periódicamente
      if (requests.size > 10000) {
        for (const [key, value] of requests.entries()) {
          if (value.length === 0 || now - value[value.length - 1] > WINDOW_MS) {
            requests.delete(key);
          }
        }
      }

      return true;
    };
  }
}

module.exports = InputValidator;

