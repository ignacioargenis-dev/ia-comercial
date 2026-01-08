# 🚀 Instagram Messaging API - Configuración para Producción

## ✅ Implementación Production-Ready Completada

Sistema de webhooks de Instagram robusto, seguro y preparado para producción con validaciones exhaustivas, sanitización de mensajes y manejo de múltiples eventos.

---

## 📋 Checklist de Producción

### Código
- [x] Validación completa del webhook verification
- [x] Sanitización de mensajes entrantes
- [x] Manejo de múltiples eventos en un payload
- [x] Manejo de diferentes tipos de mensajes
- [x] Respuesta rápida a Meta (< 5 segundos)
- [x] Procesamiento asíncrono de eventos
- [x] Manejo robusto de errores
- [x] Logging estructurado
- [x] Documentación técnica en código

### Configuración
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en Meta Developers
- [ ] Permisos aprobados por Meta
- [ ] SSL/HTTPS habilitado
- [ ] Dominio público accesible

---

## 🔧 Configuración en Meta Developers

### 1. Crear App de Instagram Messaging

**URL:** https://developers.facebook.com/apps

1. Click en "Create App" (Crear aplicación)
2. Seleccionar tipo: **Business** (Empresa)
3. Agregar producto: **Instagram** → Messenger API for Instagram
4. Completar información básica de la app

### 2. Generar Page Access Token

1. Ir a **Instagram → Settings** en el panel izquierdo
2. En "Instagram Accounts", conectar tu cuenta de Instagram Business
   - ⚠️ Debe ser una cuenta Business o Creator, no Personal
3. Click en "Generate Token"
4. Seleccionar permisos:
   - ✅ `instagram_basic` - Acceso básico
   - ✅ `instagram_manage_messages` - Enviar y recibir mensajes
   - ✅ `pages_manage_metadata` - Metadata de página
5. Copiar el token generado
6. Agregarlo a `.env`:
   ```env
   IG_PAGE_TOKEN=EAAxxxxxxxxxxxxx
   ```

### 3. Configurar Webhook

#### En tu servidor:

1. Asegurarse de que tu servidor esté público y con HTTPS
   - ⚠️ Meta **requiere** HTTPS (no acepta HTTP)
   - Usar dominio público o servicios como ngrok para desarrollo

2. Definir un token de verificación único en `.env`:
   ```env
   IG_VERIFY_TOKEN=mi_token_secreto_12345
   ```

#### En Meta Developers:

1. Ir a **Instagram → Configuration** (Configuración)
2. En "Webhooks", click en **Edit**
3. Configurar:
   - **Callback URL:** `https://tu-dominio.com/api/instagram/webhook`
   - **Verify Token:** El mismo valor que pusiste en `IG_VERIFY_TOKEN`
4. Click en **Verify and Save** (Verificar y guardar)
   - Meta hará una petición GET a tu endpoint
   - Tu servidor debe responder con el `challenge`
   - Si falla, revisar logs del servidor
5. Seleccionar suscripciones:
   - ✅ `messages` - Mensajes entrantes
   - ✅ `messaging_postbacks` - Respuestas de botones (opcional)

### 4. Probar el Webhook

1. En Meta Developers, en "Webhooks", click en **Test**
2. Seleccionar evento: `messages`
3. Click en **Send to My Server**
4. Verificar que tu servidor responda 200 OK
5. Revisar logs para confirmar que el evento fue procesado

### 5. Pasar a Producción

#### App Review (Revisión de Meta)

Para usar en producción con usuarios reales, necesitas App Review:

1. Ir a **App Review → Permissions and Features**
2. Solicitar:
   - `instagram_manage_messages` - REQUERIDO
   - `instagram_basic` - REQUERIDO
3. Completar el formulario:
   - Describir el uso de la app
   - Subir video demo (screencast de 1-2 minutos)
   - Explicar el flujo de usuario
4. Enviar para revisión
5. Esperar aprobación de Meta (1-14 días)

⚠️ **Mientras no esté aprobado:**
- Solo funcionará con usuarios que tengas agregados como "Testers" en la app

#### Modo Development vs Production

**Development Mode:**
- Solo funciona con cuentas de prueba
- Agregar testers en: Settings → Roles → Testers

**Production Mode:**
- Requiere App Review aprobado
- Funciona con cualquier usuario de Instagram
- Sujeto a rate limits más estrictos

---

## 🔐 Validaciones de Seguridad Implementadas

### 1. Webhook Verification (GET)

```javascript
✅ Verificar que IG_VERIFY_TOKEN esté configurado
✅ Validar presencia de hub.mode, hub.verify_token, hub.challenge
✅ Verificar que hub.mode === 'subscribe'
✅ Comparar hub.verify_token con IG_VERIFY_TOKEN
✅ Retornar challenge solo si todo es válido
```

**Respuestas:**
- `200 OK` + challenge → Verificación exitosa
- `400 Bad Request` → Parámetros faltantes
- `403 Forbidden` → Token inválido o modo incorrecto
- `500 Internal Server Error` → Token no configurado en servidor

### 2. Webhook Events (POST)

```javascript
✅ Responder 200 OK inmediatamente (< 5 segundos)
✅ Validar estructura del payload (object !== null)
✅ Verificar que object === 'instagram'
✅ Validar que entry sea un array con elementos
✅ Sanitizar datos antes de procesar
✅ Manejar múltiples eventos con Promise.allSettled
✅ No fallar todo si un mensaje individual falla
```

### 3. Sanitización de Mensajes

```javascript
✅ Validar que messaging sea un objeto
✅ Validar que senderId exista y sea string
✅ Filtrar mensajes sin texto
✅ Eliminar caracteres de control
✅ Normalizar espacios en blanco
✅ Truncar mensajes muy largos (> 2000 caracteres)
✅ Eliminar surrogates huérfanos (emojis malformados)
```

---

## 🎯 Tipos de Eventos Manejados

### ✅ Soportados

| Tipo | Descripción | Acción |
|------|-------------|--------|
| **Message (text)** | Mensaje de texto | Procesar con IA y responder |
| **Message (attachments)** | Imagen/video/archivo | Notificar que solo soportamos texto |
| **Postback** | Respuesta de botón | Ignorar (log) |
| **Read** | Usuario leyó mensaje | Ignorar (log) |
| **Delivery** | Mensaje entregado | Ignorar (log) |

### 📋 Flujo de Procesamiento

```
Usuario Instagram → Envía mensaje
    ↓
Meta (Instagram Graph API)
    ↓
POST /api/instagram/webhook
    ↓
Responder 200 OK inmediatamente ⚡
    ↓
Validar payload ✓
    ↓
¿object === 'instagram'? → No → Ignorar
    ↓ Sí
¿Tiene entries? → No → Ignorar
    ↓ Sí
Para cada entry.messaging:
    ↓
Validar senderId ✓
    ↓
¿Tiene message.text? → No → Notificar no soportado
    ↓ Sí
Sanitizar texto ✓
    ↓
Procesar con IA (HandleIncomingMessage)
    ↓
Generar respuesta
    ↓
Enviar respuesta por Instagram API
    ↓
✅ Completado
```

---

## 📊 Manejo de Errores

### Errores de Validación

```javascript
// Sin senderId
→ Log warning, ignorar mensaje

// Sin texto
→ Log debug, ignorar mensaje

// Payload inválido
→ Log warning, ya respondimos 200 OK

// Texto muy largo
→ Log warning, truncar a 2000 caracteres, procesar
```

### Errores de Procesamiento

```javascript
// Error en IA (OpenAI timeout, etc.)
→ Log error completo
→ Enviar mensaje al usuario: "Intenta nuevamente en unos momentos"
→ No fallar otros mensajes del mismo payload

// Error al enviar respuesta
→ Log error
→ Usuario no recibe respuesta
→ Puede reintentar

// Error crítico (servidor fuera de servicio)
→ Meta reintentará automáticamente
→ Revisar logs del servidor
```

### Logging Estructurado

Todos los eventos se registran con contexto completo:

```javascript
logger.info('💬 Instagram text message received', {
  senderId: 'xxx',
  messageId: 'mid.xxx',
  textLength: 45,
  preview: 'Hola, necesito información sobre...'
});

logger.info('✅ Instagram response sent successfully', {
  senderId: 'xxx',
  messageId: 'mid.xxx',
  leadId: 123,
  leadState: 'caliente',
  responseLength: 85
});

logger.error('❌ Error processing Instagram message', {
  senderId: 'xxx',
  messageId: 'mid.xxx',
  error: 'OpenAI timeout',
  errorType: 'ExternalServiceError',
  stack: '...'
});
```

---

## 🧪 Testing en Producción

### 1. Test Manual (Usuario Real)

1. Desde tu cuenta personal de Instagram
2. Enviar mensaje directo (DM) a tu cuenta de negocio
3. Verificar respuesta del bot

**Ejemplo:**
```
Usuario: Hola
Bot: ¡Hola! Soy el asistente virtual de [Negocio]. ¿En qué puedo ayudarte?

Usuario: Necesito información sobre instalación
Bot: Perfecto. ¿Cuál es tu nombre?
```

### 2. Test con Meta Test Button

1. En Meta Developers → Webhooks → Test
2. Enviar evento de prueba
3. Verificar logs del servidor

### 3. Verificar Logs

```bash
# Logs de verificación (GET)
📸 Instagram webhook verification attempt
✅ Instagram webhook verified successfully

# Logs de mensajes (POST)
📸 Instagram webhook received (entries: 1)
💬 Instagram text message received
✅ Instagram response sent successfully
📸 Instagram webhook processing completed (total: 1, successful: 1, failed: 0)
```

### 4. Endpoints de Health Check

```bash
# Verificar que Instagram esté configurado
curl http://localhost:3000/health/detailed

# Respuesta esperada:
{
  "status": "healthy",
  "components": {
    "instagram": {
      "status": "healthy",
      "message": "Instagram configured"
    }
  }
}
```

---

## ⚠️ Limitaciones de la API

### Rate Limits

| Límite | Valor |
|--------|-------|
| Llamadas por hora (por usuario) | 200 |
| Llamadas por día (por app) | 4,800 |
| Mensajes por usuario (24h) | Ilimitado dentro de ventana |

**Ventana de Mensajería:**
- Tienes 24 horas para responder después de que el usuario te contacta
- Después de 24 horas, no puedes iniciar conversación
- El usuario puede iniciar conversación nuevamente

### Restricciones de Contenido

**✅ Permitido:**
- Mensajes de texto
- Emojis
- Respuestas a mensajes específicos (reply)

**❌ No Permitido (sin permisos adicionales):**
- Imágenes
- Videos
- Audios
- Archivos
- Botones interactivos
- Templates

### Tipos de Cuentas

**✅ Funciona:**
- Instagram Business Account
- Instagram Creator Account

**❌ No Funciona:**
- Instagram Personal Account

---

## 🔮 Extensibilidad

### Agregar Soporte para Imágenes

```javascript
// En handleInstagramMessage()
if (message && message.attachments) {
  for (const attachment of message.attachments) {
    if (attachment.type === 'image') {
      const imageUrl = attachment.payload.url;
      // TODO: Procesar imagen (OCR, análisis, etc.)
    }
  }
}
```

### Agregar Botones Interactivos

```javascript
// En InstagramService.js
async sendMessageWithButtons(recipientId, text, buttons) {
  const payload = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: text,
          buttons: buttons
        }
      }
    }
  };
  // Enviar a Graph API
}
```

---

## 📚 Referencias

### Documentación Oficial

- **Instagram Graph API:** https://developers.facebook.com/docs/instagram-api
- **Messenger Platform (Instagram):** https://developers.facebook.com/docs/messenger-platform
- **Webhooks Reference:** https://developers.facebook.com/docs/graph-api/webhooks/getting-started
- **Permissions Reference:** https://developers.facebook.com/docs/permissions/reference

### Herramientas de Desarrollo

- **Meta Developers Console:** https://developers.facebook.com/apps
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Webhook Tester:** https://webhook.site
- **ngrok (túnel HTTPS):** https://ngrok.com

### Comunidad

- **Meta Developer Community:** https://developers.facebook.com/community
- **Stack Overflow:** Tag `instagram-graph-api`
- **Meta Developer Support:** https://developers.facebook.com/support

---

## ✅ Estado de Implementación

| Componente | Estado | Notas |
|------------|--------|-------|
| **Webhook Verification** | ✅ Production Ready | Validaciones completas |
| **Message Reception** | ✅ Production Ready | Sanitización robusta |
| **Text Messages** | ✅ Soportado | Flujo completo |
| **Attachments** | ⚠️ Notificación | Solo notifica, no procesa |
| **Error Handling** | ✅ Robusto | Manejo exhaustivo |
| **Logging** | ✅ Completo | Trazabilidad completa |
| **Security** | ✅ Seguro | Validaciones de entrada |
| **Documentation** | ✅ Completa | Comentarios en código |
| **Multiple Events** | ✅ Soportado | Promise.allSettled |
| **Rate Limiting** | ⚠️ Básico | No hay retry automático |

---

## 🚀 Checklist de Deployment

### Pre-deployment

- [ ] Variables de entorno configuradas en servidor
- [ ] Certificado SSL instalado y válido
- [ ] Dominio público accesible desde Internet
- [ ] Servidor corriendo en puerto correcto
- [ ] Logs configurados y rotando

### Deployment

- [ ] Código desplegado en servidor
- [ ] Servidor reiniciado con nueva configuración
- [ ] Health check pasa correctamente
- [ ] Webhook configurado en Meta Developers
- [ ] Verificación de webhook exitosa

### Post-deployment

- [ ] Test manual con mensaje real
- [ ] Verificar respuesta del bot
- [ ] Revisar logs de producción
- [ ] Monitorear errores primeras 24 horas
- [ ] Configurar alertas de errores

---

## 🎉 Resultado Final

**Sistema de Instagram Messaging completamente funcional y production-ready:**

✅ Validaciones exhaustivas de seguridad  
✅ Sanitización robusta de mensajes  
✅ Manejo de múltiples eventos simultáneos  
✅ Respuesta rápida a Meta (< 5 segundos)  
✅ Procesamiento asíncrono escalable  
✅ Logging completo para debugging  
✅ Manejo de errores sin fallos en cascada  
✅ Documentación técnica en código  
✅ Soporte para diferentes tipos de mensajes  
✅ Notificación de eventos no soportados  

**Listo para recibir miles de mensajes diarios con alta confiabilidad 🚀**

---

**Última actualización:** Enero 2026  
**Versión API de Meta:** v19.0  
**Estado:** Production Ready ✅

