# 🎯 Estrategia Comercial IA - Documentación Técnica

## 📖 Descripción General

El sistema de **Estrategia Comercial IA** permite a los usuarios configurar el comportamiento del asistente IA sin necesidad de editar prompts técnicos.

En lugar de escribir instrucciones complejas, el usuario simplemente configura decisiones comerciales de alto nivel, y el sistema traduce automáticamente esas decisiones en un prompt técnico optimizado.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (Dashboard)                      │
│      Configura estrategia comercial sin ver el prompt      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│             CommercialStrategy (Entidad)                    │
│   - mainObjective: generar_leads | agendar | calificar     │
│   - hotLeadCriteria: { pidePrecio, pideCita, ... }         │
│   - hotLeadActions: { enviarEmail, enviarWhatsApp, ... }   │
│   - insistenceLevel: bajo | medio | alto                   │
│   - communicationTone: profesional | cercano | directo     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           PromptGeneratorService (Traductor)                │
│      Convierte configuración → Prompt técnico               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                prompts/systemPrompt.txt                     │
│            (Generado automáticamente)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenAI API (GPT-4)                        │
│            Usa el prompt para generar respuestas            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Modelo de Datos

### CommercialStrategy

```javascript
{
  mainObjective: 'generar_leads',  // Objetivo principal
  hotLeadCriteria: {               // Criterios para Lead Caliente
    pidePrecio: true,
    pideCita: true,
    dejaTelefono: true,
    mencionaUrgencia: true,
    consultaDisponibilidad: false
  },
  hotLeadActions: {                // Acciones automáticas
    enviarEmail: true,
    enviarWhatsApp: false,
    mostrarCTA: true,
    derivarHumano: false
  },
  insistenceLevel: 'medio',        // bajo | medio | alto
  communicationTone: 'profesional', // profesional | cercano | directo
  lastUpdated: '2026-01-16T...',
  updatedBy: 'dashboard_user'
}
```

---

## 🔄 Flujo de Actualización

1. **Usuario** configura estrategia en `/estrategia-comercial.html`
2. **Frontend** envía configuración a `PUT /api/commercial-strategy`
3. **Backend** valida y guarda en `commercial_strategy` table
4. **PromptGeneratorService** traduce la configuración a prompt técnico
5. **Prompt generado** se guarda en `prompts/systemPrompt.txt`
6. **OpenAIClient** carga automáticamente el nuevo prompt
7. **Asistente IA** responde según la nueva estrategia

---

## 📝 Ejemplo de Prompt Generado

### Configuración del Usuario

```javascript
{
  mainObjective: 'agendar_reuniones',
  hotLeadCriteria: {
    pideCita: true,
    mencionaUrgencia: true
  },
  hotLeadActions: {
    enviarEmail: true,
    mostrarCTA: true
  },
  insistenceLevel: 'alto',
  communicationTone: 'directo'
}
```

### Prompt Técnico Generado

```
Eres un asistente virtual especializado en agendar reuniones comerciales. Tu objetivo es coordinar demos y citas con clientes potenciales.

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
}

INSTRUCCIONES SOBRE EL JSON:
- El campo "reply" contiene tu mensaje al usuario
- El campo "lead" contiene los datos estructurados del cliente
...

TU PRIORIDAD MÁXIMA:
1. Identificar INTERÉS en reunirse
2. Capturar NOMBRE y TELÉFONO
3. Consultar DISPONIBILIDAD de horarios
4. Conocer SERVICIO de interés
5. Confirmar FECHA Y HORA preferida

Enfócate en concretar la reunión lo antes posible.

ENFOQUE DE CONVERSACIÓN (Orientado a cierre):
- Enfócate en cerrar rápidamente
- Crea urgencia y escasez
- Haz preguntas directas de compromiso
- Solicita datos inmediatamente
- Usa frases de acción: "¿Cuándo empezamos?", "¿Agendamos hoy?"

REGLAS DE CLASIFICACIÓN DE LEADS:

🔥 LEAD CALIENTE (caliente):
- Cliente pide AGENDAR, REUNIÓN o DEMO = CALIENTE
- Cliente dice "URGENTE", "HOY", "YA" = CALIENTE
- Cliente tiene datos completos (nombre + teléfono + necesidad)
- Cliente muestra intención clara de avanzar

🌡️ LEAD TIBIO (tibio):
- Cliente hace preguntas específicas sobre el servicio
- Cliente muestra interés pero no urgencia
- Cliente tiene algunos datos pero no todos

❄️ LEAD FRÍO (frio):
- Cliente hace preguntas generales
- Cliente no proporciona datos de contacto
- Cliente está en fase exploratoria inicial

TONO DE COMUNICACIÓN (Directo):
- Sé conciso y va al punto
- Evita rodeos o explicaciones largas
- Usa frases cortas e impactantes
- Enfócate en la acción
- Ejemplo: "¿Qué servicio necesitas? Te doy precio ahora mismo."

MENSAJES DE CIERRE:

Cuando captures todos los datos necesarios:
1. CONFIRMA que registraste la información
2. INDICA la próxima acción (contacto, reunión, etc.)
3. AGRADECE el tiempo del cliente
4. DESPÍDETE cordialmente

Ejemplo de cierre:
"¡Perfecto! Ya registré todos tus datos. Un especialista te contactará en las próximas 2 horas para coordinar. ¡Muchas gracias! 🚀👋"

🔒 IMPORTANTE: Después de enviar el mensaje de cierre con datos completos, la conversación está COMPLETADA.
```

---

## 🚀 API Endpoints

### `GET /api/commercial-strategy`
Obtener la estrategia comercial activa.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "strategy": { ... },
    "summary": {
      "objetivo": "Capturar datos de contacto...",
      "criteriosCaliente": ["Cliente pide precio", "Cliente pide agendar"],
      "accionesCaliente": ["Enviar email de notificación"],
      "insistencia": "Medio (Persuasivo)",
      "tono": "Profesional"
    }
  }
}
```

### `PUT /api/commercial-strategy`
Actualizar la estrategia comercial.

**Body:**
```json
{
  "mainObjective": "generar_leads",
  "hotLeadCriteria": { "pidePrecio": true, ... },
  "hotLeadActions": { "enviarEmail": true, ... },
  "insistenceLevel": "medio",
  "communicationTone": "profesional"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estrategia comercial actualizada exitosamente",
  "data": {
    "strategy": { ... },
    "summary": { ... },
    "promptGenerated": true
  }
}
```

### `POST /api/commercial-strategy/preview-prompt`
Vista previa del prompt que se generaría.

### `GET /api/commercial-strategy/options`
Obtener todas las opciones disponibles.

### `GET /api/commercial-strategy/history`
Obtener historial de estrategias anteriores.

---

## 💾 Base de Datos

### Tabla: `commercial_strategy`

```sql
CREATE TABLE commercial_strategy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  main_objective TEXT NOT NULL,
  hot_lead_criteria TEXT NOT NULL,      -- JSON
  hot_lead_actions TEXT NOT NULL,       -- JSON
  insistence_level TEXT NOT NULL,
  communication_tone TEXT NOT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  is_active INTEGER DEFAULT 1
);
```

Solo una estrategia puede estar activa a la vez. Al guardar una nueva, las anteriores se desactivan pero se mantienen para historial.

---

## 🎨 Interfaz de Usuario

### Ubicación
`https://sendspress.cl/estrategia-comercial.html`

### Características
- ✅ Formulario intuitivo con 5 secciones
- ✅ Selección única para objetivos, insistencia y tono
- ✅ Selección múltiple para criterios y acciones
- ✅ Vista previa del prompt generado
- ✅ Resumen de la estrategia actual
- ✅ Notificaciones de éxito/error
- ✅ Diseño responsive y moderno

---

## 🔐 Ventajas del Sistema

### Para el Usuario (Gerente Comercial)
- ❌ NO necesita conocimientos técnicos
- ❌ NO necesita entender ingeniería de prompts
- ✅ Configura decisiones comerciales claras
- ✅ Ve el impacto inmediato en el asistente
- ✅ Puede experimentar con diferentes estrategias

### Para el Sistema
- ✅ Prompts siempre bien estructurados
- ✅ Consistencia en las instrucciones
- ✅ Fácil mantenimiento y escalabilidad
- ✅ Historial de cambios automático
- ✅ Validación de configuraciones

---

## 📊 Casos de Uso

### Caso 1: Startup en crecimiento
- **Objetivo:** Generar leads
- **Insistencia:** Media
- **Tono:** Cercano
- **Resultado:** Asistente amigable que captura datos sin presionar

### Caso 2: Empresa establecida con SDRs
- **Objetivo:** Calificar clientes
- **Insistencia:** Alta
- **Tono:** Profesional
- **Resultado:** Asistente que usa BANT para clasificar leads rápidamente

### Caso 3: Servicio premium
- **Objetivo:** Agendar reuniones
- **Insistencia:** Baja
- **Tono:** Profesional
- **Resultado:** Asistente consultivo que respeta el ritmo del cliente

---

## 🧪 Testing

### Probar localmente
1. Iniciar servidor: `npm start`
2. Abrir: `http://localhost:3000/estrategia-comercial.html`
3. Configurar estrategia
4. Guardar
5. Probar el chat en `/`

### Verificar prompt generado
- Abrir: `prompts/systemPrompt.txt`
- Verificar que refleje la configuración

### Verificar base de datos
```bash
sqlite3 leads.db
SELECT * FROM commercial_strategy WHERE is_active = 1;
```

---

## 🎯 Próximas Mejoras

- [ ] Agregar más opciones de criterios y acciones
- [ ] Permitir texto personalizado para mensajes de cierre
- [ ] A/B testing automático de estrategias
- [ ] Analíticas de conversión por estrategia
- [ ] Plantillas predefinidas por industria
- [ ] Exportar/importar configuraciones
- [ ] Integración con CRM para reglas avanzadas

---

## 🤝 Contribuciones

Este sistema fue diseñado con enfoque en **UX de producto SaaS**:
- Configuración por decisiones, no por código
- Interfaz intuitiva para no-técnicos
- Feedback inmediato
- Validaciones en tiempo real

---

**Última actualización:** 2026-01-16
**Versión:** 1.0.0

