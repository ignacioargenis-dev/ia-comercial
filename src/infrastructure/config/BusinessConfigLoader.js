const fs = require('fs');
const path = require('path');

/**
 * Servicio para cargar la configuración del negocio
 * 
 * Este servicio carga dinámicamente la configuración desde config/business.json
 * permitiendo que cada instancia del sistema se personalice sin modificar código.
 */
class BusinessConfigLoader {
  constructor() {
    this.config = null;
    this.configPath = path.join(process.cwd(), 'config', 'business.json');
    this.schemaPath = path.join(process.cwd(), 'config', 'business.schema.json');
    this.load();
  }

  /**
   * Cargar configuración desde archivo JSON
   */
  load() {
    try {
      if (!fs.existsSync(this.configPath)) {
        console.error('❌ Archivo config/business.json no encontrado');
        console.error('   Creando configuración por defecto...');
        this.createDefaultConfig();
      }

      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configData);

      // Validar estructura básica
      this.validate();

      console.log(`✅ Configuración de negocio cargada: ${this.config.business.name}`);
      console.log(`   Cliente: ${this.config.metadata.clientId}`);
      console.log(`   Servicios: ${this.config.services.length}`);
      console.log(`   Comunas: ${this.config.coverage.communes.length}`);

    } catch (error) {
      console.error('❌ Error al cargar configuración:', error.message);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Validar estructura de configuración
   */
  validate() {
    const required = ['business', 'services', 'coverage', 'schedule'];
    
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }

    if (!this.config.business.name) {
      throw new Error('business.name es requerido');
    }

    if (!Array.isArray(this.config.services) || this.config.services.length === 0) {
      throw new Error('services debe ser un array con al menos un servicio');
    }

    if (!Array.isArray(this.config.coverage.communes) || this.config.coverage.communes.length === 0) {
      throw new Error('coverage.communes debe ser un array con al menos una comuna');
    }
  }

  /**
   * Obtener configuración completa
   */
  getConfig() {
    return this.config;
  }

  /**
   * Obtener información del negocio
   */
  getBusinessInfo() {
    return this.config.business;
  }

  /**
   * Obtener lista de servicios
   */
  getServices() {
    return this.config.services;
  }

  /**
   * Obtener servicio por ID
   */
  getServiceById(serviceId) {
    return this.config.services.find(s => s.id === serviceId);
  }

  /**
   * Obtener cobertura (comunas)
   */
  getCoverage() {
    return this.config.coverage;
  }

  /**
   * Verificar si atiende una comuna
   */
  coversCommune(commune) {
    const normalizedCommune = commune.toLowerCase().trim();
    return this.config.coverage.communes.some(
      c => c.toLowerCase().trim() === normalizedCommune
    );
  }

  /**
   * Obtener horarios
   */
  getSchedule() {
    return this.config.schedule;
  }

  /**
   * Obtener estilo de conversación
   */
  getConversationStyle() {
    return this.config.conversationStyle || {
      tone: 'profesional y cercano',
      formality: 'tú',
      personality: 'Amigable y servicial'
    };
  }

  /**
   * Obtener configuración de notificaciones
   */
  getNotificationConfig() {
    return this.config.notifications || {};
  }

  /**
   * Generar prompt dinámico para el asistente
   */
  generateSystemPrompt() {
    const business = this.config.business;
    const services = this.config.services;
    const coverage = this.config.coverage;
    const schedule = this.config.schedule;
    const style = this.getConversationStyle();
    const qualifications = this.config.qualifications || {};

    // Formatear servicios
    const servicesText = services.map(s => 
      `   - ${s.name}: ${s.description}`
    ).join('\n');

    // Formatear comunas
    const communesText = coverage.communes.join(', ');

    // Formatear horarios
    const scheduleText = this.formatScheduleForPrompt(schedule.workingDays);

    return `
CONTEXTO DEL NEGOCIO:
Eres el asistente virtual de ${business.name}, ${business.description}.

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${business.name}
- Industria: ${business.industry}
${business.phone ? `- Teléfono: ${business.phone}` : ''}
${business.email ? `- Email: ${business.email}` : ''}
${business.website ? `- Sitio web: ${business.website}` : ''}
${qualifications.experience ? `- Experiencia: ${qualifications.experience}` : ''}
${qualifications.warranty ? `- Garantía: ${qualifications.warranty}` : ''}

SERVICIOS QUE OFRECEMOS:
${servicesText}

COBERTURA:
Atendemos las siguientes comunas: ${communesText}
${coverage.additionalFees?.enabled ? `Nota: ${coverage.additionalFees.message}` : ''}

HORARIOS DE ATENCIÓN:
${scheduleText}
${schedule.emergencyService?.enabled ? `\n🚨 Servicio de emergencia: ${schedule.emergencyService.hours}` : ''}

ESTILO DE CONVERSACIÓN:
- Tono: ${style.tone}
- Formalidad: Usa "${style.formality}" para dirigirte al cliente
- Personalidad: ${style.personality}

DIRECTRICES:
${style.guidelines ? style.guidelines.map(g => `- ${g}`).join('\n') : ''}

TU OBJETIVO:
Capturar leads calificados recopilando:
1. Nombre del cliente
2. Teléfono de contacto
3. Servicio que necesita
4. Comuna donde está ubicado
5. Nivel de urgencia

Sé ${style.tone}, pregunta de forma natural y confirma los datos antes de despedirte.
Siempre menciona que eres de ${business.name} y enfatiza nuestros ${qualifications.experience || 'años de experiencia'}.
`.trim();
  }

  /**
   * Formatear horarios para el prompt
   */
  formatScheduleForPrompt(workingDays) {
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };

    const schedule = [];
    
    for (const [day, config] of Object.entries(workingDays)) {
      if (config.enabled) {
        schedule.push(`${days[day]}: ${config.open} - ${config.close}`);
      } else {
        schedule.push(`${days[day]}: Cerrado`);
      }
    }

    return schedule.join('\n');
  }

  /**
   * Crear configuración por defecto
   */
  createDefaultConfig() {
    const defaultConfig = this.getDefaultConfig();
    
    // Crear directorio config si no existe
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    console.log('✅ Configuración por defecto creada en config/business.json');
  }

  /**
   * Obtener configuración por defecto
   */
  getDefaultConfig() {
    return {
      business: {
        name: process.env.BUSINESS_NAME || 'Mi Empresa',
        shortName: 'Empresa',
        industry: 'Servicios',
        description: 'Empresa de servicios',
        phone: process.env.BUSINESS_PHONE || '',
        email: process.env.BUSINESS_EMAIL || '',
        website: ''
      },
      services: [
        {
          id: 'consulta',
          name: 'Consulta General',
          description: 'Consulta sobre nuestros servicios',
          estimatedTime: 'Inmediato',
          requiresVisit: false
        }
      ],
      coverage: {
        regions: ['Región Metropolitana'],
        communes: ['Santiago'],
        additionalFees: {
          enabled: false,
          message: ''
        }
      },
      schedule: {
        timezone: 'America/Santiago',
        workingDays: {
          monday: { enabled: true, open: '09:00', close: '18:00' },
          tuesday: { enabled: true, open: '09:00', close: '18:00' },
          wednesday: { enabled: true, open: '09:00', close: '18:00' },
          thursday: { enabled: true, open: '09:00', close: '18:00' },
          friday: { enabled: true, open: '09:00', close: '18:00' },
          saturday: { enabled: false, open: null, close: null },
          sunday: { enabled: false, open: null, close: null }
        },
        emergencyService: {
          enabled: false,
          hours: '',
          additionalFee: false
        }
      },
      conversationStyle: {
        tone: 'profesional',
        formality: 'usted',
        personality: 'Servicial y eficiente',
        guidelines: []
      },
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        clientId: 'default',
        instanceType: 'development'
      }
    };
  }

  /**
   * Recargar configuración (útil en desarrollo)
   */
  reload() {
    console.log('🔄 Recargando configuración...');
    this.load();
  }
}

// Exportar instancia singleton
const businessConfig = new BusinessConfigLoader();
module.exports = businessConfig;

