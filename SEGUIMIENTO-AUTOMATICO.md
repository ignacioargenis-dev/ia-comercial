# Sistema de Seguimiento Automático de Leads

## 📋 Descripción General

Sistema inteligente que envía seguimientos automáticos a leads según su estado (caliente/tibio) y tiempo sin interacción. Permite maximizar la conversión sin intervención manual constante.

## 🎯 Objetivos

1. **Recuperar leads tibios**: Recordatorio después de 24h sin interacción
2. **No perder leads calientes**: Notificación después de 12h sin contacto
3. **Automatizar seguimiento**: Sin intervención manual
4. **Respetar horarios**: Solo en horario laboral configurado

## 📊 Reglas de Negocio

### Clasificación y Tiempos

| Estado | Tiempo de Espera | Acción |
|--------|------------------|--------|
| 🔥 **Caliente** | 12 horas | Seguimiento urgente por email/WhatsApp |
| 🌡️ **Tibio** | 24 horas | Recordatorio amable |
| ❄️ **Frío** | N/A | Sin seguimiento automático |
| ✅ **Contactado** | N/A | Sin seguimiento (ya atendido) |

### Condiciones para Seguimiento

Un lead recibirá seguimiento automático SI:
- ✅ No ha sido contactado por un humano (`contactado = false`)
- ✅ Es caliente o tibio (no frío)
- ✅ Han pasado las horas requeridas desde su última interacción
- ✅ Está dentro del horario laboral del negocio
- ✅ No se le envió un seguimiento en la última hora

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                   FollowUpScheduler                     │
│              (Cron Jobs - Infraestructura)              │
│                                                         │
│  ⏰ Cada 30 min:  Leads calientes                      │
│  ⏰ Cada 2 horas: Leads tibios                         │
│  ⏰ 8:00 AM:      Reporte diario                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  FollowUpService                        │
│               (Lógica de Aplicación)                    │
│                                                         │
│  • Coordina envío de mensajes                          │
│  • Selecciona canal (email/WhatsApp/webhook)           │
│  • Registra intentos y resultados                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   FollowUpRules                         │
│                 (Reglas de Dominio)                     │
│                                                         │
│  • Define tiempos de espera                            │
│  • Genera mensajes personalizados                      │
│  • Valida condiciones de envío                         │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ Modelo de Datos

### Tabla `leads` (actualizada)

```sql
CREATE TABLE leads (
  id INTEGER PRIMARY KEY,
  nombre TEXT,
  telefono TEXT,
  servicio TEXT,
  comuna TEXT,
  urgencia TEXT,
  estado TEXT DEFAULT 'frio',
  contactado INTEGER DEFAULT 0,
  notas TEXT,
  fecha_creacion DATETIME,
  fecha_actualizacion DATETIME,
  ultima_interaccion DATETIME,  -- ⬅️ NUEVO
  fecha_contacto DATETIME        -- ⬅️ NUEVO
);
```

### Tabla `follow_ups` (nueva)

```sql
CREATE TABLE follow_ups (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER,
  type TEXT,              -- 'caliente' | 'tibio'
  status TEXT,            -- 'sent' | 'failed' | 'error'
  message TEXT,           -- Extracto del mensaje enviado
  fecha_envio DATETIME,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

## 🚀 Uso e Integración

### 1. Configuración Inicial

Agregar a tu archivo `.env`:

```bash
# Seguimientos Automáticos
ENABLE_FOLLOW_UPS=true          # Habilitar/deshabilitar

# Email (ya configurado)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_TO=destino@empresa.com

# WhatsApp (opcional - futuro)
WHATSAPP_API_TOKEN=tu_token
WHATSAPP_PHONE_ID=tu_phone_id

# Webhook (opcional)
WEBHOOK_URL=https://tu-servidor.com/webhook
```

### 2. Inicio Automático

El sistema se inicia automáticamente al levantar el servidor:

```bash
npm start
```

Verás en la consola:

```
🚀 Servidor corriendo en http://localhost:3000
⏰ Inicializando sistema de seguimientos automáticos...
✅ Planificador de seguimientos iniciado
   📅 Leads calientes: cada 30 minutos
   📅 Leads tibios: cada 2 horas
   📅 Reporte diario: 8:00 AM
```

### 3. API Endpoints

#### Obtener Estadísticas

```bash
GET /api/followups/stats
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "pendingFollowUp": 12,
    "calientes": 5,
    "tibios": 7,
    "contactados": 33
  }
}
```

#### Historial de Seguimientos de un Lead

```bash
GET /api/followups/lead/123/history
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "lead_id": 123,
      "type": "caliente",
      "status": "sent",
      "message": "Hola Juan, soy Climatización Express...",
      "fecha_envio": "2026-01-07T14:30:00Z"
    }
  ]
}
```

#### Enviar Seguimiento Manual

```bash
POST /api/followups/lead/123/send
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Seguimiento enviado exitosamente a lead #123"
}
```

#### Estado del Planificador

```bash
GET /api/followups/scheduler/status
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "running": true,
    "jobs": 3,
    "schedule": {
      "hotLeads": "Cada 30 minutos",
      "warmLeads": "Cada 2 horas",
      "dailyReport": "8:00 AM"
    }
  }
}
```

#### Ejecutar Seguimientos Ahora (Testing)

```bash
POST /api/followups/scheduler/run-now
```

## 📝 Mensajes de Seguimiento

### Lead Caliente

```
Hola [Nombre], soy [Negocio]. 

Vimos que estabas interesado en nuestro servicio de [Servicio]. 

¿Sigues necesitando ayuda? Estamos disponibles para ayudarte ahora mismo.

¿Te gustaría que agendemos una visita o te enviemos una cotización?
```

### Lead Tibio

```
Hola [Nombre], te saluda [Negocio]. 

Hace un tiempo consultaste sobre [Servicio].

¿Sigues interesado? Nos encantaría poder ayudarte.

Responde este mensaje y con gusto te atendemos. 😊
```

## ⚙️ Configuración por Cliente

Los seguimientos respetan la configuración en `config/business.json`:

```json
{
  "schedule": {
    "workingDays": {
      "monday": { "enabled": true, "open": "08:00", "close": "18:00" },
      "saturday": { "enabled": false }
    }
  },
  "conversationStyle": {
    "tone": "profesional y cercano",
    "formality": "tú"
  }
}
```

## 🔔 Canales de Envío

### Prioridad de Canales

1. **WhatsApp** (si está configurado y el lead tiene teléfono)
   - Tasa de apertura más alta
   - Respuestas inmediatas

2. **Email** (si está configurado)
   - Profesional
   - Registro permanente

3. **Webhook** (si está configurado)
   - Integración con sistemas externos
   - CRM, Slack, etc.

4. **Logs** (siempre)
   - Registro en consola
   - Para debugging

### Ejemplo de Integración Email

El sistema ya está integrado con el servicio de notificaciones existente:

```javascript
// Se reutiliza EmailNotificationService
await this.notificationService.notificarLeadTibio({
  nombre: lead.nombre,
  telefono: lead.telefono,
  servicio: lead.servicio,
  message: "Mensaje de seguimiento personalizado..."
});
```

## 📈 Monitoreo y Reportes

### Logs en Consola

```
🔥 Verificando leads calientes...
   📧 Procesando 3 lead(s) caliente(s)...
   ✅ Seguimiento enviado a: Juan Pérez
   ✅ Seguimiento enviado a: María González
   ⚠️  Error al enviar seguimiento a lead #45: Email no configurado
```

### Reporte Diario (8:00 AM)

```
📊 Generando reporte diario...
   Total leads: 125
   Calientes: 15
   Tibios: 30
   Pendientes de seguimiento: 18
```

## 🧪 Testing

### Probar Seguimientos Manualmente

```bash
# Ejecutar seguimientos ahora (sin esperar el cron)
curl -X POST http://localhost:3000/api/followups/scheduler/run-now

# Ver logs en consola del servidor
```

### Simular Lead que Necesita Seguimiento

```javascript
// En la BD, insertar un lead con ultima_interaccion antigua
INSERT INTO leads (
  nombre, telefono, servicio, comuna, 
  estado, contactado, 
  ultima_interaccion
) VALUES (
  'Test', '+56912345678', 'Instalación', 'Santiago',
  'caliente', 0,
  datetime('now', '-13 hours')  -- Hace 13 horas
);
```

Luego ejecutar:
```bash
curl -X POST http://localhost:3000/api/followups/scheduler/run-now
```

## 🛠️ Personalización

### Cambiar Frecuencia de Seguimientos

Editar `src/infrastructure/automation/FollowUpScheduler.js`:

```javascript
// Cambiar de cada 30 minutos a cada 1 hora
const hotLeadsJob = cron.schedule('0 * * * *', async () => {
  await this.processHotLeads();
});
```

### Cambiar Tiempos de Espera

Editar `src/domain/services/FollowUpRules.js`:

```javascript
static getFollowUpDelay(estado) {
  const delays = {
    'caliente': 6,  // Cambiar de 12 a 6 horas
    'tibio': 48,    // Cambiar de 24 a 48 horas
    'frio': null
  };
  return delays[estado] || null;
}
```

### Personalizar Mensajes

Editar `src/domain/services/FollowUpRules.js`:

```javascript
static getFollowUpMessage(lead, businessConfig) {
  // Tu lógica personalizada aquí
  return `Tu mensaje personalizado...`;
}
```

## 🔒 Seguridad y Límites

### Evitar Spam

- ✅ No enviar más de 1 seguimiento por hora al mismo lead
- ✅ Solo enviar en horario laboral
- ✅ Dejar de enviar cuando el lead es contactado
- ✅ Límite de intentos fallidos (implementar si es necesario)

### GDPR y Privacidad

- Los seguimientos solo se envían a leads que interactuaron con el negocio
- Los datos se almacenan de forma segura en la BD local
- El lead puede solicitar eliminación de sus datos

## 📚 Archivos Importantes

```
src/
├── domain/
│   └── services/
│       └── FollowUpRules.js            # Reglas de negocio
├── application/
│   └── services/
│       └── FollowUpService.js          # Coordinación de seguimientos
├── infrastructure/
│   ├── automation/
│   │   └── FollowUpScheduler.js        # Cron jobs
│   ├── database/
│   │   ├── connection.js               # Esquema BD (actualizado)
│   │   └── sqlite/
│   │       └── SqliteLeadRepository.js # Queries (actualizado)
│   └── http/
│       └── routes/
│           └── followups.js            # API endpoints
└── server.js                           # Inicialización (actualizado)
```

## 🎓 Preguntas Frecuentes

### ¿Cómo desactivo los seguimientos automáticos?

En tu `.env`:
```bash
ENABLE_FOLLOW_UPS=false
```

### ¿Los seguimientos se envían los fines de semana?

Solo si lo configuras en `config/business.json`. Por defecto, respeta los horarios laborales.

### ¿Puedo usar esto con WhatsApp Business API?

Sí, solo necesitas:
1. Obtener un token de WhatsApp Business API
2. Configurar en `.env`
3. Implementar la función `sendWhatsAppMessage()` en `FollowUpService`

### ¿Qué pasa si el email falla?

El sistema intenta por WhatsApp, luego Webhook. Si todos fallan, se registra en `follow_ups` con `status='failed'`.

## 🚀 Próximas Mejoras

- [ ] Integración completa con WhatsApp Business API
- [ ] A/B testing de mensajes
- [ ] Plantillas de mensajes personalizables desde el dashboard
- [ ] Análisis de tasa de respuesta
- [ ] Límite de intentos por lead
- [ ] Notificaciones cuando un lead responde al seguimiento

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de consola
2. Verifica que `node-cron` esté instalado: `npm list node-cron`
3. Revisa la BD: ¿existen las tablas y columnas nuevas?
4. Prueba manualmente: `POST /api/followups/scheduler/run-now`

---

**Sistema de Seguimiento Automático v1.0**  
*Maximiza tu conversión sin perder ningún lead* 🚀

