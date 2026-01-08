# 📡 Documentación de API - IA Comercial

Documentación completa de todos los endpoints disponibles.

## 🔗 URL Base

```
http://localhost:3000
```

En producción, reemplaza con tu dominio.

## 🔑 Autenticación

Por defecto, la API no requiere autenticación. Para producción, se recomienda agregar autenticación mediante:
- API Keys
- JWT Tokens
- OAuth

## 📋 Endpoints

### 1. Chat Web

#### POST `/chat`

Enviar mensaje al asistente de IA.

**Request:**
```json
{
  "message": "Hola, necesito información",
  "sessionId": "unique-session-id-123"
}
```

**Response exitosa (200):**
```json
{
  "success": true,
  "data": {
    "respuesta": "¡Hola! Bienvenido a [Negocio]. ¿En qué puedo ayudarte hoy?",
    "sessionId": "unique-session-id-123"
  }
}
```

**Response error (400):**
```json
{
  "success": false,
  "error": "El mensaje es requerido"
}
```

**Response error (500):**
```json
{
  "success": false,
  "error": "Error al procesar el mensaje"
}
```

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola",
    "sessionId": "test123"
  }'
```

**Ejemplo con JavaScript:**
```javascript
const response = await fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hola',
    sessionId: 'test123'
  })
});

const data = await response.json();
console.log(data.data.respuesta);
```

---

#### POST `/chat/reset`

Reiniciar una conversación (limpiar historial).

**Request:**
```json
{
  "sessionId": "unique-session-id-123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Conversación reiniciada"
}
```

---

### 2. WhatsApp Webhook

#### GET `/whatsapp/webhook`

Verificación del webhook de WhatsApp (llamado por Meta/Facebook).

**Query Parameters:**
- `hub.mode`: "subscribe"
- `hub.verify_token`: Token de verificación configurado
- `hub.challenge`: Challenge de verificación

**Response (200):**
Devuelve el challenge si el token es válido.

**Response (403):**
Si el token es inválido.

---

#### POST `/whatsapp/webhook`

Recepción de mensajes de WhatsApp (llamado por Meta/Facebook).

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "56912345678",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": {
            "body": "Hola"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

**Response (200):**
Siempre devuelve 200 para evitar reintentos de Meta.

---

#### POST `/whatsapp/send`

Enviar mensaje manualmente por WhatsApp (útil para testing).

**Request:**
```json
{
  "to": "56912345678",
  "message": "Hola, este es un mensaje de prueba"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [{
      "input": "56912345678",
      "wa_id": "56912345678"
    }],
    "messages": [{
      "id": "wamid.xxx"
    }]
  }
}
```

---

### 3. Gestión de Leads

#### GET `/leads`

Obtener todos los leads.

**Query Parameters (opcionales):**
- `estado`: Filtrar por estado (`frio`, `tibio`, `caliente`)
- `contactado`: Filtrar por contactado (`true`, `false`)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "telefono": "+56912345678",
      "servicio": "Instalación de aire acondicionado",
      "comuna": "Las Condes",
      "urgencia": "Urgente, equipo dañado",
      "estado": "caliente",
      "contactado": 0,
      "notas": "Cliente necesita instalación para oficina",
      "fecha_creacion": "2024-01-15 10:30:00",
      "fecha_actualizacion": "2024-01-15 10:30:00"
    }
  ],
  "total": 1
}
```

**Ejemplos:**
```bash
# Todos los leads
curl http://localhost:3000/leads

# Solo leads calientes
curl http://localhost:3000/leads?estado=caliente

# Solo leads no contactados
curl http://localhost:3000/leads?contactado=false
```

---

#### GET `/leads/estadisticas`

Obtener estadísticas de leads.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "porEstado": {
      "caliente": 5,
      "tibio": 10,
      "frio": 10
    },
    "contactados": 15,
    "pendientes": 10
  }
}
```

---

#### GET `/leads/estado/:estado`

Obtener leads por estado específico.

**Parámetros:**
- `estado`: `frio`, `tibio` o `caliente`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "estado": "caliente",
      ...
    }
  ],
  "total": 5
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/leads/estado/caliente
```

---

#### GET `/leads/:id`

Obtener un lead específico por ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    ...
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Lead no encontrado"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/leads/1
```

---

#### POST `/leads`

Crear un lead manualmente.

**Request:**
```json
{
  "nombre": "María González",
  "telefono": "+56987654321",
  "servicio": "Mantenimiento",
  "comuna": "Providencia",
  "urgencia": "Para la próxima semana",
  "estado": "tibio",
  "notas": "Cliente referido"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Lead creado correctamente",
  "data": {
    "id": 2,
    "nombre": "María González",
    ...
  }
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María González",
    "telefono": "+56987654321",
    "servicio": "Mantenimiento"
  }'
```

---

#### PUT `/leads/:id`

Actualizar un lead.

**Request:**
```json
{
  "estado": "contactado",
  "notas": "Cliente contactado, visita agendada para el 20/01"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lead actualizado correctamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    ...
  }
}
```

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/leads/1 \
  -H "Content-Type: application/json" \
  -d '{
    "notas": "Cliente muy interesado"
  }'
```

---

#### PUT `/leads/:id/contactado`

Marcar un lead como contactado.

**Response (200):**
```json
{
  "success": true,
  "message": "Lead marcado como contactado",
  "data": {
    "id": 1,
    "contactado": 1,
    ...
  }
}
```

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/leads/1/contactado
```

---

### 4. Utilidades

#### GET `/health`

Verificar el estado del servidor.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/health
```

---

#### GET `/`

Servir el panel de administración (HTML).

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Éxito |
| 201 | Recurso creado |
| 400 | Solicitud incorrecta |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## 🔒 Seguridad (Recomendaciones para Producción)

### Agregar API Key

```javascript
// middleware/auth.js
function verificarApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'API Key inválida'
    });
  }
  
  next();
}

// En server.js
app.use('/leads', verificarApiKey, leadsRoutes);
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
});

app.use('/chat', limiter);
```

### CORS Específico

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'https://tu-dominio.com',
  optionsSuccessStatus: 200
}));
```

## 🧪 Testing

### Postman Collection

Importar esta colección en Postman:

```json
{
  "info": {
    "name": "IA Comercial API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/"
  },
  "item": [
    {
      "name": "Chat - Enviar Mensaje",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"message\": \"Hola\", \"sessionId\": \"test123\"}"
        },
        "url": {
          "raw": "http://localhost:3000/chat",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["chat"]
        }
      }
    }
  ]
}
```

## 📚 Recursos Adicionales

- [Documentación de OpenAI](https://platform.openai.com/docs)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Express.js](https://expressjs.com/)
- [Better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

