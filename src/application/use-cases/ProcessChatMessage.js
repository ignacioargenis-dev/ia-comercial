const LeadClassifier = require('../../domain/services/LeadClassifier');

/**
 * Caso de Uso: Procesar Mensaje de Chat
 * 
 * Responsabilidad única: Orquestar el flujo completo de procesamiento de un mensaje:
 * 1. Obtener historial de conversación
 * 2. Generar respuesta con IA
 * 3. Validar y corregir clasificación del lead
 * 4. Guardar conversación
 * 5. Guardar lead si está completo
 * 6. Notificar automáticamente si es caliente
 * 
 * Este caso de uso aplica reglas de negocio estrictas para filtrar oportunidades reales.
 */
class ProcessChatMessage {
  /**
   * Constructor con inyección de dependencias
   * @param {Object} dependencies - Dependencias del caso de uso
   * @param {ILeadRepository} dependencies.leadRepository
   * @param {IConversationRepository} dependencies.conversationRepository
   * @param {ChatService} dependencies.chatService
   * @param {NotifyOwner} dependencies.notifyOwner - Caso de uso de notificación
   */
  constructor({ leadRepository, conversationRepository, chatService, notifyOwner }) {
    this.leadRepository = leadRepository;
    this.conversationRepository = conversationRepository;
    this.chatService = chatService;
    this.notifyOwner = notifyOwner;
  }

  /**
   * Ejecutar el caso de uso
   * @param {Object} params - Parámetros
   * @param {string} params.sessionId - ID de la sesión
   * @param {string} params.message - Mensaje del usuario
   * @param {string} params.channel - Canal (web, whatsapp, instagram)
   * @param {Object} params.metadata - Metadata adicional del mensaje
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async execute({ sessionId, message, channel = 'web', metadata = {} }) {
    try {
      // 1. Obtener historial de conversación
      let conversation = this.conversationRepository.findBySessionId(sessionId);
      let conversationHistory = conversation?.historial || [];
      
      // 2. Agregar mensaje del usuario al historial
      conversationHistory.push({
        role: 'user',
        content: message
      });

      // 3. Generar respuesta con IA (retorna LLMResponse con Lead estructurado)
      const llmResponse = await this.chatService.generateResponse(conversationHistory, channel);
      const leadInstance = llmResponse.getLead();

      // 4. VALIDAR Y CORREGIR CLASIFICACIÓN usando reglas de negocio
      const classification = LeadClassifier.validateClassification(
        leadInstance.estado,
        leadInstance,
        conversationHistory
      );

      let finalLead = leadInstance;
      
      if (!classification.isValid) {
        console.log(`⚠️  Clasificación del LLM corregida:`);
        console.log(`   LLM dijo: "${leadInstance.estado}"`);
        console.log(`   Reglas de negocio: "${classification.suggestedEstado}"`);
        console.log(`   Razón: ${classification.reason}`);
        
        // Corregir el estado del lead según reglas de negocio
        leadInstance.estado = classification.suggestedEstado;
        finalLead = leadInstance;
      } else {
        console.log(`✅ Clasificación validada: ${leadInstance.estado}`);
        console.log(`   Razón: ${LeadClassifier.getClassificationReason(leadInstance, conversationHistory)}`);
      }

      // 5. Agregar respuesta del asistente al historial
      conversationHistory.push({
        role: 'assistant',
        content: JSON.stringify({
          reply: llmResponse.getRespuesta(),
          lead: finalLead.toJSON()
        })
      });

      // 6. Guardar conversación
      this.conversationRepository.save(sessionId, conversationHistory, channel);

      // 7. Si el lead está completo y no existe ya, guardarlo
      let savedLead = null;
      let notificationResult = null;

      if (finalLead.estaCompleto() && (!conversation || !conversation.lead_id)) {
        // Asignar canal al lead antes de guardar
        finalLead.canal = channel;
        
        // Si es Instagram, guardar el senderId para acceso directo a la conversación
        if (channel === 'instagram' && metadata?.senderId) {
          finalLead.instagram_id = metadata.senderId;
        }
        
        // Guardar el lead en el repositorio
        savedLead = this.leadRepository.save(finalLead);
        
        // Asociar conversación con lead
        this.conversationRepository.associateWithLead(sessionId, savedLead.id);
        
        // Actualizar última interacción (para seguimiento automático)
        this.leadRepository.updateLastInteraction(savedLead.id);
        
        const reason = LeadClassifier.getClassificationReason(savedLead, conversationHistory);
        console.log(`✅ Lead guardado: ${savedLead.toString()}`);
        console.log(`   Clasificado como: ${savedLead.estado} (${reason})`);

        // 8. DISPARAR NOTIFICACIÓN AUTOMÁTICAMENTE SI ES CALIENTE
        if (savedLead.esCaliente()) {
          console.log(`🔥 Lead caliente detectado - Disparando notificación automática...`);
          notificationResult = await this.notifyOwner.execute({
            lead: savedLead,
            reason: `Lead caliente: ${reason}`,
            priority: 'urgent'
          });
        } else if (savedLead.esTibio()) {
          // También notificar tibios, pero con menor prioridad
          notificationResult = await this.notifyOwner.execute({
            lead: savedLead,
            reason: `Lead tibio: ${reason}`,
            priority: 'normal'
          });
        }
      } else if (finalLead.estaCompleto()) {
        console.log(`ℹ️  Lead ya existente - ${finalLead.toString()}`);
        // Si el lead ya existe, actualizar su última interacción
        if (conversation && conversation.lead_id) {
          this.leadRepository.updateLastInteraction(conversation.lead_id);
        }
      } else {
        console.log(`ℹ️  Lead incompleto, continuando conversación - ${finalLead.toString()}`);
      }

      // 9. Retornar resultado completo
      return {
        success: true,
        respuesta: llmResponse.getRespuesta(),
        lead: finalLead,
        leadGuardado: savedLead !== null,
        conversacionCompleta: finalLead.estaCompleto(),
        clasificacion: {
          estado: finalLead.estado,
          razon: LeadClassifier.getClassificationReason(finalLead, conversationHistory),
          corregidoPorReglas: !classification.isValid
        },
        notificacion: notificationResult
      };

    } catch (error) {
      console.error('Error en ProcessChatMessage:', error);
      throw new Error('Error al procesar el mensaje: ' + error.message);
    }
  }
}

module.exports = ProcessChatMessage;
