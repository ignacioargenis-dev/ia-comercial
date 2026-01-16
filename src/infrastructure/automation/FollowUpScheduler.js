const cron = require('node-cron');
const FollowUpRules = require('../../domain/services/FollowUpRules');

/**
 * Planificador de Seguimientos Automáticos
 * 
 * Ejecuta tareas programadas para enviar seguimientos automáticos:
 * - Cada 30 minutos: Verificar leads que necesitan seguimiento
 * - Respeta horarios laborales
 * - Envía por email o WhatsApp según configuración
 */
class FollowUpScheduler {
  constructor({ leadRepository, followUpService, businessConfig }) {
    this.leadRepository = leadRepository;
    this.followUpService = followUpService;
    this.businessConfig = businessConfig;
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Iniciar el planificador
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Planificador de seguimientos ya está corriendo');
      return;
    }

    console.log('🚀 Iniciando planificador de seguimientos automáticos...');

    // Job 1: Seguimiento de leads calientes (cada 30 minutos)
    const hotLeadsJob = cron.schedule('*/30 * * * *', async () => {
      await this.processHotLeads();
    });

    // Job 2: Seguimiento de leads tibios (cada 2 horas)
    const warmLeadsJob = cron.schedule('0 */2 * * *', async () => {
      await this.processWarmLeads();
    });

    // Job 3: Reporte diario (8:00 AM)
    const dailyReportJob = cron.schedule('0 8 * * *', async () => {
      await this.sendDailyReport();
    });

    this.jobs.push(hotLeadsJob, warmLeadsJob, dailyReportJob);
    this.isRunning = true;

    console.log('✅ Planificador de seguimientos iniciado');
    console.log('   📅 Leads calientes: cada 30 minutos');
    console.log('   📅 Leads tibios: cada 2 horas');
    console.log('   📅 Reporte diario: 8:00 AM');
  }

  /**
   * Detener el planificador
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Deteniendo planificador de seguimientos...');
    
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;

    console.log('✅ Planificador detenido');
  }

  /**
   * Procesar leads calientes que necesitan seguimiento
   */
  async processHotLeads() {
    try {
      console.log('\n🔥 Verificando leads calientes...');

      // Verificar si es horario laboral
      const schedule = this.businessConfig?.getSchedule();
      if (schedule && !FollowUpRules.isWorkingHours(schedule)) {
        console.log('⏰ Fuera de horario laboral, saltando seguimiento');
        return;
      }

      // Buscar leads calientes sin contactar hace más de 12 horas
      const leads = this.leadRepository.findLeadsNeedingFollowUp(12, 'caliente');

      if (leads.length === 0) {
        console.log('   ✅ No hay leads calientes pendientes de seguimiento');
        return;
      }

      console.log(`   📧 Procesando ${leads.length} lead(s) caliente(s)...`);

      for (const lead of leads) {
        try {
          await this.followUpService.sendFollowUp(lead, 'caliente');
          console.log(`   ✅ Seguimiento enviado a: ${lead.nombre || lead.telefono || `Lead #${lead.id}`}`);
        } catch (error) {
          console.error(`   ❌ Error al enviar seguimiento a lead #${lead.id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Error en processHotLeads:', error);
    }
  }

  /**
   * Procesar leads tibios que necesitan seguimiento
   */
  async processWarmLeads() {
    try {
      console.log('\n🌡️  Verificando leads tibios...');

      // Verificar si es horario laboral
      const schedule = this.businessConfig?.getSchedule();
      if (schedule && !FollowUpRules.isWorkingHours(schedule)) {
        console.log('⏰ Fuera de horario laboral, saltando seguimiento');
        return;
      }

      // Buscar leads tibios sin contactar hace más de 24 horas
      const leads = this.leadRepository.findLeadsNeedingFollowUp(24, 'tibio');

      if (leads.length === 0) {
        console.log('   ✅ No hay leads tibios pendientes de seguimiento');
        return;
      }

      console.log(`   📧 Procesando ${leads.length} lead(s) tibio(s)...`);

      for (const lead of leads) {
        try {
          await this.followUpService.sendFollowUp(lead, 'tibio');
          console.log(`   ✅ Seguimiento enviado a: ${lead.nombre || lead.telefono || `Lead #${lead.id}`}`);
        } catch (error) {
          console.error(`   ❌ Error al enviar seguimiento a lead #${lead.id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Error en processWarmLeads:', error);
    }
  }

  /**
   * Enviar reporte diario
   */
  async sendDailyReport() {
    try {
      console.log('\n📊 Generando reporte diario...');

      const stats = this.leadRepository.getStatistics();
      
      console.log(`   Total leads: ${stats.total}`);
      console.log(`   Calientes: ${stats.porEstado?.caliente || 0}`);
      console.log(`   Tibios: ${stats.porEstado?.tibio || 0}`);
      console.log(`   Pendientes de seguimiento: ${stats.pendingFollowUp || 0}`);

      // Enviar reporte por email al propietario
      await this.followUpService.sendDailyReport(stats);

    } catch (error) {
      console.error('❌ Error en sendDailyReport:', error);
    }
  }

  /**
   * Ejecutar seguimiento manual (útil para testing)
   */
  async runNow() {
    console.log('🔄 Ejecutando seguimiento manual...');
    await this.processHotLeads();
    await this.processWarmLeads();
  }

  /**
   * Obtener estado del planificador
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobs: this.jobs.length,
      schedule: {
        hotLeads: 'Cada 30 minutos',
        warmLeads: 'Cada 2 horas',
        dailyReport: '8:00 AM'
      }
    };
  }
}

module.exports = FollowUpScheduler;

