# 🎯 Sistema Completo de Captura y Seguimiento de Leads

## 📊 Estado del Sistema

✅ **SISTEMA COMPLETAMENTE FUNCIONAL Y LISTO PARA PRODUCCIÓN**

---

## 🏗️ Arquitectura Implementada

### 1. **Captura de Leads con IA** ✅
- Chat inteligente con GPT-4o-mini
- Clasificación automática (Caliente/Tibio/Frío)
- Captura de datos: nombre, teléfono, servicio, comuna
- Validación de reglas de negocio
- Persistencia en SQLite

### 2. **Sistema Multi-Cliente (SaaS)** ✅
- Configuración por cliente en `config/business.json`
- Prompt dinámico generado automáticamente
- Script de clonación para nuevos clientes
- Sin modificar código para nuevos clientes

### 3. **Seguimiento Automático** ✅ **NUEVO**
- Leads calientes: seguimiento cada 12 horas
- Leads tibios: seguimiento cada 24 horas
- Mensajes personalizados por estado
- Respeta horarios laborales
- Múltiples canales: Email, WhatsApp, Webhook

### 4. **Dashboard de Gestión** ✅
- Vista de leads en tiempo real
- Estadísticas y métricas
- Marcado de leads contactados
- Historial de conversaciones
- Panel de seguimientos

---

## 📁 Estructura del Proyecto

```
ia-comercial/
├── config/
│   ├── business.json              # ⭐ Configuración por cliente
│   └── business.schema.json       # Validación JSON
│
├── src/
│   ├── domain/                    # Lógica de negocio pura
│   │   ├── entities/
│   │   │   └── Lead.js
│   │   └── services/
│   │       ├── LeadClassifier.js
│   │       └── FollowUpRules.js   # ⭐ Reglas de seguimiento
│   │
│   ├── application/               # Casos de uso
│   │   ├── use-cases/
│   │   │   ├── ProcessChatMessage.js
│   │   │   ├── GetLeads.js
│   │   │   ├── MarkLeadAsContacted.js
│   │   │   └── NotifyOwner.js
│   │   └── services/
│   │       ├── ChatService.js
│   │       └── FollowUpService.js # ⭐ Servicio de seguimiento
│   │
│   └── infrastructure/            # Implementaciones técnicas
│       ├── automation/
│       │   └── FollowUpScheduler.js # ⭐ Cron jobs
│       ├── config/
│       │   └── BusinessConfigLoader.js
│       ├── database/
│       │   ├── connection.js      # ⭐ Schema actualizado
│       │   └── sqlite/
│       │       ├── SqliteLeadRepository.js # ⭐ Con seguimientos
│       │       └── SqliteConversationRepository.js
│       ├── external/
│       │   └── OpenAIClient.js
│       ├── http/
│       │   └── routes/
│       │       ├── chat.js
│       │       ├── leads.js
│       │       ├── whatsapp.js
│       │       └── followups.js   # ⭐ API de seguimientos
│       ├── notifications/
│       │   ├── EmailNotificationService.js
│       │   └── WebhookNotificationService.js
│       └── container.js           # Inyección de dependencias
│
├── public/                        # Frontend
│   ├── index.html                 # Chat
│   └── dashboard.html             # Dashboard
│
├── scripts/
│   └── clone-for-client.js        # Script de clonación SaaS
│
├── database/
│   └── leads.db                   # SQLite (con follow_ups)
│
├── test-followup-system.js        # ⭐ Test de seguimientos
├── server.js                      # ⭐ Servidor con scheduler
├── package.json                   # ⭐ Con node-cron
└── .env                           # Variables de entorno
```

---

## 🗄️ Base de Datos Actualizada

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
  ultima_interaccion DATETIME,   -- ⭐ NUEVO
  fecha_contacto DATETIME         -- ⭐ NUEVO
);
```

### Tabla `follow_ups` (nueva)
```sql
CREATE TABLE follow_ups (
  id INTEGER PRIMARY KEY,
  lead_id INTEGER,
  type TEXT,              -- 'caliente' | 'tibio'
  status TEXT,            -- 'sent' | 'failed' | 'error'
  message TEXT,
  fecha_envio DATETIME,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```

---

## 🚀 Cómo Usar el Sistema

### 1. Instalación y Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno (.env)
OPENAI_API_KEY=tu_clave_openai

# Opcional: Email para notificaciones
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password
EMAIL_TO=destino@empresa.com

# Opcional: Seguimientos automáticos (habilitado por defecto)
ENABLE_FOLLOW_UPS=true

# 3. Personalizar config/business.json
{
  "business": {
    "name": "Tu Negocio",
    "phone": "+56912345678",
    "email": "contacto@tunegocio.cl"
  },
  "services": [
    { "id": "servicio1", "name": "Servicio 1", "description": "..." }
  ],
  "coverage": {
    "communes": ["Santiago", "Providencia"]
  },
  "schedule": {
    "workingDays": {
      "monday": { "enabled": true, "open": "09:00", "close": "18:00" }
    }
  }
}
```

### 2. Iniciar el Sistema

```bash
npm start
```

Verás:
```
🚀 Servidor corriendo en http://localhost:3000
📊 Sistema de captura de leads con IA
🏗️  Arquitectura limpia con patrón Repository
✅ Configuración de negocio cargada: Tu Negocio
⏰ Inicializando sistema de seguimientos automáticos...
✅ Planificador de seguimientos iniciado
   📅 Leads calientes: cada 30 minutos
   📅 Leads tibios: cada 2 horas
   📅 Reporte diario: 8:00 AM
```

### 3. Probar el Sistema

#### A. Chat y Captura de Leads
```
Visita: http://localhost:3000
```

#### B. Dashboard
```
Visita: http://localhost:3000/dashboard
```

#### C. API de Seguimientos
```bash
# Ver estadísticas
curl http://localhost:3000/api/followups/stats

# Ejecutar seguimientos manualmente
curl -X POST http://localhost:3000/api/followups/scheduler/run-now

# Ver historial de un lead
curl http://localhost:3000/api/followups/lead/1/history
```

### 4. Probar Sistema de Seguimientos

```bash
node test-followup-system.js
```

---

## 🔄 Flujo Completo del Sistema

```
1. Usuario visita el chat (http://localhost:3000)
   ↓
2. Escribe mensaje: "Necesito instalar aire acondicionado en Las Condes"
   ↓
3. IA captura datos y clasifica como "caliente"
   ↓
4. Lead se guarda en BD con ultima_interaccion = now()
   ↓
5. Notificación inmediata al propietario (email)
   ↓
6. ⏰ 12 horas después (si no fue contactado):
   ↓
7. FollowUpScheduler detecta lead pendiente
   ↓
8. FollowUpService genera mensaje personalizado
   ↓
9. Envía por Email/WhatsApp/Webhook
   ↓
10. Registra en tabla follow_ups
   ↓
11. Dashboard muestra historial de seguimientos
```

---

## 📊 Reglas de Seguimiento

### Tiempos
- 🔥 **Lead Caliente**: Seguimiento después de 12 horas sin interacción
- 🌡️ **Lead Tibio**: Seguimiento después de 24 horas sin interacción
- ❄️ **Lead Frío**: Sin seguimiento automático

### Condiciones
Un lead recibe seguimiento SI:
✅ No ha sido contactado (`contactado = false`)  
✅ Es caliente o tibio (no frío)  
✅ Ha pasado el tiempo requerido  
✅ Está en horario laboral  
✅ No recibió seguimiento en la última hora  

### Mensajes

**Lead Caliente:**
```
Hola [Nombre], soy [Negocio].

Vimos que estabas interesado en nuestro servicio de [Servicio].

¿Sigues necesitando ayuda? Estamos disponibles ahora mismo.

¿Te gustaría que agendemos una visita o te enviemos una cotización?
```

**Lead Tibio:**
```
Hola [Nombre], te saluda [Negocio].

Hace un tiempo consultaste sobre [Servicio].

¿Sigues interesado? Nos encantaría poder ayudarte.

Responde este mensaje y con gusto te atendemos. 😊
```

---

## 🔗 API Endpoints

### Chat
```
POST /api/chat
Body: { "message": "Hola", "sessionId": "abc123" }
```

### Leads
```
GET /api/leads                    # Obtener todos los leads
GET /api/leads/stats              # Estadísticas
POST /api/leads/:id/contact       # Marcar como contactado
```

### Seguimientos (Nuevo)
```
GET /api/followups/stats                 # Estadísticas de seguimientos
GET /api/followups/lead/:id/history      # Historial de un lead
POST /api/followups/lead/:id/send        # Enviar seguimiento manual
GET /api/followups/scheduler/status      # Estado del planificador
POST /api/followups/scheduler/run-now    # Ejecutar ahora (testing)
GET /api/followups/lead/:id/next         # Próxima fecha de seguimiento
```

---

## 🎯 Características Clave

### ✅ Implementadas

1. **Chat Inteligente**
   - Procesamiento de lenguaje natural
   - Clasificación automática de intención
   - Validación de datos (teléfono chileno, comunas)

2. **Gestión de Leads**
   - Captura estructurada de datos
   - Clasificación: caliente/tibio/frío
   - Persistencia en SQLite
   - Dashboard de visualización

3. **Sistema Multi-Cliente**
   - Configuración en JSON
   - Prompt dinámico
   - Script de clonación
   - Sin modificar código

4. **Seguimiento Automático** ⭐ NUEVO
   - Detección inteligente de leads pendientes
   - Mensajes personalizados
   - Múltiples canales (Email/WhatsApp/Webhook)
   - Respeta horarios laborales
   - Scheduler con cron jobs

5. **Notificaciones**
   - Email instantáneo para leads calientes
   - Seguimientos automáticos programados
   - Webhooks para integración CRM

6. **Arquitectura Limpia**
   - Separación de capas (Domain/Application/Infrastructure)
   - Inyección de dependencias
   - Fácil testing y mantenimiento

---

## 📚 Documentación Completa

- `API.md` - Documentación completa de la API
- `SEGUIMIENTO-AUTOMATICO.md` - Sistema de seguimientos
- `SAAS-MULTICLIENTE.md` - Arquitectura SaaS
- `CONFIGURACION-CLIENTE.md` - Guía de configuración
- `SOLUCION-BETTER-SQLITE3.md` - Solución de problemas de BD
- `INICIO-RAPIDO.md` - Guía de inicio rápido

---

## 🧪 Testing

### Prueba Rápida del Chat
1. Visita `http://localhost:3000`
2. Escribe: "Necesito mantenimiento de aire acondicionado en Santiago"
3. Proporciona tu nombre y teléfono
4. Revisa el dashboard: `http://localhost:3000/dashboard`

### Prueba del Sistema de Seguimientos
```bash
# Test automatizado
node test-followup-system.js

# Ver logs en consola cuando corre el scheduler
npm start
# Esperar 30 minutos o ejecutar manualmente:
curl -X POST http://localhost:3000/api/followups/scheduler/run-now
```

---

## 🔧 Configuración Avanzada

### Cambiar Frecuencia de Seguimientos

Editar `src/infrastructure/automation/FollowUpScheduler.js`:
```javascript
// De cada 30 minutos a cada 1 hora
const hotLeadsJob = cron.schedule('0 * * * *', async () => {
  await this.processHotLeads();
});
```

### Cambiar Tiempos de Espera

Editar `src/domain/services/FollowUpRules.js`:
```javascript
static getFollowUpDelay(estado) {
  const delays = {
    'caliente': 6,  // 6 horas en vez de 12
    'tibio': 48,    // 48 horas en vez de 24
    'frio': null
  };
  return delays[estado] || null;
}
```

### Desactivar Seguimientos

En `.env`:
```
ENABLE_FOLLOW_UPS=false
```

---

## 🚀 Replicar para Nuevo Cliente

### Opción 1: Script Automatizado

```bash
node scripts/clone-for-client.js \
  --id mi-cliente \
  --name "Mi Cliente SRL"
```

### Opción 2: Manual

1. Copiar carpeta completa
2. Editar `config/business.json`
3. Editar `.env`
4. `npm install`
5. `npm start`

---

## 📈 Próximas Mejoras Sugeridas

- [ ] Integración completa con WhatsApp Business API
- [ ] A/B testing de mensajes de seguimiento
- [ ] Dashboard de métricas de conversión
- [ ] Límite de intentos de seguimiento
- [ ] Plantillas de mensajes personalizables desde UI
- [ ] Integración con CRMs populares (HubSpot, Salesforce)
- [ ] Multi-idioma
- [ ] Notificaciones push en dashboard
- [ ] Análisis de sentimiento en conversaciones

---

## 🆘 Solución de Problemas

### El scheduler no arranca
```bash
# Verificar que node-cron esté instalado
npm list node-cron

# Si no está, instalarlo
npm install node-cron
```

### Las columnas de BD no existen
```bash
# El sistema migra automáticamente al iniciar
npm start

# Si persiste, eliminar BD y recrear
rm database/leads.db
npm start
```

### No se envían seguimientos
1. Verificar que ENABLE_FOLLOW_UPS=true en .env
2. Configurar EMAIL_USER y EMAIL_PASS
3. Verificar logs en consola
4. Probar manualmente: `POST /api/followups/scheduler/run-now`

---

## 📞 Contacto y Soporte

Este sistema fue diseñado con arquitectura limpia, siguiendo principios SOLID y mejores prácticas de desarrollo. Está listo para producción y puede escalar según las necesidades del negocio.

**Tecnologías utilizadas:**
- Node.js + Express
- OpenAI GPT-4o-mini
- SQLite (Better-SQLite3)
- node-cron
- Nodemailer
- Vanilla JS (frontend)

---

## ✅ Checklist de Producción

Antes de deploy:

- [ ] Configurar `config/business.json` con datos reales
- [ ] Agregar OPENAI_API_KEY válida en `.env`
- [ ] Configurar EMAIL_USER y EMAIL_PASS para notificaciones
- [ ] Revisar horarios laborales en `config/business.json`
- [ ] Probar chat end-to-end
- [ ] Probar dashboard
- [ ] Verificar que scheduler esté corriendo
- [ ] Ejecutar `node test-followup-system.js`
- [ ] Configurar backups de `database/leads.db`
- [ ] Configurar logs persistentes
- [ ] Configurar monitoreo (opcional)

---

**🎉 Sistema Completo y Listo para Producción**

*Última actualización: Enero 2026*

