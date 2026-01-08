# 🏢 Sistema SaaS Multi-Cliente

## 🎯 Objetivo Cumplido

Sistema configurado como **instancia replicable por cliente** sin modificar código. Cada cliente tiene su propia configuración en `config/business.json`.

---

## ✨ Implementación Completa

### 1. ✅ Archivo de Configuración por Cliente

**Ubicación:** `config/business.json`

```json
{
  "business": {
    "name": "Climatización Express",
    "industry": "Servicios de climatización",
    "phone": "+56912345678",
    "email": "contacto@climatizacion.cl"
  },
  "services": [
    {
      "id": "instalacion",
      "name": "Instalación de Aire Acondicionado",
      "description": "...",
      "estimatedTime": "1-2 días"
    }
  ],
  "coverage": {
    "communes": ["Santiago", "Providencia", "Las Condes"]
  },
  "schedule": {
    "workingDays": {
      "monday": { "enabled": true, "open": "08:00", "close": "18:00" }
    }
  }
}
```

### 2. ✅ Carga Dinámica del Prompt

**Clase:** `BusinessConfigLoader`

- Lee `config/business.json`
- Genera prompt dinámicamente
- Valida estructura
- Incluye automáticamente:
  - Nombre del negocio
  - Servicios ofrecidos
  - Comunas atendidas
  - Horarios
  - Estilo de conversación

### 3. ✅ Integración con OpenAI

**Modificado:** `OpenAIClient.js`

Ahora carga el prompt dinámicamente:
- Combina configuración del negocio
- Agrega reglas técnicas
- Personaliza automáticamente

### 4. ✅ Script de Clonación

**Script:** `scripts/clone-for-client.js`

Clona la instancia para un nuevo cliente con un comando:

```bash
node scripts/clone-for-client.js peluqueria-moderna "Peluquería Moderna"
```

---

## 📁 Estructura del Sistema SaaS

```
ia-comercial/
├── config/
│   ├── business.json          ← Configuración del cliente
│   └── business.schema.json   ← Schema de validación
│
├── src/infrastructure/config/
│   └── BusinessConfigLoader.js ← Cargador de configuración
│
├── scripts/
│   └── clone-for-client.js    ← Script de clonación
│
├── prompts/
│   └── systemPrompt.txt       ← Reglas técnicas (base)
│
└── ...resto de archivos compartidos
```

---

## 🔧 Configuración por Cliente

### Secciones del config/business.json

#### 1. business - Información del Negocio

```json
{
  "name": "Nombre de la Empresa",
  "shortName": "Nombre Corto",
  "industry": "Industria/Rubro",
  "description": "Descripción breve",
  "phone": "+56912345678",
  "email": "contacto@empresa.cl",
  "website": "https://www.empresa.cl"
}
```

#### 2. services - Servicios Ofrecidos

```json
[
  {
    "id": "instalacion",
    "name": "Instalación",
    "description": "Descripción del servicio",
    "estimatedTime": "1-2 días",
    "requiresVisit": true
  }
]
```

#### 3. coverage - Cobertura Geográfica

```json
{
  "regions": ["Región Metropolitana"],
  "communes": ["Santiago", "Providencia"],
  "additionalFees": {
    "enabled": true,
    "message": "Comunas lejanas pueden tener recargo"
  }
}
```

#### 4. schedule - Horarios

```json
{
  "timezone": "America/Santiago",
  "workingDays": {
    "monday": { "enabled": true, "open": "08:00", "close": "18:00" }
  },
  "emergencyService": {
    "enabled": true,
    "hours": "24/7"
  }
}
```

#### 5. conversationStyle - Personalidad del Bot

```json
{
  "tone": "profesional y cercano",
  "formality": "tú",
  "personality": "Amigable, servicial y eficiente",
  "guidelines": [
    "Preguntar por nombre y teléfono",
    "Confirmar datos antes de despedirse"
  ]
}
```

---

## 🚀 Clonar para Nuevo Cliente

### Opción 1: Script Automático (Recomendado)

```bash
node scripts/clone-for-client.js <client-id> <client-name>
```

**Ejemplo:**
```bash
node scripts/clone-for-client.js peluqueria-moderna "Peluquería Moderna"
```

**Esto crea:**
- Nueva carpeta: `../peluqueria-moderna/`
- Archivos del proyecto copiados
- `config/business.json` personalizado
- `.env` con plantilla
- `README.md` personalizado
- `SETUP.md` con instrucciones

---

### Opción 2: Clonación Manual

#### Paso 1: Clonar repositorio

```bash
# Desde el directorio padre
cp -r ia-comercial nuevo-cliente
cd nuevo-cliente
```

#### Paso 2: Limpiar datos anteriores

```bash
# Eliminar base de datos
rm -rf db/*

# Eliminar .env anterior
rm .env

# Eliminar node_modules
rm -rf node_modules
```

#### Paso 3: Crear nuevo config/business.json

```bash
# Editar config/business.json
nano config/business.json
```

Cambiar:
- `business.name`
- `business.phone`
- `business.email`
- `services[]` - Lista de servicios
- `coverage.communes` - Comunas que atiende
- `schedule.workingDays` - Horarios
- `metadata.clientId` - ID único del cliente

#### Paso 4: Crear .env

```bash
cp .env.example .env
nano .env
```

Configurar:
- `OPENAI_API_KEY`
- `BUSINESS_NAME` (debe coincidir con config)
- `OWNER_EMAIL`
- `EMAIL_USER` y `EMAIL_PASS`

#### Paso 5: Instalar y ejecutar

```bash
npm install
npm start
```

---

## 📋 Checklist de Configuración

Para cada nuevo cliente:

### Configuración Básica
- [ ] Clonar repositorio o usar script
- [ ] Editar `config/business.json`
  - [ ] Nombre del negocio
  - [ ] Datos de contacto
  - [ ] Servicios ofrecidos
  - [ ] Comunas atendidas
  - [ ] Horarios de atención
- [ ] Crear archivo `.env`
  - [ ] OPENAI_API_KEY
  - [ ] OWNER_EMAIL
- [ ] Instalar dependencias: `npm install`

### Configuración Avanzada
- [ ] Personalizar estilo de conversación
- [ ] Configurar notificaciones (email/webhook)
- [ ] Ajustar precios y formas de pago
- [ ] Configurar certificaciones/experiencia
- [ ] Personalizar branding (colores, logo)

### Verificación
- [ ] Iniciar servidor: `npm start`
- [ ] Probar chat en http://localhost:3000
- [ ] Verificar que menciona el nombre correcto
- [ ] Probar con cada servicio configurado
- [ ] Verificar respuesta de horarios
- [ ] Probar notificación con lead caliente

---

## 🎨 Personalización del Prompt

El sistema genera automáticamente el prompt desde la configuración:

### Variables Disponibles

```javascript
{business.name}           → Climatización Express
{business.industry}       → Servicios de climatización
{services[].name}         → Instalación, Mantenimiento, etc.
{coverage.communes}       → Santiago, Providencia, etc.
{schedule.workingDays}    → Lunes-Viernes 08:00-18:00
{conversationStyle.tone}  → Profesional y cercano
```

### Ejemplo de Prompt Generado

```
CONTEXTO DEL NEGOCIO:
Eres el asistente virtual de Climatización Express, 
empresa especializada en instalación, mantenimiento 
y reparación de sistemas de aire acondicionado.

SERVICIOS QUE OFRECEMOS:
- Instalación de Aire Acondicionado: ...
- Mantenimiento Preventivo: ...
- Reparación: ...

COBERTURA:
Atendemos las siguientes comunas: Santiago, Providencia, 
Las Condes, Vitacura, Ñuñoa...

HORARIOS:
Lunes: 08:00 - 18:00
Martes: 08:00 - 18:00
...

ESTILO DE CONVERSACIÓN:
- Tono: profesional y cercano
- Usa "tú" para dirigirte al cliente
- Personalidad: Amigable, servicial y eficiente
```

---

## 💼 Casos de Uso por Industria

### Climatización (Ejemplo Incluido)

```json
{
  "business": { "name": "Climatización Express" },
  "services": [
    "Instalación de AC",
    "Mantenimiento",
    "Reparación"
  ],
  "coverage": { "communes": ["Santiago", "Providencia"] }
}
```

### Peluquería/Salón de Belleza

```json
{
  "business": { "name": "Salón Elegance" },
  "services": [
    "Corte de cabello",
    "Peinados",
    "Coloración",
    "Tratamientos capilares"
  ],
  "schedule": {
    "workingDays": {
      "tuesday": { "open": "10:00", "close": "20:00" }
    }
  }
}
```

### Restaurant/Delivery

```json
{
  "business": { "name": "Pizzería Roma" },
  "services": [
    "Delivery",
    "Reservas",
    "Para llevar"
  ],
  "schedule": {
    "workingDays": {
      "daily": { "open": "12:00", "close": "23:00" }
    }
  }
}
```

### Plomería

```json
{
  "business": { "name": "Plomería Express" },
  "services": [
    "Destape de cañerías",
    "Reparación de fugas",
    "Instalación de artefactos"
  ],
  "schedule": {
    "emergencyService": {
      "enabled": true,
      "hours": "24/7"
    }
  }
}
```

### Servicios Legales

```json
{
  "business": { "name": "Bufete Jurídico" },
  "services": [
    "Consulta legal",
    "Contratos",
    "Litigios"
  ],
  "conversationStyle": {
    "formality": "usted",
    "tone": "profesional y formal"
  }
}
```

---

## 🔄 Actualizar Configuración sin Reiniciar

### Método 1: Recargar Configuración (API)

Agregar endpoint en `server.js`:

```javascript
app.post('/api/admin/reload-config', (req, res) => {
  const businessConfig = require('./src/infrastructure/config/BusinessConfigLoader');
  businessConfig.reload();
  
  res.json({ 
    success: true, 
    message: 'Configuración recargada',
    business: businessConfig.getBusinessInfo().name
  });
});
```

### Método 2: Archivo de Vigilancia (Watch)

```javascript
// En BusinessConfigLoader.js
const chokidar = require('chokidar');

watchConfig() {
  const watcher = chokidar.watch(this.configPath);
  watcher.on('change', () => {
    console.log('🔄 config/business.json modificado, recargando...');
    this.load();
  });
}
```

---

## 📊 Comparación: Antes vs Después

### ANTES (Sistema Monolítico)

```
❌ Prompt hardcodeado en archivo
❌ Nombre de negocio en variables de entorno
❌ Servicios hardcodeados
❌ Modificar código para cada cliente
❌ Difícil de escalar
```

### DESPUÉS (Sistema SaaS)

```
✅ Configuración en JSON
✅ Prompt dinámico
✅ Servicios configurables
✅ Cero modificaciones de código
✅ Clonable en segundos
✅ Escalable a N clientes
```

---

## 🎯 Beneficios del Sistema

### Para el Negocio

1. **Escalabilidad**
   - Agregar clientes sin modificar código
   - Cada instancia independiente
   - Fácil de mantener

2. **Personalización Total**
   - Cada cliente con su configuración
   - Servicios específicos
   - Horarios personalizados
   - Tono de conversación único

3. **Despliegue Rápido**
   - Script de clonación automático
   - 5 minutos para nueva instancia
   - Documentación auto-generada

### Para el Cliente

1. **Sin Código**
   - Configuración vía JSON
   - Interfaz simple
   - No requiere programadores

2. **Actualización Fácil**
   - Editar JSON y reiniciar
   - Sin deployments complejos
   - Cambios inmediatos

3. **Independencia**
   - Base de datos propia
   - Configuración aislada
   - Sin conflictos con otros clientes

---

## 🏗️ Arquitectura SaaS

```
┌────────────────────────────────────────────────┐
│              Sistema Base (Template)            │
│  - Código compartido                           │
│  - Lógica de negocio                           │
│  - Reglas de clasificación                     │
│  - API REST                                    │
└─────────────┬──────────────────────────────────┘
              │
              │ Clonación
              ↓
    ┌─────────────────────────┐
    │   Instancia Cliente A    │
    │  config/business.json    │
    │  .env                    │
    │  db/leads.db            │
    └─────────────────────────┘
    
    ┌─────────────────────────┐
    │   Instancia Cliente B    │
    │  config/business.json    │
    │  .env                    │
    │  db/leads.db            │
    └─────────────────────────┘
    
    ┌─────────────────────────┐
    │   Instancia Cliente C    │
    │  config/business.json    │
    │  .env                    │
    │  db/leads.db            │
    └─────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] BusinessConfigLoader creado
- [x] config/business.json con esquema completo
- [x] config/business.schema.json para validación
- [x] OpenAIClient modificado (carga dinámica)
- [x] Script de clonación (clone-for-client.js)
- [x] Documentación completa
- [x] Prompt dinámico generado
- [x] Servicios reflejados en respuestas
- [x] Nombre de negocio en prompt
- [x] Comunas validadas
- [x] Horarios incluidos
- [x] Estilo de conversación personalizable

---

## 🎉 Resumen Ejecutivo

### Lo que se implementó:

✅ **Configuración por cliente** (`config/business.json`)  
✅ **Carga dinámica del prompt**  
✅ **Servicios y comunas configurables**  
✅ **Horarios personalizables**  
✅ **Script de clonación automático**  
✅ **Documentación de configuración**  
✅ **Sistema 100% replicable**  

### Objetivo cumplido:

🎯 **Instancia por cliente lista para replicar sin modificar código**

### Próximos pasos:

1. Editar `config/business.json` para tu primer cliente
2. Iniciar: `npm start`
3. Verificar que todo funciona
4. Clonar para nuevo cliente: `node scripts/clone-for-client.js`

---

**Estado:** ✅ LISTO PARA ESCALAR  
**Última actualización:** Enero 2026  
**Versión:** 2.0 (SaaS Multi-Cliente)

