/**
 * Caso de Uso: Notificar al Propietario
 * 
 * Responsabilidad: Enviar notificaciones al propietario del negocio
 * cuando se identifica una oportunidad de negocio (lead caliente)
 * 
 * Este caso de uso se dispara automáticamente cuando:
 * - Se guarda un lead con estado "caliente"
 * - Un lead cambia de estado a "caliente"
 */
class NotifyOwner {
  /**
   * Constructor con inyección de dependencias
   * @param {Object} dependencies - Dependencias
   * @param {NotificationService} dependencies.notificationService - Servicio de notificaciones
   */
  constructor({ notificationService }) {
    this.notificationService = notificationService;
  }

  /**
   * Ejecutar notificación al propietario
   * 
   * @param {Object} params - Parámetros
   * @param {Lead} params.lead - Lead que disparó la notificación
   * @param {string} params.reason - Razón de la notificación
   * @param {string} params.priority - Prioridad (hot, warm, cold)
   * @returns {Promise<Object>} Resultado de la notificación
   */
  async execute({ lead, reason = '', priority = 'normal' }) {
    try {
      console.log(`\n🔔 Disparando notificación al propietario...`);
      console.log(`   Lead: ${lead.toString()}`);
      console.log(`   Razón: ${reason || 'Lead caliente detectado'}`);
      console.log(`   Prioridad: ${priority}\n`);

      const notificationData = this.prepareNotificationData(lead, reason);
      
      // Enviar notificación según el estado del lead
      let result;
      
      if (lead.esCaliente()) {
        result = await this.notificationService.notificarLeadCaliente(notificationData);
      } else if (lead.esTibio()) {
        result = await this.notificationService.notificarLeadTibio(notificationData);
      } else {
        result = await this.notificationService.notificarLeadFrio(notificationData);
      }

      console.log(`✅ Notificación enviada exitosamente\n`);

      return {
        success: true,
        notificationSent: true,
        leadId: lead.id,
        leadEstado: lead.estado,
        message: 'Notificación enviada al propietario'
      };

    } catch (error) {
      console.error('❌ Error al notificar al propietario:', error);
      
      // No lanzar error para no interrumpir el flujo principal
      return {
        success: false,
        notificationSent: false,
        leadId: lead.id,
        error: error.message,
        message: 'Error al enviar notificación, pero lead guardado correctamente'
      };
    }
  }

  /**
   * Preparar datos para la notificación
   * 
   * @param {Lead} lead - Lead a notificar
   * @param {string} reason - Razón de la notificación
   * @returns {Object} Datos formateados para notificación
   * @private
   */
  prepareNotificationData(lead, reason) {
    return {
      id: lead.id,
      nombre: lead.nombre || 'No proporcionado',
      telefono: lead.telefono || 'No proporcionado',
      servicio: lead.servicio || 'No especificado',
      comuna: lead.comuna || 'No especificada',
      urgencia: lead.urgencia || 'No especificada',
      estado: lead.estado,
      notas: lead.notas || '',
      prioridad: lead.getNivelPrioridad(),
      fecha: lead.fecha,
      reason: reason
    };
  }

  /**
   * Verificar si se debe notificar (reglas de negocio)
   * 
   * @param {Lead} lead - Lead a evaluar
   * @returns {boolean} True si se debe notificar
   */
  shouldNotify(lead) {
    // Siempre notificar leads calientes
    if (lead.esCaliente()) {
      return true;
    }

    // Notificar leads tibios con datos completos
    if (lead.esTibio() && lead.estaCompleto()) {
      return true;
    }

    // No notificar leads fríos a menos que tengan datos muy completos
    if (lead.esFrio() && lead.nombre && lead.telefono && lead.servicio) {
      return true;
    }

    return false;
  }

  /**
   * Obtener prioridad de notificación
   * 
   * @param {Lead} lead - Lead a evaluar
   * @returns {string} Prioridad: 'urgent', 'high', 'normal', 'low'
   */
  getNotificationPriority(lead) {
    if (lead.esCaliente() && lead.estaCompleto()) {
      return 'urgent'; // Notificación inmediata
    }
    
    if (lead.esCaliente()) {
      return 'high'; // Alta prioridad
    }
    
    if (lead.esTibio() && lead.estaCompleto()) {
      return 'high'; // Alta prioridad
    }
    
    if (lead.esTibio()) {
      return 'normal'; // Prioridad normal
    }
    
    return 'low'; // Baja prioridad
  }
}

module.exports = NotifyOwner;

