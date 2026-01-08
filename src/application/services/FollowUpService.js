const FollowUpRules = require('../../domain/services/FollowUpRules');

/**
 * Servicio de Seguimiento Automático
 * 
 * Coordina el envío de mensajes de seguimiento automático a leads.
 * Puede usar email, WhatsApp o SMS según configuración.
 */
class FollowUpService {
  constructor({ leadRepository, notificationService, businessConfig }) {
    this.leadRepository = leadRepository;
    this.notificationService = notificationService;
    this.businessConfig = businessConfig;
  }

  /**
   * Enviar seguimiento a un lead
   * @param {Object} lead - Lead a seguir
   * @param {string} type - Tipo de seguimiento (caliente/tibio)
   * @returns {Promise<boolean>}
   */
  async sendFollowUp(lead, type) {
    try {
      console.log(`📤 Enviando seguimiento a lead #${lead.id} (${type})`);

      // Verificar que el lead necesita seguimiento
      if (!FollowUpRules.needsFollowUp(lead, lead.ultima_interaccion)) {
        console.log(`   ℹ️  Lead #${lead.id} no necesita seguimiento aún`);
        return false;
      }

      // Generar mensaje
      const message = FollowUpRules.getFollowUpMessage(lead, this.businessConfig?.getConfig());
      
      if (!message) {
        console.log(`   ⚠️  No se pudo generar mensaje para lead #${lead.id}`);
        return false;
      }

      // Intentar enviar por el canal preferido
      const sent = await this.sendByPreferredChannel(lead, message, type);

      if (sent) {
        // Registrar el seguimiento
        this.leadRepository.recordFollowUp(
          lead.id,
          type,
          'sent',
          message.substring(0, 200) // Guardar extracto del mensaje
        );

        // Actualizar última interacción
        this.leadRepository.updateLastInteraction(lead.id);

        console.log(`   ✅ Seguimiento enviado exitosamente a lead #${lead.id}`);
        return true;
      }

      // Si no se pudo enviar, registrar el intento fallido
      this.leadRepository.recordFollowUp(
        lead.id,
        type,
        'failed',
        'No se pudo enviar por ningún canal'
      );

      return false;

    } catch (error) {
      console.error(`❌ Error al enviar seguimiento a lead #${lead.id}:`, error);
      
      // Registrar el error
      this.leadRepository.recordFollowUp(
        lead.id,
        type,
        'error',
        error.message
      );

      return false;
    }
  }

  /**
   * Enviar por el canal preferido
   * @param {Object} lead - Lead
   * @param {string} message - Mensaje
   * @param {string} type - Tipo
   * @returns {Promise<boolean>}
   * @private
   */
  async sendByPreferredChannel(lead, message, type) {
    // Prioridad 1: WhatsApp (si está configurado y el lead tiene teléfono)
    if (lead.telefono) {
      try {
        const whatsappClient = require('../../infrastructure/external/WhatsAppClient');
        const client = new whatsappClient();
        
        if (client.isConfigured()) {
          console.log(`   📱 Enviando por WhatsApp a ${lead.telefono}...`);
          
          // Formatear número de teléfono
          const formattedNumber = client.formatPhoneNumber(lead.telefono);
          
          // Enviar mensaje
          await client.sendTextMessage(formattedNumber, message);
          
          console.log(`   ✅ Mensaje WhatsApp enviado exitosamente`);
          return true;
        } else {
          console.log(`   ℹ️  WhatsApp no configurado, intentando email...`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error en WhatsApp (${error.message}), intentando email...`);
      }
    }

    // Prioridad 2: Email (si está configurado y el lead tiene email o teléfono)
    if (this.notificationService && (lead.email || lead.telefono)) {
      try {
        console.log(`   📧 Enviando por Email...`);
        
        const subject = FollowUpRules.getFollowUpSubject(lead, this.businessConfig?.getConfig());
        const emailData = {
          id: lead.id,
          nombre: lead.nombre,
          telefono: lead.telefono,
          servicio: lead.servicio,
          comuna: lead.comuna,
          estado: lead.estado,
          fecha: lead.fecha,
          message: message,
          subject: subject
        };

        // Usar el servicio de notificaciones existente
        await this.notificationService.notificarLeadTibio(emailData);
        
        return true;
      } catch (error) {
        console.log(`   ⚠️  Error en Email:`, error.message);
      }
    }

    // Prioridad 3: Webhook (si está configurado)
    if (process.env.WEBHOOK_URL) {
      try {
        console.log(`   🔗 Enviando por Webhook...`);
        
        const webhookData = {
          event: 'follow_up',
          type: type,
          lead: {
            id: lead.id,
            nombre: lead.nombre,
            telefono: lead.telefono,
            servicio: lead.servicio,
            estado: lead.estado
          },
          message: message,
          timestamp: new Date().toISOString()
        };

        // Enviar webhook
        const fetch = require('node-fetch');
        const response = await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        });

        if (response.ok) {
          console.log(`   ✅ Webhook enviado exitosamente`);
          return true;
        } else {
          throw new Error(`Webhook respondió con ${response.status}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error en Webhook:`, error.message);
      }
    }

    // Si no hay ningún canal configurado, solo registrar en logs
    console.log(`   ℹ️  No hay canales de envío configurados`);
    console.log(`   📝 Mensaje que se enviaría:`);
    console.log(`   ${message.substring(0, 100)}...`);

    return false; // No se envió realmente
  }

  /**
   * Obtener historial de seguimientos de un lead
   * @param {number} leadId - ID del lead
   * @returns {Array}
   */
  getFollowUpHistory(leadId) {
    return this.leadRepository.getFollowUps(leadId);
  }

  /**
   * Verificar si un lead necesita seguimiento
   * @param {Object} lead - Lead
   * @returns {boolean}
   */
  needsFollowUp(lead) {
    return FollowUpRules.needsFollowUp(lead, lead.ultima_interaccion);
  }

  /**
   * Obtener siguiente fecha de seguimiento
   * @param {Object} lead - Lead
   * @returns {Date|null}
   */
  getNextFollowUpDate(lead) {
    const lastFollowUp = this.leadRepository.getLastFollowUp(lead.id);
    const lastDate = lastFollowUp ? new Date(lastFollowUp.fecha_envio) : new Date(lead.ultima_interaccion);
    
    return FollowUpRules.getNextFollowUpDate(lead, lastDate);
  }

  /**
   * Obtener estadísticas de seguimientos
   * @returns {Object}
   */
  getStats() {
    const allLeads = this.leadRepository.findAll();
    return FollowUpRules.getFollowUpStats(allLeads);
  }

  /**
   * Enviar seguimiento manual a un lead específico
   * @param {number} leadId - ID del lead
   * @returns {Promise<boolean>}
   */
  async sendManualFollowUp(leadId) {
    const lead = this.leadRepository.findById(leadId);
    
    if (!lead) {
      throw new Error(`Lead #${leadId} no encontrado`);
    }

    if (lead.contactado) {
      throw new Error(`Lead #${leadId} ya fue contactado`);
    }

    return await this.sendFollowUp(lead, lead.estado);
  }
}

module.exports = FollowUpService;

