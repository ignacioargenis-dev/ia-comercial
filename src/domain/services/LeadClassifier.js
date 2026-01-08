/**
 * Servicio de Dominio: Lead Classifier
 * 
 * Responsabilidad: Aplicar reglas de negocio para clasificar leads
 * según su nivel de oportunidad (frio, tibio, caliente)
 * 
 * Este es un servicio de dominio puro que NO depende de infraestructura.
 * Contiene SOLO lógica de negocio.
 */

class LeadClassifier {
  
  /**
   * Palabras clave que indican un lead CALIENTE
   */
  static HOT_KEYWORDS = [
    // Verbos de acción directa
    'necesito', 'quiero contratar', 'quiero agendar', 'necesito cotizar',
    'cuándo pueden', 'pueden venir', 'quiero programar', 'requiero',
    
    // Urgencia
    'urgente', 'urgencia', 'hoy', 'mañana', 'esta semana', 'lo antes posible',
    'rápido', 'pronto', 'inmediato', 'ya',
    
    // Problemas actuales
    'no funciona', 'se dañó', 'está malo', 'no enciende', 'no enfría',
    'tiene falla', 'problema', 'avería',
    
    // Intención de compra
    'agendar', 'programar', 'visita', 'técnico', 'cotizar', 'presupuesto ahora',
    'disponibilidad', 'cuándo disponibles'
  ];

  /**
   * Palabras clave que indican un lead TIBIO
   */
  static WARM_KEYWORDS = [
    'me interesa', 'quisiera saber', 'más adelante', 'para el futuro',
    'estoy cotizando', 'comparando', 'tal vez', 'posiblemente',
    'eventualmente', 'en unos días', 'próximamente', 'información'
  ];

  /**
   * Palabras que indican consulta genérica (FRIO)
   */
  static COLD_INDICATORS = [
    'info', 'información general', 'qué hacen', 'servicios', 'solo pregunto'
  ];

  /**
   * Clasificar un lead basándose en sus datos y el contexto de la conversación
   * 
   * @param {Lead} lead - Instancia de la entidad Lead
   * @param {Array} conversationHistory - Historial completo de la conversación
   * @returns {string} Estado clasificado: 'frio', 'tibio' o 'caliente'
   */
  static classifyLead(lead, conversationHistory = []) {
    // Obtener el texto completo de la conversación del usuario
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    // 1. Verificar si cumple criterios de CALIENTE
    if (this.isHotLead(lead, userMessages)) {
      return 'caliente';
    }

    // 2. Verificar si cumple criterios de TIBIO
    if (this.isWarmLead(lead, userMessages)) {
      return 'tibio';
    }

    // 3. Por defecto es FRIO
    return 'frio';
  }

  /**
   * Determinar si un lead es CALIENTE (oportunidad real)
   * 
   * @param {Lead} lead - Instancia del lead
   * @param {string} conversationText - Texto de la conversación
   * @returns {boolean}
   */
  static isHotLead(lead, conversationText) {
    // Criterio 1: Tiene datos completos (nombre Y teléfono) + palabras clave calientes
    const hasBothContacts = lead.nombre !== null && lead.telefono !== null;
    const hasHotKeywords = this.containsKeywords(conversationText, this.HOT_KEYWORDS);
    
    if (hasBothContacts && hasHotKeywords) {
      return true;
    }

    // Criterio 2: Palabras clave de urgencia extrema (incluso sin datos completos)
    const urgencyKeywords = ['urgente', 'urgencia', 'inmediato', 'hoy', 'no funciona', 'se dañó'];
    if (this.containsKeywords(conversationText, urgencyKeywords)) {
      return true;
    }

    // Criterio 3: Solicitud directa de acción (agendar, cotizar, visita)
    const actionKeywords = ['cuándo pueden', 'pueden venir', 'quiero agendar', 'necesito cotizar', 'programar visita'];
    if (this.containsKeywords(conversationText, actionKeywords)) {
      return true;
    }

    // Criterio 4: Tiene nombre Y teléfono Y servicio especificado
    if (lead.nombre !== null && lead.telefono !== null && lead.servicio !== null) {
      return true;
    }

    return false;
  }

  /**
   * Determinar si un lead es TIBIO (interés moderado)
   * 
   * @param {Lead} lead - Instancia del lead
   * @param {string} conversationText - Texto de la conversación
   * @returns {boolean}
   */
  static isWarmLead(lead, conversationText) {
    // Criterio 1: Proporcionó al menos un dato de contacto
    const hasAnyContact = lead.nombre !== null || lead.telefono !== null;
    
    if (hasAnyContact) {
      return true;
    }

    // Criterio 2: Especificó servicio concreto
    if (lead.servicio !== null && lead.servicio.length > 3) {
      return true;
    }

    // Criterio 3: Usa palabras de interés moderado
    if (this.containsKeywords(conversationText, this.WARM_KEYWORDS)) {
      return true;
    }

    // Criterio 4: La conversación tiene más de 3 mensajes del usuario (engagement)
    const userMessageCount = conversationText.split('.').length;
    if (userMessageCount > 3) {
      return true;
    }

    return false;
  }

  /**
   * Verificar si el texto contiene alguna de las palabras clave
   * 
   * @param {string} text - Texto a analizar
   * @param {Array<string>} keywords - Palabras clave a buscar
   * @returns {boolean}
   */
  static containsKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  /**
   * Obtener razón de la clasificación (para logging y debugging)
   * 
   * @param {Lead} lead - Instancia del lead
   * @param {Array} conversationHistory - Historial de conversación
   * @returns {string} Razón de la clasificación
   */
  static getClassificationReason(lead, conversationHistory = []) {
    const userMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    const estado = this.classifyLead(lead, conversationHistory);

    // Construir explicación
    const reasons = [];

    if (estado === 'caliente') {
      if (lead.nombre && lead.telefono) {
        reasons.push('tiene nombre y teléfono');
      }
      if (this.containsKeywords(userMessages, ['urgente', 'urgencia', 'hoy', 'inmediato'])) {
        reasons.push('muestra urgencia');
      }
      if (this.containsKeywords(userMessages, ['agendar', 'cotizar', 'cuándo pueden'])) {
        reasons.push('solicita acción directa');
      }
      if (this.containsKeywords(userMessages, ['no funciona', 'se dañó', 'problema'])) {
        reasons.push('tiene problema actual');
      }
    } else if (estado === 'tibio') {
      if (lead.nombre || lead.telefono) {
        reasons.push('proporcionó algún dato de contacto');
      }
      if (lead.servicio) {
        reasons.push('especificó servicio');
      }
      if (this.containsKeywords(userMessages, this.WARM_KEYWORDS)) {
        reasons.push('muestra interés moderado');
      }
    } else {
      reasons.push('consulta general sin datos ni urgencia');
    }

    return reasons.length > 0 
      ? reasons.join(', ') 
      : 'sin criterios claros de clasificación';
  }

  /**
   * Validar si la clasificación del LLM es coherente con las reglas de negocio
   * 
   * @param {string} llmEstado - Estado asignado por el LLM
   * @param {Lead} lead - Instancia del lead
   * @param {Array} conversationHistory - Historial de conversación
   * @returns {Object} { isValid: boolean, suggestedEstado: string, reason: string }
   */
  static validateClassification(llmEstado, lead, conversationHistory = []) {
    const suggestedEstado = this.classifyLead(lead, conversationHistory);
    const isValid = llmEstado === suggestedEstado;

    if (isValid) {
      return {
        isValid: true,
        suggestedEstado: llmEstado,
        reason: 'Clasificación del LLM coincide con reglas de negocio'
      };
    }

    // Si no coincide, explicar por qué
    const reason = this.getClassificationReason(lead, conversationHistory);
    
    return {
      isValid: false,
      suggestedEstado: suggestedEstado,
      reason: `Debería ser '${suggestedEstado}' porque ${reason}`
    };
  }
}

module.exports = LeadClassifier;

