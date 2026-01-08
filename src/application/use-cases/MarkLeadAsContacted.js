/**
 * Caso de Uso: Marcar Lead como Contactado
 * 
 * Responsabilidad: Actualizar el estado de contacto de un lead
 */
class MarkLeadAsContacted {
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
   * @param {number} leadId - ID del lead
   * @returns {boolean} True si se actualizó correctamente
   */
  execute(leadId) {
    try {
      // Verificar que el lead existe
      const lead = this.leadRepository.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead no encontrado');
      }

      // Marcar como contactado
      const updated = this.leadRepository.markAsContacted(leadId);
      
      if (updated) {
        console.log(`✅ Lead #${leadId} marcado como contactado`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error en MarkLeadAsContacted:', error);
      throw error;
    }
  }
}

module.exports = MarkLeadAsContacted;

