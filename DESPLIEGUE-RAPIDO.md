# ⚡ Despliegue Rápido en DigitalOcean (30 minutos)

Versión resumida para despliegue rápido. Ver `DESPLIEGUE-DIGITALOCEAN.md` para guía completa.

---

## 🚀 Comandos de Copy/Paste

### 1️⃣ Crear Droplet en DigitalOcean
- Ubuntu 22.04 LTS
- $12/month (2GB RAM)
- Copia la IP: `TU_IP_AQUI`

### 2️⃣ Conectar y Preparar Servidor

```bash
# Conectar por SSH (reemplaza con tu IP)
ssh root@TU_IP_AQUI

# Actualizar sistema
apt update && apt upgrade -y

# Instalar todo lo necesario
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx
npm install -g pm2

# Verificar
node --version  # v18.x.x
npm --version   # 9.x.x
pm2 --version
```

### 3️⃣ Clonar y Configurar App

```bash
# Clonar repositorio
mkdir -p /var/www
cd /var/www
git clone https://github.com/ignacioargenis-dev/ia-comercial.git
cd ia-comercial

# Instalar dependencias
npm install --production

# Crear .env
cp .env.example .env
nano .env
```

**Configurar variables mínimas en .env:**
```env
OPENAI_API_KEY=sk-tu-clave
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
OWNER_EMAIL=dueño@negocio.com
PORT=3000
NODE_ENV=production
```

**Guardar:** `Ctrl+X` → `Y` → `Enter`

```bash
# Proteger .env
chmod 600 .env

# Crear directorios
mkdir -p logs db
```

### 4️⃣ Iniciar con PM2

```bash
# Iniciar app
pm2 start server.js --name ia-comercial

# Configurar inicio automático
pm2 save
pm2 startup systemd

# Ejecutar el comando que PM2 te muestra

# Verificar
pm2 status
pm2 logs ia-comercial
```

### 5️⃣ Configurar Nginx

```bash
# Crear configuración (reemplaza tuempresa.com con tu dominio)
nano /etc/nginx/sites-available/ia-comercial
```

**Pegar esto:**
```nginx
server {
    listen 80;
    server_name tuempresa.com www.tuempresa.com;
    
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
    }
}
```

**Guardar:** `Ctrl+X` → `Y` → `Enter`

```bash
# Habilitar sitio
ln -s /etc/nginx/sites-available/ia-comercial /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Verificar y reiniciar
nginx -t
systemctl restart nginx
```

### 6️⃣ Configurar DNS

En tu proveedor de dominio:

```
Tipo: A
Host: @
Valor: TU_IP_AQUI
TTL: 3600
```

```
Tipo: A
Host: www
Valor: TU_IP_AQUI
TTL: 3600
```

**Esperar 5-30 minutos para propagación**

### 7️⃣ Instalar SSL (después de DNS)

```bash
# Instalar certificado (reemplaza con tu dominio y email)
certbot --nginx -d tuempresa.com -d www.tuempresa.com --email tu-email@gmail.com --agree-tos --no-eff-email

# Verificar
certbot certificates
```

### 8️⃣ Configurar Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## ✅ Verificación Final

```bash
# 1. App corriendo
pm2 status
# Debería mostrar: ia-comercial | online

# 2. HTTPS funciona
curl https://tuempresa.com/health/detailed
# Debería responder con JSON

# 3. Logs OK
pm2 logs ia-comercial --lines 20
# No debería haber errores críticos
```

---

## 🌐 URLs Finales

**Chat Cliente:**
```
https://tuempresa.com/
```

**Dashboard:**
```
https://tuempresa.com/dashboard
```

**Health Check:**
```
https://tuempresa.com/health/detailed
```

**WhatsApp Webhook:**
```
https://tuempresa.com/api/whatsapp/webhook
```

**Instagram Webhook:**
```
https://tuempresa.com/api/instagram/webhook
```

---

## 🔄 Actualizar Código (Futuro)

```bash
ssh root@TU_IP_AQUI
cd /var/www/ia-comercial
git pull origin main
npm install --production
pm2 restart ia-comercial
pm2 logs ia-comercial
```

---

## 🆘 Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs ia-comercial

# Reiniciar app
pm2 restart ia-comercial

# Ver status
pm2 status

# Ver métricas
pm2 monit

# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Uso de recursos
htop  # (instalar con: apt install htop)
```

---

## 🎉 ¡Listo!

Tu sistema está en producción en:
```
https://tuempresa.com
```

**Siguiente paso:** Configurar webhooks en Meta Developers (ver DESPLIEGUE-DIGITALOCEAN.md paso 10)

---

**Tiempo total:** ~30 minutos  
**Costo:** ~$12/mes

