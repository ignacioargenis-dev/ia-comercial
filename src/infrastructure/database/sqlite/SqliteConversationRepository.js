const IConversationRepository = require('../../../domain/repositories/IConversationRepository');

/**
 * Implementación concreta del repositorio de Conversation usando SQLite
 * 
 * Encapsula toda la lógica de persistencia de conversaciones.
 */
class SqliteConversationRepository extends IConversationRepository {
  /**
   * Constructor
   * @param {Database} database - Instancia de la base de datos SQLite
   */
  constructor(database) {
    super();
    this.db = database;
  }

  /**
   * Guardar o actualizar una conversación
   * @param {string} sessionId - ID de la sesión
   * @param {Array} history - Historial de mensajes
   * @param {string} channel - Canal (web, whatsapp)
   * @param {number|null} leadId - ID del lead asociado (opcional)
   * @returns {void}
   */
  save(sessionId, history, channel = 'web', leadId = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO conversaciones (session_id, historial, canal, lead_id, fecha_actualizacion)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(sessionId, JSON.stringify(history), channel, leadId);
  }

  /**
   * Obtener una conversación por session ID
   * @param {string} sessionId - ID de la sesión
   * @returns {Object|null} Conversación encontrada o null
   */
  findBySessionId(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM conversaciones WHERE session_id = ?');
    const result = stmt.get(sessionId);
    
    if (!result) {
      return null;
    }
    
    // Parsear el historial JSON
    if (result.historial) {
      result.historial = JSON.parse(result.historial);
    }
    
    return result;
  }

  /**
   * Asociar una conversación con un lead
   * @param {string} sessionId - ID de la sesión
   * @param {number} leadId - ID del lead
   * @returns {boolean} True si se actualizó correctamente
   */
  associateWithLead(sessionId, leadId) {
    const stmt = this.db.prepare(`
      UPDATE conversaciones 
      SET lead_id = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
      WHERE session_id = ?
    `);
    
    const result = stmt.run(leadId, sessionId);
    return result.changes > 0;
  }

  /**
   * Obtener todas las conversaciones de un lead
   * @param {number} leadId - ID del lead
   * @returns {Array<Object>} Array de conversaciones
   */
  findByLeadId(leadId) {
    const stmt = this.db.prepare('SELECT * FROM conversaciones WHERE lead_id = ? ORDER BY fecha_creacion DESC');
    const results = stmt.all(leadId);
    
    // Parsear historial de cada conversación
    return results.map(result => {
      if (result.historial) {
        result.historial = JSON.parse(result.historial);
      }
      return result;
    });
  }

  /**
   * Limpiar conversaciones antiguas
   * @param {number} daysOld - Días de antigüedad
   * @returns {number} Número de conversaciones eliminadas
   */
  cleanOldConversations(daysOld = 30) {
    const stmt = this.db.prepare(`
      DELETE FROM conversaciones 
      WHERE fecha_creacion < datetime('now', '-' || ? || ' days')
    `);
    
    const result = stmt.run(daysOld);
    return result.changes;
  }

  /**
   * Obtener conversaciones activas (sin lead asociado)
   * @returns {Array<Object>} Array de conversaciones activas
   */
  findActive() {
    const stmt = this.db.prepare('SELECT * FROM conversaciones WHERE lead_id IS NULL ORDER BY fecha_actualizacion DESC');
    const results = stmt.all();
    
    return results.map(result => {
      if (result.historial) {
        result.historial = JSON.parse(result.historial);
      }
      return result;
    });
  }

  /**
   * Marcar una conversación como completada
   * @param {string} sessionId - ID de la sesión
   * @returns {boolean} True si se actualizó correctamente
   */
  markAsCompleted(sessionId) {
    const stmt = this.db.prepare(`
      UPDATE conversaciones 
      SET completed = 1, fecha_actualizacion = CURRENT_TIMESTAMP 
      WHERE session_id = ?
    `);
    
    const result = stmt.run(sessionId);
    return result.changes > 0;
  }
}

module.exports = SqliteConversationRepository;

