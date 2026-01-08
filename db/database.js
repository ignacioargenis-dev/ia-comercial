const Database = require('better-sqlite3');
const path = require('path');

// Ruta de la base de datos desde variable de entorno o default
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'leads.db');

// Crear/abrir base de datos
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Crear tabla de leads
const createLeadsTable = `
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
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Crear tabla de conversaciones para mantener historial
const createConversationsTable = `
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
`;

// Crear índices para mejorar búsquedas
const createIndexes = `
  CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
  CREATE INDEX IF NOT EXISTS idx_leads_contactado ON leads(contactado);
  CREATE INDEX IF NOT EXISTS idx_conversaciones_session ON conversaciones(session_id);
`;

// Inicializar tablas
function initDatabase() {
  try {
    db.exec(createLeadsTable);
    db.exec(createConversationsTable);
    db.exec(createIndexes);
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Inicializar al cargar el módulo
initDatabase();

module.exports = db;

