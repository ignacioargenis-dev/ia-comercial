# 🔔 Sistema de Notificaciones - Arquitectura Desacoplada

## 🎯 Objetivo Cumplido

Sistema de notificaciones automáticas que alerta al propietario cuando hay un lead caliente listo para cerrar, con arquitectura desacoplada que permite elegir entre Email o Webhook.

---

## ✨ Implementación Completa

### 1. ✅ Servicio Desacoplado

Se implementaron **dos servicios intercambiables**:

#### EmailNotificationService
- Envía emails usando **Nodemailer**
- Soporta Gmail y SMTP genérico
- HTML responsive con diseño profesional
- Fallback a texto plano
- App Password de Gmail para seguridad

#### WebhookNotificationService
- Envía notificaciones vía HTTP POST
- Integración con Make.com, Zapier, Slack, Discord
- Formato personalizado según plataforma
- Retry automático (opcional)

**El sistema elige automáticamente** según configuración en `.env`

---

### 2. ✅ Datos Incluidos en Notificación

Cada notificación incluye **exactamente lo solicitado**:

```javascript
{
  nombre: "Juan Pérez",          // ✅
  telefono: "+56912345678",       // ✅
  servicio: "instalación AC",     // ✅
  comuna: "Las Condes",           // ✅
  
  // Bonus (datos adicionales útiles):
  urgencia: "alta",
  estado: "caliente",
  fecha: "2026-01-07T15:44:56Z",
  notas: "Cliente solicita..."
}
```

---

### 3. ✅ Disparo Automático desde Flujo Principal

La notificación se dispara **automáticamente** cuando:

```javascript
// En ProcessChatMessage.js (línea 107-121)

if (savedLead.esCaliente()) {
  console.log('🔥 Lead caliente detectado - Notificando...');
  await this.notifyOwner.execute({
    lead: savedLead,
    reason: `Lead caliente: ${reason}`,
    priority: 'urgent'
  });
}
```

**Flujo Completo:**
```
Usuario → Chat → IA Clasifica → Lead Guardado
                                      ↓
                              ¿Es caliente?
                                      ↓
                                    SÍ
                                      ↓
                          🔔 Notificación Automática
                                      ↓
                          Email/Webhook al Propietario
```

---

## 📧 Configuración - Opción A: Email

### Paso 1: Obtener App Password de Gmail

1. Accede a tu cuenta de Gmail
2. Ve a: https://myaccount.google.com/apppasswords
3. Selecciona "Correo" y "Otro dispositivo personalizado"
4. Nombre: "IA Comercial"
5. Copia la contraseña de 16 caracteres

### Paso 2: Configurar .env

```env
# Email del propietario (quien recibe las notificaciones)
OWNER_EMAIL=tu-email@ejemplo.com

# Email que envía (puede ser el mismo)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx

# Servicio (opcional, default: gmail)
EMAIL_SERVICE=gmail
```

### Paso 3: Reiniciar Servidor

```bash
npm start
```

**Listo!** Los leads calientes enviarán emails automáticamente.

---

## 🔗 Configuración - Opción B: Webhook

### Opción B.1: Make.com (Recomendado)

1. Crear cuenta en [Make.com](https://www.make.com)
2. Crear nuevo Scenario
3. Agregar trigger "Webhook"
4. Copiar la URL del webhook
5. Configurar .env:

```env
WEBHOOK_URL=https://hook.make.com/tu-webhook-id
WEBHOOK_TYPE=make
```

6. En Make.com, conectar con:
   - Gmail (enviar email)
   - Google Sheets (registrar leads)
   - WhatsApp Business
   - CRM (Salesforce, HubSpot)

### Opción B.2: Slack

1. Crear un Incoming Webhook en Slack:
   - https://api.slack.com/messaging/webhooks
2. Copiar webhook URL
3. Configurar .env:

```env
WEBHOOK_URL=https://hooks.slack.com/services/tu-webhook-id
WEBHOOK_TYPE=slack
```

### Opción B.3: Discord

1. Configurar webhook en un canal de Discord
2. Copiar webhook URL
3. Configurar .env:

```env
WEBHOOK_URL=https://discord.com/api/webhooks/tu-webhook-id
WEBHOOK_TYPE=discord
```

### Opción B.4: Webhook Genérico

```env
WEBHOOK_URL=https://tu-servidor.com/webhook
WEBHOOK_TYPE=generic
```

**Payload enviado:**

```json
{
  "event": "new_lead",
  "type": "hot",
  "timestamp": "2026-01-07T15:44:56.000Z",
  "business": "Tu Empresa",
  "lead": {
    "id": 5,
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    "servicio": "instalación",
    "comuna": "Las Condes",
    "urgencia": "alta",
    "estado": "caliente",
    "notas": "",
    "fecha": "2026-01-07T15:40:00.000Z"
  }
}
```

---

## 🏗️ Arquitectura Implementada

### Clean Architecture - Capa de Infraestructura

```
src/infrastructure/notifications/
├── EmailNotificationService.js     ← Implementación Email
└── WebhookNotificationService.js   ← Implementación Webhook

src/application/use-cases/
└── NotifyOwner.js                  ← Caso de uso (orquestador)

src/infrastructure/
└── container.js                    ← Inyección de dependencias
```

### Principios Aplicados

✅ **Desacoplamiento**: Los servicios de notificación no conocen la lógica de negocio  
✅ **Inversión de Dependencias**: `NotifyOwner` depende de abstracción, no de implementación concreta  
✅ **Single Responsibility**: Cada servicio tiene una sola razón de cambio  
✅ **Open/Closed**: Fácil agregar nuevos canales (SMS, Push, etc.) sin modificar existentes  
✅ **Inyección de Dependencias**: Container decide qué servicio usar según configuración  

---

## 📊 Tipos de Notificación

### 🔥 Lead CALIENTE (Prioridad: URGENT)

**Cuándo se dispara:**
- Lead clasificado como "caliente"
- Solicita cotización, agendar o contratar
- Muestra intención directa de compra

**Notificación:**
- Email: Asunto con 🔥 y diseño rojo
- Webhook: `type: "hot"`, color rojo
- **Siempre notifica**, sin importar datos completos

**Ejemplo de Email:**

```
🔥 ¡Nuevo Lead CALIENTE!

⚡ ACCIÓN REQUERIDA
Este cliente muestra intención directa de compra.
¡Contáctalo cuanto antes!

👤 Nombre: Juan Pérez
📞 Teléfono: +56912345678
🛠️ Servicio: instalación aire acondicionado
📍 Comuna: Las Condes
⏰ Urgencia: alta

💬 Contactar por WhatsApp
```

---

### 🌡️ Lead TIBIO (Prioridad: NORMAL)

**Cuándo se dispara:**
- Lead clasificado como "tibio"
- Proporciona datos de contacto
- Muestra interés pero sin urgencia

**Notificación:**
- Email: Diseño amarillo/naranja
- Webhook: `type: "warm"`
- **Solo notifica si tiene nombre Y teléfono**

---

### ❄️ Lead FRÍO (No notifica)

**Cuándo se registra:**
- Consulta general
- Sin datos de contacto
- Sin intención de compra

**Notificación:**
- **No envía email ni webhook**
- Solo registro en consola
- Se guarda en base de datos para estadísticas

---

## 🧪 Verificación del Sistema

### Prueba Manual

```bash
# Ejecutar script de prueba
node test-notificaciones.js
```

**Salida esperada:**

```
🧪 Probando Sistema de Notificaciones

1️⃣  Inicializando servicios...
   ✅ NotificationService inicializado
   ✅ NotifyOwner use case inicializado
   📡 Servicio activo: EmailNotificationService
   📧 Email configurado: SÍ
   📬 Destinatario: tu-email@ejemplo.com

2️⃣  Creando lead de prueba CALIENTE...
   ✅ Lead creado

3️⃣  Disparando notificación...
   ✅ Éxito: true
   ✅ Notificación enviada: true

4️⃣  Probando lead TIBIO...
   ✅ Notificación tibio enviada: true

5️⃣  Enviando prueba directa del servicio...
   📧 Enviando email de prueba...
   ✅ Email de prueba enviado correctamente

🎉 PRUEBA DE NOTIFICACIONES COMPLETADA

📊 Resumen:
   ✅ Servicio: EmailNotificationService
   ✅ Estado: Configurado
   ✅ Notificación caliente: EXITOSA
   ✅ Notificación tibio: EXITOSA
```

---

## 🔍 Logs en Consola

El sistema **siempre muestra en consola** (además de email/webhook):

```
============================================================
🔥 NOTIFICACIÓN: NUEVO LEAD CALIENTE 🔥
============================================================
👤 Nombre:    Juan Pérez
📞 Teléfono:  +56912345678
🛠️  Servicio:  instalación aire acondicionado
📍 Comuna:    Las Condes
⏰ Urgencia:  alta
🕒 Fecha:     7/1/2026, 15:44:56
============================================================
```

Esto te permite verificar que el sistema funciona incluso sin email/webhook configurado.

---

## 🚀 Estados del Sistema

### Estado 1: Sin Configuración (Default)

```env
# .env sin EMAIL_USER ni WEBHOOK_URL
```

**Comportamiento:**
- ✅ Notificaciones en consola
- ❌ No envía email
- ❌ No envía webhook
- ✅ Sistema funciona normalmente
- ✅ Leads se guardan en DB

**Uso:** Desarrollo, testing local

---

### Estado 2: Email Configurado

```env
OWNER_EMAIL=propietario@ejemplo.com
EMAIL_USER=sistema@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

**Comportamiento:**
- ✅ Notificaciones en consola
- ✅ **Envía emails automáticos**
- ❌ No envía webhook
- ✅ HTML responsive profesional

**Uso:** Producción con email

---

### Estado 3: Webhook Configurado

```env
WEBHOOK_URL=https://hooks.make.com/abc123
WEBHOOK_TYPE=make
```

**Comportamiento:**
- ✅ Notificaciones en consola
- ❌ No envía email (webhook tiene prioridad)
- ✅ **Envía webhook automático**
- ✅ Integración con Make.com/Zapier

**Uso:** Producción con integraciones

---

## 📋 Variables de Entorno

### Obligatorias (Ninguna)

El sistema funciona sin configuración, mostrando solo en consola.

### Opcionales - Email

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `OWNER_EMAIL` | Email del propietario | `propietario@ejemplo.com` |
| `EMAIL_USER` | Email que envía | `sistema@gmail.com` |
| `EMAIL_PASS` | App Password de Gmail | `xxxx xxxx xxxx xxxx` |
| `EMAIL_SERVICE` | Servicio de email | `gmail` (default) o `smtp` |
| `SMTP_HOST` | Host SMTP (si service=smtp) | `smtp.ejemplo.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_SECURE` | SSL/TLS | `false` |

### Opcionales - Webhook

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `WEBHOOK_URL` | URL del webhook | `https://hooks.make.com/abc` |
| `WEBHOOK_TYPE` | Tipo de webhook | `generic`, `slack`, `discord`, `make` |

---

## 🎨 Ejemplo de Email HTML

El email enviado es completamente **responsive** y **profesional**:

### Vista Desktop:

```
┌────────────────────────────────────────┐
│  🔥 ¡Nuevo Lead CALIENTE!              │
│  Oportunidad de cierre inmediato       │
├────────────────────────────────────────┤
│                                        │
│  ⚡ ACCIÓN REQUERIDA                   │
│  Este cliente muestra intención        │
│  directa de compra. ¡Contáctalo!       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 👤 Nombre:                       │ │
│  │ Juan Pérez                       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📞 Teléfono:                     │ │
│  │ +56912345678                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 🛠️ Servicio Solicitado:          │ │
│  │ instalación aire acondicionado   │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📍 Comuna:                       │ │
│  │ Las Condes                       │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  💬 Contactar por WhatsApp       │ │
│  └──────────────────────────────────┘ │
│                                        │
├────────────────────────────────────────┤
│  Sistema de Captura de Leads con IA    │
└────────────────────────────────────────┘
```

### Características del Email:

- ✅ Gradiente rojo para leads calientes
- ✅ Gradiente amarillo para leads tibios
- ✅ Botón directo a WhatsApp (si hay teléfono)
- ✅ Diseño responsive (móvil/tablet/desktop)
- ✅ Fallback a texto plano
- ✅ Compatible con todos los clientes de email

---

## 💡 Casos de Uso Avanzados

### Integración con Make.com

**Escenario:** Automatizar todo el proceso post-lead

```
Webhook → Make.com Scenario:
  1. Recibe lead caliente
  2. Envía email al propietario
  3. Envía WhatsApp al cliente
  4. Registra en Google Sheets
  5. Crea evento en Google Calendar
  6. Añade a CRM (Salesforce/HubSpot)
  7. Envía notificación a Slack
```

### Integración con Zapier

```
Webhook → Zapier Zap:
  1. Recibe lead caliente
  2. Crea contacto en CRM
  3. Envía SMS al cliente
  4. Notifica al equipo comercial
  5. Genera tarea de seguimiento
```

### Multi-Canal (Email + Webhook)

Si quieres **ambos** simultáneamente, modifica `container.js`:

```javascript
getNotificationService() {
  if (!this.instances.notificationService) {
    // Crear servicio compuesto
    const EmailNotificationService = require('./notifications/EmailNotificationService');
    const WebhookNotificationService = require('./notifications/WebhookNotificationService');
    
    this.instances.notificationService = {
      async notificarLeadCaliente(leadData) {
        const email = new EmailNotificationService();
        const webhook = new WebhookNotificationService();
        
        await Promise.all([
          email.notificarLeadCaliente(leadData),
          webhook.notificarLeadCaliente(leadData)
        ]);
        
        return true;
      },
      // ... más métodos
    };
  }
  return this.instances.notificationService;
}
```

---

## 🔧 Troubleshooting

### Email no se envía

**Problema:** Email configurado pero no llega

**Soluciones:**

1. **Verificar App Password de Gmail:**
   ```
   - No uses tu contraseña normal
   - Genera App Password en:
     https://myaccount.google.com/apppasswords
   ```

2. **Verificar variables de entorno:**
   ```bash
   node -e "console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS)"
   ```

3. **Verificar puerto y firewall:**
   ```
   Gmail usa puerto 465 (SSL) o 587 (TLS)
   Verifica que no esté bloqueado
   ```

4. **Revisar logs del servidor:**
   ```
   ❌ Error al enviar email: <mensaje>
   ```

---

### Webhook no responde

**Problema:** Webhook configurado pero no recibe datos

**Soluciones:**

1. **Verificar URL:**
   ```bash
   node -e "console.log(process.env.WEBHOOK_URL)"
   ```

2. **Probar con curl:**
   ```bash
   curl -X POST https://tu-webhook-url \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

3. **Verificar logs en la plataforma:**
   - Make.com: Ver "History" del scenario
   - Zapier: Ver "Task History"
   - Slack: Verificar configuración del webhook

---

### Notificación no se dispara

**Problema:** Lead guardado pero no notifica

**Verificar:**

1. **¿Es realmente caliente?**
   ```bash
   # Ver logs en consola
   🔥 Lead caliente detectado - Notificando...
   ```

2. **¿El lead se guardó?**
   ```bash
   ✅ Lead guardado: Lead: ...
   ```

3. **¿Hay errores en NotifyOwner?**
   ```bash
   ❌ Error al notificar al propietario: ...
   ```

---

## ✅ Checklist de Implementación

- [x] EmailNotificationService implementado
- [x] WebhookNotificationService implementado
- [x] Container actualizado con auto-selección
- [x] NotifyOwner integrado en ProcessChatMessage
- [x] Disparo automático para leads calientes
- [x] Disparo automático para leads tibios (con datos)
- [x] Logs en consola siempre visibles
- [x] Fallback graceful sin configuración
- [x] HTML responsive para emails
- [x] Formato personalizado para webhooks
- [x] Variables de entorno documentadas
- [x] .env.example actualizado
- [x] Script de prueba (test-notificaciones.js)
- [x] Documentación completa

---

## 🎉 Resumen Ejecutivo

### Lo que se implementó:

✅ **Servicio desacoplado** - Arquitectura limpia, intercambiable  
✅ **Email con Nodemailer** - HTML responsive, App Password de Gmail  
✅ **Webhook genérico** - Integración con Make.com, Zapier, Slack, Discord  
✅ **Selección automática** - Según variables de entorno  
✅ **Disparo automático** - Integrado en flujo principal (`ProcessChatMessage`)  
✅ **Datos completos** - Nombre, teléfono, servicio, comuna (+ extras)  
✅ **Fallback graceful** - Funciona sin configuración (solo consola)  
✅ **Testing completo** - Script de verificación incluido  

### Objetivo cumplido:

🎯 **El dueño recibe leads listos para cerrar**  
🔥 **Notificación automática para leads calientes**  
📧 **Email o Webhook según preferencia**  
⚡ **Sin intervención manual requerida**  

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Última actualización:** Enero 2026

