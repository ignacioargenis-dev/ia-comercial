/**
 * Caso de Uso: Obtener Estadísticas de Leads
 * 
 * Responsabilidad: Obtener métricas y estadísticas sobre los leads
 */
class GetLeadStatistics {
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
   * @returns {Object} Estadísticas de leads
   */
  execute() {
    try {
      return this.leadRepository.getStatistics();
    } catch (error) {
      console.error('Error en GetLeadStatistics:', error);
      throw new Error('Error al obtener estadísticas: ' + error.message);
    }
  }
}

module.exports = GetLeadStatistics;

