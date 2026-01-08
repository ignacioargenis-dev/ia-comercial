# 🛡️ Sistema Robusto para Producción

## 📋 Resumen de Mejoras Implementadas

Se ha transformado el sistema de captura de leads en una aplicación **robusta, confiable y lista para producción** con:

✅ **Logging estructurado** con Winston  
✅ **Manejo global de errores** con recuperación automática  
✅ **Validaciones exhaustivas** de inputs  
✅ **Reintentos inteligentes** para APIs externas  
✅ **Health checks** completos  
✅ **Timeouts configurables**  
✅ **Monitoreo y métricas**  

---

## 🔧 Componentes Implementados

### 1. Sistema de Logging Estructurado (Winston)

**Archivo:** `src/infrastructure/logging/Logger.js`

#### Características:
- **Niveles**: error, warn, info, debug
- **Formatos**: JSON para archivos, colorizado para consola
- **Transports**: Consola (siempre) + Archivos (producción)
- **Rotación automática**: Archivos de 5MB máximo
- **Contexto enriquecido**: timestamps, request IDs, metadata

#### Uso:

```javascript
const Logger = require('./src/infrastructure/logging/Logger');

// Logs básicos
Logger.info('Usuario autenticado', { userId: 123 });
Logger.warn('Limite de rate alcanzado', { ip: '1.2.3.4' });
Logger.error('Error en base de datos', new Error('Connection failed'));

// Logs especializados
Logger.http(req, res.statusCode, duration);
Logger.lead('created', leadId, { estado: 'caliente' });
Logger.conversation(sessionId, 'whatsapp', message);
Logger.externalAPI('OpenAI', 'generateResponse', true, 1234);
Logger.performance('processMessage', 2500);
```

#### Archivos de Log:

```
logs/
├── combined.log    # Todos los logs
└── error.log       # Solo errores
```

#### Variables de Entorno:

```bash
LOG_LEVEL=info              # error, warn, info, debug
NODE_ENV=production         # development, production
```

---

### 2. Manejo Global de Errores

**Archivos:**
- `src/infrastructure/http/middleware/errorHandler.js`
- `src/infrastructure/http/middleware/requestLogger.js`

#### Clases de Error Personalizadas:

```javascript
// Error de validación (400)
throw new ValidationError('Email inválido', { field: 'email' });

// Recurso no encontrado (404)
throw new NotFoundError('Lead');

// No autorizado (401)
throw new UnauthorizedError('Token inválido');

// Servicio externo falló (503)
throw new ExternalServiceError('OpenAI', originalError);

// Rate limit excedido (429)
throw new RateLimitError('Demasiadas solicitudes');
```

#### Características:

✅ **Captura automática** de errores no manejados  
✅ **Logging detallado** con contexto  
✅ **Respuestas consistentes** en JSON  
✅ **Stack traces** solo en desarrollo  
✅ **Reintentos automáticos** para errores retriables  
✅ **Shutdown graceful** en errores críticos  

#### Uso con AsyncHandler:

```javascript
const { asyncHandler } = require('./middleware/errorHandler');

router.post('/lead', asyncHandler(async (req, res) => {
  const lead = await leadService.create(req.body);
  res.json({ success: true, data: lead });
}));
// ✅ No necesitas try/catch, se maneja automáticamente
```

---

### 3. Validaciones de Inputs

**Archivo:** `src/infrastructure/validation/InputValidator.js`

#### Validadores Disponibles:

```javascript
const InputValidator = require('./validation/InputValidator');

// Validar mensaje de chat
const result = InputValidator.validateChatMessage(userMessage);
if (!result.valid) {
  console.error(result.errors);
}
const cleanMessage = result.sanitized;

// Validar teléfono chileno
const phone = InputValidator.validatePhoneNumber('+56 9 1234 5678');
// → { valid: true, formatted: '56912345678', errors: [] }

// Validar email
const email = InputValidator.validateEmail('usuario@ejemplo.cl');

// Validar nombre
const name = InputValidator.validateName('Juan Pérez');

// Validar comuna
const comuna = InputValidator.validateComuna('Santiago', allowedComunas);

// Validar lead completo
const leadValidation = InputValidator.validateLead(leadData);
if (!leadValidation.valid) {
  InputValidator.throwValidationError(leadValidation.errors);
}
```

#### Sanitización Automática:

✅ **Elimina** scripts maliciosos (XSS)  
✅ **Limita** longitud de strings  
✅ **Normaliza** emails (lowercase)  
✅ **Formatea** números de teléfono  
✅ **Detecta** patrones sospechosos  

#### Rate Limiting:

```javascript
const rateLimiter = InputValidator.createRateLimiter();

if (!rateLimiter(req.ip)) {
  throw new RateLimitError();
}
```

---

### 4. Manejo Robusto del LLM (OpenAI)

**Archivo:** `src/infrastructure/external/OpenAIClient.js` (mejorado)

#### Características:

✅ **Timeouts configurables** (30s por defecto)  
✅ **Reintentos automáticos** con backoff exponencial  
✅ **Validación de respuestas** JSON  
✅ **Logging detallado** de cada llamada  
✅ **Recuperación de errores** con respuestas de fallback  
✅ **Health checks** para monitoreo  

#### Configuración:

```bash
OPENAI_API_KEY=sk-xxxxx
OPENAI_TIMEOUT=30000        # 30 segundos
OPENAI_MAX_RETRIES=3        # 3 intentos
OPENAI_BASE_DELAY=1000      # 1 segundo inicial
OPENAI_MAX_DELAY=10000      # 10 segundos máximo
```

#### Estrategia de Reintentos:

```
Intento 1: Inmediato
  ↓ (Error)
Intento 2: Espera 1-2s (backoff exponencial + jitter)
  ↓ (Error)
Intento 3: Espera 2-4s
  ↓ (Error)
Respuesta de Fallback
```

#### Errores Retriables:

✅ **Timeouts** (ETIMEDOUT, ECONNRESET)  
✅ **Rate limits** (429)  
✅ **Errores de servidor** (5xx)  

❌ **NO retriables:**
- Errores de autenticación (401, 403)
- Errores de cliente (400, 404)

#### Respuesta de Fallback:

Si todo falla, el sistema responde:

```json
{
  "reply": "Disculpa, estoy teniendo problemas técnicos. ¿Podrías intentar reformular tu mensaje?",
  "lead": {
    "nombre": null,
    "telefono": null,
    "servicio": null,
    "comuna": null,
    "urgencia": null,
    "estado": "frio",
    "notas": "Error en generación de respuesta"
  }
}
```

---

### 5. Health Checks Completos

**Archivo:** `src/infrastructure/http/routes/health.js`

#### Endpoints:

| Endpoint | Propósito | Uso |
|----------|-----------|-----|
| `GET /health` | Check básico | Load balancers |
| `GET /health/detailed` | Check completo | Monitoreo |
| `GET /health/ready` | Readiness check | Kubernetes |
| `GET /health/live` | Liveness check | Kubernetes |
| `GET /health/metrics` | Métricas del sistema | Prometheus |

#### Componentes Monitoreados:

✅ **Base de datos** (SQLite)  
✅ **OpenAI API** (conectividad)  
✅ **WhatsApp API** (si configurado)  
✅ **Email** (configuración)  
✅ **Scheduler** (seguimientos)  
✅ **Memoria** (uso de heap)  
✅ **Leads** (estadísticas)  

#### Respuesta de Health Check Detallado:

```json
{
  "overall": "healthy",
  "timestamp": "2026-01-07T20:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "components": {
    "database": {
      "status": "healthy",
      "message": "Database connection OK"
    },
    "openai": {
      "status": "healthy",
      "message": "OpenAI API accessible"
    },
    "whatsapp": {
      "status": "configured",
      "message": "WhatsApp API accessible"
    },
    "memory": {
      "status": "healthy",
      "usage": {
        "rss": 45,
        "heapUsed": 32,
        "heapTotal": 64
      },
      "heapUsagePercent": 50
    },
    "scheduler": {
      "status": "healthy",
      "running": true,
      "jobs": 3
    }
  },
  "checkDuration": "234ms"
}
```

#### Códigos de Respuesta:

- **200**: Sistema completamente saludable
- **207**: Sistema degradado (algunos componentes fallan)
- **503**: Sistema no disponible

---

## 📊 Puntos Críticos del Sistema

### 1. **Procesamiento de Mensajes**

**Flujo crítico:**
```
Usuario → Validación → LLM (con reintentos) → Parseo → Lead → Notificación
```

**Protecciones:**
- ✅ Validación de inputs (anti-XSS, longitud)
- ✅ Timeout en LLM (30s)
- ✅ Reintentos automáticos (3 intentos)
- ✅ Fallback si falla
- ✅ Logging completo

**Tiempo máximo:** ~90 segundos (30s × 3 reintentos)

### 2. **Captura de Leads**

**Punto crítico:** No perder ningún lead

**Protecciones:**
- ✅ Transacciones de BD
- ✅ Validación antes de guardar
- ✅ Fallback a estado "frio" si hay error
- ✅ Logging de cada lead creado

### 3. **Notificaciones**

**Punto crítico:** Alertas confiables

**Protecciones:**
- ✅ Múltiples canales (Email → WhatsApp → Webhook)
- ✅ Reintentos en caso de fallo
- ✅ Logging de cada intento
- ✅ No bloquea el flujo principal

### 4. **Seguimientos Automáticos**

**Punto crítico:** No enviar spam, no perder oportunidades

**Protecciones:**
- ✅ Rate limiting (máx 1 por hora por lead)
- ✅ Respeto de horarios laborales
- ✅ Detiene al contactar manualmente
- ✅ Logging de cada seguimiento

### 5. **APIs Externas**

**Punto crítico:** Fallos de OpenAI/WhatsApp/Email

**Protecciones:**
- ✅ Timeouts configurables
- ✅ Reintentos con backoff
- ✅ Circuit breakers (implícito)
- ✅ Fallbacks
- ✅ Health checks

---

## 🚦 Indicadores de Salud

### Señales de Sistema Saludable:

✅ `/health/detailed` responde 200  
✅ Logs sin errores críticos  
✅ Memoria < 90% heap usado  
✅ Todos los health checks pasan  
✅ Leads siendo capturados  
✅ Scheduler corriendo  

### Señales de Alerta:

⚠️ `/health/detailed` responde 207 (degraded)  
⚠️ Memoria > 90% heap usado  
⚠️ OpenAI respondiendo lento (>5s)  
⚠️ Errores de validación frecuentes  

### Señales Críticas:

🔴 `/health/detailed` responde 503  
🔴 Base de datos no responde  
🔴 OpenAI no accesible  
🔴 Scheduler detenido  
🔴 Excepciones no capturadas  

---

## 📈 Monitoreo Recomendado

### Métricas Clave:

1. **Disponibilidad**: % de tiempo con health check OK
2. **Latencia**: Tiempo de respuesta del LLM
3. **Tasa de error**: % de requests que fallan
4. **Leads capturados**: Contador diario
5. **Uso de memoria**: % heap usado

### Alertas Sugeridas:

```yaml
- name: Sistema no disponible
  condition: health_check != 200
  severity: critical
  
- name: Alta latencia LLM
  condition: llm_response_time > 10s
  severity: warning
  
- name: Memoria alta
  condition: heap_usage > 85%
  severity: warning
  
- name: Tasa de error alta
  condition: error_rate > 5%
  severity: warning
```

### Herramientas Compatibles:

- **Prometheus**: `/health/metrics`
- **Grafana**: Dashboards
- **Sentry**: Error tracking
- **DataDog**: Monitoreo completo
- **CloudWatch**: AWS
- **Uptim

e Robot**: Health checks externos

---

## 🔒 Mejores Prácticas Implementadas

### Principios SOLID:

✅ **S**ingle Responsibility: Cada clase una responsabilidad  
✅ **O**pen/Closed: Extensible sin modificar  
✅ **L**iskov Substitution: Abstracciones correctas  
✅ **I**nterface Segregation: Interfaces específicas  
✅ **D**ependency Inversion: Inyección de dependencias  

### Principios de Resiliencia:

✅ **Fail Fast**: Fallar rápido en errores obvios  
✅ **Graceful Degradation**: Funcionalidad reducida vs caída total  
✅ **Circuit Breaker**: Evitar cascada de fallos (implícito)  
✅ **Retry Logic**: Reintentos inteligentes  
✅ **Timeout**: Límites de tiempo claros  
✅ **Logging**: Observabilidad completa  

### Seguridad:

✅ **Input Sanitization**: Validación exhaustiva  
✅ **Rate Limiting**: Prevención de abuso  
✅ **Error Messages**: Sin información sensible  
✅ **Secrets Management**: Variables de entorno  
✅ **CORS**: Configurado correctamente  

---

## 📚 Archivos Clave

### Nuevos:

```
src/infrastructure/
├── logging/
│   └── Logger.js                    # Sistema de logging
├── http/
│   └── middleware/
│       ├── errorHandler.js          # Manejo de errores
│       └── requestLogger.js         # Logging de requests
├── validation/
│   └── InputValidator.js            # Validaciones
└── http/routes/
    └── health.js                    # Health checks
```

### Modificados:

```
src/infrastructure/external/
└── OpenAIClient.js                  # Reintentos y timeouts

src/application/services/
└── ChatService.js                   # Logging integrado

server.js                            # Middlewares integrados
package.json                         # Winston agregado
```

---

## 🚀 Uso en Producción

### Variables de Entorno:

```bash
# Requeridas
OPENAI_API_KEY=sk-xxxxx

# Logging
LOG_LEVEL=info                       # error, warn, info, debug
NODE_ENV=production

# OpenAI
OPENAI_TIMEOUT=30000
OPENAI_MAX_RETRIES=3

# Opcional: Email, WhatsApp, etc.
```

### Iniciar Servidor:

```bash
npm start
```

### Verificar Salud:

```bash
curl http://localhost:3000/health/detailed
```

### Monitorear Logs:

```bash
tail -f logs/combined.log
tail -f logs/error.log
```

---

## ✅ Checklist de Producción

- [ ] Variables de entorno configuradas
- [ ] Logs rotando correctamente
- [ ] Health checks respondiendo
- [ ] Timeouts configurados apropiadamente
- [ ] Rate limiting activo
- [ ] Monitoreo configurado
- [ ] Alertas configuradas
- [ ] Backups de base de datos
- [ ] Proceso manejado por PM2/systemd
- [ ] HTTPS configurado
- [ ] Firewall configurado
- [ ] Secrets en lugar seguro

---

## 📖 Documentación Adicional

- **Logging**: Ver ejemplos en `Logger.js`
- **Errores**: Ver clases en `errorHandler.js`
- **Validaciones**: Ver métodos en `InputValidator.js`
- **Health**: Ver endpoints en `health.js`

---

**🎉 Sistema Robusto y Listo para Clientes Reales**

*Implementado: Enero 2026*

