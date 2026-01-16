const CommercialStrategy = require('../../../domain/entities/CommercialStrategy');

/**
 * Repositorio: Commercial Strategy (SQLite)
 * 
 * Persiste la configuración de la estrategia comercial del usuario.
 * Esta configuración se usa para generar el prompt de la IA.
 */
class SqliteCommercialStrategyRepository {
  constructor(database) {
    this.db = database;
    this._createTable();
  }

  /**
   * Crear tabla si no existe
   */
  _createTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commercial_strategy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        main_objective TEXT NOT NULL,
        hot_lead_criteria TEXT NOT NULL,
        hot_lead_actions TEXT NOT NULL,
        insistence_level TEXT NOT NULL,
        communication_tone TEXT NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Si no existe ninguna configuración, crear una por defecto
    const existing = this.db.prepare('SELECT COUNT(*) as count FROM commercial_strategy WHERE is_active = 1').get();
    if (existing.count === 0) {
      this._createDefault();
    }
  }

  /**
   * Crear configuración por defecto
   */
  _createDefault() {
    const defaultStrategy = new CommercialStrategy({
      mainObjective: 'generar_leads',
      hotLeadCriteria: {
        pidePrecio: true,
        pideCita: true,
        dejaTelefono: true,
        mencionaUrgencia: true,
        consultaDisponibilidad: false
      },
      hotLeadActions: {
        enviarEmail: true,
        enviarWhatsApp: false,
        mostrarCTA: true,
        derivarHumano: false
      },
      insistenceLevel: 'medio',
      communicationTone: 'profesional',
      updatedBy: 'system'
    });

    this.save(defaultStrategy);
    console.log('✅ Estrategia comercial por defecto creada');
  }

  /**
   * Guardar o actualizar estrategia
   */
  save(strategy) {
    // Desactivar estrategias anteriores
    this.db.prepare('UPDATE commercial_strategy SET is_active = 0').run();

    // Insertar nueva estrategia activa
    const stmt = this.db.prepare(`
      INSERT INTO commercial_strategy (
        main_objective,
        hot_lead_criteria,
        hot_lead_actions,
        insistence_level,
        communication_tone,
        last_updated,
        updated_by,
        is_active
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?, 1)
    `);

    const result = stmt.run(
      strategy.mainObjective,
      JSON.stringify(strategy.hotLeadCriteria),
      JSON.stringify(strategy.hotLeadActions),
      strategy.insistenceLevel,
      strategy.communicationTone,
      strategy.updatedBy || 'user'
    );

    strategy.id = result.lastInsertRowid;
    return strategy;
  }

  /**
   * Obtener estrategia activa
   */
  getActive() {
    const stmt = this.db.prepare(`
      SELECT * FROM commercial_strategy 
      WHERE is_active = 1 
      ORDER BY last_updated DESC 
      LIMIT 1
    `);
    
    const row = stmt.get();
    
    if (!row) {
      // Si no hay estrategia activa, crear una por defecto
      this._createDefault();
      return this.getActive();
    }

    return this._rowToStrategy(row);
  }

  /**
   * Obtener historial de estrategias
   */
  getHistory(limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM commercial_strategy 
      ORDER BY last_updated DESC 
      LIMIT ?
    `);
    
    const rows = stmt.all(limit);
    return rows.map(row => this._rowToStrategy(row));
  }

  /**
   * Convertir fila de BD a entidad
   */
  _rowToStrategy(row) {
    return new CommercialStrategy({
      mainObjective: row.main_objective,
      hotLeadCriteria: JSON.parse(row.hot_lead_criteria),
      hotLeadActions: JSON.parse(row.hot_lead_actions),
      insistenceLevel: row.insistence_level,
      communicationTone: row.communication_tone,
      lastUpdated: row.last_updated,
      updatedBy: row.updated_by
    });
  }
}

module.exports = SqliteCommercialStrategyRepository;

