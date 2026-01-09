# 📦 Resumen: Despliegue en DigitalOcean

## 🎯 Guías Disponibles

He creado **3 guías completas** para desplegar tu sistema:

### 1️⃣ **DESPLIEGUE-DIGITALOCEAN.md** (Guía Completa)
- ✅ 15 pasos detallados
- ✅ Explicaciones completas
- ✅ Troubleshooting
- ✅ Configuración de seguridad
- ✅ Monitoreo y mantenimiento
- ⏱️ **Tiempo:** 60-90 minutos (primera vez)

### 2️⃣ **DESPLIEGUE-RAPIDO.md** (Express)
- ✅ Comandos de copy/paste
- ✅ Sin explicaciones largas
- ✅ Solo lo esencial
- ⏱️ **Tiempo:** 30 minutos

### 3️⃣ **ARQUITECTURA-PRODUCCION.md** (Referencia Técnica)
- ✅ Diagramas de arquitectura
- ✅ Flujo de requests
- ✅ Capas de seguridad
- ✅ Optimizaciones
- ✅ Escalabilidad

---

## 🚀 Proceso de Despliegue (Resumen)

```
1. Crear Droplet en DigitalOcean
   ↓
2. Instalar Node.js, Nginx, PM2, Certbot
   ↓
3. Clonar repositorio de GitHub
   ↓
4. Configurar .env con credenciales
   ↓
5. Iniciar app con PM2
   ↓
6. Configurar Nginx como reverse proxy
   ↓
7. Configurar dominio (DNS)
   ↓
8. Instalar SSL con Let's Encrypt
   ↓
9. Configurar firewall (UFW)
   ↓
10. Configurar webhooks en Meta Developers
   ↓
✅ Sistema en producción con HTTPS
```

---

## 💰 Costos Mensuales Estimados

| Servicio | Costo |
|----------|-------|
| DigitalOcean Droplet (2GB RAM) | $12/mes |
| Dominio (.com) | ~$1/mes ($12/año) |
| SSL Certificate (Let's Encrypt) | **GRATIS** |
| OpenAI API | Variable (según uso) |
| **Total infraestructura** | **~$13/mes** |

---

## 🎯 Lo que tendrás después del despliegue

### ✅ URLs en Producción

```
🌐 Chat Cliente:
https://tuempresa.com/

📊 Dashboard:
https://tuempresa.com/dashboard

🎭 Modo Demo:
https://tuempresa.com/demo

❤️ Health Check:
https://tuempresa.com/health/detailed

💚 WhatsApp Webhook:
https://tuempresa.com/api/whatsapp/webhook

📸 Instagram Webhook:
https://tuempresa.com/api/instagram/webhook
```

### ✅ Características

- 🔒 **HTTPS seguro** (SSL con Let's Encrypt)
- 🔄 **Renovación automática** de certificado SSL
- 🚀 **Auto-restart** con PM2 si la app cae
- 🛡️ **Firewall** configurado (UFW)
- 📊 **Monitoreo** en tiempo real con PM2
- 📝 **Logs** estructurados
- 🔔 **Webhooks** funcionando para WhatsApp e Instagram
- 💾 **Base de datos** SQLite persistente
- 🎨 **Frontend** servido eficientemente por Nginx

---

## 📋 Checklist de Prerequisitos

Antes de empezar, asegúrate de tener:

### Cuentas
- [ ] Cuenta de DigitalOcean (https://digitalocean.com)
- [ ] Dominio registrado (ej: GoDaddy, Namecheap)
- [ ] API Key de OpenAI con créditos
- [ ] Cuenta de Gmail para notificaciones
- [ ] (Opcional) WhatsApp Business API
- [ ] (Opcional) Instagram Business Account

### Credenciales Preparadas
- [ ] `OPENAI_API_KEY`
- [ ] `EMAIL_USER` y `EMAIL_PASSWORD` (App Password de Gmail)
- [ ] `OWNER_EMAIL` (donde llegarán notificaciones)
- [ ] `WHATSAPP_ACCESS_TOKEN` (si aplica)
- [ ] `IG_PAGE_TOKEN` (si aplica)

### Conocimientos
- [ ] Uso básico de terminal/SSH
- [ ] Edición básica con nano o vim
- [ ] Configuración de DNS (A records)

---

## 🎓 Recomendación de Guía

### Si es tu primera vez:
👉 **Usa DESPLIEGUE-DIGITALOCEAN.md**
- Explicaciones detalladas
- Aprenderás cada paso
- Troubleshooting incluido

### Si ya tienes experiencia:
👉 **Usa DESPLIEGUE-RAPIDO.md**
- Comandos directos
- Sin explicaciones largas
- En 30 minutos está listo

### Si quieres entender la arquitectura:
👉 **Lee ARQUITECTURA-PRODUCCION.md**
- Diagramas visuales
- Flujos de datos
- Optimizaciones avanzadas

---

## 📊 Stack Tecnológico en Producción

```
┌─────────────────────────────────────┐
│   Frontend (Cliente/Dashboard)     │
│   HTML, CSS, JavaScript             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Nginx (Reverse Proxy + SSL)      │
│   Let's Encrypt                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   PM2 (Process Manager)             │
│   Auto-restart, Clustering          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Node.js + Express                 │
│   Clean Architecture + DDD          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   SQLite (better-sqlite3)           │
│   Leads, Conversations, Followups   │
└─────────────────────────────────────┘

External APIs:
├── OpenAI (GPT-4o-mini)
├── WhatsApp Cloud API
├── Instagram Messaging API
└── Gmail SMTP
```

---

## 🔐 Seguridad en Producción

### ✅ Implementado
- 🔒 HTTPS/SSL (Let's Encrypt)
- 🛡️ Firewall (UFW)
- 🔑 SSH con claves (recomendado)
- 📝 Logs de acceso
- 🚫 `.env` protegido (chmod 600)
- 🔐 Secrets no expuestos

### 🎯 Mejoras Futuras (Opcional)
- 🔐 Autenticación en dashboard (JWT)
- 🚦 Rate limiting en Nginx
- 📊 Monitoreo con PM2 Plus
- 💾 Backups automáticos diarios
- 🌐 CDN para assets estáticos

---

## 🚀 Comandos Esenciales Post-Despliegue

```bash
# Ver status de la app
pm2 status

# Ver logs en tiempo real
pm2 logs ia-comercial

# Reiniciar app
pm2 restart ia-comercial

# Ver métricas (CPU, RAM)
pm2 monit

# Actualizar código desde GitHub
cd /var/www/ia-comercial
git pull origin main
npm install --production
pm2 restart ia-comercial

# Ver logs de Nginx
tail -f /var/log/nginx/ia-comercial-access.log

# Verificar SSL
certbot certificates

# Verificar firewall
ufw status
```

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

**1. App no inicia:**
```bash
pm2 logs ia-comercial --err
# Verificar .env y credenciales
```

**2. Error 502 Bad Gateway:**
```bash
pm2 status
# Verificar que la app esté corriendo
systemctl restart nginx
```

**3. SSL no funciona:**
```bash
certbot renew
nginx -t
systemctl restart nginx
```

**4. Webhooks no llegan:**
```bash
# Verificar en Meta Developers que:
# - Callback URL está bien escrita
# - Verify Token coincide con .env
# - Eventos están suscritos (messages)
```

Ver guía completa en `DESPLIEGUE-DIGITALOCEAN.md` Paso 14.

---

## 📈 Métricas de Éxito

Tu sistema estará funcionando correctamente si:

✅ `https://tuempresa.com` carga el chat  
✅ `https://tuempresa.com/health/detailed` responde con JSON  
✅ `pm2 status` muestra estado "online"  
✅ Logs no muestran errores críticos  
✅ Puedes crear leads desde el chat  
✅ Dashboard muestra los leads  
✅ Webhooks reciben mensajes de WhatsApp/Instagram  
✅ Notificaciones por email funcionan  
✅ SSL certificado es válido (candado verde en navegador)  

---

## 🎉 Resultado Final

Después del despliegue tendrás:

```
✅ Sistema en producción con HTTPS
✅ URL profesional: https://tuempresa.com
✅ SSL válido y renovación automática
✅ 99.9% uptime con PM2
✅ Webhooks configurados y funcionando
✅ Notificaciones automáticas
✅ Logs y monitoreo en tiempo real
✅ Firewall y seguridad configurada
✅ Listo para recibir clientes reales
```

**Costo:** ~$13/mes  
**Tiempo de despliegue:** 30-90 minutos  
**Mantenimiento:** Mínimo (actualizaciones ocasionales)

---

## 📚 Archivos de Referencia

| Archivo | Propósito | Cuándo usar |
|---------|-----------|-------------|
| `DESPLIEGUE-DIGITALOCEAN.md` | Guía paso a paso completa | Primera vez, aprender cada paso |
| `DESPLIEGUE-RAPIDO.md` | Comandos rápidos | Ya tienes experiencia |
| `ARQUITECTURA-PRODUCCION.md` | Diagramas y arquitectura | Entender el sistema completo |
| `README.md` | Documentación general | Referencia del proyecto |
| `README-INSTAGRAM.md` | Configuración de Instagram | Setup de Instagram Business |
| `WHATSAPP-INTEGRACION.md` | Configuración de WhatsApp | Setup de WhatsApp Cloud API |

---

## 🎯 Siguiente Paso

**Elige tu guía y comienza el despliegue:**

### Opción 1: Despliegue Completo (Recomendado primera vez)
```bash
# Abre y sigue:
DESPLIEGUE-DIGITALOCEAN.md
```

### Opción 2: Despliegue Rápido (Si tienes experiencia)
```bash
# Abre y sigue:
DESPLIEGUE-RAPIDO.md
```

### Opción 3: Entender arquitectura primero
```bash
# Lee primero:
ARQUITECTURA-PRODUCCION.md
```

---

**¡Tu sistema está listo para producción! 🚀**

**Todas las guías están disponibles en:**
```
https://github.com/ignacioargenis-dev/ia-comercial
```

