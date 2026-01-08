# Arquitectura de Respuestas Estructuradas JSON

## 📋 Descripción General

El sistema ha sido refactorizado para trabajar con respuestas estructuradas en JSON, eliminando el parsing de texto libre y mejorando la robustez y mantenibilidad del código.

## 🎯 Objetivos Cumplidos

1. ✅ LLM siempre devuelve respuesta estructurada en JSON
2. ✅ Validación de schemas con Zod
3. ✅ Entidad de dominio Lead con métodos de negocio
4. ✅ Manejo de errores con reintentos automáticos
5. ✅ Endpoints refactorizados para trabajar con datos estructurados

## 📊 Contrato de Respuesta del LLM

El LLM siempre responde con la siguiente estructura JSON:

```json
{
  "reply": "texto de respuesta al usuario",
  "lead": {
    "nombre": null,
    "telefono": null,
    "servicio": null,
    "comuna": null,
    "estado": "frio | tibio | caliente"
  }
}
```

### Campos del Contrato

- **reply**: Mensaje conversacional que se envía al usuario
- **lead.nombre**: Nombre completo del cliente (null si aún no se capturó)
- **lead.telefono**: Teléfono con formato +56... (null si aún no se capturó)
- **lead.servicio**: Servicio solicitado (null si aún no se capturó)
- **lead.comuna**: Comuna del cliente (null si aún no se capturó)
- **lead.estado**: Calificación del lead - SOLO puede ser: "frio", "tibio" o "caliente"

## 🏗️ Arquitectura Implementada

### 1. Entidad de Dominio: Lead

**Ubicación**: `models/Lead.js`

La clase `Lead` representa un cliente potencial con:

```javascript
class Lead {
  constructor(data)           // Crea y valida una instancia
  estaCompleto()             // Verifica si tiene datos suficientes
  esCaliente()               // Es lead prioritario?
  esTibio()                  // Es lead con interés moderado?
  esFrio()                   // Es lead exploratorio?
  getNivelPrioridad()        // Retorna 1-3 según prioridad
  toJSON()                   // Serializa para DB
  toString()                 // Para logs
}
```

**Métodos de Negocio**:
- `estaCompleto()`: Considera completo si tiene nombre Y (teléfono O servicio)
- `getNivelPrioridad()`: caliente=3, tibio=2, frio=1

### 2. Clase LLMResponse

**Ubicación**: `models/Lead.js`

Encapsula la respuesta completa del LLM:

```javascript
class LLMResponse {
  constructor(data)         // Valida y crea instancia
  getRespuesta()           // Obtiene el texto de respuesta
  getLead()                // Obtiene la instancia de Lead
  toJSON()                 // Serializa para envío
}
```

### 3. Validación con Zod

**Schemas Definidos**:

```javascript
// Schema para datos del Lead
const LeadDataSchema = z.object({
  nombre: z.string().nullable(),
  telefono: z.string().nullable(),
  servicio: z.string().nullable(),
  comuna: z.string().nullable(),
  estado: z.enum(['frio', 'tibio', 'caliente'])
});

// Schema para respuesta completa del LLM
const LLMResponseSchema = z.object({
  reply: z.string().min(1, 'La respuesta no puede estar vacía'),
  lead: LeadDataSchema
});
```

**Beneficios**:
- Type safety en tiempo de ejecución
- Mensajes de error descriptivos
- Validación automática de tipos y formatos
- Documentación del contrato en código

## 🔄 Flujo de Procesamiento

### Flujo Completo con Validación

```
Usuario envía mensaje
        ↓
Endpoint valida entrada (Zod)
        ↓
AIService.procesarMensaje()
        ↓
AIService.generarRespuestaEstructurada()
        ↓
OpenAI genera JSON con response_format: json_object
        ↓
Parse JSON
        ↓
Validar con Zod
        ├─ ✅ Válido → Crear LLMResponse
        └─ ❌ Inválido → Reintentar (hasta 3 veces)
                ↓
        Enviar mensaje de corrección al LLM
                ↓
        Generar nuevamente
        ↓
LLMResponse con Lead estructurado
        ↓
Verificar si Lead está completo
        ├─ Sí → Guardar en DB + Notificar
        └─ No → Continuar conversación
        ↓
Retornar respuesta al usuario
```

## 🛡️ Manejo de Errores

### Estrategia de Reintentos

El sistema implementa reintentos automáticos para manejar errores:

```javascript
MAX_REINTENTOS = 3
```

**Tipos de Errores Manejados**:

1. **Error de Validación Zod**: 
   - Se construye mensaje de corrección con detalles
   - Se agrega al contexto de la conversación
   - Se solicita al LLM una nueva respuesta

2. **JSON Inválido (SyntaxError)**:
   - Se notifica al LLM que el JSON es inválido
   - Se solicita una nueva respuesta siguiendo el formato

3. **Error de API de OpenAI**:
   - Backoff exponencial (espera creciente)
   - Reintento automático

### Ejemplo de Mensaje de Corrección

```javascript
ERROR DE VALIDACIÓN: Tu respuesta JSON anterior no cumple con el contrato requerido.

Errores encontrados:
- Campo "lead.estado": Invalid enum value. Expected 'frio' | 'tibio' | 'caliente'
- Campo "reply": Required

JSON recibido:
{ "respuesta": "Hola", "lead": {...} }

Por favor, corrige tu respuesta...
```

## 📝 System Prompt Actualizado

El prompt del sistema ha sido modificado para:

1. **Forzar formato JSON**: Instrucciones claras sobre la estructura exacta
2. **Ejemplos completos**: 5 ejemplos de diferentes escenarios
3. **Prohibiciones explícitas**: No usar markdown, no texto fuera del JSON
4. **Guías de calificación**: Criterios claros para estado frio/tibio/caliente

**Características clave**:
- Uso de `response_format: { type: "json_object" }` en llamada a OpenAI
- Instrucciones repetidas sobre formato JSON
- Ejemplos válidos de cada tipo de respuesta

## 🔌 API Endpoints Refactorizados

### POST /chat

**Request**:
```json
{
  "message": "Hola, necesito reparar mi aire",
  "sessionId": "web_12345"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "respuesta": "¡Hola! Con gusto te ayudamos...",
    "sessionId": "web_12345",
    "lead": {
      "nombre": null,
      "telefono": null,
      "servicio": "reparación",
      "comuna": null,
      "estado": "tibio",
      "completo": false,
      "prioridad": 2
    },
    "conversacionCompleta": false
  }
}
```

**Campos Adicionales**:
- `lead.completo`: boolean indicando si el lead tiene datos suficientes
- `lead.prioridad`: número 1-3 para ordenamiento
- `conversacionCompleta`: boolean indicando si se capturaron todos los datos

### POST /whatsapp/webhook

El webhook de WhatsApp procesa mensajes de la misma manera:

```javascript
const resultado = await aiService.procesarMensaje(from, textoMensaje, 'whatsapp');
// resultado.respuesta -> texto para enviar
// resultado.lead -> instancia de Lead con datos estructurados
// resultado.conversacionCompleta -> boolean
```

**Ventajas**:
- Consistencia entre canales (web y WhatsApp)
- Misma lógica de validación y procesamiento
- Logging mejorado con información del lead

## 🎨 Mejores Prácticas Implementadas

### 1. Separation of Concerns

- **Models**: Lógica de dominio y validación (Lead.js)
- **Services**: Lógica de negocio (aiService.js)
- **Routes**: Manejo de HTTP y validación de entrada (chat.js, whatsapp.js)

### 2. Type Safety

- Validación en tiempo de ejecución con Zod
- Schemas exportados para reutilización
- Mensajes de error descriptivos

### 3. Error Handling

- Try-catch en todos los niveles
- Reintentos automáticos con backoff
- Logging detallado para debugging
- Respuestas HTTP apropiadas

### 4. Domain Modeling

- Clase Lead con métodos de negocio
- Encapsulación de lógica de dominio
- Abstracción de la persistencia

### 5. Testability

- Funciones puras y pequeñas
- Dependencias inyectables
- Separación clara de responsabilidades

## 🔍 Debugging y Logs

El sistema incluye logging detallado:

```javascript
// Logs de éxito
console.log(`✅ Respuesta JSON válida obtenida - Estado del lead: ${estado}`);
console.log(`✅ Lead guardado: ${leadInstance.toString()}`);

// Logs de advertencia
console.warn(`⚠️ Validación Zod falló (intento ${intento}/${MAX_REINTENTOS})`);
console.warn(`⚠️ JSON inválido (intento ${intento}/${MAX_REINTENTOS})`);

// Logs informativos
console.log(`ℹ️ Lead incompleto, continuando conversación`);
console.log(`📊 Lead - Estado: ${estado}, Completo: ${completo}`);
```

## 🚀 Beneficios de la Nueva Arquitectura

### 1. Robustez
- Validación automática de datos
- Manejo de errores con reintentos
- Contrato de API estricto

### 2. Mantenibilidad
- Código organizado en capas
- Lógica de negocio centralizada
- Fácil de extender

### 3. Type Safety
- Validación en runtime con Zod
- Errores detectados tempranamente
- Documentación implícita en código

### 4. Consistencia
- Mismo flujo para todos los canales
- Formato uniforme de respuestas
- Validación centralizada

### 5. Observabilidad
- Logs estructurados
- Métricas de reintentos
- Estado del lead en cada interacción

## 🔧 Configuración

### Dependencias Agregadas

```json
{
  "zod": "^3.22.4"
}
```

Instalar con:
```bash
npm install zod --ignore-scripts
```

### Variables de Entorno

No se requieren nuevas variables de entorno. El sistema utiliza las mismas configuraciones existentes.

## 📈 Próximos Pasos Sugeridos

1. **Tests Unitarios**: Agregar tests para validación y lógica de negocio
2. **Tests de Integración**: Validar flujo completo con mocks
3. **Métricas**: Agregar contadores de reintentos y tasa de éxito
4. **Monitoring**: Alertas para cuando se agotan reintentos
5. **Extensión**: Agregar más campos al contrato según necesidad

## 📚 Referencias

- **Zod Documentation**: https://zod.dev
- **OpenAI JSON Mode**: https://platform.openai.com/docs/guides/json-mode
- **Domain-Driven Design**: Patterns para modelado de dominio

---

**Versión**: 2.0  
**Fecha de Implementación**: Enero 2026  
**Arquitecto**: Sistema refactorizado siguiendo principios SOLID y DDD

