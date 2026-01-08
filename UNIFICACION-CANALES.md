# 🔄 Unificación de Canales - Interfaz Multi-Canal

## ✅ Refactor Completado

Todos los canales (Web, Instagram, WhatsApp, Simulación) ahora utilizan una **interfaz unificada** para el procesamiento de mensajes, garantizando consistencia en clasificación, guardado y notificaciones.

---

## 🎯 Objetivo Alcanzado

**Antes:** Cada canal procesaba mensajes de forma diferente
**Ahora:** Todos los canales usan la misma función central: `HandleIncomingMessage.execute()`

---

## 📐 Arquitectura Unificada

### Función Central

```javascript
HandleIncomingMessage.execute({
  message: string,      // Texto del mensaje (requerido)
  sessionId: string,    // ID de sesión (requerido)
  channel: string,      // 'web' | 'instagram' | 'whatsapp' (requerido)
  senderId: string,     // ID del usuario en el canal (opcional)
  metadata: object      // Metadata adicional (opcional)
})
```

### Flujo Unificado

```
┌─────────────────────────────────────────────────────────┐
│                  ENTRADA DE MENSAJES                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🌐 Web Chat    📸 Instagram    💚 WhatsApp    🎭 Demo │
│       │              │              │              │    │
│       └──────────────┴──────────────┴──────────────┘    │
│                         │                                │
│                         ▼                                │
│       ┌──────────────────────────────────────┐          │
│       │   HandleIncomingMessage.execute()    │          │
│       │   (INTERFAZ UNIFICADA)                │          │
│       └──────────────────────────────────────┘          │
│                         │                                │
│                         ▼                                │
│       ┌──────────────────────────────────────┐          │
│       │  1. [CANAL] Mensaje recibido (LOG)   │          │
│       │  2. Validación de entrada            │          │
│       │  3. Procesamiento con IA             │          │
│       │  4. Clasificación de lead            │          │
│       │  5. Guardado en BD (con canal)       │          │
│       │  6. Notificaciones (si caliente)     │          │
│       │  7. [CANAL] Respuesta enviada (LOG)  │          │
│       └──────────────────────────────────────┘          │
│                         │                                │
│                         ▼                                │
│                   RESPUESTA                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementación

### 1. Función Central: HandleIncomingMessage

**Ubicación:** `src/application/use-cases/HandleIncomingMessage.js`

**Características:**
- Interfaz unificada para todos los canales
- Logging estructurado por canal: `[WEB]`, `[INSTAGRAM]`, `[WHATSAPP]`
- Validación consistente
- Manejo de errores robusto
- Metadata de duración y timestamp

**Ejemplo:**

```javascript
const result = await handleIncomingMessage.execute({
  message: 'Hola, necesito instalación',
  sessionId: 'instagram_user123',
  channel: 'instagram',
  senderId: 'user123',
  metadata: {
    messageId: 'mid.xxx',
    timestamp: 1234567890
  }
});

// Resultado unificado:
{
  success: true,
  respuesta: "¡Hola! Soy el asistente virtual...",
  lead: { id: 42, estado: 'tibio', canal: 'instagram', ... },
  channel: 'instagram',
  sessionId: 'instagram_user123',
  conversacionCompleta: false,
  leadGuardado: false,
  metadata: {
    duration: '234ms',
    timestamp: '2026-01-08T14:00:00.000Z'
  }
}
```

### 2. Refactor de Endpoints

#### Web Chat (`/api/chat`)

**Antes:**
```javascript
const processChatMessage = container.getProcessChatMessageUseCase();
const resultado = await processChatMessage.execute({ ... });
```

**Ahora:**
```javascript
const handleIncomingMessage = container.getHandleIncomingMessageUseCase();
const resultado = await handleIncomingMessage.execute({
  message,
  sessionId,
  channel: 'web',
  senderId: sessionId,
  metadata: { userAgent, ip }
});
```

#### Instagram DM (`/api/instagram/webhook`)

**Antes:**
```javascript
const result = await handleIncomingMessage.execute({
  message: messageText,
  sessionId: sessionId,
  channel: 'instagram',
  metadata: { senderId, ... }
});
```

**Ahora:**
```javascript
const result = await handleIncomingMessage.execute({
  message: messageText,
  sessionId: sessionId,
  channel: 'instagram',
  senderId: senderId,  // ← Parámetro de primer nivel
  metadata: { recipientId, messageId, timestamp }
});
```

#### WhatsApp (`/api/whatsapp/webhook`)

**Antes:**
```javascript
const result = await handleIncomingMessage.execute({
  message: text,
  sessionId: from,
  channel: 'whatsapp',
  metadata: { name, messageId, timestamp }
});
```

**Ahora:**
```javascript
const result = await handleIncomingMessage.execute({
  message: text,
  sessionId: `whatsapp_${from}`,  // ← Prefijo para evitar colisiones
  channel: 'whatsapp',
  senderId: from,  // ← Parámetro de primer nivel
  metadata: { name, messageId, timestamp }
});
```

#### Simulación (`/api/simulate/instagram`)

**Ya actualizado:**
```javascript
const result = await handleIncomingMessage.execute({
  message: message.trim(),
  sessionId: `instagram_${userId}`,
  channel: 'instagram',
  senderId: userId,
  metadata: { platform: 'instagram', simulation: true }
});
```

---

## 📊 Logging Estructurado

### Formato de Logs

Todos los canales ahora usan el mismo formato:

**Entrada:**
```
📸 [INSTAGRAM] Mensaje recibido
   channel: instagram
   sessionId: instagram_user123
   senderId: user123
   messageLength: 45
   preview: Hola, necesito información sobre instalación
```

**Salida:**
```
📸 [INSTAGRAM] Respuesta enviada
   channel: instagram
   sessionId: instagram_user123
   senderId: user123
   responseLength: 85
   leadId: 42
   leadState: tibio
   leadCompleto: false
   conversacionCompleta: false
   leadGuardado: false
   duration: 234ms
```

**Error:**
```
📸 [INSTAGRAM] Error al procesar mensaje
   channel: instagram
   sessionId: instagram_user123
   senderId: user123
   error: OpenAI timeout
   errorType: ExternalServiceError
   duration: 30000ms
```

### Íconos por Canal

| Canal | Ícono | Logs |
|-------|-------|------|
| Web | 🌐 | `[WEB] Mensaje recibido` |
| Instagram | 📸 | `[INSTAGRAM] Mensaje recibido` |
| WhatsApp | 💚 | `[WHATSAPP] Mensaje recibido` |
| Simulación | 🎭 | `[SIMULATE] Mensaje recibido` |

---

## ✅ Garantías de Consistencia

### 1. Clasificación Idéntica

Todos los canales usan el mismo `LeadClassifier`:

```javascript
// ANTES: Posible inconsistencia entre canales

// AHORA: Mismo clasificador para todos
LeadClassifier.classify(lead, conversationContext)
  → 'frio' | 'tibio' | 'caliente'
```

### 2. Guardado Idéntico

Todos los canales guardan leads con el mismo repositorio:

```javascript
// Todos usan:
leadRepository.save(lead)

// Lead incluye canal:
{
  nombre: "María",
  telefono: "+56912345678",
  canal: "instagram"  // ← Siempre presente
}
```

### 3. Notificaciones Idénticas

Todos los canales disparan notificaciones de la misma forma:

```javascript
// Si estado === 'caliente':
notificationService.notificarLeadCaliente(lead)

// Email incluye canal:
Asunto: 🔥 Lead caliente desde Instagram - María
Canal: 📸 Instagram
```

---

## 🧪 Testing

### Test de Consistencia

**Objetivo:** Verificar que el mismo mensaje produce el mismo resultado en todos los canales.

```javascript
// Mensaje de prueba
const mensaje = "María González, +56912345678, necesito instalación urgente en Las Condes";

// Web
const resultWeb = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: mensaje, sessionId: 'test_web' })
});

// Instagram
const resultInstagram = await fetch('/api/simulate/instagram', {
  method: 'POST',
  body: JSON.stringify({ message: mensaje, senderId: 'test_ig' })
});

// WhatsApp
const resultWhatsApp = await fetch('/api/simulate/whatsapp', {
  method: 'POST',
  body: JSON.stringify({ message: mensaje, phoneNumber: 'test_wa' })
});

// Verificar:
// 1. Clasificación idéntica (caliente)
// 2. Lead guardado con datos idénticos
// 3. Notificación enviada en todos los casos
// 4. Solo cambia el campo 'canal'
```

---

## 📈 Beneficios

### Para el Sistema

**Antes:**
- Duplicación de código
- Inconsistencias entre canales
- Difícil de mantener
- Logs diferentes

**Ahora:**
- ✅ Código centralizado
- ✅ Consistencia garantizada
- ✅ Fácil mantenimiento
- ✅ Logs unificados

### Para el Negocio

**Antes:**
- Lead de Instagram podría clasificarse diferente que Web
- Notificaciones inconsistentes
- Difícil depurar problemas

**Ahora:**
- ✅ Misma experiencia en todos los canales
- ✅ Notificaciones consistentes
- ✅ Logs completos y trazables

### Para el Desarrollo

**Antes:**
- Cambios en lógica requieren actualizar múltiples archivos
- Testing complejo
- Bugs difíciles de reproducir

**Ahora:**
- ✅ Un solo punto de entrada
- ✅ Testing simplificado
- ✅ Bugs fáciles de depurar

---

## 🎯 Ejemplo Completo: Instagram

### Flujo Completo

```javascript
// 1. Usuario envía mensaje por Instagram
// Meta envía webhook:
{
  "object": "instagram",
  "entry": [{
    "messaging": [{
      "sender": {"id": "user123"},
      "message": {"text": "Hola, necesito instalación urgente"}
    }]
  }]
}

// 2. Instagram Webhook lo procesa:
const result = await handleIncomingMessage.execute({
  message: "Hola, necesito instalación urgente",
  sessionId: "instagram_user123",
  channel: "instagram",
  senderId: "user123",
  metadata: {
    recipientId: "page456",
    messageId: "mid.xxx",
    timestamp: 1234567890
  }
});

// 3. Logs generados:
📸 [INSTAGRAM] Mensaje recibido
   channel: instagram
   sessionId: instagram_user123
   senderId: user123
   messageLength: 35
   preview: Hola, necesito instalación urgente

📸 [INSTAGRAM] Procesando con IA...
   channel: instagram
   sessionId: instagram_user123

📸 [INSTAGRAM] Respuesta enviada
   channel: instagram
   sessionId: instagram_user123
   senderId: user123
   responseLength: 120
   leadId: null
   leadState: frio
   duration: 1234ms

// 4. Lead guardado en BD:
{
  id: null,
  nombre: null,
  telefono: null,
  servicio: "instalación",
  comuna: null,
  estado: "frio",
  canal: "instagram"  // ← CORRECTO
}

// 5. Respuesta enviada a Instagram:
await instagramService.sendMessage(
  "user123",
  "¡Hola! Soy el asistente de Climatización Express..."
);
```

---

## 📝 Checklist de Implementación

**Refactor del Core:**
- [x] Mejorar HandleIncomingMessage con logging estructurado
- [x] Agregar parámetro `senderId`
- [x] Agregar íconos por canal
- [x] Logs de entrada: `[CANAL] Mensaje recibido`
- [x] Logs de salida: `[CANAL] Respuesta enviada`
- [x] Logs de error: `[CANAL] Error al procesar mensaje`

**Refactor de Endpoints:**
- [x] Web Chat (`/api/chat`)
- [x] Instagram (`/api/instagram/webhook`)
- [x] WhatsApp (`/api/whatsapp/webhook`)
- [x] Simulación Instagram (`/api/simulate/instagram`)
- [x] Simulación WhatsApp (`/api/simulate/whatsapp`)
- [x] Simulación Web (`/api/simulate/web`)

**Garantías:**
- [x] Clasificación idéntica entre canales
- [x] Guardado idéntico entre canales
- [x] Notificaciones idénticas entre canales
- [x] Logs consistentes entre canales

**Documentación:**
- [x] Guía de arquitectura unificada
- [x] Ejemplo completo de Instagram
- [x] Checklist de implementación

---

## 🎉 Resultado Final

**Sistema completamente unificado:**

✅ Una sola interfaz para todos los canales  
✅ Logs estructurados y consistentes  
✅ Clasificación garantizada idéntica  
✅ Guardado garantizado idéntico  
✅ Notificaciones garantizadas idénticas  
✅ Fácil de mantener y extender  
✅ Testing simplificado  
✅ Debugging facilitado  

**Preparado para agregar nuevos canales fácilmente 🚀**

---

**Archivos modificados:**
- `src/application/use-cases/HandleIncomingMessage.js` (Interfaz unificada)
- `src/infrastructure/http/routes/chat.js` (Usa interfaz unificada)
- `src/infrastructure/http/routes/instagram.js` (Usa interfaz unificada)
- `src/infrastructure/http/routes/whatsapp.js` (Usa interfaz unificada)
- `src/infrastructure/http/routes/simulate.js` (Usa interfaz unificada)

**Sin errores de lint** ✅

