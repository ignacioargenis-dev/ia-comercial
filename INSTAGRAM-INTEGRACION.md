# 📸 Instagram DM - Integración Completada

## ✅ Canal Instagram Agregado

Sistema completamente integrado con Instagram Messaging API de Meta.

---

## 📁 Archivos Creados

### 1. `src/infrastructure/external/InstagramService.js`
- Servicio para enviar mensajes a Instagram
- Health check de la API
- Logging de mensajes enviados/recibidos

### 2. `src/infrastructure/http/routes/instagram.js`
- `GET /api/instagram/webhook` - Verificación de Meta
- `POST /api/instagram/webhook` - Recepción de mensajes
- Reutiliza `HandleIncomingMessage` (mismo flujo que web/WhatsApp)

---

## 🔧 Archivos Modificados

### 1. `src/infrastructure/container.js`
- Agregado `getInstagramService()`
- Agregado alias `getHandleIncomingMessage()`

### 2. `server.js`
- Registrada ruta `/api/instagram`

### 3. `.env`
- Variables agregadas:
  - `IG_PAGE_TOKEN=`
  - `IG_VERIFY_TOKEN=`

### 4. `src/infrastructure/http/routes/health.js`
- Agregado health check de Instagram

---

## ⚙️ Configuración

### Variables de Entorno

```env
# Instagram Messaging API
IG_PAGE_TOKEN=tu_page_access_token
IG_VERIFY_TOKEN=tu_verify_token_personalizado
```

### Obtener Credenciales

1. **Meta Business Suite**: https://business.facebook.com
2. Crear App de Instagram Messaging
3. Generar Page Access Token
4. Definir Verify Token (string personalizado)

---

## 🔗 Configurar Webhook en Meta

### URL del Webhook

```
https://tu-dominio.com/api/instagram/webhook
```

### Callback Verification

```
GET /api/instagram/webhook
  ?hub.mode=subscribe
  &hub.verify_token=TU_VERIFY_TOKEN
  &hub.challenge=1234567890
```

### Suscripciones Necesarias

- ✅ `messages` - Mensajes entrantes
- ✅ `messaging_postbacks` - Respuestas de botones (opcional)

---

## 📊 Flujo de Mensajes

```
Usuario Instagram
    ↓
Meta envia POST /api/instagram/webhook
    ↓
InstagramRoutes extrae sender.id y message.text
    ↓
HandleIncomingMessage.execute() [MISMO QUE WEB/WHATSAPP]
    ↓
ProcessChatMessage → OpenAI → Clasificación
    ↓
InstagramService.sendMessage()
    ↓
Usuario recibe respuesta
```

---

## 🧪 Testing

### 1. Verificar Webhook

```bash
curl "http://localhost:3000/api/instagram/webhook?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=test123"
```

**Respuesta esperada:** `test123`

### 2. Simular Mensaje Entrante

```bash
curl -X POST http://localhost:3000/api/instagram/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "messaging": [{
        "sender": { "id": "123456789" },
        "recipient": { "id": "987654321" },
        "timestamp": 1234567890,
        "message": {
          "mid": "msg_id",
          "text": "Hola, necesito información"
        }
      }]
    }]
  }'
```

### 3. Health Check

```bash
curl http://localhost:3000/health/detailed
```

**Buscar en respuesta:**
```json
{
  "components": {
    "instagram": {
      "status": "healthy|not_configured",
      "message": "..."
    }
  }
}
```

---

## 📝 Logging

### Mensaje Recibido

```
💬 Instagram message received {
  senderId: '123456789',
  messageId: 'msg_abc123',
  text: 'Hola, necesito información'
}
```

### Respuesta de IA Enviada

```
✅ Instagram response sent {
  senderId: '123456789',
  leadId: 42,
  leadState: 'caliente'
}
```

### Mensaje Enviado por API

```
📤 Sending Instagram message {
  recipientId: '123456789',
  textLength: 145
}
```

---

## 🔍 Estructura de Datos

### Webhook Entrante (Meta → Sistema)

```json
{
  "object": "instagram",
  "entry": [{
    "id": "page_id",
    "time": 1234567890,
    "messaging": [{
      "sender": {
        "id": "instagram_scoped_id"
      },
      "recipient": {
        "id": "page_instagram_id"
      },
      "timestamp": 1234567890,
      "message": {
        "mid": "message_id",
        "text": "Mensaje del usuario"
      }
    }]
  }]
}
```

### Envío de Mensaje (Sistema → Instagram)

```json
POST https://graph.instagram.com/v21.0/me/messages
{
  "recipient": {
    "id": "instagram_scoped_id"
  },
  "message": {
    "text": "Respuesta del asistente"
  }
}
```

---

## 🎯 SessionId Format

```javascript
sessionId = `instagram_${senderId}`
```

**Ejemplo:** `instagram_1234567890`

Esto permite:
- ✅ Mantener conversaciones separadas por canal
- ✅ Identificar origen del lead
- ✅ Historial de conversación por usuario

---

## 🚀 Deploy

### 1. Variables de Entorno

Asegurar que estén configuradas:
```bash
IG_PAGE_TOKEN=EAAxxxxx...
IG_VERIFY_TOKEN=mi_token_secreto_123
```

### 2. HTTPS Requerido

Meta requiere HTTPS para webhooks:
- Usar ngrok (desarrollo)
- Usar certificado SSL (producción)

### 3. URL Pública

Configurar en Meta:
```
https://tu-dominio.com/api/instagram/webhook
```

### 4. Whitelist IP (Opcional)

Meta envía desde IPs específicas:
```
31.13.24.0/21
31.13.64.0/18
66.220.144.0/20
69.63.176.0/20
173.252.64.0/18
```

---

## ⚠️ Consideraciones

### Limitaciones de Instagram

1. **Solo texto**: No soporta archivos/imágenes en mensajes básicos
2. **24 horas**: Ventana de mensajería después del primer contacto
3. **Rate limits**: 
   - 200 llamadas/hora por usuario
   - 4800 llamadas/día por app

### Manejo de Errores

```javascript
try {
  await instagramService.sendMessage(senderId, text);
} catch (error) {
  // Log error
  // Intentar mensaje de error al usuario
  // No bloquea el flujo
}
```

---

## 📈 Métricas

### En Logs

```javascript
Logger.info('Instagram response sent', {
  senderId: '123',
  leadId: 42,
  leadState: 'caliente'
});
```

### En Base de Datos

```sql
SELECT * FROM conversaciones WHERE canal = 'instagram';
SELECT * FROM leads WHERE sessionId LIKE 'instagram_%';
```

---

## 🔄 Comparación con Otros Canales

| Canal | SessionId Format | API | Verificación |
|-------|-----------------|-----|--------------|
| Web | `web_${uuid}` | N/A | N/A |
| WhatsApp | `whatsapp_${phoneId}` | WhatsApp Cloud | GET /webhook |
| Instagram | `instagram_${senderId}` | Instagram Graph | GET /webhook |

**Todos usan el MISMO `HandleIncomingMessage`** ✅

---

## ✅ Checklist de Integración

- [x] InstagramService.js creado
- [x] Routes de Instagram creadas
- [x] Container actualizado
- [x] server.js actualizado
- [x] Variables .env agregadas
- [x] Health check agregado
- [x] Reutiliza HandleIncomingMessage
- [x] Logging implementado
- [x] Documentación completa

---

## 🎉 Estado

**✅ COMPLETAMENTE FUNCIONAL**

El sistema ahora soporta 3 canales:
- 🌐 Web Chat
- 💚 WhatsApp
- 📸 Instagram DM

Todos comparten:
- ✅ Mismo motor de IA
- ✅ Misma lógica de clasificación
- ✅ Misma base de datos
- ✅ Mismo sistema de seguimientos

---

**Creado:** Enero 2026  
**API Version:** Instagram Graph API v21.0  
**Documentación Meta:** https://developers.facebook.com/docs/messenger-platform

