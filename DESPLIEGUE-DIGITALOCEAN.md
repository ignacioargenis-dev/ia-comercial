# 🚀 Guía Completa de Despliegue en DigitalOcean

Esta guía te llevará paso a paso desde cero hasta tener tu sistema de IA Comercial funcionando en producción con HTTPS.

---

## 📋 Prerrequisitos

Antes de comenzar, necesitas:

### ✅ Cuentas y Servicios
- [ ] Cuenta de DigitalOcean (https://digitalocean.com)
- [ ] Dominio propio (ej: `tuempresa.com`)
- [ ] Cuenta de OpenAI con créditos
- [ ] (Opcional) WhatsApp Business API configurada
- [ ] (Opcional) Instagram Business Account

### ✅ Conocimientos Básicos
- Uso básico de terminal/SSH
- Configuración de DNS
- Conceptos básicos de servidores

### 💰 Costos Estimados
- **Droplet básico:** $6-12/mes
- **Dominio:** $10-15/año
- **OpenAI API:** Variable según uso
- **Total mensual:** ~$10-20/mes

---

## 🎯 Arquitectura del Despliegue

```
Internet
   ↓
Dominio (tuempresa.com)
   ↓
DigitalOcean Droplet
   ↓
Nginx (Reverse Proxy + SSL)
   ↓
Node.js App (Puerto 3000)
   ↓
PM2 (Process Manager)
   ↓
SQLite Database
```

---

## 📦 PASO 1: Crear Droplet en DigitalOcean

### 1.1 Ingresar a DigitalOcean

1. Ve a https://cloud.digitalocean.com
2. Click en **"Create"** → **"Droplets"**

### 1.2 Configurar el Droplet

**Choose an image:**
- ✅ **Ubuntu 22.04 (LTS) x64** (Recomendado)

**Choose Size:**
- ✅ **Basic** (suficiente para empezar)
- ✅ **Regular** → **$12/month** (2 GB RAM, 1 vCPU, 50 GB SSD)
  - Para más tráfico: $24/month (4 GB RAM, 2 vCPU)

**Choose a datacenter region:**
- ✅ **New York** (si tus clientes están en América)
- ✅ **San Francisco** (West Coast)
- ✅ **Toronto** (Canadá)
- ✅ **Frankfurt** (Europa)

**Authentication:**
- ✅ **SSH Key** (Más seguro - recomendado)
  - Si no tienes una, click "New SSH Key"
  - Sigue las instrucciones para generar y agregar tu clave
- ⬜ Password (Menos seguro)

**Hostname:**
- Nombre descriptivo: `ia-comercial-prod`

### 1.3 Crear el Droplet

1. Click **"Create Droplet"**
2. Espera 1-2 minutos
3. **Copia la IP del Droplet** (ej: `165.227.123.45`)

---

## 🔐 PASO 2: Conectarse al Servidor

### 2.1 Conectar por SSH

```bash
# Reemplaza con tu IP
ssh root@165.227.123.45
```

Si usas Windows sin WSL, puedes usar **PuTTY** o **PowerShell**:
```powershell
ssh root@165.227.123.45
```

### 2.2 Actualizar el Sistema

```bash
# Actualizar paquetes
apt update && apt upgrade -y
```

---

## 🛠️ PASO 3: Instalar Software Necesario

### 3.1 Instalar Node.js (v18 LTS)

```bash
# Agregar repositorio de NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalación
node --version  # Debería mostrar v18.x.x
npm --version   # Debería mostrar 9.x.x
```

### 3.2 Instalar Git

```bash
apt install -y git

# Verificar
git --version
```

### 3.3 Instalar PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar
pm2 --version
```

### 3.4 Instalar Nginx (Reverse Proxy)

```bash
# Instalar Nginx
apt install -y nginx

# Verificar que esté corriendo
systemctl status nginx

# Habilitar inicio automático
systemctl enable nginx
```

### 3.5 Instalar Certbot (SSL Certificates)

```bash
# Instalar Certbot para Nginx
apt install -y certbot python3-certbot-nginx
```

---

## 📂 PASO 4: Clonar el Repositorio

### 4.1 Crear directorio para la aplicación

```bash
# Crear directorio
mkdir -p /var/www
cd /var/www

# Clonar tu repositorio
git clone https://github.com/ignacioargenis-dev/ia-comercial.git

# Entrar al directorio
cd ia-comercial
```

### 4.2 Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install --production

# Verificar que no haya errores
```

---

## 🔧 PASO 5: Configurar Variables de Entorno

### 5.1 Crear archivo .env

```bash
# Copiar el ejemplo
cp .env.example .env

# Editar con nano (o vim si prefieres)
nano .env
```

### 5.2 Configurar todas las variables

```env
# ═══════════════════════════════════════════════════════════════
# Producción - DigitalOcean
# ═══════════════════════════════════════════════════════════════

# OpenAI (OBLIGATORIO)
OPENAI_API_KEY=sk-tu-clave-real-de-openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT=30000
OPENAI_MAX_RETRIES=3

# Email (OBLIGATORIO)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
OWNER_EMAIL=dueño@negocio.com
BUSINESS_NAME=Tu Negocio

# WhatsApp (Si lo usas)
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxx...
WHATSAPP_VERIFY_TOKEN=tu_token_secreto
WHATSAPP_API_VERSION=v21.0

# Instagram (Si lo usas)
IG_PAGE_TOKEN=EAAyy...
IG_VERIFY_TOKEN=tu_token_instagram

# Base de Datos
DATABASE_PATH=/var/www/ia-comercial/db/leads.db

# Servidor
PORT=3000
NODE_ENV=production

# Logging
LOG_LEVEL=info
LOG_FILE=/var/www/ia-comercial/logs/combined.log

# Seguimiento Automático
FOLLOWUP_HOT_INTERVAL=0.5
FOLLOWUP_WARM_INTERVAL=2
FOLLOWUP_DAILY_REPORT_HOUR=8
```

**Guardar y salir:**
- Presiona `Ctrl + X`
- Presiona `Y` (Yes)
- Presiona `Enter`

### 5.3 Proteger el archivo .env

```bash
# Solo el owner puede leer/escribir
chmod 600 .env

# Verificar permisos
ls -la .env
# Debería mostrar: -rw------- 1 root root ...
```

---

## 🚀 PASO 6: Iniciar la Aplicación con PM2

### 6.1 Crear directorio para logs

```bash
mkdir -p /var/www/ia-comercial/logs
mkdir -p /var/www/ia-comercial/db
```

### 6.2 Iniciar con PM2

```bash
# Ir al directorio de la app
cd /var/www/ia-comercial

# Iniciar con PM2
pm2 start server.js --name ia-comercial

# Ver status
pm2 status

# Ver logs en tiempo real
pm2 logs ia-comercial
```

### 6.3 Configurar PM2 para inicio automático

```bash
# Guardar la configuración actual
pm2 save

# Generar script de inicio automático
pm2 startup systemd

# Ejecutar el comando que PM2 te muestra
# (Será algo como: sudo env PATH=... pm2 startup ...)
```

### 6.4 Verificar que funciona

```bash
# Probar la API
curl http://localhost:3000/health/detailed

# Debería responder con JSON de health check
```

---

## 🌐 PASO 7: Configurar Dominio (DNS)

### 7.1 Agregar registros DNS

En tu proveedor de dominio (ej: GoDaddy, Namecheap, etc.):

**Registro A:**
```
Type: A
Host: @
Value: 165.227.123.45  (Tu IP de DigitalOcean)
TTL: 3600
```

**Registro A (subdominio www):**
```
Type: A
Host: www
Value: 165.227.123.45
TTL: 3600
```

**Registro A (subdominio api - opcional):**
```
Type: A
Host: api
Value: 165.227.123.45
TTL: 3600
```

### 7.2 Esperar propagación DNS

- Puede tomar de 5 minutos a 48 horas
- Verifica en: https://dnschecker.org

---

## 🔒 PASO 8: Configurar Nginx como Reverse Proxy

### 8.1 Crear configuración de Nginx

```bash
# Crear archivo de configuración
nano /etc/nginx/sites-available/ia-comercial
```

### 8.2 Agregar configuración (SIN SSL por ahora)

```nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name tuempresa.com www.tuempresa.com;
    
    # Logs
    access_log /var/log/nginx/ia-comercial-access.log;
    error_log /var/log/nginx/ia-comercial-error.log;
    
    # Reverse proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Limitar tamaño de uploads
    client_max_body_size 10M;
}
```

**IMPORTANTE:** Reemplaza `tuempresa.com` con tu dominio real.

**Guardar:** `Ctrl + X` → `Y` → `Enter`

### 8.3 Habilitar el sitio

```bash
# Crear symlink
ln -s /etc/nginx/sites-available/ia-comercial /etc/nginx/sites-enabled/

# Eliminar sitio default (opcional)
rm /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t

# Si todo está OK, reiniciar Nginx
systemctl restart nginx
```

### 8.4 Verificar

```bash
# Probar desde el servidor
curl http://tuempresa.com/health/detailed

# O desde tu navegador (reemplaza con tu dominio)
http://tuempresa.com
```

---

## 🔐 PASO 9: Configurar SSL con Let's Encrypt

### 9.1 Obtener certificado SSL

```bash
# Ejecutar Certbot (reemplaza con tu dominio y email)
certbot --nginx -d tuempresa.com -d www.tuempresa.com --email tu-email@gmail.com --agree-tos --no-eff-email
```

Certbot automáticamente:
- ✅ Obtiene el certificado
- ✅ Configura Nginx para usar SSL
- ✅ Configura redirección HTTP → HTTPS

### 9.2 Verificar SSL

```bash
# Ver certificados instalados
certbot certificates

# Probar renovación automática
certbot renew --dry-run
```

### 9.3 Acceder con HTTPS

Ahora tu sitio está en:
```
https://tuempresa.com
https://www.tuempresa.com
```

**Certificado se renovará automáticamente cada 90 días.**

---

## 🔗 PASO 10: Configurar Webhooks (WhatsApp e Instagram)

### 10.1 URLs de Webhooks

Tus webhooks ahora están en:

**WhatsApp:**
```
https://tuempresa.com/api/whatsapp/webhook
```

**Instagram:**
```
https://tuempresa.com/api/instagram/webhook
```

### 10.2 Configurar en Meta Developers

#### Para WhatsApp:

1. Ve a https://developers.facebook.com
2. Tu App → WhatsApp → Configuration
3. **Callback URL:** `https://tuempresa.com/api/whatsapp/webhook`
4. **Verify Token:** El valor de `WHATSAPP_VERIFY_TOKEN` en tu `.env`
5. Click **"Verify and Save"**
6. **Subscribe to:** `messages`

#### Para Instagram:

1. Ve a https://developers.facebook.com
2. Tu App → Products → Messenger → Instagram Settings
3. **Callback URL:** `https://tuempresa.com/api/instagram/webhook`
4. **Verify Token:** El valor de `IG_VERIFY_TOKEN` en tu `.env`
5. Click **"Verify and Save"**
6. **Subscribe to:** `messages`

### 10.3 Verificar Webhooks

```bash
# Ver logs de Nginx
tail -f /var/log/nginx/ia-comercial-access.log

# Ver logs de la app
pm2 logs ia-comercial

# Enviar mensaje de prueba por WhatsApp/Instagram
# Deberías ver la petición en los logs
```

---

## 🔥 PASO 11: Configurar Firewall (UFW)

### 11.1 Configurar reglas básicas

```bash
# Habilitar UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Verificar status
ufw status
```

Debería mostrar:
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

---

## 📊 PASO 12: Monitoreo y Mantenimiento

### 12.1 Ver logs de la aplicación

```bash
# Logs en tiempo real
pm2 logs ia-comercial

# Solo errores
pm2 logs ia-comercial --err

# Últimas 100 líneas
pm2 logs ia-comercial --lines 100
```

### 12.2 Ver métricas

```bash
# Monitor en tiempo real
pm2 monit

# Información detallada
pm2 info ia-comercial
```

### 12.3 Comandos útiles de PM2

```bash
# Reiniciar app
pm2 restart ia-comercial

# Detener app
pm2 stop ia-comercial

# Iniciar app
pm2 start ia-comercial

# Eliminar de PM2
pm2 delete ia-comercial

# Ver todas las apps
pm2 list

# Guardar configuración
pm2 save
```

### 12.4 Ver logs del sistema

```bash
# Logs de Nginx (acceso)
tail -f /var/log/nginx/ia-comercial-access.log

# Logs de Nginx (errores)
tail -f /var/log/nginx/ia-comercial-error.log

# Uso de disco
df -h

# Uso de memoria
free -h

# Procesos activos
htop  # (instalar con: apt install htop)
```

---

## 🔄 PASO 13: Actualizaciones Futuras

### 13.1 Actualizar el código

```bash
# Conectar por SSH
ssh root@165.227.123.45

# Ir al directorio
cd /var/www/ia-comercial

# Pull cambios de GitHub
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install --production

# Reiniciar app
pm2 restart ia-comercial

# Verificar que funciona
pm2 logs ia-comercial
```

### 13.2 Actualizar Node.js

```bash
# Ver versión actual
node --version

# Actualizar a nueva versión LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt update && apt upgrade -y

# Reiniciar app
pm2 restart ia-comercial
```

---

## 🆘 PASO 14: Troubleshooting

### Problema 1: App no inicia

```bash
# Ver logs
pm2 logs ia-comercial --err

# Verificar puerto 3000
netstat -tulpn | grep 3000

# Verificar .env
cat /var/www/ia-comercial/.env

# Reiniciar
pm2 restart ia-comercial
```

### Problema 2: Error 502 Bad Gateway

```bash
# Verificar que la app esté corriendo
pm2 status

# Ver logs de Nginx
tail -50 /var/log/nginx/ia-comercial-error.log

# Reiniciar Nginx
systemctl restart nginx

# Reiniciar app
pm2 restart ia-comercial
```

### Problema 3: SSL no funciona

```bash
# Ver certificados
certbot certificates

# Renovar manualmente
certbot renew

# Ver configuración de Nginx
cat /etc/nginx/sites-available/ia-comercial

# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### Problema 4: Webhooks no llegan

```bash
# Ver logs en tiempo real
pm2 logs ia-comercial

# Verificar que el endpoint responde
curl https://tuempresa.com/api/instagram/webhook

# Ver configuración en Meta
# Verificar que Callback URL y Verify Token coincidan
```

### Problema 5: Disco lleno

```bash
# Ver uso de disco
df -h

# Ver archivos más grandes
du -h /var/www/ia-comercial | sort -rh | head -20

# Limpiar logs viejos
pm2 flush  # Limpia logs de PM2

# Limpiar logs de Nginx
truncate -s 0 /var/log/nginx/*.log

# Rotar logs automáticamente (ya configurado por defecto)
```

---

## 📋 PASO 15: Checklist Final de Verificación

### ✅ Servidor
- [ ] Droplet creado y accesible por SSH
- [ ] Sistema actualizado (`apt update && apt upgrade`)
- [ ] Node.js instalado (v18+)
- [ ] PM2 instalado y configurado
- [ ] Nginx instalado y corriendo
- [ ] Certbot instalado

### ✅ Aplicación
- [ ] Código clonado desde GitHub
- [ ] Dependencias instaladas (`npm install`)
- [ ] `.env` configurado con todas las variables
- [ ] App corriendo con PM2 (`pm2 list`)
- [ ] PM2 configurado para inicio automático (`pm2 startup`)

### ✅ Dominio y SSL
- [ ] DNS configurado (A record apuntando a IP del Droplet)
- [ ] Nginx configurado como reverse proxy
- [ ] SSL instalado con Let's Encrypt
- [ ] HTTPS funcionando (`https://tuempresa.com`)
- [ ] Redirección HTTP → HTTPS funcionando

### ✅ APIs Externas
- [ ] OpenAI API funcionando (health check verde)
- [ ] Email configurado y probado
- [ ] WhatsApp webhook configurado (si aplica)
- [ ] Instagram webhook configurado (si aplica)

### ✅ Seguridad
- [ ] Firewall configurado (UFW)
- [ ] `.env` con permisos restrictivos (chmod 600)
- [ ] SSH con clave (no password)
- [ ] Nginx configurado con headers de seguridad

### ✅ Funcionalidad
- [ ] Chat web funciona (`https://tuempresa.com/`)
- [ ] Dashboard accesible (`https://tuempresa.com/dashboard`)
- [ ] API responde (`https://tuempresa.com/health/detailed`)
- [ ] Logs funcionando (`pm2 logs`)
- [ ] Notificaciones por email funcionan

---

## 🎉 ¡Despliegue Completado!

Tu sistema de IA Comercial está ahora en producción:

```
✅ Servidor: DigitalOcean Droplet
✅ URL: https://tuempresa.com
✅ SSL: Let's Encrypt (renovación automática)
✅ Process Manager: PM2 (reinicio automático)
✅ Reverse Proxy: Nginx
✅ Firewall: UFW
✅ Webhooks: Configurados para WhatsApp e Instagram
```

---

## 📞 Comandos de Referencia Rápida

```bash
# Ver status de la app
pm2 status

# Ver logs
pm2 logs ia-comercial

# Reiniciar app
pm2 restart ia-comercial

# Ver logs de Nginx
tail -f /var/log/nginx/ia-comercial-access.log

# Actualizar código
cd /var/www/ia-comercial && git pull && npm install && pm2 restart ia-comercial

# Ver uso de recursos
htop

# Verificar SSL
certbot certificates

# Renovar SSL manualmente
certbot renew
```

---

## 📚 Documentación Adicional

- **DigitalOcean:** https://docs.digitalocean.com
- **PM2:** https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Node.js:** https://nodejs.org/en/docs/

---

**¡Tu sistema está listo para recibir clientes! 🚀**

