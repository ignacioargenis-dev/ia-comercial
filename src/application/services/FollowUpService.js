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

  /**
   * Enviar reporte diario al propietario
   * @param {Object} stats - Estadísticas del sistema
   * @returns {Promise<boolean>}
   */
  async sendDailyReport(stats) {
    try {
      console.log('📊 Enviando reporte diario...');

      // Verificar que Resend esté configurado
      if (!process.env.RESEND_API_KEY) {
        console.log('⚠️  RESEND_API_KEY no configurado, saltando reporte diario');
        return false;
      }

      if (!process.env.EMAIL_TO && !process.env.OWNER_EMAIL) {
        console.log('⚠️  EMAIL_TO no configurado, saltando reporte diario');
        return false;
      }

      const businessName = this.businessConfig?.getConfig()?.business?.name || 'IA Comercial';
      const today = new Date().toLocaleDateString('es-CL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Crear HTML del reporte
      const reportHTML = this.buildDailyReportHTML(stats, businessName, today);

      // Enviar usando Resend
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data, error } = await resend.emails.send({
        from: `${businessName} <onboarding@resend.dev>`,
        to: [process.env.EMAIL_TO || process.env.OWNER_EMAIL],
        subject: `📊 Reporte Diario - ${today}`,
        html: reportHTML
      });

      if (error) {
        console.error('❌ Error al enviar reporte diario:', error);
        return false;
      }

      console.log(`✅ Reporte diario enviado exitosamente (ID: ${data?.id})`);
      return true;

    } catch (error) {
      console.error('❌ Error en sendDailyReport:', error);
      return false;
    }
  }

  /**
   * Construir HTML del reporte diario
   * @param {Object} stats - Estadísticas
   * @param {string} businessName - Nombre del negocio
   * @param {string} date - Fecha
   * @returns {string} HTML del reporte
   * @private
   */
  buildDailyReportHTML(stats, businessName, date) {
    const totalLeads = stats.total || 0;
    const calientes = stats.porEstado?.caliente || 0;
    const tibios = stats.porEstado?.tibio || 0;
    const frios = stats.porEstado?.frio || 0;
    const noContactados = stats.noContactados || 0;

    // Estadísticas por canal
    const porCanal = stats.porCanalEstado || {};
    const webLeads = porCanal.web?.total || 0;
    const instagramLeads = porCanal.instagram?.total || 0;
    const whatsappLeads = porCanal.whatsapp?.total || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #667eea; }
          .stat-card.hot { border-left-color: #ff4757; }
          .stat-card.warm { border-left-color: #ffa502; }
          .stat-card.cold { border-left-color: #70a1ff; }
          .stat-number { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .stat-label { color: #666; font-size: 14px; }
          .section-title { color: #667eea; font-size: 18px; font-weight: bold; margin: 25px 0 15px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
          .channel-list { list-style: none; padding: 0; }
          .channel-item { padding: 12px; background: #f8f9fa; margin: 8px 0; border-radius: 6px; display: flex; justify-content: space-between; }
          .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 Reporte Diario</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${businessName}</p>
            <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">${date}</p>
          </div>
          
          <div class="content">
            <div class="section-title">📈 Resumen General</div>
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-number">${totalLeads}</div>
                <div class="stat-label">Total Leads</div>
              </div>
              <div class="stat-card hot">
                <div class="stat-number" style="color: #ff4757;">${calientes}</div>
                <div class="stat-label">🔥 Calientes</div>
              </div>
              <div class="stat-card warm">
                <div class="stat-number" style="color: #ffa502;">${tibios}</div>
                <div class="stat-label">🌡️ Tibios</div>
              </div>
              <div class="stat-card cold">
                <div class="stat-number" style="color: #70a1ff;">${frios}</div>
                <div class="stat-label">❄️ Fríos</div>
              </div>
            </div>

            ${noContactados > 0 ? `
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <strong>⚠️ Atención:</strong> Hay <strong>${noContactados}</strong> lead(s) sin contactar
            </div>
            ` : ''}

            <div class="section-title">📱 Leads por Canal</div>
            <ul class="channel-list">
              <li class="channel-item">
                <span>🌐 Web</span>
                <strong>${webLeads}</strong>
              </li>
              <li class="channel-item">
                <span>📸 Instagram</span>
                <strong>${instagramLeads}</strong>
              </li>
              <li class="channel-item">
                <span>💚 WhatsApp</span>
                <strong>${whatsappLeads}</strong>
              </li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sendspress.cl/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                Ver Dashboard Completo
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>${businessName}</strong> - Sistema de IA Comercial</p>
            <p>Reporte generado automáticamente</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = FollowUpService;

