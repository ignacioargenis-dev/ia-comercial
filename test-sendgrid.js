require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSendGrid() {
  console.log('🧪 Probando envío de email con SendGrid...');

  try {
    // Verificar que tenemos la API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY no configurada en .env');
      return;
    }

    // Configurar transporter para SendGrid
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });

    // Configurar email
    const mailOptions = {
      from: `"SendSpress Test" <${process.env.EMAIL_USER || 'test@sendspress.cl'}>`,
      to: process.env.OWNER_EMAIL,
      subject: '🚀 Test SendGrid - SendSpress Funcionando',
      html: `
        <h2>¡SendGrid configurado correctamente!</h2>
        <p>Este email fue enviado usando SendGrid SMTP desde Digital Ocean.</p>
        <p>Las notificaciones de leads ahora funcionarán correctamente.</p>
        <br>
        <p><strong>SendSpress</strong> - Automatiza tus ventas con IA</p>
        <p>✅ Email desde servidor: Funcionando</p>
        <p>✅ Notificaciones de leads: Listas</p>
      `,
      text: 'Test SendGrid exitoso. Las notificaciones de leads ahora funcionarán.'
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente con SendGrid!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Destinatario:', process.env.OWNER_EMAIL);

  } catch (error) {
    console.error('❌ Error al enviar email con SendGrid:', error.message);
    console.error('🔍 Código de error:', error.code);
    console.error('🔍 Respuesta:', error.response);
  }
}

testSendGrid();
