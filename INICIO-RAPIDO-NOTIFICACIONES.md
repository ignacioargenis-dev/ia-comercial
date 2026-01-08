# 🚀 Inicio Rápido - Notificaciones Automáticas

## ⚡ En 3 Pasos

### Paso 1: Elegir Método

**Opción A: Email** (Recomendado para empezar)  
**Opción B: Webhook** (Para integraciones avanzadas)

---

## 📧 Opción A: Email (5 minutos)

### 1. Generar App Password de Gmail

1. Accede a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" → "Otro dispositivo personalizado"
3. Nombre: "IA Comercial"
4. Copia la contraseña (16 caracteres con espacios)

### 2. Configurar .env

Crea archivo `.env` en la raíz del proyecto:

```env
# Configuración obligatoria
OPENAI_API_KEY=sk-tu-clave-aqui

# Notificaciones por Email
OWNER_EMAIL=tu-email@ejemplo.com
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx

# Opcional
BUSINESS_NAME=Tu Empresa
PORT=3000
```

### 3. Iniciar

```bash
npm start
```

**¡Listo!** Cada lead caliente enviará un email automáticamente.

---

## 🔗 Opción B: Webhook (3 minutos)

### 1. Crear Webhook en Make.com

1. Crear cuenta gratis: https://www.make.com
2. Nuevo Scenario → Webhook
3. Copiar URL del webhook

### 2. Configurar .env

```env
# Configuración obligatoria
OPENAI_API_KEY=sk-tu-clave-aqui

# Notificaciones por Webhook
WEBHOOK_URL=https://hook.make.com/abc123
WEBHOOK_TYPE=make
```

### 3. Iniciar

```bash
npm start
```

**¡Listo!** Los leads calientes se enviarán a Make.com.

---

## 🧪 Probar

### Crear Lead de Prueba

```javascript
// test-notif-simple.js
require('dotenv').config();
const container = require('./src/infrastructure/container');
const { Lead } = require('./src/domain/entities/Lead');

async function test() {
  const notifyOwner = container.getNotifyOwnerUseCase();
  
  const lead = new Lead({
    nombre: 'Juan Prueba',
    telefono: '+56912345678',
    servicio: 'instalación',
    comuna: 'Las Condes',
    estado: 'caliente',
    fecha: new Date().toISOString()
  });
  
  await notifyOwner.execute({ lead, priority: 'urgent' });
  console.log('✅ Notificación enviada');
}

test();
```

Ejecutar:
```bash
node test-notif-simple.js
```

**Verifica:**
- ✅ Consola muestra notificación
- ✅ Email recibido (si configuraste email)
- ✅ Webhook recibido en Make.com (si configuraste webhook)

---

## 🎯 Flujo Real

```
Usuario en chatbot:
"Necesito instalar un aire acondicionado en Las Condes, 
mi teléfono es +56912345678"

        ↓

Sistema clasifica: CALIENTE 🔥

        ↓

Lead guardado en DB

        ↓

🔔 Notificación automática

        ↓

📧 Email al propietario
ó
🔗 Webhook a Make.com

        ↓

Propietario contacta al cliente
```

---

## 🎨 Qué Recibirás

### Email:

```
🔥 ¡Nuevo Lead CALIENTE!

⚡ ACCIÓN REQUERIDA
Este cliente muestra intención directa de compra.

👤 Nombre: Juan Pérez
📞 Teléfono: +56912345678
🛠️ Servicio: instalación aire acondicionado
📍 Comuna: Las Condes

[Botón: 💬 Contactar por WhatsApp]
```

### Webhook (JSON):

```json
{
  "event": "new_lead",
  "type": "hot",
  "lead": {
    "nombre": "Juan Pérez",
    "telefono": "+56912345678",
    "servicio": "instalación",
    "comuna": "Las Condes"
  }
}
```

---

## 💡 Casos de Uso

### Solo Email
```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
OWNER_EMAIL=propietario@ejemplo.com
```

### Solo Webhook
```env
WEBHOOK_URL=https://hooks.make.com/abc
```

### Sin Configuración (Testing)
```env
# No configures EMAIL ni WEBHOOK
# Las notificaciones solo aparecerán en consola
```

---

## ❓ Troubleshooting Rápido

### Email no llega

```bash
# Verificar variables
node -e "console.log(process.env.EMAIL_USER)"

# Verificar que sea App Password, no contraseña normal
# Generar aquí: https://myaccount.google.com/apppasswords
```

### Webhook no funciona

```bash
# Verificar URL
node -e "console.log(process.env.WEBHOOK_URL)"

# Probar manualmente
curl -X POST https://tu-webhook-url -d '{"test": true}'
```

---

## 📚 Documentación Completa

- `NOTIFICACIONES.md` - Documentación técnica completa
- `RESUMEN-NOTIFICACIONES.md` - Resumen ejecutivo
- `INICIO-RAPIDO-NOTIFICACIONES.md` - Esta guía

---

## ✅ Checklist

- [ ] Instalar dependencias: `npm install`
- [ ] Crear archivo `.env`
- [ ] Configurar `OPENAI_API_KEY`
- [ ] Configurar Email O Webhook
- [ ] Iniciar servidor: `npm start`
- [ ] Probar con lead de prueba
- [ ] Verificar recepción de notificación

---

**¿Listo?** → `npm start`  
**¿Dudas?** → Lee `NOTIFICACIONES.md`  
**¿Problemas?** → Revisa logs en consola

