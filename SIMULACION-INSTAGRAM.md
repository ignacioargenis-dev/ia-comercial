# 🎭 Endpoint de Simulación de Instagram

## ✅ Implementación Completada

Endpoint para simular mensajes de Instagram sin necesitar la API real de Meta. Ideal para demostraciones comerciales y desarrollo.

---

## 🎯 Objetivo

Permitir demostrar el flujo completo de Instagram (y otros canales) sin configurar las APIs externas, usando el mismo procesamiento de IA y guardando leads con el canal correcto.

---

## 📍 Endpoint Principal

### POST `/api/simulate/instagram`

**Descripción:**
Simula un mensaje recibido desde Instagram, procesándolo con el mismo flujo de IA que un mensaje real y guardando el lead con `canal="instagram"`.

**Request:**

```bash
POST http://localhost:3000/api/simulate/instagram
Content-Type: application/json

{
  "message": "Hola, necesito información sobre instalación",
  "senderId": "demo_user_123"  // Opcional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "respuesta": "¡Hola! Soy el asistente virtual de Climatización Express. ¿En qué puedo ayudarte?",
    "lead": null,
    "metadata": {
      "sessionId": "instagram_demo_user_123",
      "canal": "instagram",
      "simulacion": true,
      "timestamp": "2026-01-08T14:30:00.000Z"
    }
  }
}
```

---

## 📊 Flujo Completo Simulado

### Ejemplo: Captura de Lead Caliente

**Paso 1: Saludo inicial**

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola",
    "senderId": "maria_123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "respuesta": "¡Hola! Soy el asistente de Climatización Express. ¿En qué puedo ayudarte?",
    "lead": null,
    "metadata": {
      "sessionId": "instagram_maria_123",
      "canal": "instagram",
      "simulacion": true
    }
  }
}
```

**Paso 2: Proporcionar información**

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "María González, +56912345678, necesito instalación urgente en Las Condes",
    "senderId": "maria_123"
  }'
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "respuesta": "Perfecto María. Ya registré tus datos, un asesor te contactará en breve.",
    "lead": {
      "id": 42,
      "nombre": "María González",
      "telefono": "+56912345678",
      "servicio": "instalación",
      "comuna": "Las Condes",
      "estado": "caliente",
      "canal": "instagram",
      "completo": true
    },
    "metadata": {
      "sessionId": "instagram_maria_123",
      "canal": "instagram",
      "simulacion": true
    }
  }
}
```

---

## 🌐 Otros Endpoints de Simulación

### POST `/api/simulate/whatsapp`

Simula mensajes desde WhatsApp.

**Request:**
```json
{
  "message": "Hola, necesito mantenimiento",
  "phoneNumber": "+56987654321"  // Opcional
}
```

**Respuesta:**
- Igual estructura que Instagram
- `canal`: `"whatsapp"`
- `sessionId`: `"whatsapp_+56987654321"`

---

### POST `/api/simulate/web`

Simula mensajes desde el chat web.

**Request:**
```json
{
  "message": "Hola, necesito cotización",
  "sessionId": "web_session_456"  // Opcional
}
```

**Respuesta:**
- Igual estructura que Instagram
- `canal`: `"web"`
- `sessionId`: `"web_session_456"` o generado automáticamente

---

### GET `/api/simulate/status`

Verifica que el módulo de simulación esté activo.

**Request:**
```bash
GET http://localhost:3000/api/simulate/status
```

**Response:**
```json
{
  "success": true,
  "message": "Módulo de simulación activo",
  "availableEndpoints": [
    {
      "method": "POST",
      "path": "/api/simulate/instagram",
      "description": "Simular mensaje desde Instagram"
    },
    {
      "method": "POST",
      "path": "/api/simulate/whatsapp",
      "description": "Simular mensaje desde WhatsApp"
    },
    {
      "method": "POST",
      "path": "/api/simulate/web",
      "description": "Simular mensaje desde Web"
    }
  ],
  "timestamp": "2026-01-08T14:30:00.000Z"
}
```

---

## 🧪 Ejemplos de Testing

### Test 1: Lead Frío (Solo consulta)

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cuánto cuesta una instalación?",
    "senderId": "user_001"
  }'
```

**Resultado esperado:**
- `lead`: `null` o con `estado`: `"frio"`
- Bot responde con información general

---

### Test 2: Lead Tibio (Deja datos pero sin urgencia)

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Juan Pérez, +56911112222, me interesa pero quiero cotizaciones",
    "senderId": "user_002"
  }'
```

**Resultado esperado:**
- `lead.estado`: `"tibio"`
- `lead.canal`: `"instagram"`
- `lead.completo`: `true` o `false` (según datos faltantes)

---

### Test 3: Lead Caliente (Urgencia explícita)

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "María Silva, +56933334444, necesito instalación URGENTE hoy en Providencia",
    "senderId": "user_003"
  }'
```

**Resultado esperado:**
- `lead.estado`: `"caliente"`
- `lead.canal`: `"instagram"`
- `lead.completo`: `true`
- Email de notificación enviado al propietario

---

### Test 4: Conversación Multi-Mensaje

```bash
# Mensaje 1
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "senderId": "user_004"}'

# Mensaje 2
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Carlos Muñoz", "senderId": "user_004"}'

# Mensaje 3
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "+56955556666", "senderId": "user_004"}'

# Mensaje 4
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Mantenimiento en Vitacura", "senderId": "user_004"}'
```

**Resultado esperado:**
- Conversación se mantiene por `sessionId` (`instagram_user_004`)
- Lead se construye progresivamente
- Al final, lead completo con todos los datos

---

## 📊 Verificar Leads en Dashboard

Después de simular mensajes, verifica los leads en:

**URL:** http://localhost:3000/dashboard

**Filtros:**
- Canal: Instagram
- Estado: Caliente / Tibio / Frío

**Verificación:**
- Los leads simulados aparecen con `Canal`: 📸 Instagram
- Todos los datos se guardan correctamente
- Teléfono es clickable para WhatsApp

---

## 🎨 Uso en Demo Mode

### Integración con `/demo`

El endpoint de simulación se puede integrar con la página de demos:

```javascript
// En public/demo.js
async function sendInstagramMessage(message, senderId) {
  const response = await fetch('/api/simulate/instagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, senderId })
  });
  
  const data = await response.json();
  return data.data.respuesta;
}

// Uso
const respuesta = await sendInstagramMessage('Hola', 'demo_user_1');
console.log(respuesta); // "¡Hola! Soy el asistente virtual..."
```

---

## 🔒 Validaciones Implementadas

### Request Body

```javascript
✅ message: requerido, string, no vacío
✅ senderId: opcional, string (se genera automáticamente si falta)
```

### Errores Comunes

**Error 400: Bad Request**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "El campo \"message\" es requerido y debe ser un string no vacío"
}
```

**Casos que generan 400:**
- `message` faltante
- `message` no es string
- `message` vacío o solo espacios
- `message` es `null` o `undefined`

**Error 500: Internal Server Error**
```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Error al procesar el mensaje simulado",
  "details": "OpenAI timeout" // Solo en development
}
```

---

## 📈 Beneficios

### Para Demos Comerciales

- ✅ No requiere configurar Instagram API
- ✅ No requiere cuenta de Instagram Business
- ✅ Funciona localmente sin conexión a Meta
- ✅ Resultados consistentes y predecibles
- ✅ Control total sobre el flujo

### Para Desarrollo

- ✅ Testing sin APIs externas
- ✅ No consume cuota de APIs
- ✅ Más rápido que usar webhooks reales
- ✅ Facilita debugging
- ✅ No requiere HTTPS

### Para QA

- ✅ Tests automatizados fáciles
- ✅ Reproducibilidad perfecta
- ✅ No depende de servicios externos
- ✅ Validación de flujos completos

---

## 🔄 Comparación: Real vs Simulación

| Aspecto | Instagram Real | Simulación |
|---------|----------------|------------|
| **API requerida** | Sí (Meta) | No |
| **Configuración** | Compleja | Ninguna |
| **HTTPS** | Requerido | No necesario |
| **Rate limits** | Sí (200/hora) | No |
| **Webhook** | Requerido | No |
| **Procesamiento IA** | ✅ | ✅ |
| **Guardar lead** | ✅ | ✅ |
| **Canal correcto** | ✅ | ✅ |
| **Notificaciones** | ✅ | ✅ |
| **Envío respuesta** | A Instagram | Solo JSON |

**Diferencia clave:** La simulación NO envía la respuesta de vuelta a Instagram (no llama a la API de Meta), solo la retorna en el JSON.

---

## 🎯 Casos de Uso

### 1. Demo Comercial

```bash
# Simular cliente interesado
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Necesito instalación urgente",
    "senderId": "cliente_demo"
  }'

# Mostrar al cliente:
# 1. La respuesta de la IA
# 2. El lead en el dashboard
# 3. El email de notificación (si está configurado)
```

### 2. Testing de Clasificación

```bash
# Lead Frío
curl ... -d '{"message": "Hola"}'

# Lead Tibio
curl ... -d '{"message": "Juan, +56911112222, me interesa"}'

# Lead Caliente
curl ... -d '{"message": "María, +56922223333, URGENTE hoy"}'
```

### 3. Validación de Reglas de Negocio

```bash
# Cambiar reglas en dashboard → Reglas del Negocio
# Probar con simulación
curl ... -d '{"message": "Instalación en Santiago"}'

# Verificar que respuesta cambie según reglas
```

---

## 📝 Logging

Todos los mensajes simulados se registran con:

```
📸 Simulación de Instagram iniciada
   sessionId: instagram_demo_user_123
   messageLength: 45
   preview: Hola, necesito información sobre instalación

✅ Simulación de Instagram completada
   sessionId: instagram_demo_user_123
   leadId: 42
   leadState: caliente
   hasResponse: true
```

**Diferenciador:** Los logs incluyen que es una simulación para no confundir con mensajes reales.

---

## 🚀 Deployment

### En Producción

**Opción 1:** Dejar habilitado para demos internos
- Útil para mostrar el sistema a clientes potenciales
- Asegurar autenticación si está público

**Opción 2:** Deshabilitar en producción
```javascript
// En server.js
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/simulate', simulateRoutes);
}
```

**Opción 3:** Requerir token especial
```javascript
// En simulate.js
router.use((req, res, next) => {
  if (req.headers['x-demo-token'] !== process.env.DEMO_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});
```

---

## ✅ Checklist

**Implementación:**
- [x] Endpoint POST `/api/simulate/instagram`
- [x] Endpoint POST `/api/simulate/whatsapp`
- [x] Endpoint POST `/api/simulate/web`
- [x] Endpoint GET `/api/simulate/status`
- [x] Validación de inputs
- [x] Manejo de errores
- [x] Logging estructurado
- [x] Documentación completa

**Testing:**
- [x] Lead frío
- [x] Lead tibio
- [x] Lead caliente
- [x] Conversación multi-mensaje
- [x] Validación de errores

**Integración:**
- [x] Registrado en server.js
- [x] Usa mismo flujo que Instagram real
- [x] Guarda canal correctamente
- [x] Compatible con dashboard

---

## 🎉 Resultado Final

**Endpoint completamente funcional para simular Instagram sin API real:**

✅ Mismo procesamiento de IA  
✅ Mismo flujo de lead  
✅ Canal "instagram" guardado correctamente  
✅ Notificaciones si el lead es caliente  
✅ Ideal para demos y testing  
✅ Sin dependencias externas  
✅ Documentación completa  

**Listo para demostraciones comerciales y desarrollo 🚀**

---

**Archivo:** `src/infrastructure/http/routes/simulate.js`  
**Rutas:** `/api/simulate/instagram`, `/api/simulate/whatsapp`, `/api/simulate/web`, `/api/simulate/status`

