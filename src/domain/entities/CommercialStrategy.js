/**
 * Entidad: Commercial Strategy
 * 
 * Representa la estrategia comercial configurada por el usuario.
 * Esta configuración se traduce automáticamente a un prompt técnico
 * sin que el usuario necesite conocimientos de ingeniería de prompts.
 */
class CommercialStrategy {
  constructor(data = {}) {
    // 1. Objetivo principal del asistente
    this.mainObjective = data.mainObjective || 'generar_leads';
    
    // 2. Criterios de Lead Caliente (múltiples)
    this.hotLeadCriteria = data.hotLeadCriteria || {
      pidePrecio: true,
      pideCita: true,
      dejaTelefono: true,
      mencionaUrgencia: true,
      consultaDisponibilidad: false
    };
    
    // 3. Acciones automáticas ante Lead Caliente (múltiples)
    this.hotLeadActions = data.hotLeadActions || {
      enviarEmail: true,
      enviarWhatsApp: false,
      mostrarCTA: true,
      derivarHumano: false
    };
    
    // 4. Nivel de insistencia
    this.insistenceLevel = data.insistenceLevel || 'medio';
    
    // 5. Tono de comunicación
    this.communicationTone = data.communicationTone || 'profesional';
    
    // Metadata
    this.lastUpdated = data.lastUpdated || new Date().toISOString();
    this.updatedBy = data.updatedBy || 'system';
  }

  /**
   * Validar que la configuración es válida
   */
  isValid() {
    const validObjectives = ['generar_leads', 'agendar_reuniones', 'calificar_clientes', 'vender_directamente'];
    const validInsistence = ['bajo', 'medio', 'alto'];
    const validTones = ['profesional', 'cercano', 'directo'];

    return validObjectives.includes(this.mainObjective) &&
           validInsistence.includes(this.insistenceLevel) &&
           validTones.includes(this.communicationTone);
  }

  /**
   * Obtener descripción humana del objetivo
   */
  getObjectiveDescription() {
    const descriptions = {
      'generar_leads': 'Capturar datos de contacto de prospectos interesados',
      'agendar_reuniones': 'Coordinar reuniones y demos con clientes potenciales',
      'calificar_clientes': 'Identificar y clasificar leads por nivel de interés',
      'vender_directamente': 'Cerrar ventas y concretar negocios inmediatamente'
    };
    return descriptions[this.mainObjective] || this.mainObjective;
  }

  /**
   * Obtener lista de criterios activos para Lead Caliente
   */
  getActiveHotLeadCriteria() {
    return Object.entries(this.hotLeadCriteria)
      .filter(([_, isActive]) => isActive)
      .map(([key, _]) => this._criteriaKeyToLabel(key));
  }

  /**
   * Obtener lista de acciones activas para Lead Caliente
   */
  getActiveHotLeadActions() {
    return Object.entries(this.hotLeadActions)
      .filter(([_, isActive]) => isActive)
      .map(([key, _]) => this._actionKeyToLabel(key));
  }

  /**
   * Convertir clave de criterio a etiqueta legible
   */
  _criteriaKeyToLabel(key) {
    const labels = {
      'pidePrecio': 'Cliente pide precio',
      'pideCita': 'Cliente pide agendar',
      'dejaTelefono': 'Cliente deja teléfono',
      'mencionaUrgencia': 'Cliente menciona urgencia',
      'consultaDisponibilidad': 'Cliente consulta disponibilidad'
    };
    return labels[key] || key;
  }

  /**
   * Convertir clave de acción a etiqueta legible
   */
  _actionKeyToLabel(key) {
    const labels = {
      'enviarEmail': 'Enviar email de notificación',
      'enviarWhatsApp': 'Enviar mensaje por WhatsApp',
      'mostrarCTA': 'Mostrar CTA inmediato en chat',
      'derivarHumano': 'Derivar inmediatamente a humano'
    };
    return labels[key] || key;
  }

  /**
   * Serializar a JSON
   */
  toJSON() {
    return {
      mainObjective: this.mainObjective,
      hotLeadCriteria: this.hotLeadCriteria,
      hotLeadActions: this.hotLeadActions,
      insistenceLevel: this.insistenceLevel,
      communicationTone: this.communicationTone,
      lastUpdated: this.lastUpdated,
      updatedBy: this.updatedBy
    };
  }

  /**
   * Crear desde JSON
   */
  static fromJSON(json) {
    return new CommercialStrategy(json);
  }
}

module.exports = CommercialStrategy;

