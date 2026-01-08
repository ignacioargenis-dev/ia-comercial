const fetch = require('node-fetch');

/**
 * Cliente de WhatsApp Cloud API (Capa de Infraestructura)
 * 
 * Encapsula toda la comunicación con la API de WhatsApp Business.
 * Documentación oficial: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
class WhatsAppClient {
  constructor() {
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
    
    // Validar configuración
    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('⚠️  WhatsApp no configurado - Variables WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN faltantes');
    }
  }

  /**
   * Verificar si WhatsApp está configurado
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.phoneNumberId && this.accessToken);
  }

  /**
   * Enviar mensaje de texto
   * @param {string} to - Número de teléfono (formato: 56912345678)
   * @param {string} message - Mensaje de texto
   * @returns {Promise<Object>} Respuesta de la API
   */
  async sendTextMessage(to, message) {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp no configurado correctamente');
    }

    // Limpiar número de teléfono (eliminar + y espacios)
    const cleanNumber = to.replace(/[\s+]/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `WhatsApp API error: ${response.status}`);
      }

      console.log(`✅ Mensaje WhatsApp enviado a ${cleanNumber}`);
      return data;
    } catch (error) {
      console.error('❌ Error al enviar mensaje WhatsApp:', error.message);
      throw error;
    }
  }

  /**
   * Enviar mensaje con botones de respuesta rápida
   * @param {string} to - Número de teléfono
   * @param {string} message - Mensaje de texto
   * @param {Array<string>} buttons - Array de textos de botones (máx 3)
   * @returns {Promise<Object>}
   */
  async sendButtonMessage(to, message, buttons) {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp no configurado correctamente');
    }

    const cleanNumber = to.replace(/[\s+]/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: message
        },
        action: {
          buttons: buttons.slice(0, 3).map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: `btn_${idx}`,
              title: btn.substring(0, 20) // Límite de 20 caracteres
            }
          }))
        }
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `WhatsApp API error: ${response.status}`);
      }

      console.log(`✅ Mensaje con botones enviado a ${cleanNumber}`);
      return data;
    } catch (error) {
      console.error('❌ Error al enviar mensaje con botones:', error.message);
      throw error;
    }
  }

  /**
   * Marcar mensaje como leído
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<Object>}
   */
  async markAsRead(messageId) {
    if (!this.isConfigured()) {
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      });

      if (!response.ok) {
        throw new Error(`Error al marcar como leído: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('⚠️  Error al marcar mensaje como leído:', error.message);
      // No lanzar error, es solo una mejora UX
    }
  }

  /**
   * Enviar indicador de escritura (typing...)
   * @param {string} to - Número de teléfono
   * @returns {Promise<void>}
   */
  async sendTypingIndicator(to) {
    // WhatsApp Cloud API no soporta typing indicator directamente
    // Esta es una función placeholder para futura implementación
    return Promise.resolve();
  }

  /**
   * Obtener información del número de teléfono
   * @returns {Promise<Object>}
   */
  async getPhoneNumberInfo() {
    if (!this.isConfigured()) {
      throw new Error('WhatsApp no configurado correctamente');
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error al obtener info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error al obtener info del número:', error.message);
      throw error;
    }
  }

  /**
   * Validar webhook de verificación de Meta
   * @param {string} mode - Modo de verificación
   * @param {string} token - Token de verificación
   * @param {string} challenge - Challenge de Meta
   * @returns {string|null} Challenge si es válido, null si no
   */
  validateWebhookVerification(mode, token, challenge) {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      console.error('❌ WHATSAPP_VERIFY_TOKEN no configurado');
      return null;
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook de WhatsApp verificado correctamente');
      return challenge;
    }

    console.error('❌ Token de verificación inválido');
    return null;
  }

  /**
   * Extraer mensaje de texto del webhook
   * @param {Object} entry - Entry del webhook
   * @returns {Object|null} Objeto con from, messageId, text, timestamp
   */
  extractMessageFromWebhook(entry) {
    try {
      const changes = entry.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages?.[0];

      if (!messages) {
        return null;
      }

      // Solo procesar mensajes de texto
      if (messages.type !== 'text') {
        console.log(`ℹ️  Tipo de mensaje no soportado: ${messages.type}`);
        return null;
      }

      return {
        from: messages.from,
        messageId: messages.id,
        text: messages.text?.body || '',
        timestamp: messages.timestamp,
        name: value.contacts?.[0]?.profile?.name || 'Usuario'
      };
    } catch (error) {
      console.error('❌ Error al extraer mensaje del webhook:', error);
      return null;
    }
  }

  /**
   * Verificar si un número está en formato WhatsApp válido
   * @param {string} phoneNumber - Número de teléfono
   * @returns {boolean}
   */
  isValidPhoneNumber(phoneNumber) {
    // Formato: código de país + número (sin +)
    // Ejemplo válido: 56912345678 (Chile)
    const cleaned = phoneNumber.replace(/[\s+]/g, '');
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Formatear número de teléfono para WhatsApp
   * @param {string} phoneNumber - Número (puede incluir +, espacios, guiones)
   * @returns {string} Número limpio para WhatsApp
   */
  formatPhoneNumber(phoneNumber) {
    // Eliminar todos los caracteres no numéricos excepto el +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Eliminar el +
    cleaned = cleaned.replace('+', '');
    
    // Si es número chileno sin código de país, agregar 56
    if (cleaned.length === 9 && cleaned.startsWith('9')) {
      cleaned = '56' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = WhatsAppClient;

