const { z } = require('zod');

/**
 * Schema de validación para el Lead usando Zod
 */
const LeadDataSchema = z.object({
  nombre: z.string().nullable(),
  telefono: z.string().nullable(),
  servicio: z.string().nullable(),
  comuna: z.string().nullable(),
  estado: z.enum(['frio', 'tibio', 'caliente'])
});

/**
 * Schema de validación para la respuesta completa del LLM
 */
const LLMResponseSchema = z.object({
  reply: z.string().min(1, 'La respuesta no puede estar vacía'),
  lead: LeadDataSchema
});

/**
 * Clase de dominio Lead
 * Representa un cliente potencial con sus datos y estado de calificación
 */
class Lead {
  constructor(data) {
    // Validar datos de entrada
    const validated = LeadDataSchema.parse(data);
    
    this.nombre = validated.nombre;
    this.telefono = validated.telefono;
    this.servicio = validated.servicio;
    this.comuna = validated.comuna;
    this.estado = validated.estado;
    this.fecha = new Date().toISOString();
  }

  /**
   * Verificar si el lead tiene datos completos
   * Considera completo si tiene nombre y al menos teléfono o servicio
   */
  estaCompleto() {
    return this.nombre !== null && (this.telefono !== null || this.servicio !== null);
  }

  /**
   * Verificar si el lead es caliente (prioritario)
   */
  esCaliente() {
    return this.estado === 'caliente';
  }

  /**
   * Verificar si el lead es tibio
   */
  esTibio() {
    return this.estado === 'tibio';
  }

  /**
   * Verificar si el lead es frío
   */
  esFrio() {
    return this.estado === 'frio';
  }

  /**
   * Obtener el nivel de prioridad numérico
   * 3 = caliente, 2 = tibio, 1 = frío
   */
  getNivelPrioridad() {
    const niveles = {
      'caliente': 3,
      'tibio': 2,
      'frio': 1
    };
    return niveles[this.estado];
  }

  /**
   * Convertir a objeto simple para guardar en DB
   */
  toJSON() {
    return {
      nombre: this.nombre,
      telefono: this.telefono,
      servicio: this.servicio,
      comuna: this.comuna,
      estado: this.estado,
      fecha: this.fecha
    };
  }

  /**
   * Generar un resumen del lead para logs
   */
  toString() {
    return `Lead: ${this.nombre || 'Sin nombre'} - Estado: ${this.estado} - Teléfono: ${this.telefono || 'N/A'}`;
  }
}

/**
 * Clase para representar la respuesta completa del LLM
 */
class LLMResponse {
  constructor(data) {
    // Validar respuesta completa
    const validated = LLMResponseSchema.parse(data);
    
    this.reply = validated.reply;
    this.lead = new Lead(validated.lead);
  }

  /**
   * Obtener el texto de respuesta al usuario
   */
  getRespuesta() {
    return this.reply;
  }

  /**
   * Obtener la instancia de Lead
   */
  getLead() {
    return this.lead;
  }

  /**
   * Convertir a objeto simple
   */
  toJSON() {
    return {
      reply: this.reply,
      lead: this.lead.toJSON()
    };
  }
}

module.exports = {
  Lead,
  LLMResponse,
  LeadDataSchema,
  LLMResponseSchema
};

