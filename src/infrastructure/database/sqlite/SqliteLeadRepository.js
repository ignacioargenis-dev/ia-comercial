const { Lead } = require('../../../domain/entities/Lead');

/**
 * Repositorio de Leads - Implementación SQLite
 * 
 * ACTUALIZADO: Ahora incluye seguimiento de última interacción y seguimientos
 */
class SqliteLeadRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Guardar un nuevo lead o actualizar uno existente
   */
  save(lead) {
    const stmt = this.db.prepare(`
      INSERT INTO leads (nombre, telefono, servicio, comuna, urgencia, estado, contactado, notas, canal, instagram_id, fecha_creacion, fecha_actualizacion, ultima_interaccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `);

    const result = stmt.run(
      lead.nombre,
      lead.telefono,
      lead.servicio,
      lead.comuna,
      lead.urgencia,
      lead.estado,
      lead.contactado ? 1 : 0,
      lead.notas,
      lead.canal || 'web',
      lead.instagram_id || null
    );

    lead.id = result.lastInsertRowid;
    return lead;
  }

  /**
   * Actualizar un lead existente
   * @param {Lead} lead - Lead con los datos actualizados
   * @returns {Lead} Lead actualizado
   */
  update(lead) {
    const stmt = this.db.prepare(`
      UPDATE leads 
      SET nombre = ?,
          telefono = ?,
          servicio = ?,
          comuna = ?,
          urgencia = ?,
          estado = ?,
          contactado = ?,
          notas = ?,
          canal = ?,
          instagram_id = ?,
          fecha_actualizacion = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      lead.nombre,
      lead.telefono,
      lead.servicio,
      lead.comuna,
      lead.urgencia,
      lead.estado,
      lead.contactado ? 1 : 0,
      lead.notas,
      lead.canal || 'web',
      lead.instagram_id || null,
      lead.id
    );

    if (result.changes === 0) {
      throw new Error(`No se pudo actualizar el lead con ID ${lead.id}`);
    }

    return lead;
  }

  /**
   * Buscar lead por ID
   */
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE id = ?');
    const row = stmt.get(id);
    
    if (!row) return null;
    
    return this.rowToLead(row);
  }

  /**
   * Buscar todos los leads con filtros opcionales
   */
  findAll(filters = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (filters.estado) {
      query += ' AND estado = ?';
      params.push(filters.estado);
    }

    if (filters.contactado !== undefined) {
      query += ' AND contactado = ?';
      params.push(filters.contactado ? 1 : 0);
    }

    if (filters.canal) {
      query += ' AND canal = ?';
      params.push(filters.canal);
    }

    query += ' ORDER BY fecha_creacion DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => this.rowToLead(row));
  }

  /**
   * Buscar leads por estado
   */
  findByStatus(estado) {
    const stmt = this.db.prepare('SELECT * FROM leads WHERE estado = ? ORDER BY fecha_creacion DESC');
    const rows = stmt.all(estado);
    return rows.map(row => this.rowToLead(row));
  }

  /**
   * Marcar lead como contactado
   */
  markAsContacted(id) {
    const stmt = this.db.prepare(`
      UPDATE leads 
      SET contactado = 1, 
          fecha_actualizacion = datetime('now'),
          fecha_contacto = datetime('now')
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Actualizar última interacción del lead
   */
  updateLastInteraction(id) {
    const stmt = this.db.prepare(`
      UPDATE leads 
      SET ultima_interaccion = datetime('now'),
          fecha_actualizacion = datetime('now')
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Registrar seguimiento enviado
   */
  recordFollowUp(leadId, type, status, message = null) {
    const stmt = this.db.prepare(`
      INSERT INTO follow_ups (lead_id, type, status, message, fecha_envio)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(leadId, type, status, message);
    return result.lastInsertRowid;
  }

  /**
   * Obtener último seguimiento de un lead
   */
  getLastFollowUp(leadId) {
    const stmt = this.db.prepare(`
      SELECT * FROM follow_ups 
      WHERE lead_id = ? 
      ORDER BY fecha_envio DESC 
      LIMIT 1
    `);
    
    return stmt.get(leadId);
  }

  /**
   * Obtener todos los seguimientos de un lead
   */
  getFollowUps(leadId) {
    const stmt = this.db.prepare(`
      SELECT * FROM follow_ups 
      WHERE lead_id = ? 
      ORDER BY fecha_envio DESC
    `);
    
    return stmt.all(leadId);
  }

  /**
   * Buscar leads que necesitan seguimiento
   * @param {number} hoursThreshold - Horas desde última interacción
   * @param {string} estado - Estado del lead (opcional)
   */
  findLeadsNeedingFollowUp(hoursThreshold, estado = null) {
    let query = `
      SELECT l.* 
      FROM leads l
      LEFT JOIN follow_ups f ON l.id = f.lead_id
      WHERE l.contactado = 0
        AND (
          julianday('now') - julianday(l.ultima_interaccion)
        ) * 24 >= ?
    `;
    
    const params = [hoursThreshold];

    if (estado) {
      query += ' AND l.estado = ?';
      params.push(estado);
    }

    // No enviar seguimiento si ya se envió uno recientemente (última 1 hora)
    query += `
      AND (
        f.id IS NULL 
        OR (julianday('now') - julianday(f.fecha_envio)) * 24 >= 1
      )
    `;

    query += ' GROUP BY l.id ORDER BY l.fecha_creacion DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params);
    
    return rows.map(row => this.rowToLead(row));
  }

  /**
   * Obtener estadísticas de leads
   */
  getStatistics() {
    // Total de leads
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM leads');
    const total = totalStmt.get().count;

    // Por estado
    const estadoStmt = this.db.prepare('SELECT estado, COUNT(*) as count FROM leads GROUP BY estado');
    const porEstado = {};
    const estadoRows = estadoStmt.all();
    estadoRows.forEach(row => {
      porEstado[row.estado] = row.count;
    });

    // Por canal
    const canalStmt = this.db.prepare('SELECT canal, COUNT(*) as count FROM leads GROUP BY canal');
    const porCanal = {};
    const canalRows = canalStmt.all();
    canalRows.forEach(row => {
      porCanal[row.canal] = row.count;
    });

    // Por canal y estado (leads calientes por canal)
    const canalEstadoStmt = this.db.prepare(`
      SELECT canal, estado, COUNT(*) as count 
      FROM leads 
      GROUP BY canal, estado
    `);
    const porCanalEstado = {};
    const canalEstadoRows = canalEstadoStmt.all();
    canalEstadoRows.forEach(row => {
      if (!porCanalEstado[row.canal]) {
        porCanalEstado[row.canal] = {
          total: 0,
          caliente: 0,
          tibio: 0,
          frio: 0
        };
      }
      porCanalEstado[row.canal][row.estado] = row.count;
      porCanalEstado[row.canal].total += row.count;
    });

    // Contactados vs pendientes
    const contactadosStmt = this.db.prepare('SELECT COUNT(*) as count FROM leads WHERE contactado = 1');
    const contactados = contactadosStmt.get().count;
    const pendientes = total - contactados;

    // Seguimientos pendientes
    const followUpStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM leads 
      WHERE contactado = 0 
        AND estado IN ('caliente', 'tibio')
    `);
    const pendingFollowUp = followUpStmt.get().count;

    return {
      total,
      porEstado,
      porCanal,
      porCanalEstado, // Nuevo: estadísticas detalladas por canal
      contactados,
      pendientes,
      pendingFollowUp
    };
  }

  /**
   * Convertir fila de BD a instancia de Lead
   * @private
   */
  rowToLead(row) {
    return new Lead({
      id: row.id,
      nombre: row.nombre,
      telefono: row.telefono,
      servicio: row.servicio,
      comuna: row.comuna,
      urgencia: row.urgencia,
      estado: row.estado,
      contactado: row.contactado === 1,
      notas: row.notas,
      canal: row.canal || 'web',
      instagram_id: row.instagram_id || null,
      fecha: row.fecha_creacion,
      fecha_actualizacion: row.fecha_actualizacion,
      ultima_interaccion: row.ultima_interaccion,
      fecha_contacto: row.fecha_contacto
    });
  }
}

module.exports = SqliteLeadRepository;
