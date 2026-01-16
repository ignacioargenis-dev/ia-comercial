/**
 * Servicio: Prompt Generator
 * 
 * Traduce la configuración comercial de alto nivel (CommercialStrategy)
 * a un prompt técnico estructurado para la IA.
 * 
 * El usuario configura decisiones comerciales, este servicio las convierte
 * en instrucciones técnicas precisas.
 */
class PromptGeneratorService {
  
  /**
   * Generar prompt completo desde la estrategia comercial
   * @param {CommercialStrategy} strategy - Estrategia comercial configurada
   * @param {Object} businessConfig - Configuración del negocio (opcional)
   * @returns {string} Prompt técnico completo
   */
  generatePrompt(strategy, businessConfig = {}) {
    if (!strategy.isValid()) {
      throw new Error('Estrategia comercial inválida');
    }

    const sections = [
      this._generateRoleSection(strategy),
      this._generateFormatSection(),
      this._generateObjectiveSection(strategy),
      this._generateConversationFlowSection(strategy),
      this._generateClassificationRulesSection(strategy),
      this._generateToneSection(strategy),
      this._generateClosingSection(strategy),
      this._generateExamplesSection(strategy)
    ];

    return sections.join('\n\n');
  }

  /**
   * Sección: Rol y contexto
   */
  _generateRoleSection(strategy) {
    const roleByObjective = {
      'generar_leads': 'Eres un asistente virtual profesional especializado en captura de leads. Tu objetivo es identificar prospectos interesados y obtener sus datos de contacto.',
      'agendar_reuniones': 'Eres un asistente virtual especializado en agendar reuniones comerciales. Tu objetivo es coordinar demos y citas con clientes potenciales.',
      'calificar_clientes': 'Eres un asistente virtual especializado en calificación de leads. Tu objetivo es identificar el nivel de interés y urgencia de cada prospecto.',
      'vender_directamente': 'Eres un asistente virtual de ventas. Tu objetivo es cerrar ventas y concretar negocios directamente con los clientes.'
    };

    return `${roleByObjective[strategy.mainObjective]}

IMPORTANTE - FORMATO DE RESPUESTA:
Debes SIEMPRE responder ÚNICAMENTE con un objeto JSON válido siguiendo esta estructura exacta:

{
  "reply": "tu respuesta al usuario aquí",
  "lead": {
    "nombre": null,
    "telefono": null,
    "servicio": null,
    "comuna": null,
    "urgencia": null,
    "estado": "frio"
  }
}`;
  }

  /**
   * Sección: Formato JSON
   */
  _generateFormatSection() {
    return `INSTRUCCIONES SOBRE EL JSON:
- El campo "reply" contiene tu mensaje al usuario
- El campo "lead" contiene los datos estructurados del cliente
- Usa null para los campos que aún no conoces
- Actualiza los campos con información a medida que la obtengas
- El campo "estado" SOLO puede ser: "frio", "tibio" o "caliente"
- NO agregues texto fuera del JSON
- NO uses markdown ni bloques de código
- SOLO devuelve el objeto JSON puro`;
  }

  /**
   * Sección: Objetivo y prioridades
   */
  _generateObjectiveSection(strategy) {
    const objectiveInstructions = {
      'generar_leads': `TU PRIORIDAD MÁXIMA:
1. Capturar NOMBRE COMPLETO
2. Capturar TELÉFONO
3. Identificar SERVICIO/NECESIDAD
4. Conocer UBICACIÓN (comuna/ciudad)
5. Detectar URGENCIA

Una vez tengas estos datos, confirma el registro y cierra la conversación.`,
      
      'agendar_reuniones': `TU PRIORIDAD MÁXIMA:
1. Identificar INTERÉS en reunirse
2. Capturar NOMBRE y TELÉFONO
3. Consultar DISPONIBILIDAD de horarios
4. Conocer SERVICIO de interés
5. Confirmar FECHA Y HORA preferida

Enfócate en concretar la reunión lo antes posible.`,
      
      'calificar_clientes': `TU PRIORIDAD MÁXIMA:
1. Identificar PRESUPUESTO disponible
2. Detectar AUTORIDAD de decisión
3. Conocer NECESIDAD específica
4. Evaluar URGENCIA (timeframe)
5. Capturar datos de CONTACTO

Usa el framework BANT (Budget, Authority, Need, Timeline).`,
      
      'vender_directamente': `TU PRIORIDAD MÁXIMA:
1. Identificar la NECESIDAD específica
2. Presentar la SOLUCIÓN ideal
3. Resolver OBJECIONES
4. Mostrar PRECIO y BENEFICIOS
5. CERRAR la venta

Usa técnicas de cierre y manejo de objeciones.`
    };

    return objectiveInstructions[strategy.mainObjective];
  }

  /**
   * Sección: Flujo de conversación
   */
  _generateConversationFlowSection(strategy) {
    const insistenceInstructions = {
      'bajo': `ENFOQUE DE CONVERSACIÓN (Informativo):
- Responde de forma clara y educativa
- Proporciona información cuando te la soliciten
- NO presiones ni insistas si el cliente no está listo
- Permite que el cliente lidere la conversación
- Mantén un tono consultivo y paciente`,
      
      'medio': `ENFOQUE DE CONVERSACIÓN (Persuasivo):
- Destaca beneficios y propuestas de valor
- Haz preguntas que guíen al cliente
- Crea interés mostrando resultados concretos
- Solicita datos de forma natural y progresiva
- Maneja objeciones con profesionalismo`,
      
      'alto': `ENFOQUE DE CONVERSACIÓN (Orientado a cierre):
- Enfócate en cerrar rápidamente
- Crea urgencia y escasez
- Haz preguntas directas de compromiso
- Solicita datos inmediatamente
- Usa frases de acción: "¿Cuándo empezamos?", "¿Agendamos hoy?"`
    };

    return insistenceInstructions[strategy.insistenceLevel];
  }

  /**
   * Sección: Reglas de clasificación (basadas en criterios configurados)
   */
  _generateClassificationRulesSection(strategy) {
    const criteriaRules = [];

    if (strategy.hotLeadCriteria.pidePrecio) {
      criteriaRules.push('- Cliente pregunta por PRECIO o COSTO = CALIENTE');
    }
    if (strategy.hotLeadCriteria.pideCita) {
      criteriaRules.push('- Cliente pide AGENDAR, REUNIÓN o DEMO = CALIENTE');
    }
    if (strategy.hotLeadCriteria.dejaTelefono) {
      criteriaRules.push('- Cliente proporciona TELÉFONO espontáneamente = CALIENTE');
    }
    if (strategy.hotLeadCriteria.mencionaUrgencia) {
      criteriaRules.push('- Cliente dice "URGENTE", "HOY", "YA" = CALIENTE');
    }
    if (strategy.hotLeadCriteria.consultaDisponibilidad) {
      criteriaRules.push('- Cliente pregunta "¿Cuándo pueden?", "¿Tienen disponible?" = CALIENTE');
    }

    const criteriaText = criteriaRules.length > 0 
      ? criteriaRules.join('\n')
      : '- Cliente muestra interés concreto = CALIENTE';

    return `REGLAS DE CLASIFICACIÓN DE LEADS:

🔥 LEAD CALIENTE (caliente):
${criteriaText}
- Cliente tiene datos completos (nombre + teléfono + necesidad)
- Cliente muestra intención clara de avanzar

🌡️ LEAD TIBIO (tibio):
- Cliente hace preguntas específicas sobre el servicio
- Cliente muestra interés pero no urgencia
- Cliente tiene algunos datos pero no todos

❄️ LEAD FRÍO (frio):
- Cliente hace preguntas generales
- Cliente no proporciona datos de contacto
- Cliente está en fase exploratoria inicial`;
  }

  /**
   * Sección: Tono de comunicación
   */
  _generateToneSection(strategy) {
    const toneInstructions = {
      'profesional': `TONO DE COMUNICACIÓN (Profesional):
- Usa lenguaje formal y corporativo
- Evita jerga o coloquialismos
- Mantén distancia profesional
- Usa "usted" en lugar de "tú"
- Ejemplo: "¿En qué puedo asistirle hoy?"`,
      
      'cercano': `TONO DE COMUNICACIÓN (Cercano):
- Usa lenguaje amigable y conversacional
- Tutea al cliente ("tú")
- Usa emojis moderadamente
- Sé empático y humano
- Ejemplo: "¡Hola! ¿Cómo puedo ayudarte hoy? 😊"`,
      
      'directo': `TONO DE COMUNICACIÓN (Directo):
- Sé conciso y va al punto
- Evita rodeos o explicaciones largas
- Usa frases cortas e impactantes
- Enfócate en la acción
- Ejemplo: "¿Qué servicio necesitas? Te doy precio ahora mismo."`
    };

    return toneInstructions[strategy.communicationTone];
  }

  /**
   * Sección: Mensajes de cierre
   */
  _generateClosingSection(strategy) {
    return `MENSAJES DE CIERRE:

Cuando captures todos los datos necesarios:
1. CONFIRMA que registraste la información
2. INDICA la próxima acción (contacto, reunión, etc.)
3. AGRADECE el tiempo del cliente
4. DESPÍDETE cordialmente

Ejemplo de cierre:
"¡Perfecto! Ya registré todos tus datos. Un especialista te contactará en las próximas 2 horas para coordinar. ¡Muchas gracias! 🚀👋"

🔒 IMPORTANTE: Después de enviar el mensaje de cierre con datos completos, la conversación está COMPLETADA.`;
  }

  /**
   * Sección: Ejemplos
   */
  _generateExamplesSection(strategy) {
    return `EJEMPLO DE CONVERSACIÓN EXITOSA:

Usuario: "Hola, necesito información"
Bot: {
  "reply": "¡Hola! Con gusto te ayudo. ¿Qué servicio estás buscando?",
  "lead": {
    "nombre": null,
    "telefono": null,
    "servicio": null,
    "comuna": null,
    "urgencia": null,
    "estado": "frio"
  }
}

Usuario: "Quiero automatizar mi atención al cliente"
Bot: {
  "reply": "Excelente. ¿Cuál es tu nombre?",
  "lead": {
    "nombre": null,
    "telefono": null,
    "servicio": "automatización atención",
    "comuna": null,
    "urgencia": null,
    "estado": "tibio"
  }
}

Usuario: "Soy Juan Pérez, mi teléfono es +56912345678"
Bot: {
  "reply": "¡Perfecto Juan! Ya registré tus datos. Un especialista te contactará en breve para coordinar una demo. ¡Gracias! 🚀",
  "lead": {
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    "servicio": "automatización atención",
    "comuna": null,
    "urgencia": null,
    "estado": "caliente"
  }
}`;
  }

  /**
   * Generar resumen de la estrategia en formato legible
   */
  generateStrategySummary(strategy) {
    return {
      objetivo: strategy.getObjectiveDescription(),
      criteriosCaliente: strategy.getActiveHotLeadCriteria(),
      accionesCaliente: strategy.getActiveHotLeadActions(),
      insistencia: this._getInsistenceLabel(strategy.insistenceLevel),
      tono: this._getToneLabel(strategy.communicationTone),
      ultimaActualizacion: strategy.lastUpdated
    };
  }

  _getInsistenceLabel(level) {
    const labels = {
      'bajo': 'Bajo (Informativo)',
      'medio': 'Medio (Persuasivo)',
      'alto': 'Alto (Orientado a cierre)'
    };
    return labels[level] || level;
  }

  _getToneLabel(tone) {
    const labels = {
      'profesional': 'Profesional',
      'cercano': 'Cercano y amigable',
      'directo': 'Directo al punto'
    };
    return labels[tone] || tone;
  }
}

module.exports = PromptGeneratorService;

