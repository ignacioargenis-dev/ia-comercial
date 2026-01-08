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
 * Entidad de Dominio: Lead
 * 
 * Representa un cliente potencial con sus datos y estado de calificación.
 * Contiene la lógica de negocio relacionada con el comportamiento del Lead.
 * 
 * Esta es una entidad pura del dominio que no conoce detalles de implementación
 * de persistencia ni de infraestructura.
 */
class Lead {
  constructor(data) {
    // Validar datos de entrada con Zod
    const validated = LeadDataSchema.parse(data);
    
    this.id = data.id || null;
    this.nombre = validated.nombre;
    this.telefono = validated.telefono;
    this.servicio = validated.servicio;
    this.comuna = validated.comuna;
    this.estado = validated.estado;
    this.urgencia = data.urgencia || null;
    this.notas = data.notas || '';
    this.contactado = data.contactado || false;
    this.canal = data.canal || 'web';
    this.instagram_id = data.instagram_id || null; // ID de Instagram para acceso directo
    this.fecha = data.fecha || new Date().toISOString();
  }

  /**
   * Verificar si el lead tiene datos completos para contacto
   * Considera completo si tiene nombre Y (teléfono O servicio)
   * @returns {boolean}
   */
  estaCompleto() {
    return this.nombre !== null && (this.telefono !== null || this.servicio !== null);
  }

  /**
   * Verificar si el lead es caliente (prioritario)
   * @returns {boolean}
   */
  esCaliente() {
    return this.estado === 'caliente';
  }

  /**
   * Verificar si el lead es tibio
   * @returns {boolean}
   */
  esTibio() {
    return this.estado === 'tibio';
  }

  /**
   * Verificar si el lead es frío
   * @returns {boolean}
   */
  esFrio() {
    return this.estado === 'frio';
  }

  /**
   * Obtener el nivel de prioridad numérico
   * 3 = caliente, 2 = tibio, 1 = frío
   * @returns {number}
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
   * Marcar como contactado
   */
  marcarComoContactado() {
    this.contactado = true;
  }

  /**
   * Actualizar información del lead
   * @param {Object} data - Datos a actualizar
   */
  actualizar(data) {
    if (data.nombre !== undefined) this.nombre = data.nombre;
    if (data.telefono !== undefined) this.telefono = data.telefono;
    if (data.servicio !== undefined) this.servicio = data.servicio;
    if (data.comuna !== undefined) this.comuna = data.comuna;
    if (data.estado !== undefined) {
      // Validar que el estado sea válido
      LeadDataSchema.pick({ estado: true }).parse({ estado: data.estado });
      this.estado = data.estado;
    }
    if (data.urgencia !== undefined) this.urgencia = data.urgencia;
    if (data.notas !== undefined) this.notas = data.notas;
  }

  /**
   * Convertir a objeto simple para persistencia
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      telefono: this.telefono,
      servicio: this.servicio,
      comuna: this.comuna,
      estado: this.estado,
      urgencia: this.urgencia,
      notas: this.notas,
      contactado: this.contactado,
      canal: this.canal,
      instagram_id: this.instagram_id,
      fecha: this.fecha
    };
  }

  /**
   * Generar un resumen del lead para logs
   * @returns {string}
   */
  toString() {
    return `Lead: ${this.nombre || 'Sin nombre'} - Estado: ${this.estado} - Teléfono: ${this.telefono || 'N/A'}`;
  }

  /**
   * Crear Lead desde datos de base de datos
   * Factory method para reconstruir desde persistencia
   * @param {Object} dbData - Datos desde la base de datos
   * @returns {Lead}
   */
  static fromDatabase(dbData) {
    return new Lead({
      id: dbData.id,
      nombre: dbData.nombre,
      telefono: dbData.telefono,
      servicio: dbData.servicio,
      comuna: dbData.comuna,
      estado: dbData.estado,
      urgencia: dbData.urgencia,
      notas: dbData.notas,
      contactado: dbData.contactado === 1,
      fecha: dbData.fecha_creacion
    });
  }
}

/**
 * Value Object: LLMResponse
 * 
 * Encapsula la respuesta estructurada del LLM.
 * Es inmutable y contiene tanto el mensaje al usuario como los datos del lead.
 */
class LLMResponse {
  constructor(data) {
    // Validar respuesta completa
    const validated = LLMResponseSchema.parse(data);
    
    this.reply = validated.reply;
    this.lead = new Lead(validated.lead);
    
    // Hacer inmutable
    Object.freeze(this);
  }

  /**
   * Obtener el texto de respuesta al usuario
   * @returns {string}
   */
  getRespuesta() {
    return this.reply;
  }

  /**
   * Obtener la instancia de Lead
   * @returns {Lead}
   */
  getLead() {
    return this.lead;
  }

  /**
   * Convertir a objeto simple
   * @returns {Object}
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

