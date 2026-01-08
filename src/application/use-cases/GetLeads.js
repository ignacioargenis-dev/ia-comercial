/**
 * Caso de Uso: Obtener Leads
 * 
 * Responsabilidad: Obtener y filtrar leads según criterios
 */
class GetLeads {
  /**
   * Constructor con inyección de dependencias
   * @param {Object} dependencies - Dependencias
   * @param {ILeadRepository} dependencies.leadRepository
   */
  constructor({ leadRepository }) {
    this.leadRepository = leadRepository;
  }

  /**
   * Ejecutar el caso de uso
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.estado - Filtrar por estado
   * @param {boolean} filters.contactado - Filtrar por contactado
   * @returns {Array<Lead>} Array de leads
   */
  execute(filters = {}) {
    try {
      return this.leadRepository.findAll(filters);
    } catch (error) {
      console.error('Error en GetLeads:', error);
      throw new Error('Error al obtener leads: ' + error.message);
    }
  }

  /**
   * Obtener lead por ID
   * @param {number} id - ID del lead
   * @returns {Lead|null}
   */
  executeById(id) {
    try {
      return this.leadRepository.findById(id);
    } catch (error) {
      console.error('Error en GetLeads.executeById:', error);
      throw new Error('Error al obtener lead: ' + error.message);
    }
  }

  /**
   * Obtener leads por estado
   * @param {string} status - Estado del lead
   * @returns {Array<Lead>}
   */
  executeByStatus(status) {
    try {
      return this.leadRepository.findByStatus(status);
    } catch (error) {
      console.error('Error en GetLeads.executeByStatus:', error);
      throw new Error('Error al obtener leads por estado: ' + error.message);
    }
  }
}

module.exports = GetLeads;

