# 🔐 Guía de Configuración de APIs

## 📋 Resumen

Este documento te guía paso a paso para configurar todas las credenciales necesarias del sistema.

**Archivo de configuración:** `.env` (en la raíz del proyecto)

---

## 🚀 Configuración Rápida

### Paso 1: Crear archivo .env

Si no existe, copia el archivo de ejemplo:

```bash
# En Windows:
copy .env.example .env

# En Linux/Mac:
cp .env.example .env
```

### Paso 2: Editar .env

Abre el archivo `.env` con tu editor favorito y configura las credenciales.

---

## 1️⃣ OpenAI (REQUERIDO)

### ¿Para qué sirve?
El asistente de IA que conversa con los clientes y captura leads.

### ¿Cómo obtener la API Key?

1. **Crear cuenta en OpenAI:**
   - Ve a: https://platform.openai.com/signup
   - Regístrate con tu email

2. **Obtener API Key:**
   - Ve a: https://platform.openai.com/api-keys
   - Click en "Create new secret key"
   - Copia la key (empieza con `sk-proj-...`)
   - ⚠️ **IMPORTANTE:** Guárdala, no podrás verla de nuevo

3. **Agregar créditos:**
   - Ve a: https://platform.openai.com/account/billing
   - Agrega un método de pago
   - Mínimo recomendado: $5 USD (alcanza para ~500-1000 conversaciones)

### Configurar en .env:

```env
OPENAI_API_KEY=sk-proj-tu-key-real-aqui-xxxxxxxxxxxxx
```

### Verificar que funciona:

```bash
# Reinicia el servidor
npm start

# En otra terminal, prueba el health check:
curl http://localhost:3000/health/detailed
```

**Deberías ver:**
```json
"openai": {
  "status": "healthy",
  "message": "OpenAI API Key configured"
}
```

### Costos Estimados:

| Uso Mensual | Conversaciones | Costo Aprox |
|-------------|----------------|-------------|
| Bajo | 100-300 | $1-3 USD |
| Medio | 500-1000 | $5-10 USD |
| Alto | 2000-5000 | $20-50 USD |

**Modelo usado:** `gpt-4o-mini` (el más económico y rápido)

---

## 2️⃣ WhatsApp Cloud API (OPCIONAL)

### ¿Para qué sirve?
Permite que el asistente reciba y envíe mensajes por WhatsApp automáticamente.

### ¿Cómo obtener credenciales?

**Opción A: Configuración Rápida (Para pruebas)**

1. **Crear cuenta Meta for Developers:**
   - Ve a: https://developers.facebook.com/
   - Inicia sesión con tu cuenta de Facebook

2. **Crear una App:**
   - Click en "My Apps" → "Create App"
   - Selecciona "Business"
   - Nombre: "Mi Asistente IA"
   - Email de contacto
   - Click "Create App"

3. **Agregar WhatsApp:**
   - En el dashboard de tu app
   - Click "Add Product"
   - Busca "WhatsApp" → "Set Up"

4. **Obtener credenciales de prueba:**
   - En la sección de WhatsApp
   - Verás:
     - **Phone Number ID**: Número de 15 dígitos
     - **Temporary Access Token**: Empieza con `EAA...`
   - Copia ambos

5. **Crear Verify Token:**
   - Inventa un token secreto, por ejemplo: `mi-token-123`

### Configurar en .env:

```env
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxx
WHATSAPP_VERIFY_TOKEN=mi-token-123
```

### Configurar Webhook:

1. **Exponer tu servidor localmente (para pruebas):**
   ```bash
   # Instalar ngrok (solo una vez)
   # https://ngrok.com/download
   
   # Exponer puerto 3000
   ngrok http 3000
   ```

2. **Configurar en Meta:**
   - En tu app de Meta, sección WhatsApp → Configuration
   - **Callback URL:** `https://tu-url-ngrok.ngrok.io/api/whatsapp/webhook`
   - **Verify Token:** El mismo que pusiste en `.env` (ej: `mi-token-123`)
   - Click "Verify and Save"

3. **Suscribirse a mensajes:**
   - En Webhooks fields
   - Selecciona "messages"
   - Click "Subscribe"

### Verificar que funciona:

```bash
# Verifica el estado de WhatsApp
curl http://localhost:3000/api/whatsapp/status
```

**Deberías ver:**
```json
{
  "success": true,
  "configured": true,
  "message": "WhatsApp está configurado correctamente"
}
```

### Enviar mensaje de prueba:

1. En el dashboard de Meta, verás un número de prueba
2. Agrega tu propio WhatsApp a la lista de números de prueba
3. Envía un mensaje a ese número
4. ¡El asistente debería responder!

### ⚠️ Limitaciones en Prueba:

- Solo funciona con hasta 5 números agregados manualmente
- Acceso temporal limitado
- Para producción, necesitas verificar tu negocio en Meta

### Para Producción:

Ver guía completa: `WHATSAPP-INTEGRACION.md`

---

## 3️⃣ Email (OPCIONAL)

### ¿Para qué sirve?
Enviar notificaciones cuando llega un lead caliente y reportes diarios.

### Configuración con Gmail:

#### Paso 1: Habilitar autenticación de 2 pasos

1. Ve a: https://myaccount.google.com/security
2. Busca "Verificación en 2 pasos"
3. Actívala si no está activada

#### Paso 2: Crear App Password

1. Ve a: https://myaccount.google.com/apppasswords
2. Nombre: "Asistente IA"
3. Click "Create"
4. Copia la contraseña de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)

#### Paso 3: Configurar en .env:

```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_TO=destino@empresa.com
EMAIL_FROM_NAME=Climatización Express
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Otros proveedores de email:

**Outlook/Hotmail:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
```

**Yahoo:**
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

**Personalizado (SMTP genérico):**
```env
EMAIL_HOST=smtp.tu-proveedor.com
EMAIL_PORT=587
EMAIL_USER=tu-usuario
EMAIL_PASS=tu-contraseña
```

### Verificar que funciona:

```bash
# Reinicia el servidor
npm start

# Verifica el health check
curl http://localhost:3000/health/detailed
```

**Deberías ver:**
```json
"email": {
  "status": "healthy",
  "message": "Email service configured"
}
```

### Probar envío:

Crea un lead caliente y verifica que llegue el email:

1. Abre: http://localhost:3000/demo
2. Selecciona "Cliente Urgente"
3. Completa la simulación
4. Revisa tu bandeja de entrada

---

## 📊 Configuración de Seguimientos

Estos valores controlan cuándo el sistema envía seguimientos automáticos:

### Leads Calientes:

```env
# Enviar seguimiento cada 30 minutos si no hay respuesta
FOLLOW_UP_CALIENTE_INTERVAL_MINUTES=30
```

**Recomendaciones:**
- **Agresivo:** 15 minutos
- **Balanceado:** 30 minutos (por defecto)
- **Conservador:** 60 minutos

### Leads Tibios:

```env
# Enviar seguimiento cada 2 horas si no hay respuesta
FOLLOW_UP_TIBIO_INTERVAL_HOURS=2
```

**Recomendaciones:**
- **Agresivo:** 1 hora
- **Balanceado:** 2 horas (por defecto)
- **Conservador:** 4-6 horas

### Reporte Diario:

```env
# Hora del reporte (formato: minuto hora)
# 0 8 = 8:00 AM
DAILY_REPORT_CRON=0 8
```

**Ejemplos:**
- `0 8` = 8:00 AM
- `30 9` = 9:30 AM
- `0 18` = 6:00 PM
- `30 17` = 5:30 PM

---

## ✅ Checklist de Configuración

### Mínimo para funcionar:

- [x] `PORT` configurado (por defecto 3000)
- [x] `NODE_ENV` configurado (development)
- [ ] `OPENAI_API_KEY` configurado ⚠️ **OBLIGATORIO**

### Para producción completa:

- [ ] `OPENAI_API_KEY` configurado
- [ ] `WHATSAPP_PHONE_NUMBER_ID` configurado
- [ ] `WHATSAPP_ACCESS_TOKEN` configurado
- [ ] `WHATSAPP_VERIFY_TOKEN` configurado
- [ ] `EMAIL_USER` configurado
- [ ] `EMAIL_PASS` configurado
- [ ] `EMAIL_TO` configurado
- [ ] Intervalos de seguimiento ajustados

---

## 🔍 Verificar Configuración Completa

### Comando para verificar todo:

```bash
# Asegúrate que el servidor esté corriendo
npm start

# En otra terminal:
curl http://localhost:3000/health/detailed
```

### Respuesta esperada:

```json
{
  "overall": "healthy",
  "components": {
    "database": {
      "status": "healthy"
    },
    "openai": {
      "status": "healthy"
    },
    "whatsapp": {
      "status": "healthy"
    },
    "email": {
      "status": "healthy"
    }
  }
}
```

### Si algo está mal configurado:

```json
{
  "overall": "degraded",
  "components": {
    "openai": {
      "status": "unhealthy",
      "message": "OpenAI API Key not configured"
    }
  }
}
```

---

## 🛠️ Troubleshooting

### "OpenAI API Key not configured"

**Solución:**
1. Verifica que `.env` tenga `OPENAI_API_KEY=sk-proj-...`
2. Reinicia el servidor: `npm start`
3. Verifica que no haya espacios extras en la key

### "Invalid OpenAI API Key"

**Solución:**
1. Verifica que la key sea correcta
2. Verifica que tenga créditos en OpenAI
3. Genera una nueva key en: https://platform.openai.com/api-keys

### "Email authentication failed"

**Solución (Gmail):**
1. Verifica que la autenticación de 2 pasos esté activada
2. Usa una App Password, NO tu contraseña normal
3. Verifica que no haya espacios en `EMAIL_PASS`

### "WhatsApp webhook verification failed"

**Solución:**
1. Verifica que `WHATSAPP_VERIFY_TOKEN` coincida exactamente
2. Verifica que la URL del webhook sea correcta
3. Verifica que el servidor esté accesible desde internet

### Variables no se aplican

**Solución:**
1. **Reinicia el servidor** después de cambiar `.env`
2. Verifica que el archivo se llame exactamente `.env` (no `.env.txt`)
3. Verifica que esté en la raíz del proyecto (junto a `package.json`)

---

## 📂 Estructura de Archivos

```
ia-comercial/
├── .env                    ← Aquí van tus credenciales (NO subir a git)
├── .env.example            ← Ejemplo sin credenciales reales
├── .gitignore              ← Debe incluir .env
├── package.json
└── ...
```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE:

1. **NUNCA subas `.env` a git**
   - Verifica que `.env` esté en `.gitignore`
   - Si accidentalmente lo subiste, cambia todas las keys inmediatamente

2. **No compartas las keys**
   - Son como contraseñas
   - Cada persona/servidor debe tener sus propias keys

3. **Rota las keys periódicamente**
   - Cambia las keys cada 3-6 meses
   - Si sospechas que fueron expuestas, cámbialas inmediatamente

4. **Usa .env.example para documentar**
   - Sube `.env.example` a git con valores de ejemplo
   - NUNCA pongas credenciales reales en `.env.example`

---

## 🎯 Configuraciones Recomendadas por Entorno

### Desarrollo Local:

```env
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-proj-...
# WhatsApp y Email opcionales
```

### Staging/Pruebas:

```env
NODE_ENV=development
PORT=3000
OPENAI_API_KEY=sk-proj-...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
EMAIL_USER=...
EMAIL_TO=pruebas@empresa.com
```

### Producción:

```env
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=sk-proj-...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
EMAIL_USER=...
EMAIL_TO=ventas@empresa.com
FOLLOW_UP_CALIENTE_INTERVAL_MINUTES=15
FOLLOW_UP_TIBIO_INTERVAL_HOURS=2
```

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. **Revisa los logs:**
   ```bash
   # Los logs muestran errores detallados
   npm start
   ```

2. **Verifica el health check:**
   ```bash
   curl http://localhost:3000/health/detailed
   ```

3. **Consulta la documentación:**
   - `INICIO-RAPIDO.md` - Configuración inicial
   - `WHATSAPP-INTEGRACION.md` - WhatsApp específico
   - `API.md` - Documentación completa de APIs

---

**Última actualización:** Enero 2026  
**Versión:** 1.0

