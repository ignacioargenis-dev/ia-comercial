/**
 * Script de Datos de Ejemplo para Demos Comerciales
 * 
 * Genera datos realistas para demostraciones:
 * - Leads en diferentes estados
 * - Conversaciones ejemplo
 * - Historial de seguimientos
 * - Escenarios variados
 */

require('dotenv').config();
const container = require('../src/infrastructure/container');
const { Lead } = require('../src/domain/entities/Lead');

console.log('🎬 GENERANDO DATOS DE EJEMPLO PARA DEMO');
console.log('='.repeat(60));
console.log('');

// Datos de ejemplo realistas
const demoLeads = [
  // 1. Lead Caliente - Lista para cerrar
  {
    nombre: 'María González',
    telefono: '56912345601',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'Las Condes',
    urgencia: 'urgente',
    estado: 'caliente',
    contactado: false,
    notas: 'Cliente urgente, necesita instalación esta semana. Presupuesto aprobado.',
    escenario: 'Cliente listo para cerrar venta'
  },
  
  // 2. Lead Caliente - Múltiples equipos
  {
    nombre: 'Juan Pérez',
    telefono: '56912345602',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'Vitacura',
    urgencia: 'esta semana',
    estado: 'caliente',
    contactado: false,
    notas: 'Necesita 3 equipos para su casa. Budget sin límite.',
    escenario: 'Venta grande, múltiples equipos'
  },
  
  // 3. Lead Caliente - Empresa
  {
    nombre: 'Roberto Silva',
    telefono: '56912345603',
    servicio: 'Mantenimiento Preventivo',
    comuna: 'Providencia',
    urgencia: 'mensual',
    estado: 'caliente',
    contactado: false,
    notas: 'Gerente de oficina, 15 equipos. Contrato mensual.',
    escenario: 'Cliente corporativo, ingreso recurrente'
  },
  
  // 4. Lead Tibio - Cotización solicitada
  {
    nombre: 'Andrea Rojas',
    telefono: '56912345604',
    servicio: 'Reparación',
    comuna: 'Ñuñoa',
    urgencia: null,
    estado: 'tibio',
    contactado: false,
    notas: 'Equipo no enfría. Pidió cotización de reparación.',
    escenario: 'Necesita seguimiento, interesada'
  },
  
  // 5. Lead Tibio - Comparando opciones
  {
    nombre: 'Carlos Muñoz',
    telefono: '56912345605',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'La Reina',
    urgencia: null,
    estado: 'tibio',
    contactado: false,
    notas: 'Está comparando entre 3 proveedores. Precio importante.',
    escenario: 'Cliente comparando, necesita diferenciación'
  },
  
  // 6. Lead Tibio - Primera casa
  {
    nombre: 'Sofía Vargas',
    telefono: '56912345606',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'Macul',
    urgencia: null,
    estado: 'tibio',
    contactado: false,
    notas: 'Primera casa, evaluando si instalar AC o no.',
    escenario: 'Cliente necesita educación sobre el producto'
  },
  
  // 7. Lead Frío - Solo preguntando
  {
    nombre: 'Pedro Soto',
    telefono: '56912345607',
    servicio: null,
    comuna: 'Santiago',
    urgencia: null,
    estado: 'frio',
    contactado: false,
    notas: 'Preguntó precios generales, sin necesidad inmediata.',
    escenario: 'Consulta general, largo plazo'
  },
  
  // 8. Lead Contactado - En negociación
  {
    nombre: 'Valentina Torres',
    telefono: '56912345608',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'La Florida',
    urgencia: 'esta semana',
    estado: 'caliente',
    contactado: true,
    notas: 'Ya contactada. En proceso de negociación de precio.',
    escenario: 'En proceso de cierre'
  },
  
  // 9. Lead Contactado - Servicio completado
  {
    nombre: 'Diego Morales',
    telefono: '56912345609',
    servicio: 'Mantenimiento Preventivo',
    comuna: 'Puente Alto',
    urgencia: null,
    estado: 'tibio',
    contactado: true,
    notas: 'Servicio realizado. Cliente satisfecho. Potencial referido.',
    escenario: 'Cliente satisfecho, fuente de referidos'
  },
  
  // 10. Lead Caliente - Emergencia
  {
    nombre: 'Camila Ríos',
    telefono: '56912345610',
    servicio: 'Reparación',
    comuna: 'San Bernardo',
    urgencia: 'hoy',
    estado: 'caliente',
    contactado: false,
    notas: 'Emergencia! Equipo dejó de funcionar, hace mucho calor.',
    escenario: 'Servicio de emergencia, alta prioridad'
  },
  
  // 11. Lead Tibio - Proyecto futuro
  {
    nombre: 'Rodrigo Vega',
    telefono: '56912345611',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'Maipú',
    urgencia: 'próximo mes',
    estado: 'tibio',
    contactado: false,
    notas: 'Remodelando casa. Instalación en 1-2 meses.',
    escenario: 'Pipeline futuro, mantener contacto'
  },
  
  // 12. Lead Caliente - Referido
  {
    nombre: 'Francisca Pinto',
    telefono: '56912345612',
    servicio: 'Instalación de Aire Acondicionado',
    comuna: 'Estación Central',
    urgencia: 'esta semana',
    estado: 'caliente',
    contactado: false,
    notas: 'Referida por Diego Morales. Alta confianza. 2 equipos.',
    escenario: 'Referido (conversión alta), venta segura'
  }
];

async function seedDemoData() {
  try {
    const leadRepository = container.getLeadRepository();
    const db = container.getDatabaseConnection();
    
    console.log('1️⃣  Limpiando datos anteriores...');
    
    // Limpiar leads de demo anteriores (solo los que tienen teléfonos de ejemplo)
    db.prepare(`DELETE FROM leads WHERE telefono LIKE '569123456%'`).run();
    db.prepare(`DELETE FROM conversaciones WHERE session_id LIKE 'demo_%'`).run();
    db.prepare(`DELETE FROM follow_ups WHERE lead_id NOT IN (SELECT id FROM leads)`).run();
    
    console.log('   ✅ Datos anteriores limpiados');
    console.log('');
    
    console.log('2️⃣  Insertando leads de ejemplo...');
    
    const insertedLeads = [];
    
    for (const leadData of demoLeads) {
      const lead = new Lead({
        nombre: leadData.nombre,
        telefono: leadData.telefono,
        servicio: leadData.servicio,
        comuna: leadData.comuna,
        urgencia: leadData.urgencia,
        estado: leadData.estado,
        contactado: leadData.contactado,
        notas: leadData.notas
      });
      
      const savedLead = leadRepository.save(lead);
      insertedLeads.push(savedLead);
      
      console.log(`   ✅ Lead #${savedLead.id}: ${leadData.nombre} (${leadData.estado})`);
      console.log(`      Escenario: ${leadData.escenario}`);
    }
    
    console.log('');
    console.log('3️⃣  Ajustando timestamps para realismo...');
    
    // Ajustar fechas para que algunos leads sean más antiguos
    const now = new Date();
    
    // Leads 1-4: Hoy (recientes)
    // Leads 5-8: Ayer
    db.prepare(`
      UPDATE leads 
      SET fecha_creacion = datetime('now', '-1 day'),
          ultima_interaccion = datetime('now', '-1 day')
      WHERE telefono IN ('56912345605', '56912345606', '56912345607', '56912345608')
    `).run();
    
    // Leads 9-10: Hace 2 días
    db.prepare(`
      UPDATE leads 
      SET fecha_creacion = datetime('now', '-2 days'),
          ultima_interaccion = datetime('now', '-2 days')
      WHERE telefono IN ('56912345609', '56912345610')
    `).run();
    
    // Leads 11-12: Hace 3 días (para probar seguimientos)
    db.prepare(`
      UPDATE leads 
      SET fecha_creacion = datetime('now', '-3 days'),
          ultima_interaccion = datetime('now', '-3 days')
      WHERE telefono IN ('56912345611', '56912345612')
    `).run();
    
    console.log('   ✅ Timestamps ajustados para diferentes momentos');
    console.log('');
    
    console.log('4️⃣  Generando conversaciones de ejemplo...');
    
    // Crear algunas conversaciones de ejemplo
    const conversationRepository = container.getConversationRepository();
    
    // Conversación 1: Lead Caliente
    const conversation1 = [
      { role: 'user', content: 'Hola, necesito instalar un aire acondicionado urgente' },
      { role: 'assistant', content: '¡Hola! Soy el asistente de Climatización Express. Con gusto te ayudo con la instalación. ¿En qué comuna necesitas el servicio?' },
      { role: 'user', content: 'En Las Condes, es urgente porque hace mucho calor' },
      { role: 'assistant', content: 'Perfecto, atendemos en Las Condes. ¿Cuál es tu nombre para registrar tu solicitud?' },
      { role: 'user', content: 'María González, mi teléfono es +56912345601' }
    ];
    conversationRepository.save(
      'demo_maria_gonzalez',
      conversation1,
      'web',
      insertedLeads[0].id
    );
    
    console.log('   ✅ Conversación 1: María González (urgente)');
    
    // Conversación 2: Lead Tibio
    const conversation2 = [
      { role: 'user', content: 'Mi aire acondicionado no enfría' },
      { role: 'assistant', content: '¡Hola! Puedo ayudarte con eso. ¿En qué comuna está tu equipo?' },
      { role: 'user', content: 'Ñuñoa' },
      { role: 'assistant', content: '¿Me das tu nombre y teléfono para enviarte una cotización?' },
      { role: 'user', content: 'Andrea Rojas, 56912345604' }
    ];
    conversationRepository.save(
      'demo_andrea_rojas',
      conversation2,
      'whatsapp',
      insertedLeads[3].id
    );
    
    console.log('   ✅ Conversación 2: Andrea Rojas (reparación)');
    console.log('');
    
    console.log('5️⃣  Simulando seguimientos enviados...');
    
    // Simular algunos seguimientos ya enviados
    const lead11Id = insertedLeads[10].id;
    const lead12Id = insertedLeads[11].id;
    
    leadRepository.recordFollowUp(
      lead11Id,
      'tibio',
      'sent',
      'Hola Rodrigo, te saluda Climatización Express. Hace un tiempo consultaste sobre instalación...'
    );
    
    leadRepository.recordFollowUp(
      lead12Id,
      'caliente',
      'sent',
      'Hola Francisca, soy Climatización Express. Vimos que estabas interesada en instalar 2 equipos...'
    );
    
    console.log('   ✅ 2 seguimientos registrados');
    console.log('');
    
    // Estadísticas finales
    const stats = leadRepository.getStatistics();
    
    console.log('='.repeat(60));
    console.log('✅ DATOS DE DEMO GENERADOS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   Total leads: ${stats.total}`);
    console.log(`   🔥 Calientes: ${stats.porEstado.caliente || 0}`);
    console.log(`   🌡️  Tibios: ${stats.porEstado.tibio || 0}`);
    console.log(`   ❄️  Fríos: ${stats.porEstado.frio || 0}`);
    console.log(`   ✅ Contactados: ${stats.contactados}`);
    console.log(`   📧 Pendientes seguimiento: ${stats.pendingFollowUp || 0}`);
    console.log('');
    console.log('📝 Escenarios de demo incluidos:');
    console.log('   • Cliente urgente (cierre rápido)');
    console.log('   • Venta grande (múltiples equipos)');
    console.log('   • Cliente corporativo (ingreso recurrente)');
    console.log('   • Servicio de emergencia');
    console.log('   • Cliente referido');
    console.log('   • Pipeline futuro');
    console.log('');
    console.log('🎬 Sistema listo para demostración comercial!');
    console.log('');
    console.log('💡 Próximos pasos:');
    console.log('   1. Abre el dashboard: http://localhost:3000/dashboard');
    console.log('   2. Revisa los diferentes estados de leads');
    console.log('   3. Simula una conversación nueva en: http://localhost:3000');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
seedDemoData()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

