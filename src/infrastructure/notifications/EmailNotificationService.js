const nodemailer = require('nodemailer');

/**
 * Servicio de Notificaciones por Email
 * 
 * Implementación concreta del servicio de notificaciones usando Nodemailer.
 * Envía emails al propietario cuando hay leads importantes.
 */
class EmailNotificationService {
  constructor() {
    this.transporter = null;
    this.sendGridTransporter = null;
    this.isConfigured = false;
    this.initialize();
  }

  /**
   * Inicializar el transporter de Nodemailer
   */
  initialize() {
    try {
      // Verificar que las variables de entorno estén configuradas
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️  Email primario no configurado - Variables EMAIL_USER y EMAIL_PASS faltantes en .env');
        this.isConfigured = false;
      } else {
        // Configurar transporter primario según el servicio
        const emailService = process.env.EMAIL_SERVICE || 'gmail';

        if (emailService === 'gmail') {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS // App Password de Gmail
            }
          });
        } else if (emailService === 'smtp') {
          // Configuración SMTP genérica
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });
        }

        this.isConfigured = true;
        console.log('✅ Servicio de email primario inicializado correctamente');
      }

      // Configurar SendGrid como respaldo (opcional)
      if (process.env.SENDGRID_API_KEY) {
        this.sendGridTransporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
        console.log('✅ Servicio de email respaldo (SendGrid) inicializado');
      } else {
        console.log('ℹ️  SendGrid no configurado - Solo respaldo a consola disponible');
      }

    } catch (error) {
      console.error('❌ Error al inicializar servicio de email:', error.message);
      this.isConfigured = false;
    }
  }

  /**
   * Notificar sobre un lead caliente
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadCaliente(leadData) {
    if (!this.isConfigured) {
      console.log('📧 Email no configurado - Notificación solo en consola');
      this.logToConsole('CALIENTE', leadData);
      return true;
    }

    // Intentar primero con el método configurado
    const exitoPrimario = await this.enviarConMetodoPrimario(leadData, 'CALIENTE');

    if (exitoPrimario) {
      return true;
    }

    // Si falla y tenemos SendGrid configurado, intentar con SendGrid
    if (process.env.SENDGRID_API_KEY) {
      console.log('🔄 Intentando fallback con SendGrid...');
      return await this.enviarConSendGrid(leadData, 'CALIENTE');
    }

    // Si no hay fallback, mostrar en consola
    console.log('📧 Fallback no disponible - Notificación solo en consola');
    this.logToConsole('CALIENTE', leadData);
    return false;
  }

  /**
   * Notificar sobre un lead tibio
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadTibio(leadData) {
    // Solo notificar tibios si están completos
    if (!leadData.nombre || !leadData.telefono) {
      console.log('ℹ️  Lead tibio sin datos completos - No se envía email');
      return true;
    }

    if (!this.isConfigured) {
      console.log('📧 Email no configurado - Notificación solo en consola');
      this.logToConsole('TIBIO', leadData);
      return true;
    }

    // Intentar primero con el método configurado
    const exitoPrimario = await this.enviarConMetodoPrimario(leadData, 'TIBIO');

    if (exitoPrimario) {
      return true;
    }

    // Si falla y tenemos SendGrid configurado, intentar con SendGrid
    if (process.env.SENDGRID_API_KEY) {
      console.log('🔄 Intentando fallback con SendGrid para lead tibio...');
      return await this.enviarConSendGrid(leadData, 'TIBIO');
    }

    // Si no hay fallback, mostrar en consola
    console.log('📧 Fallback no disponible - Notificación solo en consola');
    this.logToConsole('TIBIO', leadData);
    return false;
  }

  /**
   * Notificar sobre un lead frío (solo log)
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {Promise<boolean>}
   */
  async notificarLeadFrio(leadData) {
    // Los leads fríos no generan emails, solo log
    this.logToConsole('FRIO', leadData);
    return true;
  }

  /**
   * Enviar email con método primario configurado
   * @private
   */
  async enviarConMetodoPrimario(leadData, tipo) {
    if (!this.transporter) return false;

    try {
      const emailContent = tipo === 'CALIENTE' ? this.buildHotLeadEmail(leadData) : this.buildWarmLeadEmail(leadData);
      const canalTexto = this.getCanalTexto(leadData.canal);
      const asunto = tipo === 'CALIENTE'
        ? `🔥 Lead caliente desde ${canalTexto} - ${leadData.nombre || 'Sin nombre'}`
        : `🌡️ Lead tibio desde ${canalTexto} - ${leadData.nombre}`;

      const mailOptions = {
        from: `"${process.env.BUSINESS_NAME || 'Sistema IA'}" <${process.env.EMAIL_USER}>`,
        to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
        subject: asunto,
        html: emailContent,
        text: this.buildPlainTextEmail(leadData)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado correctamente con método primario:', info.messageId);
      this.logToConsole(tipo, leadData);
      return true;

    } catch (error) {
      // Si es timeout, probablemente es bloqueo de Gmail
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        console.log('⏰ Timeout en método primario - Probablemente bloqueo de proveedor');
      } else {
        console.error('❌ Error en método primario:', error.message);
      }
      return false;
    }
  }

  /**
   * Enviar email con SendGrid como respaldo
   * @private
   */
  async enviarConSendGrid(leadData, tipo) {
    if (!this.sendGridTransporter) return false;

    try {
      const emailContent = tipo === 'CALIENTE' ? this.buildHotLeadEmail(leadData) : this.buildWarmLeadEmail(leadData);
      const canalTexto = this.getCanalTexto(leadData.canal);
      const asunto = tipo === 'CALIENTE'
        ? `🔥 Lead caliente desde ${canalTexto} - ${leadData.nombre || 'Sin nombre'} (Respaldo)`
        : `🌡️ Lead tibio desde ${canalTexto} - ${leadData.nombre} (Respaldo)`;

      const mailOptions = {
        from: `"${process.env.BUSINESS_NAME || 'Sistema IA'}" <${process.env.EMAIL_USER || 'sistema@sendspress.cl'}>`,
        to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
        subject: asunto,
        html: emailContent,
        text: this.buildPlainTextEmail(leadData)
      };

      const info = await this.sendGridTransporter.sendMail(mailOptions);
      console.log('✅ Email enviado correctamente con SendGrid:', info.messageId);
      this.logToConsole(tipo, leadData);
      return true;

    } catch (error) {
      console.error('❌ Error en SendGrid:', error.message);
      this.logToConsole(tipo, leadData);
      return false;
    }
  }

  /**
   * Construir HTML del email para lead caliente
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {string} HTML del email
   * @private
   */
  buildHotLeadEmail(leadData) {
    const businessName = process.env.BUSINESS_NAME || 'Tu Negocio';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
    .field { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    .field strong { color: #d63031; display: block; margin-bottom: 5px; }
    .urgent { background: #fff3cd; border-left: 4px solid #f5576c; padding: 15px; margin: 20px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; padding: 15px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 ¡Nuevo Lead CALIENTE!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Oportunidad de cierre inmediato</p>
    </div>
    
    <div class="content">
      <div class="urgent">
        <strong>⚡ ACCIÓN REQUERIDA</strong>
        <p>Este cliente muestra intención directa de compra. ¡Contáctalo cuanto antes!</p>
      </div>

      <h2 style="color: #f5576c; border-bottom: 2px solid #f5576c; padding-bottom: 10px;">Datos del Cliente</h2>
      
      <div class="field">
        <strong>👤 Nombre:</strong>
        <span style="font-size: 18px;">${leadData.nombre || 'No proporcionado'}</span>
      </div>

      <div class="field">
        <strong>📞 Teléfono:</strong>
        <span style="font-size: 18px; font-family: monospace;">
          ${leadData.telefono ? `<a href="tel:${leadData.telefono}">${leadData.telefono}</a>` : 'No proporcionado'}
        </span>
      </div>

      <div class="field">
        <strong>🛠️ Servicio Solicitado:</strong>
        <span style="font-size: 18px;">${leadData.servicio || 'No especificado'}</span>
      </div>

      <div class="field">
        <strong>📍 Comuna:</strong>
        <span style="font-size: 18px;">${leadData.comuna || 'No especificada'}</span>
      </div>

      <div class="field">
        <strong>📱 Canal de Origen:</strong>
        <span style="font-size: 18px;">${this.getCanalIcono(leadData.canal)} ${this.getCanalTexto(leadData.canal)}</span>
      </div>

      ${leadData.urgencia ? `
      <div class="field">
        <strong>⏰ Nivel de Urgencia:</strong>
        <span style="font-size: 18px; color: #d63031;">${leadData.urgencia}</span>
      </div>
      ` : ''}

      ${leadData.notas ? `
      <div class="field">
        <strong>📝 Notas Adicionales:</strong>
        <p>${leadData.notas}</p>
      </div>
      ` : ''}

      <div class="field">
        <strong>🕒 Fecha de Captura:</strong>
        <span>${new Date(leadData.fecha).toLocaleString('es-ES', { 
          dateStyle: 'full', 
          timeStyle: 'short' 
        })}</span>
      </div>

      ${leadData.telefono ? `
      <div class="cta">
        <a href="https://wa.me/${leadData.telefono.replace(/[^0-9]/g, '')}" target="_blank">
          💬 Contactar por WhatsApp
        </a>
      </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Este email fue generado automáticamente por ${businessName}</p>
      <p>Sistema de Captura de Leads con IA</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Construir HTML del email para lead tibio
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {string} HTML del email
   * @private
   */
  buildWarmLeadEmail(leadData) {
    const businessName = process.env.BUSINESS_NAME || 'Tu Negocio';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
    .field { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
    .field strong { display: block; margin-bottom: 5px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌡️ Lead Tibio</h1>
      <p>Cliente interesado - Seguimiento recomendado</p>
    </div>
    
    <div class="content">
      <div class="field"><strong>👤 Nombre:</strong> ${leadData.nombre || 'No proporcionado'}</div>
      <div class="field"><strong>📞 Teléfono:</strong> ${leadData.telefono || 'No proporcionado'}</div>
      <div class="field"><strong>🛠️ Servicio:</strong> ${leadData.servicio || 'No especificado'}</div>
      <div class="field"><strong>📍 Comuna:</strong> ${leadData.comuna || 'No especificada'}</div>
      <div class="field"><strong>📱 Canal:</strong> ${this.getCanalIcono(leadData.canal)} ${this.getCanalTexto(leadData.canal)}</div>
      <div class="field"><strong>🕒 Fecha:</strong> ${new Date(leadData.fecha).toLocaleString('es-ES')}</div>
    </div>

    <div class="footer">
      <p>${businessName} - Sistema de Captura de Leads con IA</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Construir versión texto plano del email
   * 
   * @param {Object} leadData - Datos del lead
   * @returns {string} Texto plano
   * @private
   */
  buildPlainTextEmail(leadData) {
    return `
🔥 NUEVO LEAD ${leadData.estado?.toUpperCase() || 'CALIENTE'}

Datos del Cliente:
==================
👤 Nombre: ${leadData.nombre || 'No proporcionado'}
📞 Teléfono: ${leadData.telefono || 'No proporcionado'}
🛠️  Servicio: ${leadData.servicio || 'No especificado'}
📍 Comuna: ${leadData.comuna || 'No especificada'}
📱 Canal: ${this.getCanalIcono(leadData.canal)} ${this.getCanalTexto(leadData.canal)}
${leadData.urgencia ? `⏰ Urgencia: ${leadData.urgencia}` : ''}
🕒 Fecha: ${new Date(leadData.fecha).toLocaleString('es-ES')}

${leadData.notas ? `Notas: ${leadData.notas}` : ''}

--
${process.env.BUSINESS_NAME || 'Sistema de Captura de Leads con IA'}
    `.trim();
  }

  /**
   * Log a consola (siempre se ejecuta)
   * 
   * @param {string} tipo - Tipo de lead
   * @param {Object} leadData - Datos del lead
   * @private
   */
  logToConsole(tipo, leadData) {
    const emoji = tipo === 'CALIENTE' ? '🔥' : tipo === 'TIBIO' ? '🌡️' : '❄️';
    const border = '='.repeat(60);
    
    console.log(`\n${border}`);
    console.log(`${emoji} NOTIFICACIÓN: NUEVO LEAD ${tipo} ${emoji}`);
    console.log(border);
    console.log(`👤 Nombre:    ${leadData.nombre || 'No proporcionado'}`);
    console.log(`📞 Teléfono:  ${leadData.telefono || 'No proporcionado'}`);
    console.log(`🛠️  Servicio:  ${leadData.servicio || 'No especificado'}`);
    console.log(`📍 Comuna:    ${leadData.comuna || 'No especificada'}`);
    console.log(`📱 Canal:     ${this.getCanalIcono(leadData.canal)} ${this.getCanalTexto(leadData.canal)}`);
    if (leadData.urgencia) {
      console.log(`⏰ Urgencia:  ${leadData.urgencia}`);
    }
    console.log(`🕒 Fecha:     ${new Date(leadData.fecha).toLocaleString('es-ES')}`);
    console.log(border + '\n');
  }

  /**
   * Obtener ícono del canal
   * 
   * @param {string} canal - Canal del lead
   * @returns {string} Ícono del canal
   * @private
   */
  getCanalIcono(canal) {
    const iconos = {
      'web': '🌐',
      'whatsapp': '💚',
      'instagram': '📸'
    };
    return iconos[canal] || '🌐';
  }

  /**
   * Obtener texto del canal
   * 
   * @param {string} canal - Canal del lead
   * @returns {string} Texto del canal
   * @private
   */
  getCanalTexto(canal) {
    const textos = {
      'web': 'Web',
      'whatsapp': 'WhatsApp',
      'instagram': 'Instagram'
    };
    return textos[canal] || 'Web';
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
   * Enviar email de prueba
   * 
   * @returns {Promise<boolean>}
   */
  async sendTestEmail() {
    if (!this.isConfigured) {
      console.error('❌ Email no configurado');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
        subject: '✅ Test - Sistema de Notificaciones',
        text: 'Este es un email de prueba. El sistema de notificaciones está funcionando correctamente.',
        html: '<h2>✅ Sistema de Notificaciones Activo</h2><p>Este es un email de prueba. Todo funciona correctamente.</p>'
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de prueba enviado correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error al enviar email de prueba:', error.message);
      return false;
    }
  }
}

module.exports = EmailNotificationService;

