const axios = require('axios');
const Logger = require('../logging/Logger');

/**
 * Servicio de Instagram Messaging API (Capa de Infraestructura)
 */
class InstagramService {
  constructor() {
    this.pageToken = process.env.IG_PAGE_TOKEN;
    this.apiUrl = 'https://graph.instagram.com/v21.0';
    
    if (!this.pageToken) {
      Logger.warn('Instagram not configured: IG_PAGE_TOKEN missing');
    } else {
      Logger.info('Instagram Service initialized');
    }
  }

  /**
   * Enviar mensaje de texto a usuario de Instagram
   * @param {string} recipientId - Instagram Scoped ID (IGSID)
   * @param {string} text - Mensaje a enviar
   */
  async sendMessage(recipientId, text) {
    if (!this.pageToken) {
      throw new Error('Instagram not configured');
    }

    try {
      const url = `${this.apiUrl}/me/messages`;
      
      const payload = {
        recipient: {
          id: recipientId
        },
        message: {
          text: text
        }
      };

      Logger.info('📤 Sending Instagram message', {
        recipientId,
        textLength: text.length
      });

      const response = await axios.post(url, payload, {
        params: {
          access_token: this.pageToken
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      Logger.info('✅ Instagram message sent', {
        recipientId,
        messageId: response.data.message_id
      });

      return {
        success: true,
        messageId: response.data.message_id
      };

    } catch (error) {
      Logger.error('❌ Failed to send Instagram message', {
        recipientId,
        error: error.message,
        response: error.response?.data
      });

      throw error;
    }
  }

  /**
   * Validar que el servicio está configurado
   */
  isConfigured() {
    return !!this.pageToken;
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.pageToken) {
      return {
        status: 'not_configured',
        message: 'IG_PAGE_TOKEN not set'
      };
    }

    try {
      // Verificar que el token es válido haciendo una llamada simple
      const url = `${this.apiUrl}/me`;
      await axios.get(url, {
        params: {
          fields: 'id,username',
          access_token: this.pageToken
        },
        timeout: 5000
      });

      return {
        status: 'ok',
        message: 'Instagram API accessible'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

module.exports = InstagramService;

