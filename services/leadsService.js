const db = require('../db/database');

/**
 * Servicio para gestionar leads en la base de datos
 */
class LeadsService {
  
  /**
   * Crear un nuevo lead
   */
  crearLead(datos) {
    const { nombre, telefono, servicio, comuna, urgencia, estado, notas } = datos;
    
    const stmt = db.prepare(`
      INSERT INTO leads (nombre, telefono, servicio, comuna, urgencia, estado, notas)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(nombre, telefono, servicio, comuna, urgencia, estado || 'frio', notas || '');
    
    return {
      id: result.lastInsertRowid,
      ...datos
    };
  }

  /**
   * Obtener todos los leads
   */
  obtenerTodos(filtros = {}) {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (filtros.estado) {
      query += ' AND estado = ?';
      params.push(filtros.estado);
    }

    if (filtros.contactado !== undefined) {
      query += ' AND contactado = ?';
      params.push(filtros.contactado ? 1 : 0);
    }

    query += ' ORDER BY fecha_creacion DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  /**
   * Obtener un lead por ID
   */
  obtenerPorId(id) {
    const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
    return stmt.get(id);
  }

  /**
   * Obtener leads por estado
   */
  obtenerPorEstado(estado) {
    const stmt = db.prepare('SELECT * FROM leads WHERE estado = ? ORDER BY fecha_creacion DESC');
    return stmt.all(estado);
  }

  /**
   * Actualizar un lead
   */
  actualizar(id, datos) {
    const campos = [];
    const valores = [];

    // Construir query dinámicamente según campos presentes
    if (datos.nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.telefono !== undefined) {
      campos.push('telefono = ?');
      valores.push(datos.telefono);
    }
    if (datos.servicio !== undefined) {
      campos.push('servicio = ?');
      valores.push(datos.servicio);
    }
    if (datos.comuna !== undefined) {
      campos.push('comuna = ?');
      valores.push(datos.comuna);
    }
    if (datos.urgencia !== undefined) {
      campos.push('urgencia = ?');
      valores.push(datos.urgencia);
    }
    if (datos.estado !== undefined) {
      campos.push('estado = ?');
      valores.push(datos.estado);
    }
    if (datos.notas !== undefined) {
      campos.push('notas = ?');
      valores.push(datos.notas);
    }
    if (datos.contactado !== undefined) {
      campos.push('contactado = ?');
      valores.push(datos.contactado ? 1 : 0);
    }

    campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');
    valores.push(id);

    const query = `UPDATE leads SET ${campos.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...valores);

    return result.changes > 0;
  }

  /**
   * Marcar lead como contactado
   */
  marcarContactado(id) {
    const stmt = db.prepare(`
      UPDATE leads 
      SET contactado = 1, fecha_actualizacion = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Obtener estadísticas de leads
   */
  obtenerEstadisticas() {
    const total = db.prepare('SELECT COUNT(*) as total FROM leads').get();
    const porEstado = db.prepare(`
      SELECT estado, COUNT(*) as cantidad 
      FROM leads 
      GROUP BY estado
    `).all();
    const contactados = db.prepare('SELECT COUNT(*) as total FROM leads WHERE contactado = 1').get();
    const pendientes = db.prepare('SELECT COUNT(*) as total FROM leads WHERE contactado = 0').get();

    return {
      total: total.total,
      porEstado: porEstado.reduce((acc, item) => {
        acc[item.estado] = item.cantidad;
        return acc;
      }, {}),
      contactados: contactados.total,
      pendientes: pendientes.total
    };
  }

  /**
   * Guardar conversación
   */
  guardarConversacion(sessionId, historial, canal = 'web', leadId = null) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO conversaciones (session_id, historial, canal, lead_id, fecha_actualizacion)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(sessionId, JSON.stringify(historial), canal, leadId);
  }

  /**
   * Obtener conversación
   */
  obtenerConversacion(sessionId) {
    const stmt = db.prepare('SELECT * FROM conversaciones WHERE session_id = ?');
    const result = stmt.get(sessionId);
    
    if (result && result.historial) {
      result.historial = JSON.parse(result.historial);
    }
    
    return result;
  }

  /**
   * Asociar conversación con lead
   */
  asociarConversacionConLead(sessionId, leadId) {
    const stmt = db.prepare(`
      UPDATE conversaciones 
      SET lead_id = ?, fecha_actualizacion = CURRENT_TIMESTAMP 
      WHERE session_id = ?
    `);
    stmt.run(leadId, sessionId);
  }
}

module.exports = new LeadsService();

