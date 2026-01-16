require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Probando envío de email con Nodemailer...');

  try {
    // Configurar transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Configurar email
    const mailOptions = {
      from: `"SendSpress Test" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: '🧪 Test de Email - SendSpress',
      html: `
        <h2>Test de Email Exitoso</h2>
        <p>Este email fue enviado directamente desde Node.js usando Nodemailer.</p>
        <p>Si recibes este email, las notificaciones de leads funcionarán correctamente.</p>
        <br>
        <p><strong>SendSpress</strong> - Automatiza tus ventas</p>
      `,
      text: 'Test de email desde SendSpress. Si recibes este email, las notificaciones funcionan.'
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Destinatario:', process.env.OWNER_EMAIL);

  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    console.error('🔍 Detalles del error:', error);
  }
}

testEmail();
