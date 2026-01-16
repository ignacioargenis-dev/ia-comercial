require('dotenv').config();
const EmailNotificationService = require('./src/infrastructure/notifications/EmailNotificationService');

async function testSistemaCompleto() {
  console.log('🧪 Probando sistema completo de notificaciones...\n');

  // Simular datos de lead caliente
  const leadCaliente = {
    nombre: 'María González',
    telefono: '+56988776655',
    servicio: 'automatización de ventas',
    comuna: 'Santiago',
    canal: 'web',
    estado: 'caliente',
    esCaliente: () => true,
    toString: () => 'María González - +56988776655 - web'
  };

  // Simular datos de lead tibio
  const leadTibio = {
    nombre: 'Carlos Rodríguez',
    telefono: '+56999888777',
    servicio: 'consultoría',
    comuna: 'Providencia',
    canal: 'web',
    estado: 'tibio',
    esCaliente: () => false,
    toString: () => 'Carlos Rodríguez - +56999888777 - web'
  };

  try {
    // Inicializar servicio
    const emailService = new EmailNotificationService();

    console.log('📧 Probando lead CALIENTE (debería enviar notificación)...');
    const resultadoCaliente = await emailService.notificarLeadCaliente(leadCaliente);
    console.log('Resultado lead caliente:', resultadoCaliente ? '✅ Éxito' : '❌ Falló');

    console.log('\n📧 Probando lead TIBIO (debería enviar notificación)...');
    const resultadoTibio = await emailService.notificarLeadTibio(leadTibio);
    console.log('Resultado lead tibio:', resultadoTibio ? '✅ Éxito' : '❌ Falló');

    console.log('\n🎯 Resumen del test:');
    console.log('- Si Gmail funciona: Ambos emails se enviaron correctamente');
    console.log('- Si Gmail falla: Intentará SendGrid (si está configurado)');
    console.log('- Si SendGrid no está: Mostrará logs en consola');

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testSistemaCompleto();
