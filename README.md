# 🤖 Sistema de IA Comercial Multi-Canal

Sistema inteligente de captura y calificación de leads con IA (OpenAI GPT-4), integrado con múltiples canales de comunicación: Web, WhatsApp e Instagram.

## 🚀 Características

### ✅ Inteligencia Artificial
- **OpenAI GPT-4o-mini** para conversaciones naturales
- Extracción automática de datos (nombre, teléfono, servicio, comuna)
- Clasificación inteligente de leads (frío/tibio/caliente)
- Validación de clasificación con reglas de negocio

### 📱 Canales Integrados
- **🌐 Web Chat:** Interfaz moderna y responsiva
- **💚 WhatsApp:** Integración con WhatsApp Cloud API
- **📸 Instagram:** Instagram Direct Messages
- **🎭 Simulador:** Testing sin APIs reales

### 📊 Dashboard Avanzado
- Visualización en tiempo real de leads
- Métricas por canal (Web, Instagram, WhatsApp)
- Filtros avanzados (estado, canal, contactado)
- Enlaces directos a conversaciones de Instagram
- Enlaces de WhatsApp con mensajes pre-rellenados

### 🔔 Notificaciones Automáticas
- Email inmediato para leads calientes
- Email para leads tibios
- Seguimiento automático programado
- Templates HTML profesionales

### 🎯 Funcionalidades Empresariales
- **Editor de Reglas de Negocio:** Modificar prompts sin código
- **Modo Demo:** Para presentaciones comerciales
- **Métricas por Canal:** Análisis de rendimiento
- **Mensajes Optimizados:** Diferentes por canal (cortos para Instagram/WhatsApp)
- **Seguimiento Automático:** Recordatorios programados

## 🏗️ Arquitectura

### Clean Architecture + Domain-Driven Design
```
src/
├── domain/              # Entidades y lógica de negocio
│   ├── entities/       # Lead, LLMResponse
│   └── services/       # LeadClassifier
├── application/        # Casos de uso
│   ├── services/       # ChatService
│   └── use-cases/      # ProcessChatMessage, HandleIncomingMessage, etc.
└── infrastructure/     # Implementaciones
    ├── database/       # SQLite + Repositories
    ├── external/       # OpenAI, WhatsApp, Instagram, Email
    ├── http/           # Express routes & middleware
    └── logging/        # Winston Logger
```

### Tecnologías
- **Backend:** Node.js + Express
- **Base de Datos:** SQLite (better-sqlite3)
- **IA:** OpenAI API (GPT-4o-mini)
- **Logging:** Winston
- **Validación:** Zod
- **Testing:** Scripts de simulación

## 📦 Instalación

### Prerequisitos
- Node.js v18 o superior
- Cuenta de OpenAI con créditos
- (Opcional) WhatsApp Business API
- (Opcional) Instagram Business Account

### 1. Clonar Repositorio
```bash
git clone https://github.com/TU_USUARIO/ia-comercial.git
cd ia-comercial
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
# OpenAI (Obligatorio)
OPENAI_API_KEY=sk-...

# Email (Obligatorio para notificaciones)
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password
OWNER_EMAIL=dueño@negocio.com

# WhatsApp (Opcional)
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxx...
WHATSAPP_VERIFY_TOKEN=tu_token_secreto

# Instagram (Opcional)
IG_PAGE_TOKEN=EAAyy...
IG_VERIFY_TOKEN=tu_token_instagram
```

### 4. Iniciar Servidor
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📖 Documentación

### Guías de Inicio Rápido
- **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)** - Primeros pasos
- **[CONFIGURACION-APIS.md](CONFIGURACION-APIS.md)** - Configurar APIs externas

### Integraciones
- **[README-INSTAGRAM.md](README-INSTAGRAM.md)** - Configuración completa de Instagram
- **[CHECKLIST-INSTAGRAM-RAPIDO.md](CHECKLIST-INSTAGRAM-RAPIDO.md)** - Instagram en 30 min
- **[WHATSAPP-INTEGRACION.md](WHATSAPP-INTEGRACION.md)** - Integración de WhatsApp

### Funcionalidades
- **[GUIA-DEMO-5-MINUTOS.md](GUIA-DEMO-5-MINUTOS.md)** - Demo comercial
- **[PROPUESTA-VALOR-COMERCIAL.md](PROPUESTA-VALOR-COMERCIAL.md)** - Valor de negocio
- **[MEJORAS-DASHBOARD.md](MEJORAS-DASHBOARD.md)** - Funcionalidades del dashboard
- **[SEGUIMIENTO-AUTOMATICO.md](SEGUIMIENTO-AUTOMATICO.md)** - Sistema de seguimientos

### Personalization
- **[PERSONALIZACION.md](PERSONALIZACION.md)** - Adaptar para tu negocio
- **[EDITOR-REGLAS-NEGOCIO.md](EDITOR-REGLAS-NEGOCIO.md)** - Editor de prompts

## 🎯 Uso

### Páginas Principales

#### Chat de Cliente (`http://localhost:3000/`)
Interfaz para que clientes inicien conversaciones.

#### Dashboard (`http://localhost:3000/dashboard`)
Panel de administración para:
- Ver todos los leads
- Filtrar por estado/canal
- Contactar leads con un click
- Ver métricas por canal

#### Demo Mode (`http://localhost:3000/demo`)
Modo de demostración para presentaciones comerciales.

### API Endpoints

```
POST /api/chat                    # Chat web
POST /api/whatsapp/webhook        # Webhook WhatsApp
POST /api/instagram/webhook       # Webhook Instagram
GET  /api/leads                   # Listar leads
GET  /api/leads/estadisticas      # Métricas
GET  /api/system/prompt           # Obtener prompt
PUT  /api/system/prompt           # Actualizar prompt
POST /api/simulate/instagram      # Simular Instagram
POST /api/simulate/whatsapp       # Simular WhatsApp
GET  /health/detailed             # Health check
```

## 🔧 Configuración por Cliente

### 1. Información del Negocio
Editar `config/business.json`:
```json
{
  "name": "Tu Negocio",
  "industry": "tu-industria",
  "services": ["servicio1", "servicio2"],
  "communes": ["Comuna1", "Comuna2"]
}
```

### 2. Prompt del Asistente
Editar `prompts/systemPrompt.txt` o usar el editor web en:
```
http://localhost:3000/dashboard → Botón "Reglas del Negocio"
```

## 📊 Métricas y Análisis

### Dashboard Muestra:
- **Total de leads** por canal
- **Leads calientes/tibios/fríos** por canal
- **Tasa de conversión** por canal
- **Leads pendientes** de contactar
- **Seguimientos pendientes**

### Ejemplo de Métricas:
```
Web:       34 leads (16 calientes, 14 tibios, 4 fríos)
Instagram:  2 leads (2 calientes, 0 tibios, 0 fríos)
WhatsApp:   1 lead  (1 caliente, 0 tibios, 0 fríos)
```

## 🧪 Testing

### Simulador de Instagram
```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, necesito instalación", "senderId": "test_001"}'
```

### Simulador de WhatsApp
```bash
curl -X POST http://localhost:3000/api/simulate/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"message": "Necesito cotización", "senderId": "+56912345678"}'
```

### Health Check
```bash
curl http://localhost:3000/health/detailed
```

## 🚀 Despliegue a Producción

### Requisitos
- Servidor con Node.js
- Dominio con certificado SSL (HTTPS)
- PM2 o similar para mantener el proceso

### Pasos Básicos
1. Clonar repo en servidor
2. Configurar `.env` con credenciales de producción
3. Instalar dependencias: `npm install --production`
4. Iniciar con PM2: `pm2 start server.js --name ia-comercial`
5. Configurar webhooks de WhatsApp e Instagram con tu dominio

Ver **[README-INSTAGRAM.md](README-INSTAGRAM.md)** para configuración detallada de webhooks.

## 🤝 Contribuir

Este proyecto usa:
- **ESLint** para linting (configuración pendiente)
- **Conventional Commits** para mensajes de commit
- **Clean Architecture** para estructura

## 📄 Licencia

[MIT License](LICENSE) - Libre para uso comercial

## 🆘 Soporte

### Documentación Adicional
- Todos los archivos `.md` en el proyecto
- Comentarios extensivos en el código
- Scripts de ejemplo en `/scripts`

### Troubleshooting Común

**Error: OpenAI API Key inválida**
→ Verificar `OPENAI_API_KEY` en `.env`

**Error: Webhook Instagram no verifica**
→ Verificar `IG_VERIFY_TOKEN` coincide en `.env` y Meta Developers

**Error: WhatsApp no responde**
→ Verificar tokens y que el webhook esté suscrito al evento `messages`

## 🎉 Características Destacadas

### Optimización por Canal
- **Instagram/WhatsApp:** Mensajes cortos, una pregunta a la vez
- **Web:** Conversaciones más detalladas
- **Adaptación automática** del prompt según el canal

### Enlaces Directos
- **Instagram:** Click en dashboard abre conversación en Instagram Direct
- **WhatsApp:** Click en teléfono abre WhatsApp con mensaje pre-rellenado

### Clasificación Inteligente
- **IA + Reglas de Negocio:** Doble validación
- **Corrección automática:** Si IA se equivoca, reglas corrigen
- **Logging detallado:** Rastrea cambios de clasificación

### Seguimiento Automático
- **Leads calientes:** Recordatorio cada 30 minutos si no contactado
- **Leads tibios:** Recordatorio cada 2 horas
- **Reporte diario:** Resumen a las 8:00 AM

---

**Desarrollado con ❤️ para facilitar cierres comerciales**

**Versión:** 1.0.0  
**Última actualización:** Enero 2025
