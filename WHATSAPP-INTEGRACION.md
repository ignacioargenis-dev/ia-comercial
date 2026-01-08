# 📱 Integración WhatsApp Cloud API

## 📋 Descripción General

Sistema completo de integración con WhatsApp Cloud API que permite:
- ✅ Recibir mensajes entrantes por WhatsApp
- ✅ Enviar respuestas automáticas con IA
- ✅ Capturar leads desde WhatsApp
- ✅ Enviar seguimientos automáticos por WhatsApp
- ✅ Reutilizar toda la lógica existente del chat web

---

## 🏗️ Arquitectura de la Integración

```
WhatsApp Usuario
      ↓
Meta Cloud API (Webhook)
      ↓
/api/whatsapp/webhook (Endpoint)
      ↓
WhatsAppClient (Extrae mensaje)
      ↓
HandleIncomingMessage (Caso de uso genérico)
      ↓
ProcessChatMessage (Lógica existente)
      ↓
OpenAI + LeadClassifier
      ↓
Respuesta generada
      ↓
WhatsAppClient.sendTextMessage()
      ↓
Meta Cloud API
      ↓
WhatsApp Usuario
```

**Ventajas:**
- ✅ Misma lógica para web y WhatsApp
- ✅ Reutilización total del código
- ✅ Sin duplicación
- ✅ Mantenimiento simplificado

---

## 🚀 Configuración Paso a Paso

### Paso 1: Crear App en Meta Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com/)
2. Click en **"My Apps"** > **"Create App"**
3. Selecciona **"Business"** como tipo de app
4. Proporciona:
   - **Display Name**: Ej. "Mi Negocio Bot"
   - **Contact Email**: Tu email
   - **Business Account**: Selecciona o crea uno

5. Click en **"Create App"**

### Paso 2: Agregar WhatsApp Product

1. En el dashboard de tu app, busca **"WhatsApp"**
2. Click en **"Set up"**
3. Selecciona tu **Business Portfolio** (o crea uno)

### Paso 3: Configurar Número de Teléfono

Meta te proporciona un número de prueba temporal:

1. Ve a **WhatsApp > Getting Started**
2. Encontrarás:
   - **Phone Number ID**: (ej. `123456789012345`)
   - **WhatsApp Business Account ID**
   - **Temporary Access Token**: (válido 24 horas, solo para testing)

3. Para **testing**, puedes usar el número temporal
4. Para **producción**, debes agregar tu propio número:
   - Click en **"Add phone number"**
   - Verifica tu número con SMS/llamada
   - Acepta términos de WhatsApp Business

### Paso 4: Generar Token de Acceso Permanente

**Para desarrollo/testing (24 horas):**
- Usa el "Temporary Access Token" que Meta proporciona

**Para producción (permanente):**

1. Ve a **WhatsApp > Configuration**
2. Click en **"Create Permanent Token"** o:
3. Ve a **Settings > Basic**
4. Click en **"Generate Token"**
5. Selecciona permisos:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
6. Copia y guarda el token de forma segura

> ⚠️ **IMPORTANTE**: El token se muestra UNA SOLA VEZ. Si lo pierdes, deberás generar uno nuevo.

### Paso 5: Configurar Webhook

1. Ve a **WhatsApp > Configuration**
2. En **"Webhook"**, click en **"Edit"**
3. Proporciona:

   **Callback URL:**
   ```
   https://tu-servidor.com/api/whatsapp/webhook
   ```

   **Verify Token:** (inventa uno, ej. `mi_token_secreto_123`)
   ```
   mi_token_secreto_123
   ```

4. Click en **"Verify and Save"**

   > Meta enviará una solicitud GET a tu webhook para verificarlo.
   > Tu servidor debe responder con el `challenge` que Meta envía.

5. En **"Webhook fields"**, suscríbete a:
   - ✅ `messages` (obligatorio)
   - ✅ `message_status` (opcional, para ver estados de entrega)

### Paso 6: Configurar Variables de Entorno

Edita tu archivo `.env`:

```bash
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123

# Opcional: Especificar versión de la API (por defecto v21.0)
WHATSAPP_API_VERSION=v21.0
```

**Dónde encontrar cada valor:**

| Variable | Ubicación en Meta Developers |
|----------|------------------------------|
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp > Getting Started > Phone Number ID |
| `WHATSAPP_ACCESS_TOKEN` | Settings > Basic > Generate Token |
| `WHATSAPP_VERIFY_TOKEN` | El que TÚ inventaste en el paso 5 |

---

## 🧪 Pruebas Locales con ngrok

Para probar localmente antes de desplegar:

### 1. Instalar ngrok

```bash
# Descargar desde https://ngrok.com/download
# O instalar con npm:
npm install -g ngrok

# O con chocolatey (Windows):
choco install ngrok
```

### 2. Iniciar tu servidor local

```bash
npm start
# Servidor corriendo en http://localhost:3000
```

### 3. Exponer tu servidor con ngrok

```bash
ngrok http 3000
```

Verás algo como:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### 4. Configurar webhook en Meta

Usa la URL de ngrok:
```
https://abc123.ngrok-free.app/api/whatsapp/webhook
```

### 5. Probar enviando mensaje

1. Abre WhatsApp en tu móvil
2. Envía mensaje al número de prueba de Meta
3. Mira los logs en tu consola

**Logs esperados:**
```
📱 WhatsApp - Mensaje de Juan (56912345678): "Hola, necesito ayuda"
✅ Respuesta enviada a Juan (56912345678)
   📊 Lead - Estado: frio
```

---

## 🔧 Configuración Avanzada

### Agregar Número de Teléfono Propio

**Requisitos:**
- Tener un número que NO esté en WhatsApp personal
- Poder recibir SMS o llamada para verificación
- Número debe ser de negocio (no personal)

**Pasos:**
1. Ve a **WhatsApp > API Setup**
2. Click en **"Add Phone Number"**
3. Ingresa tu número
4. Verifica con código SMS/llamada
5. Acepta términos de WhatsApp Business
6. Espera aprobación (puede tardar 24h)

### Modo de Prueba vs Producción

**Modo de Prueba (Temporal):**
- ✅ Gratis e ilimitado
- ✅ Solo puedes enviar a números agregados manualmente
- ✅ Máximo 5 números de prueba
- ❌ No puedes recibir mensajes de usuarios externos

**Agregar números de prueba:**
1. WhatsApp > API Setup
2. "To" section
3. Click en "Add Number"
4. Agrega número de teléfono (ej. +56912345678)

**Modo de Producción:**
- ✅ Enviar/recibir de cualquier número
- ✅ Sin límites de números
- ❌ Requiere aprobación de cuenta de negocio
- ❌ Puede tener costos (primeras 1000 conversaciones/mes gratis)

### Límites y Cuotas

**Tier 1 (Inicial):**
- 1,000 conversaciones únicas/día
- Suficiente para empezar

**Tier 2-3:**
- Más conversaciones
- Requiere historial de uso sin problemas

**Primeras 1000 conversaciones/mes:**
- Gratis en todos los países
- Después se cobra según país

---

## 🔍 Verificar Configuración

### Desde la Terminal

```bash
# Verificar estado de configuración
curl http://localhost:3000/api/whatsapp/status
```

**Respuesta esperada (configurado):**
```json
{
  "success": true,
  "configured": true,
  "phoneNumber": "+1 555-0100",
  "verifiedName": "Mi Negocio",
  "quality": "GREEN",
  "message": "WhatsApp configurado correctamente ✅"
}
```

**Respuesta (no configurado):**
```json
{
  "success": true,
  "configured": false,
  "message": "WhatsApp no está configurado",
  "missing": [
    "WHATSAPP_PHONE_NUMBER_ID",
    "WHATSAPP_ACCESS_TOKEN"
  ]
}
```

### Enviar Mensaje de Prueba

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "56912345678",
    "message": "Hola, este es un mensaje de prueba"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [{"input": "56912345678", "wa_id": "56912345678"}],
    "messages": [{"id": "wamid.xxxxx"}]
  },
  "message": "Mensaje enviado a 56912345678"
}
```

---

## 📡 Endpoints de la API

### GET /api/whatsapp/webhook

**Propósito:** Verificación del webhook por Meta

**Query Parameters:**
- `hub.mode=subscribe`
- `hub.verify_token=tu_token`
- `hub.challenge=challenge_string`

**Respuesta:** Devuelve el `challenge` si el token es válido

### POST /api/whatsapp/webhook

**Propósito:** Recibir mensajes entrantes de WhatsApp

**Body (enviado por Meta):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "56912345678",
          "id": "wamid.xxxxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hola, necesito ayuda"
          }
        }],
        "contacts": [{
          "profile": {
            "name": "Juan Pérez"
          }
        }]
      }
    }]
  }]
}
```

**Respuesta:** `200 OK` (siempre, incluso si hay error)

### POST /api/whatsapp/send

**Propósito:** Enviar mensaje manual por WhatsApp (testing)

**Body:**
```json
{
  "to": "56912345678",
  "message": "Hola, este es un mensaje de prueba"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje enviado a 56912345678"
}
```

### GET /api/whatsapp/status

**Propósito:** Verificar estado de configuración

**Respuesta:**
```json
{
  "success": true,
  "configured": true,
  "phoneNumber": "+1 555-0100",
  "verifiedName": "Mi Negocio",
  "quality": "GREEN"
}
```

---

## 🔄 Flujo Completo de Conversación

### 1. Usuario envía mensaje desde WhatsApp

```
Usuario: "Hola, necesito instalar un aire acondicionado"
```

### 2. Meta envía webhook a tu servidor

```http
POST /api/whatsapp/webhook
{
  "object": "whatsapp_business_account",
  "entry": [...]
}
```

### 3. Tu servidor procesa el mensaje

```javascript
// Extrae mensaje
const { from, text } = extractMessageFromWebhook(entry);

// Procesa con IA
const result = await handleIncomingMessage.execute({
  message: text,
  sessionId: from,
  channel: 'whatsapp'
});

// Envía respuesta
await whatsappClient.sendTextMessage(from, result.reply);
```

### 4. Usuario recibe respuesta

```
Bot: "¡Hola! Soy el asistente de Climatización Express. 
Con gusto te ayudo con la instalación. ¿En qué comuna 
necesitas el servicio?"
```

### 5. Conversación continúa...

El sistema recuerda el contexto usando `sessionId` (número de teléfono).

---

## 🚨 Solución de Problemas

### Error: "Token de verificación inválido"

**Causa:** El `WHATSAPP_VERIFY_TOKEN` en tu `.env` no coincide con el que configuraste en Meta.

**Solución:**
```bash
# Verificar tu .env
WHATSAPP_VERIFY_TOKEN=debe_coincidir_con_meta
```

### Error: "Invalid OAuth access token"

**Causa:** El `WHATSAPP_ACCESS_TOKEN` expiró o es inválido.

**Solución:**
1. Ve a Meta Developers > Settings > Basic
2. Genera un nuevo token permanente
3. Actualiza tu `.env`
4. Reinicia el servidor

### Error: "Phone number not registered"

**Causa:** El número de teléfono no está verificado o registrado en WhatsApp Business.

**Solución:**
1. Ve a WhatsApp > API Setup
2. Verifica que tu número esté activo
3. Si es número de prueba, agrega el destinatario a la lista de prueba

### No recibo mensajes en el webhook

**Checklist:**
- [ ] ¿El webhook está configurado en Meta?
- [ ] ¿La URL del webhook es accesible públicamente?
- [ ] ¿Estás suscrito al campo "messages" en el webhook?
- [ ] ¿Tu servidor está corriendo?
- [ ] ¿El token de verificación coincide?

**Debug:**
```bash
# Ver logs del servidor
npm start

# Enviar mensaje desde WhatsApp
# Deberías ver:
📱 WhatsApp - Mensaje de ...
```

### Mensajes no se envían

**Checklist:**
- [ ] ¿`WHATSAPP_ACCESS_TOKEN` es válido?
- [ ] ¿`WHATSAPP_PHONE_NUMBER_ID` es correcto?
- [ ] ¿El número destino está en formato correcto? (sin + ni espacios)
- [ ] ¿El número está en la lista de prueba? (si estás en modo desarrollo)

**Debug:**
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"to":"56912345678","message":"Test"}'
```

### Error 503: "WhatsApp no está configurado"

**Causa:** Faltan variables de entorno.

**Solución:**
```bash
# Verificar que existan en .env:
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
```

---

## 📊 Monitoreo y Logs

### Logs en Consola

```
📱 WhatsApp - Mensaje de Juan Pérez (56912345678): "Hola"
   📨 Mensaje entrante [whatsapp] - SessionId: 56912345678
   ✅ Respuesta generada [whatsapp]
   ✅ Mensaje WhatsApp enviado a 56912345678
   📊 Lead - Estado: frio
```

### Ver Mensajes en Meta

1. Ve a **WhatsApp > Manager**
2. Click en **"Phone Numbers"**
3. Selecciona tu número
4. Ve a **"Insights"** para ver métricas:
   - Mensajes enviados
   - Mensajes recibidos
   - Conversaciones iniciadas
   - Tasa de entrega

---

## 💰 Costos y Facturación

### Modelo de Precios

**Conversaciones Business-Initiated:**
- Cuando TÚ inicias la conversación (seguimientos)
- Precio según país (ej. Chile: ~$0.07 USD/conversación)

**Conversaciones User-Initiated:**
- Cuando el USUARIO te escribe primero
- GRATIS hasta 1000/mes
- Después: precio según país

**Ventana de 24 horas:**
- Una "conversación" = ventana de 24h desde el último mensaje
- Múltiples mensajes en 24h = 1 conversación

### Optimizar Costos

✅ **Buenas prácticas:**
- Responde rápido (dentro de 24h = 1 conversación)
- Resuelve en una conversación
- Usa templates pre-aprobados para seguimientos

❌ **Evitar:**
- Enviar múltiples seguimientos en días diferentes
- Iniciar conversaciones innecesarias
- Enviar mensajes fuera de la ventana de 24h

---

## 🔐 Seguridad

### Proteger Token de Acceso

```bash
# NUNCA commitar .env al repositorio
echo ".env" >> .gitignore

# Rotar tokens periódicamente
# (cada 3-6 meses)
```

### Validar Webhook de Meta

El código ya incluye validación del `verify_token` y `hub.signature` (opcional).

### Límites de Rate

Meta tiene límites:
- **Tier 1**: 1,000 conversaciones/día
- **Tier 2**: 10,000 conversaciones/día
- **Tier 3**: 100,000 conversaciones/día

El sistema respeta estos límites automáticamente.

---

## 🎯 Siguientes Pasos

### Modo Desarrollo → Producción

1. **Agregar número propio**
   - WhatsApp > API Setup > Add Phone Number
   - Verificar con SMS
   - Esperar aprobación

2. **Solicitar revisión de negocio**
   - Business Manager > Business Settings
   - Completar información de negocio
   - Esperar verificación (1-3 días)

3. **Configurar plantillas de mensajes**
   - Para enviar mensajes iniciados por negocio
   - Deben ser pre-aprobados por Meta

4. **Actualizar servidor a producción**
   - Deploy en servidor real (no ngrok)
   - Configurar HTTPS
   - Actualizar webhook URL en Meta

### Funciones Avanzadas (Futuro)

- [ ] Envío de imágenes
- [ ] Botones interactivos
- [ ] Listas de opciones
- [ ] Ubicaciones
- [ ] Templates de mensajes
- [ ] Análisis de métricas avanzado

---

## 📚 Recursos Adicionales

**Documentación Oficial:**
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Getting Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

**Herramientas:**
- [Postman Collection](https://www.postman.com/meta/workspace/whatsapp-business-platform/collection/635739564-f8e66a9f-c8e2-4bc5-9d36-6c28a3e05ad8)
- [Webhook Tester](https://webhook.site/)
- [ngrok](https://ngrok.com/)

**Soporte:**
- [Meta for Developers Community](https://developers.facebook.com/community)
- [WhatsApp Business API Support](https://developers.facebook.com/support)

---

## ✅ Checklist de Configuración

- [ ] App creada en Meta Developers
- [ ] WhatsApp Product agregado
- [ ] Número de teléfono verificado
- [ ] Token de acceso generado
- [ ] Webhook configurado y verificado
- [ ] Variables de entorno en `.env`
- [ ] Servidor corriendo
- [ ] Test de envío exitoso
- [ ] Test de recepción exitoso
- [ ] Números de prueba agregados (si aplica)
- [ ] Logs funcionando correctamente

---

**🎉 ¡Integración de WhatsApp Completada!**

*Sistema listo para capturar leads desde WhatsApp* 📱

