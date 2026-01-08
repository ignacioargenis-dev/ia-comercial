# 📸 Enlaces Directos a Instagram en Dashboard

## ✅ Implementación Completada

Cuando un lead proviene de Instagram, el dashboard ahora muestra un enlace clickeable que abre directamente la conversación con ese cliente en Instagram.

---

## 🎯 Funcionalidad

### Antes
```
Canal: 📸 Instagram (texto simple)
```

### Después
```
Canal: 📸 Instagram (enlace clickeable)
       ↓ (click)
       Abre Instagram Direct con el cliente
```

---

## 🔧 Implementación Técnica

### 1. Base de Datos

**Nueva columna:** `instagram_id`

```sql
ALTER TABLE leads ADD COLUMN instagram_id TEXT
```

**Propósito:** Guardar el Instagram User ID (senderId) del cliente para crear enlaces directos.

**Migración automática:** Se ejecuta al reiniciar el servidor.

### 2. Entidad Lead

**Nuevo campo:**
```javascript
class Lead {
  constructor(data) {
    // ... otros campos
    this.instagram_id = data.instagram_id || null;
  }
}
```

### 3. Captura del Instagram ID

**En `ProcessChatMessage.js`:**

```javascript
if (finalLead.estaCompleto() && (!conversation || !conversation.lead_id)) {
  // Asignar canal
  finalLead.canal = channel;
  
  // Si es Instagram, guardar el senderId
  if (channel === 'instagram' && metadata?.senderId) {
    finalLead.instagram_id = metadata.senderId; // ← NUEVO
  }
  
  savedLead = this.leadRepository.save(finalLead);
}
```

**Flujo de captura:**
```
Usuario envía DM en Instagram
    ↓
Webhook recibe mensaje con sender.id
    ↓
HandleIncomingMessageUseCase recibe senderId
    ↓
ProcessChatMessage guarda senderId como instagram_id
    ↓
Lead guardado con instagram_id poblado
```

### 4. API de Leads

**Campo agregado a la respuesta:**

```javascript
const leadsJSON = leads.map(lead => ({
  // ... otros campos
  canal: lead.canal,
  instagram_id: lead.instagram_id, // ← NUEVO
  // ...
}));
```

### 5. Dashboard

**Nueva función `formatCanalLink`:**

```javascript
function formatCanalLink(lead) {
  const canal = lead.canal || 'web';
  
  // Si es Instagram y tiene instagram_id
  if (canal === 'instagram' && lead.instagram_id) {
    const instagramUrl = `https://www.instagram.com/direct/t/${lead.instagram_id}`;
    return `<a href="${instagramUrl}" target="_blank" class="instagram-link">
      📸 Instagram
    </a>`;
  }
  
  // Si es WhatsApp
  if (canal === 'whatsapp') {
    return '💚 WhatsApp';
  }
  
  // Web u otros
  return formatCanal(canal);
}
```

**Estilos CSS:**

```css
.instagram-link {
  color: white !important;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(225, 48, 108, 0.3);
}

.instagram-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(225, 48, 108, 0.5);
}
```

---

## 🌐 URL de Instagram Direct

### Formato de URL
```
https://www.instagram.com/direct/t/{USER_ID}
```

**Donde `{USER_ID}` es el Instagram User ID (senderId) del cliente.**

### Ejemplo
Si el `instagram_id` es `123456789`:
```
https://www.instagram.com/direct/t/123456789
```

**Comportamiento:**
- Se abre Instagram Web (o app si está instalada)
- Navegación directa a la conversación con ese usuario
- Historial completo de mensajes visible

---

## 📊 Ejemplo Visual

### Tabla del Dashboard

| Nombre | Teléfono | Servicio | Comuna | Canal | Estado | Contactado |
|--------|----------|----------|--------|-------|--------|------------|
| Juan P. | +56912... | Instalación | Las Condes | **[📸 Instagram](#)** | 🔥 caliente | ⏳ Pendiente |
| María G. | +56987... | Mantenimiento | Providencia | 🌐 Web | 🌡️ tibio | ✅ Contactado |

**Nota:** El enlace de Instagram es clickeable y tiene estilo visual distintivo (gradiente rosa).

---

## 🔄 Flujo Completo

```
1. Cliente envía DM en Instagram
   "Hola, necesito instalación"
   
2. Sistema recibe webhook de Meta
   - sender.id: "1234567890"
   - text: "Hola, necesito instalación"
   
3. Bot responde y captura datos
   - Nombre: Juan Pérez
   - Teléfono: +56912345678
   - Servicio: instalación
   - Comuna: Las Condes
   
4. Lead guardado en BD
   - canal: "instagram"
   - instagram_id: "1234567890" ← NUEVO
   
5. Asesor ve lead en dashboard
   - Canal muestra: [📸 Instagram] (clickeable)
   
6. Asesor hace click
   - Se abre: https://www.instagram.com/direct/t/1234567890
   - Ve conversación completa con el cliente
   - Puede continuar la conversación desde Instagram
```

---

## ✅ Ventajas

### Para el Asesor

**Acceso Instantáneo:**
- Un click para abrir la conversación
- No necesita buscar al cliente manualmente
- Ve todo el historial de mensajes

**Contexto Completo:**
- Lee toda la conversación con el bot
- Entiende la situación del cliente
- Puede continuar de forma natural

**Eficiencia:**
- Menos tiempo buscando
- Más tiempo vendiendo
- Mejor experiencia para el cliente

### Para el Cliente

**Continuidad:**
- La conversación continúa en el mismo hilo
- No necesita explicar todo de nuevo
- Experiencia fluida

**Respuesta Rápida:**
- El asesor tiene todos los datos
- Puede responder específicamente
- Cierre más rápido

---

## 🧪 Testing

### Test 1: Crear Lead de Instagram

```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, necesito instalación",
    "senderId": "test_user_12345"
  }'
```

**Verificar:**
1. Lead se crea con `canal: "instagram"`
2. Lead tiene `instagram_id: "test_user_12345"`

### Test 2: Ver en Dashboard

1. Abrir `http://localhost:3000/dashboard`
2. Buscar el lead creado
3. Verificar columna "Canal"

**Debe mostrar:**
```
[📸 Instagram] ← Con fondo gradiente rosa, clickeable
```

### Test 3: Click en Enlace

1. Click en "📸 Instagram"
2. Se abre nueva pestaña
3. URL: `https://www.instagram.com/direct/t/test_user_12345`

**Nota:** Instagram pedirá login si no estás autenticado.

### Test 4: Filtrar por Canal

1. En dashboard, seleccionar filtro: `Canal: Instagram`
2. Tabla muestra solo leads de Instagram
3. Todos deben tener enlace clickeable

---

## 🚨 Casos Especiales

### Lead de Instagram sin instagram_id

**Escenario:** Lead antiguo o creado manualmente

**Comportamiento:**
```javascript
if (canal === 'instagram' && lead.instagram_id) {
  // Mostrar enlace
} else {
  // Mostrar solo texto "📸 Instagram"
}
```

**Resultado:** Muestra texto simple sin enlace (no hay error).

### Lead de WhatsApp

**Comportamiento:** Muestra `💚 WhatsApp` sin enlace (por ahora).

**Mejora futura:** Agregar `whatsapp_id` similar a Instagram.

### Lead de Web

**Comportamiento:** Muestra `🌐 Web` sin enlace.

---

## 📝 Archivos Modificados

### Backend

1. **`src/domain/entities/Lead.js`**
   - Campo `instagram_id` agregado

2. **`src/infrastructure/database/connection.js`**
   - Migración para columna `instagram_id`

3. **`src/infrastructure/database/sqlite/SqliteLeadRepository.js`**
   - Insert incluye `instagram_id`
   - Select mapea `instagram_id`

4. **`src/application/use-cases/ProcessChatMessage.js`**
   - Captura `senderId` de metadata
   - Guarda en `instagram_id` cuando canal es Instagram

5. **`src/infrastructure/http/routes/leads.js`**
   - API incluye `instagram_id` en respuesta

### Frontend

6. **`public/dashboard.html`**
   - Función `formatCanalLink()` agregada
   - Estilos CSS para `.instagram-link`
   - Columna "Canal" ahora usa `formatCanalLink()`

---

## 🎉 Estado: **PRODUCTION READY**

El sistema ahora captura automáticamente el Instagram ID de cada lead y proporciona acceso directo a la conversación desde el dashboard 🚀

---

## 🔮 Mejoras Futuras

### 1. WhatsApp ID
Similar funcionalidad para WhatsApp:
```javascript
if (canal === 'whatsapp' && lead.whatsapp_id) {
  const whatsappUrl = `https://wa.me/${lead.whatsapp_id}`;
  return `<a href="${whatsappUrl}">💚 WhatsApp</a>`;
}
```

### 2. Nombre de Usuario
En lugar de solo el ID, obtener el @username de Instagram:
```javascript
// Llamada a Graph API
GET /{user_id}?fields=username
```

### 3. Vista Previa
Mostrar últimos mensajes al hacer hover sobre el enlace.

### 4. Indicador de Nuevos Mensajes
Señalar si hay mensajes no leídos del cliente.

---

**Implementación completada:** Enero 2025  
**Versión:** 1.0.0  
**Status:** ✅ Funcionando en producción

