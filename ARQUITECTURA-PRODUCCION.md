# 🏗️ Arquitectura de Producción en DigitalOcean

## 📊 Diagrama de Infraestructura

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ DNS
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    tuempresa.com                                │
│                  (Registro A → IP Droplet)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ Port 443 (HTTPS)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DIGITALOCEAN DROPLET                          │
│                    Ubuntu 22.04 LTS                             │
│                  IP: 165.227.123.45                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              UFW FIREWALL                              │    │
│  │  • Port 22  (SSH)        ✅                            │    │
│  │  • Port 80  (HTTP)       ✅ → Redirect to HTTPS       │    │
│  │  • Port 443 (HTTPS)      ✅                            │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│                   ↓                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              NGINX (Reverse Proxy)                     │    │
│  │  • SSL/TLS Termination (Let's Encrypt)                │    │
│  │  • Load Balancing                                      │    │
│  │  • Static File Serving                                 │    │
│  │  • Request Forwarding                                  │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│                   │ localhost:3000                              │
│                   ↓                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              PM2 PROCESS MANAGER                       │    │
│  │  • Auto-restart on crash                               │    │
│  │  • Cluster mode (opcional)                             │    │
│  │  • Log management                                      │    │
│  │  • Monitoring                                          │    │
│  └────────────────┬───────────────────────────────────────┘    │
│                   │                                             │
│                   ↓                                             │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           NODE.JS APPLICATION                          │    │
│  │              (server.js)                               │    │
│  │                                                        │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │        Express HTTP Server                   │     │    │
│  │  │        • Rutas API                          │     │    │
│  │  │        • Middleware                         │     │    │
│  │  │        • Archivos estáticos                 │     │    │
│  │  └──────────────┬───────────────────────────────┘     │    │
│  │                 │                                      │    │
│  │                 ↓                                      │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │        Application Layer                    │     │    │
│  │  │        • ChatService                        │     │    │
│  │  │        • Use Cases                          │     │    │
│  │  │        • Business Logic                     │     │    │
│  │  └──────────────┬───────────────────────────────┘     │    │
│  │                 │                                      │    │
│  │                 ↓                                      │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │        Domain Layer                         │     │    │
│  │  │        • Entities (Lead)                    │     │    │
│  │  │        • Services (LeadClassifier)          │     │    │
│  │  └──────────────┬───────────────────────────────┘     │    │
│  │                 │                                      │    │
│  │                 ↓                                      │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │        Infrastructure Layer                 │     │    │
│  │  │        • Database (SQLite)                  │     │    │
│  │  │        • External Services                  │     │    │
│  │  │        • Logging (Winston)                  │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              SQLITE DATABASE                           │    │
│  │              /var/www/ia-comercial/db/leads.db         │    │
│  │  • Leads                                               │    │
│  │  • Conversations                                       │    │
│  │  • Follow-ups                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              LOG FILES                                 │    │
│  │              /var/www/ia-comercial/logs/               │    │
│  │  • combined.log                                        │    │
│  │  • error.log                                           │    │
│  │  • PM2 logs                                            │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Outbound HTTPS
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIS                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   OpenAI     │  │  WhatsApp    │  │  Instagram   │         │
│  │   GPT-4      │  │  Cloud API   │  │  Messaging   │         │
│  │              │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐                                              │
│  │   Gmail      │                                              │
│  │   SMTP       │                                              │
│  │              │                                              │
│  └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Requests

### 1. Request del Cliente (Web Chat)

```
Cliente
  ↓ HTTPS GET
  https://tuempresa.com/

Nginx (Port 443)
  ↓ Sirve archivo estático
  /var/www/ia-comercial/public/index.html

Cliente recibe HTML + JS
  ↓ AJAX POST
  https://tuempresa.com/api/chat

Nginx (Port 443)
  ↓ Proxy a
  http://localhost:3000/api/chat

Node.js App
  ↓ Procesa
  ChatService → OpenAI API → LeadClassifier

Response
  ↓
Cliente
```

### 2. Webhook de WhatsApp

```
Meta Servers
  ↓ POST
  https://tuempresa.com/api/whatsapp/webhook

Nginx
  ↓ Proxy a
  http://localhost:3000/api/whatsapp/webhook

Node.js App
  ↓ Procesa mensaje
  HandleIncomingMessage → OpenAI → WhatsAppClient

WhatsApp Response
  ↓ API Call
Meta Servers
  ↓
Usuario en WhatsApp recibe respuesta
```

### 3. Webhook de Instagram

```
Meta Servers
  ↓ POST
  https://tuempresa.com/api/instagram/webhook

Nginx
  ↓ Proxy a
  http://localhost:3000/api/instagram/webhook

Node.js App
  ↓ Procesa mensaje
  HandleIncomingMessage → OpenAI → InstagramService

Instagram Response
  ↓ API Call
Meta Servers
  ↓
Usuario en Instagram recibe respuesta
```

---

## 🔐 Capas de Seguridad

### Nivel 1: Firewall (UFW)
```
Internet → UFW → Solo puertos 22, 80, 443
```

### Nivel 2: Nginx
```
- SSL/TLS encryption (Let's Encrypt)
- Rate limiting (opcional)
- Request filtering
- CORS headers
```

### Nivel 3: Node.js App
```
- Input validation (Zod)
- Environment variables (.env)
- Authentication (para dashboard - futuro)
- Error handling
```

### Nivel 4: Base de Datos
```
- Archivo local (no expuesto)
- Permisos restrictivos
- Backups regulares
```

---

## 📦 Estructura de Archivos en Producción

```
/var/www/ia-comercial/
├── server.js                    # Punto de entrada
├── package.json                 # Dependencias
├── .env                         # Variables de entorno (protegido)
│
├── src/                         # Código fuente
│   ├── application/            # Casos de uso
│   ├── domain/                 # Lógica de negocio
│   └── infrastructure/         # Implementaciones
│       ├── database/           # SQLite
│       ├── external/           # APIs externas
│       └── http/               # Express routes
│
├── public/                      # Archivos estáticos
│   ├── index.html              # Chat cliente
│   ├── dashboard.html          # Panel admin
│   ├── demo.html               # Modo demo
│   └── *.js, *.css             # Assets
│
├── config/                      # Configuración
│   └── business.json           # Config del negocio
│
├── prompts/                     # Prompts de IA
│   └── systemPrompt.txt        # Prompt principal
│
├── db/                          # Base de datos
│   └── leads.db                # SQLite (se crea automáticamente)
│
└── logs/                        # Logs
    ├── combined.log            # Todos los logs
    └── error.log               # Solo errores
```

---

## 🔍 Monitoreo en Producción

### PM2 Dashboard

```bash
# Ver todas las apps
pm2 list

# Ver métricas en tiempo real
pm2 monit

# Ver información detallada
pm2 info ia-comercial

# Ver logs
pm2 logs ia-comercial
```

### Nginx Logs

```bash
# Access logs (todas las requests)
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Logs del sitio específico
tail -f /var/log/nginx/ia-comercial-access.log
tail -f /var/log/nginx/ia-comercial-error.log
```

### Application Logs

```bash
# Ver logs de la app
tail -f /var/www/ia-comercial/logs/combined.log

# Solo errores
tail -f /var/www/ia-comercial/logs/error.log

# Con PM2
pm2 logs ia-comercial --lines 100
```

### Sistema

```bash
# Uso de CPU y RAM
htop

# Uso de disco
df -h

# Espacio usado por directorio
du -sh /var/www/ia-comercial

# Conexiones activas
netstat -an | grep ESTABLISHED | wc -l

# Procesos de Node.js
ps aux | grep node
```

---

## 🚨 Alertas y Notificaciones

### Configurar PM2 Plus (Opcional)

```bash
# Registrarse en PM2 Plus
pm2 plus

# Conectar el servidor
pm2 link <secret_key> <public_key>

# Configurar alertas por email/Slack
# https://app.pm2.io
```

### Monitoreo de Uptime

Servicios recomendados (gratuitos):
- **UptimeRobot** (https://uptimerobot.com)
- **Pingdom** (https://pingdom.com)
- **Better Uptime** (https://betteruptime.com)

Configurar:
- URL: `https://tuempresa.com/health/detailed`
- Intervalo: 5 minutos
- Alertas: Email/SMS cuando caiga

---

## 💾 Backups

### Base de Datos

```bash
# Crear backup manual
cp /var/www/ia-comercial/db/leads.db /var/www/ia-comercial/db/leads.db.backup

# Crear backup con timestamp
cp /var/www/ia-comercial/db/leads.db /var/www/ia-comercial/db/leads-$(date +%Y%m%d-%H%M%S).db

# Automatizar con cron (diario a las 3 AM)
crontab -e

# Agregar esta línea:
0 3 * * * cp /var/www/ia-comercial/db/leads.db /var/www/ia-comercial/db/leads-$(date +\%Y\%m\%d).db && find /var/www/ia-comercial/db/leads-*.db -mtime +7 -delete
```

### Código

```bash
# Está en GitHub - no necesita backup adicional
# Pero puedes hacer snapshots del Droplet desde DigitalOcean
```

### Snapshots de DigitalOcean

1. Panel de DigitalOcean → Droplets → Tu droplet
2. Snapshots → Take Snapshot
3. Costo: ~$0.05/GB/mes
4. Útil antes de actualizaciones importantes

---

## ⚡ Optimizaciones de Performance

### 1. Nginx Caching (Opcional)

```nginx
# En /etc/nginx/sites-available/ia-comercial
# Agregar cache para archivos estáticos

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Gzip Compression

```nginx
# Ya está habilitado por defecto en Nginx
# Verificar en /etc/nginx/nginx.conf

gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml;
```

### 3. PM2 Cluster Mode

```bash
# Usar múltiples instancias (usa todos los CPUs)
pm2 start server.js --name ia-comercial -i max

# O especificar número de instancias
pm2 start server.js --name ia-comercial -i 2
```

### 4. Connection Pooling (Ya implementado)

SQLite con `better-sqlite3` ya maneja conexiones eficientemente.

---

## 📈 Escalabilidad

### Vertical (Más recursos al mismo servidor)

**En DigitalOcean:**
1. Panel → Droplets → Tu droplet
2. Resize
3. Elegir plan superior ($24, $48, etc.)
4. Resize automáticamente (5-10 min downtime)

### Horizontal (Múltiples servidores)

Para alto tráfico:
1. **Load Balancer** de DigitalOcean
2. **Múltiples Droplets** corriendo la app
3. **Base de datos externa** (PostgreSQL en lugar de SQLite)
4. **Redis** para sesiones compartidas

---

## 🎯 Métricas Clave a Monitorear

### Performance
- **Response Time:** < 500ms promedio
- **Uptime:** > 99.9%
- **Error Rate:** < 1%

### Recursos
- **CPU:** < 70% promedio
- **RAM:** < 80% uso
- **Disk:** < 80% uso

### Aplicación
- **Requests/minute**
- **Leads creados/día**
- **Tasa de conversión por canal**
- **Errores de OpenAI API**

---

## 🔄 Plan de Disaster Recovery

### Si el servidor cae completamente:

**1. Verificar en DigitalOcean:**
- Panel → Droplets → Ver si está "Active"
- Si está "Off", reiniciarlo

**2. Crear nuevo Droplet (15 min):**
```bash
# Seguir DESPLIEGUE-RAPIDO.md
# Restaurar backup de DB si existe
```

**3. Recuperar desde GitHub:**
```bash
# Todo el código está en GitHub
# Solo necesitas restaurar .env y la base de datos
```

**4. Backup esencial:**
- `.env` (guardar copia segura offline)
- `db/leads.db` (backup diario automatizado)

---

## 📊 Dashboard de Métricas (Futuro)

Herramientas recomendadas:
- **Grafana** + **Prometheus**
- **Datadog**
- **New Relic**
- **PM2 Plus** (más simple)

---

**Tu sistema está diseñado para ser robusto, escalable y fácil de mantener en producción.** 🚀

