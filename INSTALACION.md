# 📦 Guía de Instalación - IA Comercial

Esta guía te ayudará a instalar y configurar el sistema IA Comercial paso a paso.

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### 1. Node.js
Versión 16 o superior recomendada.

**Verificar instalación:**
```bash
node --version
npm --version
```

**Si no está instalado:**
- Windows: Descargar desde [nodejs.org](https://nodejs.org/)
- Mac: `brew install node`
- Linux: `sudo apt install nodejs npm`

### 2. Cuenta de OpenAI
Necesitarás una API Key de OpenAI.

**Obtener API Key:**
1. Visita [platform.openai.com](https://platform.openai.com/)
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva API Key
5. Copia la clave (guárdala en un lugar seguro)

### 3. (Opcional) WhatsApp Business Account
Solo si quieres habilitar WhatsApp desde el inicio.

**Requisitos:**
- Cuenta de Meta for Developers
- Número de teléfono verificado
- WhatsApp Business App configurada

## 🚀 Instalación

### Paso 1: Descargar o Clonar el Proyecto

Si tienes el proyecto en un ZIP:
```bash
# Descomprimir y entrar a la carpeta
cd ia-comercial
```

Si usas Git:
```bash
git clone <url-del-repositorio>
cd ia-comercial
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todos los paquetes necesarios:
- Express (servidor web)
- OpenAI (integración con IA)
- Better-sqlite3 (base de datos)
- Axios (peticiones HTTP)
- Cors (seguridad)
- Dotenv (variables de entorno)

**Tiempo estimado:** 2-3 minutos

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
```

En Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

Ahora edita el archivo `.env` con tus datos:

```env
# Puerto del servidor
PORT=3000

# OpenAI API Key (OBLIGATORIO)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Datos de tu negocio
BUSINESS_NAME=Mi Empresa
BUSINESS_PHONE=+56912345678
OWNER_EMAIL=propietario@miempresa.com
OWNER_PHONE=+56912345678

# WhatsApp (opcional por ahora)
# WHATSAPP_API_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123
```

### Paso 4: Personalizar el Prompt del Asistente

Edita el archivo `prompts/systemPrompt.txt` para personalizar:
- Servicios que ofreces
- Tono y estilo de respuesta
- Información específica de tu negocio

Reemplaza `{BUSINESS_NAME}` manualmente o déjalo así (se reemplazará automáticamente con el valor de `.env`).

### Paso 5: Probar la Instalación

```bash
npm start
```

Deberías ver algo como:

```
╔══════════════════════════════════════════╗
║       🤖 IA COMERCIAL INICIADO 🤖       ║
╚══════════════════════════════════════════╝

🌐 Servidor corriendo en: http://localhost:3000
📊 Panel de administración: http://localhost:3000
💬 Endpoint de chat: http://localhost:3000/chat
📱 Webhook de WhatsApp: http://localhost:3000/whatsapp/webhook
📋 API de leads: http://localhost:3000/leads

✅ Sistema listo para recibir consultas
```

### Paso 6: Acceder al Panel

Abre tu navegador y ve a:
```
http://localhost:3000
```

Deberías ver el panel de administración de leads.

## 🧪 Probar el Sistema

### Probar el Chat Web

1. En el panel (http://localhost:3000), haz clic en el botón flotante 💬
2. Escribe un mensaje como "Hola"
3. El asistente debería responder
4. Proporciona datos de prueba (nombre, teléfono, etc.)
5. Verifica que el lead aparezca en la tabla

### Probar con API directamente

```bash
# Enviar mensaje
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "sessionId": "test123"}'

# Ver leads
curl http://localhost:3000/leads
```

## 🔧 Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### Error: "OPENAI_API_KEY is not set"
Verifica que:
1. El archivo `.env` existe
2. La variable `OPENAI_API_KEY` está configurada
3. No hay espacios extra en la clave

### Error: "EADDRINUSE" (puerto en uso)
Cambia el puerto en `.env`:
```env
PORT=3001
```

### La base de datos no se crea
Verifica permisos de escritura en la carpeta `db/`:
```bash
mkdir -p db
chmod 755 db
```

### El asistente no responde
1. Verifica tu saldo en OpenAI
2. Revisa la consola para ver errores
3. Verifica tu conexión a internet

## 📱 Configurar WhatsApp (Opcional)

Si quieres habilitar WhatsApp más adelante, sigue estos pasos:

### 1. Crear App en Meta for Developers

1. Ve a [developers.facebook.com](https://developers.facebook.com/)
2. Crea una nueva app
3. Agrega el producto "WhatsApp"

### 2. Configurar Webhook

1. En la configuración de WhatsApp, ve a "Configuración"
2. Callback URL: `https://tu-dominio.com/whatsapp/webhook`
3. Token de verificación: El mismo que pusiste en `WHATSAPP_VERIFY_TOKEN`
4. Suscríbete a "messages"

### 3. Obtener Credenciales

1. Copia el `Access Token` → `WHATSAPP_API_TOKEN`
2. Copia el `Phone Number ID` → `WHATSAPP_PHONE_NUMBER_ID`

### 4. Actualizar .env

```env
WHATSAPP_API_TOKEN=tu_token_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_id_aqui
WHATSAPP_VERIFY_TOKEN=mi_token_secreto_123
```

### 5. Reiniciar servidor

```bash
npm start
```

## 🌐 Desplegar en Producción

### Opción 1: VPS (Recomendado)

1. Contratar un VPS (DigitalOcean, AWS, Linode, etc.)
2. Subir el proyecto
3. Instalar Node.js
4. Configurar `.env`
5. Usar PM2 para mantener el servidor activo:

```bash
npm install -g pm2
pm2 start server.js --name ia-comercial
pm2 save
pm2 startup
```

### Opción 2: Heroku

```bash
# Instalar Heroku CLI
# Crear app
heroku create mi-ia-comercial

# Configurar variables de entorno
heroku config:set OPENAI_API_KEY=tu_clave
heroku config:set BUSINESS_NAME="Mi Empresa"

# Desplegar
git push heroku main
```

### Opción 3: Railway / Render

1. Conectar repositorio
2. Configurar variables de entorno
3. Desplegar automáticamente

## 📊 Mantenimiento

### Ver logs en producción
```bash
pm2 logs ia-comercial
```

### Reiniciar servidor
```bash
pm2 restart ia-comercial
```

### Backup de base de datos
```bash
cp db/leads.db db/leads-backup-$(date +%Y%m%d).db
```

### Actualizar dependencias
```bash
npm update
```

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de la consola
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de tener saldo en tu cuenta de OpenAI
4. Revisa la documentación de OpenAI y WhatsApp Cloud API

## ✅ Checklist de Instalación

- [ ] Node.js instalado
- [ ] Proyecto descargado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` creado y configurado
- [ ] OpenAI API Key configurada
- [ ] Prompt personalizado
- [ ] Servidor iniciado sin errores
- [ ] Panel accesible en navegador
- [ ] Chat de prueba funcional
- [ ] Lead de prueba creado correctamente

¡Listo! Tu sistema IA Comercial está funcionando. 🎉

