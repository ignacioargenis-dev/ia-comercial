/**
 * Reglas de Seguimiento Automático de Leads
 * 
 * Define las reglas de negocio para el seguimiento automático:
 * - Leads tibios: recordatorio después de 24h sin interacción
 * - Leads calientes: notificación después de 12h sin contacto humano
 */
class FollowUpRules {
  /**
   * Obtener tiempo de espera antes del seguimiento (en horas)
   * @param {string} estado - Estado del lead (caliente/tibio/frio)
   * @returns {number} Horas a esperar
   */
  static getFollowUpDelay(estado) {
    const delays = {
      'caliente': 12, // 12 horas
      'tibio': 24,    // 24 horas
      'frio': null    // No hacer seguimiento automático
    };
    
    return delays[estado] || null;
  }

  /**
   * Determinar si un lead necesita seguimiento
   * @param {Object} lead - Lead a evaluar
   * @param {Date} lastInteractionDate - Fecha de última interacción
   * @returns {boolean}
   */
  static needsFollowUp(lead, lastInteractionDate) {
    // No hacer seguimiento si ya fue contactado por humano
    if (lead.contactado) {
      return false;
    }

    // No hacer seguimiento a leads fríos
    if (lead.estado === 'frio') {
      return false;
    }

    // Obtener delay según estado
    const delayHours = this.getFollowUpDelay(lead.estado);
    if (!delayHours) {
      return false;
    }

    // Calcular tiempo transcurrido
    const now = new Date();
    const lastInteraction = new Date(lastInteractionDate);
    const hoursElapsed = (now - lastInteraction) / (1000 * 60 * 60);

    return hoursElapsed >= delayHours;
  }

  /**
   * Obtener mensaje de seguimiento según estado
   * @param {Object} lead - Lead
   * @param {Object} businessConfig - Configuración del negocio
   * @returns {string}
   */
  static getFollowUpMessage(lead, businessConfig) {
    const businessName = businessConfig?.business?.name || 'Nuestro equipo';
    const nombre = lead.nombre || 'estimado cliente';

    if (lead.estado === 'caliente') {
      return `Hola ${nombre}, soy ${businessName}. 

Vimos que estabas interesado en nuestro servicio de ${lead.servicio || 'nuestros servicios'}. 

¿Sigues necesitando ayuda? Estamos disponibles para ayudarte ahora mismo.

¿Te gustaría que agendemos una visita o te enviemos una cotización?`;
    }

    if (lead.estado === 'tibio') {
      return `Hola ${nombre}, te saluda ${businessName}. 

Hace un tiempo consultaste sobre ${lead.servicio || 'nuestros servicios'}.

¿Sigues interesado? Nos encantaría poder ayudarte.

Responde este mensaje y con gusto te atendemos. 😊`;
    }

    return null;
  }

  /**
   * Obtener asunto de email según estado
   * @param {Object} lead - Lead
   * @param {Object} businessConfig - Configuración del negocio
   * @returns {string}
   */
  static getFollowUpSubject(lead, businessConfig) {
    const businessName = businessConfig?.business?.name || 'Nuestro equipo';

    if (lead.estado === 'caliente') {
      return `${businessName} - ¿Seguimos con tu solicitud?`;
    }

    if (lead.estado === 'tibio') {
      return `${businessName} - ¿Aún necesitas ayuda?`;
    }

    return 'Seguimiento';
  }

  /**
   * Obtener prioridad del seguimiento
   * @param {string} estado - Estado del lead
   * @returns {string}
   */
  static getFollowUpPriority(estado) {
    const priorities = {
      'caliente': 'high',
      'tibio': 'normal',
      'frio': 'low'
    };
    
    return priorities[estado] || 'low';
  }

  /**
   * Calcular siguiente fecha de seguimiento
   * @param {Object} lead - Lead
   * @param {Date} lastFollowUp - Fecha del último seguimiento
   * @returns {Date|null}
   */
  static getNextFollowUpDate(lead, lastFollowUp) {
    if (lead.contactado) {
      return null; // Ya contactado, no más seguimientos
    }

    const delayHours = this.getFollowUpDelay(lead.estado);
    if (!delayHours) {
      return null;
    }

    const nextDate = new Date(lastFollowUp);
    nextDate.setHours(nextDate.getHours() + delayHours);
    
    return nextDate;
  }

  /**
   * Verificar si es horario laboral para enviar seguimiento
   * @param {Object} schedule - Horarios del negocio
   * @returns {boolean}
   */
  static isWorkingHours(schedule) {
    if (!schedule) return true; // Si no hay horario configurado, enviar siempre

    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutos desde medianoche

    const daySchedule = schedule.workingDays?.[dayOfWeek];
    
    if (!daySchedule || !daySchedule.enabled) {
      return false; // Día no laborable
    }

    // Convertir horarios a minutos
    const [openHour, openMin] = daySchedule.open.split(':').map(Number);
    const [closeHour, closeMin] = daySchedule.close.split(':').map(Number);
    
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
  }

  /**
   * Obtener estadísticas de seguimiento
   * @param {Array} leads - Lista de leads
   * @returns {Object}
   */
  static getFollowUpStats(leads) {
    const stats = {
      total: leads.length,
      pendingFollowUp: 0,
      calientes: 0,
      tibios: 0,
      contactados: 0
    };

    for (const lead of leads) {
      if (lead.contactado) {
        stats.contactados++;
      } else {
        if (lead.estado === 'caliente') stats.calientes++;
        if (lead.estado === 'tibio') stats.tibios++;
        stats.pendingFollowUp++;
      }
    }

    return stats;
  }
}

module.exports = FollowUpRules;

