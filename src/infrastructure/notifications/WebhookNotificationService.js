const https = require('https');
const http = require('http');

/**
 * Servicio de Notificaciones por Webhook
 * 
 * Implementación concreta que envía notificaciones a un webhook externo.
 * Útil para integrar con Slack, Discord, Make.com, Zapier, etc.
 */
class WebhookNotificationService {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
    this.isConfigured = !!this.webhookUrl;
    
    if (!this.isConfigured) {
      console.warn('⚠️  Webhook no configurado - Variable WEBHOOK_URL faltante en .env');
    } else {
      console.log('✅ Servicio de webhook inicializado correctamente');
    }
  }

  /**
   * Notificar sobre un lead caliente
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadCaliente(leadData) {
    this.logToConsole('CALIENTE', leadData);

    if (!this.isConfigured) {
      console.log('🔗 Webhook no configurado - Notificación solo en consola');
      return true;
    }

    try {
      const payload = this.buildPayload('hot', leadData);
      await this.sendWebhook(payload);
      
      console.log('✅ Webhook enviado correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error al enviar webhook:', error.message);
      return false;
    }
  }

  /**
   * Notificar sobre un lead tibio
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadTibio(leadData) {
    this.logToConsole('TIBIO', leadData);

    // Solo notificar tibios si están completos
    if (!leadData.nombre || !leadData.telefono) {
      console.log('ℹ️  Lead tibio sin datos completos - No se envía webhook');
      return true;
    }

    if (!this.isConfigured) {
      return true;
    }

    try {
      const payload = this.buildPayload('warm', leadData);
      await this.sendWebhook(payload);
      
      console.log('✅ Webhook de lead tibio enviado');
      return true;

    } catch (error) {
      console.error('❌ Error al enviar webhook de lead tibio:', error.message);
      return false;
    }
  }

  /**
   * Notificar sobre un lead frío (solo log)
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadFrio(leadData) {
    this.logToConsole('FRIO', leadData);
    return true;
  }

  /**
   * Construir payload del webhook
   * 
   * @param {string} type - Tipo de lead: hot, warm, cold
   * @param {Object} leadData - Datos del lead
   * @returns {Object} Payload estructurado
   * @private
   */
  buildPayload(type, leadData) {
    const basePayload = {
      event: 'new_lead',
      type: type,
      timestamp: new Date().toISOString(),
      business: process.env.BUSINESS_NAME || 'Sistema IA',
      lead: {
        id: leadData.id,
        nombre: leadData.nombre || 'No proporcionado',
        telefono: leadData.telefono || 'No proporcionado',
        servicio: leadData.servicio || 'No especificado',
        comuna: leadData.comuna || 'No especificada',
        urgencia: leadData.urgencia || 'No especificada',
        estado: leadData.estado,
        notas: leadData.notas || '',
        fecha: leadData.fecha
      }
    };

    // Formato específico según el tipo de webhook
    const webhookType = process.env.WEBHOOK_TYPE || 'generic';

    if (webhookType === 'slack') {
      return this.formatForSlack(basePayload);
    } else if (webhookType === 'discord') {
      return this.formatForDiscord(basePayload);
    } else if (webhookType === 'make' || webhookType === 'zapier') {
      return basePayload; // Formato genérico para Make.com o Zapier
    }

    return basePayload;
  }

  /**
   * Formatear payload para Slack
   * 
   * @param {Object} payload - Payload base
   * @returns {Object} Payload formateado para Slack
   * @private
   */
  formatForSlack(payload) {
    const emoji = payload.type === 'hot' ? ':fire:' : payload.type === 'warm' ? ':thermometer:' : ':snowflake:';
    const color = payload.type === 'hot' ? '#f5576c' : payload.type === 'warm' ? '#fee140' : '#4facfe';
    
    return {
      text: `${emoji} Nuevo Lead ${payload.type === 'hot' ? 'CALIENTE' : payload.type === 'warm' ? 'Tibio' : 'Frío'}`,
      attachments: [
        {
          color: color,
          fields: [
            { title: 'Nombre', value: payload.lead.nombre, short: true },
            { title: 'Teléfono', value: payload.lead.telefono, short: true },
            { title: 'Servicio', value: payload.lead.servicio, short: true },
            { title: 'Comuna', value: payload.lead.comuna, short: true },
            { title: 'Urgencia', value: payload.lead.urgencia, short: false }
          ],
          footer: payload.business,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
  }

  /**
   * Formatear payload para Discord
   * 
   * @param {Object} payload - Payload base
   * @returns {Object} Payload formateado para Discord
   * @private
   */
  formatForDiscord(payload) {
    const emoji = payload.type === 'hot' ? '🔥' : payload.type === 'warm' ? '🌡️' : '❄️';
    const color = payload.type === 'hot' ? 16007020 : payload.type === 'warm' ? 16702784 : 5234942;
    
    return {
      content: `${emoji} **Nuevo Lead ${payload.type === 'hot' ? 'CALIENTE' : payload.type === 'warm' ? 'Tibio' : 'Frío'}**`,
      embeds: [
        {
          title: `Lead: ${payload.lead.nombre}`,
          color: color,
          fields: [
            { name: '📞 Teléfono', value: payload.lead.telefono, inline: true },
            { name: '🛠️ Servicio', value: payload.lead.servicio, inline: true },
            { name: '📍 Comuna', value: payload.lead.comuna, inline: true },
            { name: '⏰ Urgencia', value: payload.lead.urgencia, inline: false }
          ],
          footer: { text: payload.business },
          timestamp: payload.timestamp
        }
      ]
    };
  }

  /**
   * Enviar webhook HTTP POST
   * 
   * @param {Object} payload - Datos a enviar
   * @returns {Promise<void>}
   * @private
   */
  sendWebhook(payload) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.webhookUrl);
      const protocol = url.protocol === 'https:' ? https : http;
      
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'IA-Comercial-LeadSystem/1.0'
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Webhook respondió con status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Log a consola
   * 
   * @param {string} tipo - Tipo de lead
   * @param {Object} leadData - Datos del lead
   * @private
   */
  logToConsole(tipo, leadData) {
    const emoji = tipo === 'CALIENTE' ? '🔥' : tipo === 'TIBIO' ? '🌡️' : '❄️';
    const border = '='.repeat(60);
    
    console.log(`\n${border}`);
    console.log(`${emoji} WEBHOOK: NUEVO LEAD ${tipo} ${emoji}`);
    console.log(border);
    console.log(`👤 Nombre:    ${leadData.nombre || 'No proporcionado'}`);
    console.log(`📞 Teléfono:  ${leadData.telefono || 'No proporcionado'}`);
    console.log(`🛠️  Servicio:  ${leadData.servicio || 'No especificado'}`);
    console.log(`📍 Comuna:    ${leadData.comuna || 'No especificada'}`);
    if (leadData.urgencia) {
      console.log(`⏰ Urgencia:  ${leadData.urgencia}`);
    }
    console.log(`🕒 Fecha:     ${new Date(leadData.fecha).toLocaleString('es-ES')}`);
    console.log(border + '\n');
  }

  /**
   * Verificar configuración del servicio
   * 
   * @returns {boolean}
   */
  isReady() {
    return this.isConfigured;
  }

  /**
   * Enviar webhook de prueba
   * 
   * @returns {Promise<boolean>}
   */
  async sendTestWebhook() {
    if (!this.isConfigured) {
      console.error('❌ Webhook no configurado');
      return false;
    }

    try {
      const testPayload = {
        event: 'test',
        message: 'Sistema de notificaciones por webhook funcionando correctamente',
        timestamp: new Date().toISOString(),
        business: process.env.BUSINESS_NAME || 'Sistema IA'
      };

      await this.sendWebhook(testPayload);
      console.log('✅ Webhook de prueba enviado correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error al enviar webhook de prueba:', error.message);
      return false;
    }
  }
}

module.exports = WebhookNotificationService;

