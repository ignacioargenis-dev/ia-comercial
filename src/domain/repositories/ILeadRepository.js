/**
 * Interfaz del repositorio de Lead
 * Define el contrato que deben cumplir todas las implementaciones
 * 
 * Siguiendo el Principio de Inversión de Dependencias (SOLID),
 * las capas superiores dependen de esta abstracción, no de la implementación concreta.
 */
class ILeadRepository {
  /**
   * Guardar un nuevo lead
   * @param {Lead} lead - Instancia de la entidad Lead
   * @returns {Lead} Lead guardado con ID asignado
   */
  save(lead) {
    throw new Error('Method save() must be implemented');
  }

  /**
   * Actualizar un lead existente
   * @param {number} id - ID del lead
   * @param {Object} data - Datos a actualizar
   * @returns {boolean} True si se actualizó correctamente
   */
  update(id, data) {
    throw new Error('Method update() must be implemented');
  }

  /**
   * Obtener todos los leads
   * @param {Object} filters - Filtros opcionales
   * @returns {Array<Lead>} Array de leads
   */
  findAll(filters = {}) {
    throw new Error('Method findAll() must be implemented');
  }

  /**
   * Obtener un lead por ID
   * @param {number} id - ID del lead
   * @returns {Lead|null} Lead encontrado o null
   */
  findById(id) {
    throw new Error('Method findById() must be implemented');
  }

  /**
   * Obtener leads por estado
   * @param {string} status - Estado del lead (frio, tibio, caliente)
   * @returns {Array<Lead>} Array de leads con ese estado
   */
  findByStatus(status) {
    throw new Error('Method findByStatus() must be implemented');
  }

  /**
   * Obtener leads por estado de contacto
   * @param {boolean} contacted - True para contactados, false para pendientes
   * @returns {Array<Lead>} Array de leads
   */
  findByContactStatus(contacted) {
    throw new Error('Method findByContactStatus() must be implemented');
  }

  /**
   * Marcar lead como contactado
   * @param {number} id - ID del lead
   * @returns {boolean} True si se actualizó correctamente
   */
  markAsContacted(id) {
    throw new Error('Method markAsContacted() must be implemented');
  }

  /**
   * Obtener estadísticas de leads
   * @returns {Object} Objeto con estadísticas
   */
  getStatistics() {
    throw new Error('Method getStatistics() must be implemented');
  }

  /**
   * Eliminar un lead
   * @param {number} id - ID del lead
   * @returns {boolean} True si se eliminó correctamente
   */
  delete(id) {
    throw new Error('Method delete() must be implemented');
  }
}

module.exports = ILeadRepository;

