# 🎯 Reglas de Negocio para Clasificación de Leads

## 📋 Descripción General

Sistema de clasificación automática de leads basado en reglas de negocio estrictas para filtrar oportunidades reales y priorizar contactos con alta intención de compra.

**Objetivo**: Que el sistema identifique automáticamente qué leads son oportunidades reales de negocio y notifique al propietario solo cuando vale la pena.

---

## 🏷️ Clasificación de Leads

### ❄️ LEAD FRÍO (frio)

**Definición**: Solo consulta general, sin datos ni intención de contratar

**Criterios**:
- ✅ Hace preguntas MUY generales
- ✅ NO proporciona ningún dato de contacto
- ✅ Solo pregunta precios sin contexto
- ✅ Saludo inicial sin información adicional
- ✅ Muestra muy poco compromiso

**Ejemplos**:
```
❄️ "Hola"
❄️ "¿Qué servicios tienen?"
❄️ "¿Cuánto cuesta?"
❄️ "Info"
❄️ "Quisiera saber en qué me pueden ayudar"
```

**Acción**: No notificar. Solo se guarda si proporciona datos eventualmente.

---

### 🌡️ LEAD TIBIO (tibio)

**Definición**: Deja datos o muestra interés, pero no pide acción inmediata

**Criterios**:
- ✅ Proporciona AL MENOS un dato de contacto (nombre O teléfono)
- ✅ Pregunta sobre servicios específicos
- ✅ Muestra interés pero sin urgencia
- ✅ Usa frases como "más adelante", "para el futuro"
- ✅ Está cotizando o comparando opciones

**Palabras clave**:
```
me interesa | quisiera saber | más adelante | para el futuro
estoy cotizando | comparando | tal vez | posiblemente
eventualmente | en unos días | próximamente
```

**Ejemplos**:
```
🌡️ "Hola, soy María. ¿Qué servicios ofrecen?"
🌡️ "Mi teléfono es +56999... Quisiera saber sobre mantenimiento"
🌡️ "Estoy pensando en instalar aire acondicionado más adelante"
🌡️ "¿Cuánto cuesta aproximadamente una reparación?"
🌡️ "Quiero cotizar pero no es urgente"
```

**Acción**: Notificar con prioridad NORMAL cuando el lead esté completo.

---

### 🔥 LEAD CALIENTE (caliente)

**Definición**: Solicita cotizar, agendar, contratar o muestra intención directa de compra

**Criterios (cumple AL MENOS UNO)**:
1. ✅ Usa verbos de acción directa:
   - "necesito", "quiero contratar", "quiero agendar"
   - "necesito cotizar", "cuándo pueden venir"

2. ✅ Menciona urgencia inmediata:
   - "urgente", "hoy", "mañana", "esta semana"
   - "lo antes posible", "rápido", "pronto"

3. ✅ Pregunta por disponibilidad específica:
   - "¿tienen disponibilidad?", "¿cuándo pueden?"
   - "¿pueden venir?"

4. ✅ Tiene un problema actual que requiere solución:
   - "no funciona", "se dañó", "está malo"
   - "tiene falla", "problema", "avería"

5. ✅ Solicita explícitamente:
   - Agendar visita, cotización, servicio
   - Pregunta por métodos de pago con intención de contratar

6. ✅ Proporciona nombre Y teléfono Y muestra intención clara

**Palabras clave calientes**:
```
necesito | quiero contratar | quiero agendar | urgente | hoy
mañana | lo antes posible | cuándo pueden | pueden venir
no funciona | se dañó | problema | agendar | cotizar
```

**Ejemplos**:
```
🔥 "Necesito reparar mi aire acondicionado urgente"
🔥 "¿Cuándo pueden venir a hacer mantenimiento?"
🔥 "Quiero agendar una visita para cotizar"
🔥 "Mi equipo no funciona, necesito un técnico hoy"
🔥 "¿Cuánto cuesta instalar un split y cuándo pueden?"
🔥 "Juan Pérez, +56912345678, necesito servicio urgente"
```

**Acción**: **NOTIFICACIÓN AUTOMÁTICA INMEDIATA** al propietario con prioridad URGENTE.

---

## 🤖 Implementación Técnica

### 1. Servicio de Dominio: LeadClassifier

Clase pura de dominio que aplica las reglas de negocio:

```javascript
// src/domain/services/LeadClassifier.js

LeadClassifier.classifyLead(lead, conversationHistory)
// Retorna: 'frio', 'tibio' o 'caliente'

LeadClassifier.validateClassification(llmEstado, lead, conversationHistory)
// Valida si el LLM clasificó correctamente
// Si no, sugiere el estado correcto

LeadClassifier.getClassificationReason(lead, conversationHistory)
// Retorna la razón de la clasificación
```

**Características**:
- ✅ Sin dependencias de infraestructura
- ✅ Lógica de negocio pura
- ✅ Fácilmente testeable
- ✅ Reglas centralizadas

### 2. Caso de Uso: NotifyOwner

Dispara notificaciones automáticas al propietario:

```javascript
// src/application/use-cases/NotifyOwner.js

await notifyOwner.execute({
  lead: leadInstance,
  reason: 'Lead caliente: muestra urgencia inmediata',
  priority: 'urgent'
});
```

**Prioridades**:
- `urgent`: Lead caliente con datos completos
- `high`: Lead caliente o tibio completo
- `normal`: Lead tibio
- `low`: Lead frío con algunos datos

### 3. Flujo Automático

El flujo en `ProcessChatMessage` es:

```
1. Usuario envía mensaje
        ↓
2. LLM genera respuesta con clasificación inicial
        ↓
3. LeadClassifier VALIDA la clasificación
        ├─ ✅ Correcta → Mantener
        └─ ❌ Incorrecta → Corregir según reglas
        ↓
4. Guardar lead con clasificación correcta
        ↓
5. Si estado === "caliente"
        ├─ Disparar NotifyOwner automáticamente
        └─ Prioridad: URGENT
        ↓
6. Si estado === "tibio" y completo
        ├─ Disparar NotifyOwner
        └─ Prioridad: NORMAL
```

---

## 📊 Ejemplos de Clasificación Automática

### Caso 1: Corrección de Clasificación

```
LLM dijo: "tibio"
Conversación: "Necesito reparar urgente mi equipo"
Datos: { nombre: null, telefono: null, servicio: "reparación" }

LeadClassifier detecta:
❌ Clasificación incorrecta
✅ Debería ser "caliente" porque: muestra urgencia, tiene problema actual

Resultado:
Estado corregido a: "caliente"
Notificación: ENVIADA automáticamente con prioridad URGENT
```

### Caso 2: Progresión de Lead

```
Mensaje 1: "Hola" → FRIO (solo saludo)
Mensaje 2: "Soy María" → TIBIO (dio nombre)
Mensaje 3: "Mi teléfono es +56999, necesito técnico urgente" 
           → CALIENTE (datos + urgencia)

Resultado:
Estado final: "caliente"
Notificación: ENVIADA automáticamente
```

### Caso 3: Lead Caliente Inmediato

```
Mensaje 1: "¿Cuándo pueden venir a reparar? Estoy en Las Condes"

LeadClassifier detecta:
✅ Solicitud directa de acción ("cuándo pueden venir")
✅ Clasificación: "caliente"

Resultado:
Notificación: ENVIADA inmediatamente
Aunque no tenga datos completos, la urgencia lo hace caliente
```

---

## 🎯 Reglas Adicionales

### Progresión de Estado

Un lead PUEDE cambiar de estado durante la conversación:

```
frio → tibio → caliente  ✅ Correcto
caliente → tibio → frio  ❌ Raro pero posible
```

El sistema siempre evalúa el estado MÁS RECIENTE basándose en TODA la conversación.

### Criterio de Datos + Intención

| Datos | Urgencia/Interés | Resultado |
|-------|------------------|-----------|
| Ninguno | Ninguna | 🥶 FRIO |
| Alguno | Ninguna | 🌡️ TIBIO |
| Ninguno | Alta | 🔥 CALIENTE |
| Completos | Ninguna | 🌡️ TIBIO |
| Completos | Alta | 🔥🔥🔥 CALIENTE URGENTE |

### Validación de Coherencia

El sistema SIEMPRE valida la clasificación del LLM:

```javascript
if (llmEstado !== reglasNegocioEstado) {
  console.log(`⚠️ Clasificación corregida de "${llmEstado}" a "${reglasNegocioEstado}"`);
  lead.estado = reglasNegocioEstado;
}
```

Esto garantiza que las reglas de negocio SIEMPRE prevalecen sobre el criterio del LLM.

---

## 📈 Estadísticas y Filtrado

### Buscar por Estado

```javascript
// Obtener solo oportunidades calientes
const leadsCalientes = leadRepository.findByStatus('caliente');

// Filtrar por prioridad
const leadsPrioritarios = leadsCalientes.filter(lead => 
  lead.estaCompleto() && lead.getNivelPrioridad() === 3
);
```

### Estadísticas

```javascript
const stats = leadRepository.getStatistics();
// {
//   total: 100,
//   porEstado: {
//     caliente: 15,  // 15% - Oportunidades reales
//     tibio: 35,     // 35% - Interés moderado
//     frio: 50       // 50% - Solo curiosidad
//   },
//   contactados: 20,
//   pendientes: 80
// }
```

---

## 🔔 Sistema de Notificaciones

### Cuándo se Notifica

| Estado | Condición | Prioridad | Automático |
|--------|-----------|-----------|------------|
| 🔥 Caliente | Siempre | URGENT | ✅ SÍ |
| 🌡️ Tibio | Si está completo | NORMAL | ✅ SÍ |
| ❄️ Frío | Nunca | - | ❌ NO |

### Contenido de Notificación

```
🔥🔥🔥 ¡NUEVO LEAD CALIENTE! 🔥🔥🔥
=====================================
📋 Nombre: Juan Pérez
📞 Teléfono: +56912345678
🛠️  Servicio: Reparación urgente
📍 Comuna: Las Condes
⚡ Urgencia: Inmediata - equipo no funciona
📅 Fecha: 07/01/2026 14:30

🔥 Clasificado como CALIENTE porque:
   - Muestra urgencia inmediata
   - Tiene problema actual
   - Proporcionó datos completos

⏰ Contactar lo antes posible
=====================================
```

---

## ✅ Pruebas y Verificación

### Pruebas Automatizadas

Todas las reglas de negocio están probadas:

```bash
node test-business-rules.js
```

**Resultados**:
```
✅ Test 1: Lead FRIO - Solo saludo → CORRECTO
✅ Test 2: Lead TIBIO - Proporciona nombre → CORRECTO
✅ Test 3: Lead CALIENTE - Urgencia → CORRECTO
✅ Test 4: Lead CALIENTE - Datos completos → CORRECTO
✅ Test 5: Lead CALIENTE - Solicita agendar → CORRECTO
✅ Test 6: Validación corrige al LLM → CORRECTO
✅ Test 7: Persistencia en BD → CORRECTO
✅ Test 8: Búsqueda por estado → CORRECTO
✅ Test 9: Estadísticas → CORRECTO
```

---

## 📊 Impacto en el Negocio

### Antes (Sin Reglas Claras)

- ❌ Todos los leads notificados (ruido)
- ❌ Difícil priorizar contactos
- ❌ Tiempo perdido en consultas frías
- ❌ Oportunidades calientes mezcladas con curiosos

### Después (Con Reglas de Negocio)

- ✅ Solo oportunidades reales notificadas
- ✅ Priorización automática por urgencia
- ✅ Equipo enfocado en leads calientes
- ✅ Tasa de conversión mejorada

### Ejemplo Real

```
100 conversaciones/día:
- 50 frías (50%) → No se notifican
- 35 tibias (35%) → Se guardan, notificación normal
- 15 calientes (15%) → NOTIFICACIÓN INMEDIATA

Resultado:
- 85% menos ruido
- Equipo enfocado en 15 oportunidades reales
- Respuesta rápida a leads urgentes
```

---

## 🎓 Mejores Prácticas

### Para el Equipo Comercial

1. **Priorizar Calientes**: Contactar en menos de 2 horas
2. **Seguimiento Tibios**: Contactar en 24 horas
3. **Ignorar Fríos**: A menos que proporcionen datos

### Para el Sistema

1. **Validar Siempre**: No confiar ciegamente en el LLM
2. **Logging Detallado**: Registrar razones de clasificación
3. **Métricas**: Monitorear distribución de leads
4. **Refinamiento**: Ajustar palabras clave según resultados

### Para el Propietario

1. **Revisar Calientes**: Inmediatamente al recibir notificación
2. **Analizar Estadísticas**: Semanalmente para detectar patrones
3. **Feedback**: Informar si hay falsos positivos/negativos
4. **Optimización**: Ajustar reglas según conversión real

---

## 🚀 Próximas Mejoras Sugeridas

1. **Machine Learning**: Entrenar modelo con conversiones reales
2. **Scoring Avanzado**: Más allá de 3 categorías (0-100 puntos)
3. **Integración CRM**: Exportar leads calientes automáticamente
4. **Follow-up Automático**: Recordatorios si no se contacta en X tiempo
5. **A/B Testing**: Probar diferentes criterios de clasificación

---

## ✅ Conclusión

El sistema ahora cuenta con:

✅ **Reglas de negocio claras y documentadas**  
✅ **Clasificación automática inteligente**  
✅ **Validación del LLM con reglas estrictas**  
✅ **Notificaciones automáticas solo para oportunidades reales**  
✅ **Persistencia correcta de clasificaciones**  
✅ **Sistema de priorización automático**  
✅ **Filtrado efectivo de consultas sin valor**  

**El sistema está listo para filtrar oportunidades reales y maximizar la conversión** 🎯

---

**Versión**: 3.1  
**Fecha**: Enero 2026  
**Tipo**: Reglas de Negocio + Clasificación Automática  
**Estado**: ✅ Implementado y Probado

