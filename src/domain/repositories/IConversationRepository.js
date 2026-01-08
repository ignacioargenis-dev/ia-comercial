/**
 * Interfaz del repositorio de Conversation
 * Define el contrato para la persistencia de conversaciones
 */
class IConversationRepository {
  /**
   * Guardar o actualizar una conversación
   * @param {string} sessionId - ID de la sesión
   * @param {Array} history - Historial de mensajes
   * @param {string} channel - Canal (web, whatsapp)
   * @param {number|null} leadId - ID del lead asociado (opcional)
   * @returns {void}
   */
  save(sessionId, history, channel = 'web', leadId = null) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Obtener una conversación por session ID
   * @param {string} sessionId - ID de la sesión
   * @returns {Object|null} Conversación encontrada o null
   */
  findBySessionId(sessionId) {
    throw new Error('Method findBySessionId() must be implemented');
  }

  /**
   * Asociar una conversación con un lead
   * @param {string} sessionId - ID de la sesión
   * @param {number} leadId - ID del lead
   * @returns {boolean} True si se actualizó correctamente
   */
  associateWithLead(sessionId, leadId) {
    throw new Error('Method associateWithLead() must be implemented');
  }

  /**
   * Obtener todas las conversaciones de un lead
   * @param {number} leadId - ID del lead
   * @returns {Array<Object>} Array de conversaciones
   */
  findByLeadId(leadId) {
    throw new Error('Method findByLeadId() must be implemented');
  }

  /**
   * Limpiar conversaciones antiguas
   * @param {number} daysOld - Días de antigüedad
   * @returns {number} Número de conversaciones eliminadas
   */
  cleanOldConversations(daysOld = 30) {
    throw new Error('Method cleanOldConversations() must be implemented');
  }
}

module.exports = IConversationRepository;

