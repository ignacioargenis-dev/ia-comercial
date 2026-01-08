const Database = require('better-sqlite3');
const path = require('path');

/**
 * Configuración y conexión a la base de datos SQLite
 * Este módulo es responsable de la conexión y configuración inicial
 */
class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar la conexión y las tablas
   */
  initialize() {
    if (this.isInitialized) {
      return this.db;
    }

    // Ruta de la base de datos desde variable de entorno o default
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'db', 'leads.db');
    
    // Crear/abrir base de datos
    this.db = new Database(dbPath);
    
    // Habilitar foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Crear tablas
    this.createTables();
    
    this.isInitialized = true;
    console.log('✅ Base de datos inicializada correctamente');
    
    return this.db;
  }

  /**
   * Crear las tablas de la base de datos
   */
  createTables() {
    // Primero migrar esquema si la tabla ya existe
    this.migrateSchema();

    // Tabla de leads
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT,
        telefono TEXT,
        servicio TEXT,
        comuna TEXT,
        urgencia TEXT,
        estado TEXT DEFAULT 'frio',
        contactado INTEGER DEFAULT 0,
        notas TEXT,
        canal TEXT DEFAULT 'web',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        ultima_interaccion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_contacto DATETIME
      )
    `);

    // Tabla de conversaciones
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        lead_id INTEGER,
        canal TEXT DEFAULT 'web',
        historial TEXT,
        estado TEXT DEFAULT 'activo',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id)
      )
    `);

    // Tabla de seguimientos automáticos
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    // Crear índices
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
      CREATE INDEX IF NOT EXISTS idx_leads_contactado ON leads(contactado);
      CREATE INDEX IF NOT EXISTS idx_leads_canal ON leads(canal);
      CREATE INDEX IF NOT EXISTS idx_conversaciones_session ON conversaciones(session_id);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_fecha ON follow_ups(fecha_envio);
    `);

    // Crear índice de ultima_interaccion solo si la columna existe
    try {
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_ultima_interaccion ON leads(ultima_interaccion);`);
    } catch (error) {
      // Ignorar si la columna no existe
    }
  }

  /**
   * Migrar esquema de BD para agregar columnas nuevas
   */
  migrateSchema() {
    try {
      // Verificar si la tabla leads existe
      const tableExists = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='leads'
      `).get();

      if (!tableExists) {
        // Tabla no existe, se creará después
        return;
      }

      // Verificar si las columnas existen
      const columns = this.db.prepare("PRAGMA table_info(leads)").all();
      const hasUltimaInteraccion = columns.some(col => col.name === 'ultima_interaccion');
      const hasFechaContacto = columns.some(col => col.name === 'fecha_contacto');
      const hasCanal = columns.some(col => col.name === 'canal');
      const hasInstagramId = columns.some(col => col.name === 'instagram_id');

      if (!hasUltimaInteraccion) {
        console.log('⚙️  Migrando BD: Agregando columna ultima_interaccion');
        // SQLite no permite DEFAULT con funciones en ALTER TABLE, usar NULL
        this.db.exec(`ALTER TABLE leads ADD COLUMN ultima_interaccion DATETIME`);
        // Inicializar con fecha_creacion para leads existentes
        const leadCount = this.db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
        if (leadCount > 0) {
          this.db.exec(`UPDATE leads SET ultima_interaccion = COALESCE(fecha_creacion, datetime('now'))`);
          console.log(`   ✅ Inicializadas ${leadCount} filas existentes`);
        }
      }

      if (!hasFechaContacto) {
        console.log('⚙️  Migrando BD: Agregando columna fecha_contacto');
        this.db.exec(`ALTER TABLE leads ADD COLUMN fecha_contacto DATETIME`);
      }

      if (!hasCanal) {
        console.log('⚙️  Migrando BD: Agregando columna canal');
        this.db.exec(`ALTER TABLE leads ADD COLUMN canal TEXT DEFAULT 'web'`);
        // Inicializar leads existentes con canal 'web'
        const leadCount = this.db.prepare('SELECT COUNT(*) as count FROM leads').get().count;
        if (leadCount > 0) {
          this.db.exec(`UPDATE leads SET canal = 'web' WHERE canal IS NULL`);
          console.log(`   ✅ Inicializadas ${leadCount} filas existentes con canal='web'`);
        }
      }

      if (!hasInstagramId) {
        console.log('⚙️  Migrando BD: Agregando columna instagram_id');
        this.db.exec(`ALTER TABLE leads ADD COLUMN instagram_id TEXT`);
        console.log('   ✅ Columna instagram_id agregada para enlaces directos a conversaciones');
      }

      if (!hasUltimaInteraccion || !hasFechaContacto || !hasCanal) {
        console.log('✅ Migración de BD completada');
      }
    } catch (error) {
      // Ignorar errores (tabla no existe o columnas ya existen)
      if (error.message.includes('duplicate column name')) {
        // Las columnas ya existen, todo bien
      } else {
        console.log('ℹ️  Migración omitida:', error.message);
      }
    }
  }

  /**
   * Obtener la instancia de la base de datos
   * @returns {Database}
   */
  getDatabase() {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Cerrar la conexión a la base de datos
   */
  close() {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
      console.log('✅ Conexión a base de datos cerrada');
    }
  }
}

// Exportar instancia singleton
const dbConnection = new DatabaseConnection();
module.exports = dbConnection;

