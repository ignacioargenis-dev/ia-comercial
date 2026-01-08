/**
 * Contenedor de Inyección de Dependencias
 * 
 * Este módulo configura y proporciona todas las dependencias del sistema.
 * Sigue el patrón de Inyección de Dependencias para:
 * - Desacoplar componentes
 * - Facilitar testing
 * - Centralizar configuración
 */

const dbConnection = require('./database/connection');

// Repositorios
const SqliteLeadRepository = require('./database/sqlite/SqliteLeadRepository');
const SqliteConversationRepository = require('./database/sqlite/SqliteConversationRepository');

// Servicios de infraestructura
const OpenAIClient = require('./external/OpenAIClient');
const WhatsAppClient = require('./external/WhatsAppClient');
const InstagramService = require('./external/InstagramService');
const EmailNotificationService = require('./notifications/EmailNotificationService');
const WebhookNotificationService = require('./notifications/WebhookNotificationService');

// Servicios de aplicación
const ChatService = require('../application/services/ChatService');
const FollowUpService = require('../application/services/FollowUpService');

// Servicios de automatización
const FollowUpScheduler = require('./automation/FollowUpScheduler');

// Configuración
const businessConfig = require('./config/BusinessConfigLoader');

// Casos de uso
const ProcessChatMessage = require('../application/use-cases/ProcessChatMessage');
const HandleIncomingMessage = require('../application/use-cases/HandleIncomingMessage');
const GetLeads = require('../application/use-cases/GetLeads');
const MarkLeadAsContacted = require('../application/use-cases/MarkLeadAsContacted');
const GetLeadStatistics = require('../application/use-cases/GetLeadStatistics');
const NotifyOwner = require('../application/use-cases/NotifyOwner');

/**
 * Contenedor singleton de dependencias
 */
class Container {
  constructor() {
    this.instances = {};
  }

  /**
   * Obtener instancia de la base de datos
   * @returns {Database}
   */
  getDatabase() {
    if (!this.instances.database) {
      this.instances.database = dbConnection.getDatabase();
    }
    return this.instances.database;
  }

  /**
   * Obtener repositorio de Lead
   * @returns {SqliteLeadRepository}
   */
  getLeadRepository() {
    if (!this.instances.leadRepository) {
      this.instances.leadRepository = new SqliteLeadRepository(this.getDatabase());
    }
    return this.instances.leadRepository;
  }

  /**
   * Obtener repositorio de Conversation
   * @returns {SqliteConversationRepository}
   */
  getConversationRepository() {
    if (!this.instances.conversationRepository) {
      this.instances.conversationRepository = new SqliteConversationRepository(this.getDatabase());
    }
    return this.instances.conversationRepository;
  }

  /**
   * Obtener cliente de OpenAI
   * @returns {OpenAIClient}
   */
  getOpenAIClient() {
    if (!this.instances.openAIClient) {
      this.instances.openAIClient = new OpenAIClient();
    }
    return this.instances.openAIClient;
  }

  /**
   * Obtener cliente de WhatsApp
   * @returns {WhatsAppClient}
   */
  getWhatsAppClient() {
    if (!this.instances.whatsappClient) {
      this.instances.whatsappClient = new WhatsAppClient();
    }
    return this.instances.whatsappClient;
  }

  /**
   * Obtener servicio de Instagram
   * @returns {InstagramService}
   */
  getInstagramService() {
    if (!this.instances.instagramService) {
      this.instances.instagramService = new InstagramService();
    }
    return this.instances.instagramService;
  }

  /**
   * Obtener servicio de chat
   * @returns {ChatService}
   */
  getChatService() {
    if (!this.instances.chatService) {
      this.instances.chatService = new ChatService({
        openAIClient: this.getOpenAIClient()
      });
    }
    return this.instances.chatService;
  }

  /**
   * Obtener servicio de notificaciones
   * Selecciona automáticamente entre Email o Webhook según configuración
   * @returns {EmailNotificationService|WebhookNotificationService}
   */
  getNotificationService() {
    if (!this.instances.notificationService) {
      // Prioridad: Webhook > Email > Fallback a Email (solo consola)
      if (process.env.WEBHOOK_URL) {
        console.log('🔗 Usando servicio de notificaciones por Webhook');
        this.instances.notificationService = new WebhookNotificationService();
      } else {
        console.log('📧 Usando servicio de notificaciones por Email');
        this.instances.notificationService = new EmailNotificationService();
      }
    }
    return this.instances.notificationService;
  }

  /**
   * Obtener caso de uso NotifyOwner
   * @returns {NotifyOwner}
   */
  getNotifyOwnerUseCase() {
    if (!this.instances.notifyOwner) {
      this.instances.notifyOwner = new NotifyOwner({
        notificationService: this.getNotificationService()
      });
    }
    return this.instances.notifyOwner;
  }

  /**
   * Obtener caso de uso ProcessChatMessage
   * @returns {ProcessChatMessage}
   */
  getProcessChatMessageUseCase() {
    if (!this.instances.processChatMessage) {
      this.instances.processChatMessage = new ProcessChatMessage({
        leadRepository: this.getLeadRepository(),
        conversationRepository: this.getConversationRepository(),
        chatService: this.getChatService(),
        notifyOwner: this.getNotifyOwnerUseCase()
      });
    }
    return this.instances.processChatMessage;
  }

  /**
   * Obtener caso de uso HandleIncomingMessage
   * @returns {HandleIncomingMessage}
   */
  getHandleIncomingMessageUseCase() {
    if (!this.instances.handleIncomingMessage) {
      this.instances.handleIncomingMessage = new HandleIncomingMessage({
        processChatMessage: this.getProcessChatMessageUseCase()
      });
    }
    return this.instances.handleIncomingMessage;
  }

  /**
   * Alias para getHandleIncomingMessageUseCase
   * @returns {HandleIncomingMessage}
   */
  getHandleIncomingMessage() {
    return this.getHandleIncomingMessageUseCase();
  }

  /**
   * Obtener caso de uso GetLeads
   * @returns {GetLeads}
   */
  getGetLeadsUseCase() {
    if (!this.instances.getLeads) {
      this.instances.getLeads = new GetLeads({
        leadRepository: this.getLeadRepository()
      });
    }
    return this.instances.getLeads;
  }

  /**
   * Obtener caso de uso MarkLeadAsContacted
   * @returns {MarkLeadAsContacted}
   */
  getMarkLeadAsContactedUseCase() {
    if (!this.instances.markLeadAsContacted) {
      this.instances.markLeadAsContacted = new MarkLeadAsContacted({
        leadRepository: this.getLeadRepository()
      });
    }
    return this.instances.markLeadAsContacted;
  }

  /**
   * Obtener caso de uso GetLeadStatistics
   * @returns {GetLeadStatistics}
   */
  getGetLeadStatisticsUseCase() {
    if (!this.instances.getLeadStatistics) {
      this.instances.getLeadStatistics = new GetLeadStatistics({
        leadRepository: this.getLeadRepository()
      });
    }
    return this.instances.getLeadStatistics;
  }

  /**
   * Obtener conexión a la base de datos
   * @returns {Database}
   */
  getDatabaseConnection() {
    if (!dbConnection.isInitialized) {
      dbConnection.initialize();
    }
    return dbConnection.getDatabase();
  }

  /**
   * Obtener Business Config
   * @returns {BusinessConfigLoader}
   */
  getBusinessConfig() {
    return businessConfig;
  }

  /**
   * Obtener servicio de seguimiento automático
   * @returns {FollowUpService}
   */
  getFollowUpService() {
    if (!this.instances.followUpService) {
      this.instances.followUpService = new FollowUpService({
        leadRepository: this.getLeadRepository(),
        notificationService: this.getNotificationService(),
        businessConfig: this.getBusinessConfig()
      });
    }
    return this.instances.followUpService;
  }

  /**
   * Obtener planificador de seguimientos
   * @returns {FollowUpScheduler}
   */
  getFollowUpScheduler() {
    if (!this.instances.followUpScheduler) {
      this.instances.followUpScheduler = new FollowUpScheduler({
        leadRepository: this.getLeadRepository(),
        followUpService: this.getFollowUpService(),
        businessConfig: this.getBusinessConfig()
      });
    }
    return this.instances.followUpScheduler;
  }
}

// Exportar instancia singleton
const container = new Container();
module.exports = container;

