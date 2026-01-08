/**
 * Servicio de notificaciones para leads calientes
 * Implementa notificaciones por consola y estructura para email/WhatsApp
 */
class NotificationService {
  
  /**
   * Notificar sobre un nuevo lead caliente
   */
  async notificarLeadCaliente(lead) {
    console.log('\n🔥🔥🔥 ¡NUEVO LEAD CALIENTE! 🔥🔥🔥');
    console.log('=====================================');
    console.log(`📋 Nombre: ${lead.nombre || 'No proporcionado'}`);
    console.log(`📞 Teléfono: ${lead.telefono || 'No proporcionado'}`);
    console.log(`🛠️  Servicio: ${lead.servicio || 'No especificado'}`);
    console.log(`📍 Comuna: ${lead.comuna || 'No especificada'}`);
    console.log(`⚡ Urgencia: ${lead.urgencia || 'No especificada'}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log('=====================================\n');

    // Enviar notificación por email (implementar según necesidad)
    if (process.env.OWNER_EMAIL) {
      await this.enviarEmail(lead);
    }

    // Enviar notificación por WhatsApp (implementar según necesidad)
    if (process.env.OWNER_PHONE) {
      await this.enviarWhatsApp(lead);
    }

    return true;
  }

  /**
   * Enviar email al propietario
   * Estructura lista para implementar con nodemailer o similar
   */
  async enviarEmail(lead) {
    // TODO: Implementar con nodemailer cuando se requiera
    console.log(`📧 [Email pendiente de configuración] → ${process.env.OWNER_EMAIL}`);
    
    /*
    Ejemplo de implementación con nodemailer:
    
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.OWNER_EMAIL,
      subject: `🔥 Nuevo Lead Caliente: ${lead.nombre}`,
      html: `
        <h2>¡Nuevo Lead Caliente!</h2>
        <p><strong>Nombre:</strong> ${lead.nombre}</p>
        <p><strong>Teléfono:</strong> ${lead.telefono}</p>
        <p><strong>Servicio:</strong> ${lead.servicio}</p>
        <p><strong>Comuna:</strong> ${lead.comuna}</p>
        <p><strong>Urgencia:</strong> ${lead.urgencia}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CL')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    */
    
    return true;
  }

  /**
   * Enviar mensaje por WhatsApp al propietario
   * Estructura lista para implementar con WhatsApp Cloud API
   */
  async enviarWhatsApp(lead) {
    // TODO: Implementar con WhatsApp Cloud API cuando se requiera
    console.log(`💬 [WhatsApp pendiente de configuración] → ${process.env.OWNER_PHONE}`);
    
    /*
    Ejemplo de implementación con WhatsApp Cloud API:
    
    const axios = require('axios');
    
    const mensaje = `🔥 *¡NUEVO LEAD CALIENTE!*\n\n` +
                   `📋 *Nombre:* ${lead.nombre}\n` +
                   `📞 *Teléfono:* ${lead.telefono}\n` +
                   `🛠️ *Servicio:* ${lead.servicio}\n` +
                   `📍 *Comuna:* ${lead.comuna}\n` +
                   `⚡ *Urgencia:* ${lead.urgencia}`;

    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: process.env.OWNER_PHONE,
        type: 'text',
        text: { body: mensaje }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    */
    
    return true;
  }

  /**
   * Notificar sobre lead tibio (opcional)
   */
  async notificarLeadTibio(lead) {
    console.log('🌡️  Nuevo lead tibio registrado:', lead.nombre);
    return true;
  }

  /**
   * Notificar sobre lead frío (opcional, solo log)
   */
  async notificarLeadFrio(lead) {
    console.log('❄️  Nuevo lead frío registrado:', lead.nombre);
    return true;
  }
}

module.exports = new NotificationService();

