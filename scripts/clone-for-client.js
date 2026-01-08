#!/usr/bin/env node

/**
 * Script para clonar la instancia para un nuevo cliente
 * 
 * Uso: node scripts/clone-for-client.js <client-id> <client-name>
 * Ejemplo: node scripts/clone-for-client.js peluqueria-moderna "Peluquería Moderna"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Obtener argumentos
const args = process.argv.slice(2);

if (args.length < 2) {
  error('Uso: node scripts/clone-for-client.js <client-id> <client-name>');
}

const clientId = args[0];
const clientName = args[1];
const targetDir = path.join(process.cwd(), '..', clientId);

log('\n' + '='.repeat(70), 'bright');
log('🚀 CLONACIÓN DE INSTANCIA PARA NUEVO CLIENTE', 'bright');
log('='.repeat(70), 'bright');
log('');

info(`Cliente ID: ${clientId}`);
info(`Cliente Nombre: ${clientName}`);
info(`Directorio destino: ${targetDir}`);
log('');

// Verificar que no existe el directorio
if (fs.existsSync(targetDir)) {
  error(`El directorio ${targetDir} ya existe`);
}

try {
  // Paso 1: Clonar repositorio
  log('1️⃣  Clonando repositorio...', 'bright');
  const sourceDir = process.cwd();
  
  // Copiar archivos (excluir node_modules, .git, db, etc.)
  info('   Copiando archivos del proyecto...');
  
  // Crear directorio destino
  fs.mkdirSync(targetDir, { recursive: true });
  
  // Copiar archivos
  copyDirectory(sourceDir, targetDir, [
    'node_modules',
    '.git',
    'db',
    '.env',
    'dist',
    'build',
    'coverage',
    '.DS_Store',
    'Thumbs.db'
  ]);
  
  success('   Repositorio clonado');
  
  // Paso 2: Crear configuración personalizada
  log('\n2️⃣  Creando configuración personalizada...', 'bright');
  
  const configPath = path.join(targetDir, 'config', 'business.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Personalizar configuración
  config.business.name = clientName;
  config.business.shortName = clientName.split(' ')[0];
  config.metadata.clientId = clientId;
  config.metadata.createdAt = new Date().toISOString().split('T')[0];
  config.metadata.lastUpdated = config.metadata.createdAt;
  config.metadata.instanceType = 'development';
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  success(`   Configuración creada: config/business.json`);
  
  // Paso 3: Crear .env personalizado
  log('\n3️⃣  Creando archivo .env...', 'bright');
  
  const envContent = `# Configuración para ${clientName}
# Generado: ${new Date().toISOString()}

# ================================
# CONFIGURACIÓN GENERAL
# ================================
PORT=3000
NODE_ENV=development
BUSINESS_NAME=${clientName}

# ================================
# OPENAI API
# ================================
OPENAI_API_KEY=sk-REEMPLAZAR-CON-TU-CLAVE
OPENAI_MODEL=gpt-4o-mini

# ================================
# BASE DE DATOS
# ================================
DATABASE_PATH=./db/leads.db

# ================================
# NOTIFICACIONES - EMAIL
# ================================
OWNER_EMAIL=propietario@${clientId}.cl
EMAIL_USER=sistema@${clientId}.cl
EMAIL_PASS=REEMPLAZAR-CON-APP-PASSWORD
EMAIL_SERVICE=gmail

# ================================
# NOTIFICACIONES - WEBHOOK (Opcional)
# ================================
# WEBHOOK_URL=https://hooks.make.com/tu-webhook
# WEBHOOK_TYPE=make

# ================================
# WHATSAPP (Opcional)
# ================================
# WHATSAPP_API_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_VERIFY_TOKEN=
# OWNER_PHONE=

# ================================
# INSTANCIA
# ================================
CLIENT_ID=${clientId}
`;
  
  fs.writeFileSync(path.join(targetDir, '.env'), envContent);
  success('   Archivo .env creado');
  
  // Paso 4: Crear README personalizado
  log('\n4️⃣  Creando documentación personalizada...', 'bright');
  
  const readmeContent = `# ${clientName} - IA Comercial

Instancia personalizada del sistema IA Comercial para ${clientName}.

## 🚀 Inicio Rápido

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
# Editar .env y agregar:
# - OPENAI_API_KEY
# - OWNER_EMAIL
# - EMAIL_USER y EMAIL_PASS (para notificaciones)

# 3. Personalizar config/business.json
# - Servicios ofrecidos
# - Comunas atendidas
# - Horarios de atención

# 4. Iniciar servidor
npm start
\`\`\`

## 📊 Accesos

- **Chat:** http://localhost:3000
- **Dashboard:** http://localhost:3000/dashboard
- **API:** http://localhost:3000/api/leads

## 📝 Configuración

Editar \`config/business.json\` para personalizar:

- Nombre y datos de contacto
- Servicios ofrecidos
- Comunas atendidas
- Horarios de atención
- Estilo de conversación
- Notificaciones

## 📚 Documentación

Ver archivos de documentación en la raíz:
- \`INICIO-RAPIDO.md\` - Guía de inicio
- \`NOTIFICACIONES.md\` - Configurar notificaciones
- \`DASHBOARD-COMERCIAL.md\` - Uso del panel
- \`API.md\` - Documentación de API

## 🔧 Soporte

Para dudas o soporte técnico, contactar al equipo de desarrollo.

---

**Cliente:** ${clientName}  
**ID:** ${clientId}  
**Fecha de creación:** ${new Date().toISOString().split('T')[0]}
`;
  
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent);
  success('   README.md personalizado creado');
  
  // Paso 5: Crear directorio para base de datos
  log('\n5️⃣  Creando estructura de directorios...', 'bright');
  
  const dbDir = path.join(targetDir, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  success('   Directorio db/ creado');
  
  // Paso 6: Crear archivo de instrucciones
  log('\n6️⃣  Creando guía de configuración...', 'bright');
  
  const setupInstructions = `# 📋 INSTRUCCIONES DE CONFIGURACIÓN

## Pasos para poner en marcha la instancia de ${clientName}

### 1. Configurar OpenAI

\`\`\`bash
# Editar .env y agregar tu API key de OpenAI
OPENAI_API_KEY=sk-tu-clave-aqui
\`\`\`

### 2. Personalizar Negocio

Editar \`config/business.json\`:

- \`business.name\`: "${clientName}"
- \`business.phone\`: Teléfono de contacto
- \`business.email\`: Email de contacto
- \`services\`: Lista de servicios que ofrece
- \`coverage.communes\`: Comunas que atiende
- \`schedule.workingDays\`: Horarios de atención

### 3. Configurar Notificaciones

**Opción A - Email:**

1. Generar App Password de Gmail:
   https://myaccount.google.com/apppasswords

2. Editar .env:
   \`\`\`
   OWNER_EMAIL=propietario@ejemplo.com
   EMAIL_USER=sistema@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   \`\`\`

**Opción B - Webhook:**

1. Crear webhook en Make.com o Zapier

2. Editar .env:
   \`\`\`
   WEBHOOK_URL=https://hooks.make.com/abc123
   WEBHOOK_TYPE=make
   \`\`\`

### 4. Instalar y Ejecutar

\`\`\`bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
\`\`\`

### 5. Verificar

- Chat: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- API: http://localhost:3000/api/leads

## ✅ Checklist

- [ ] OPENAI_API_KEY configurado en .env
- [ ] Datos de negocio actualizados en config/business.json
- [ ] Servicios personalizados
- [ ] Comunas configuradas
- [ ] Horarios definidos
- [ ] Email o Webhook configurado
- [ ] npm install ejecutado
- [ ] Servidor iniciado y funcionando
- [ ] Prueba de chat realizada
- [ ] Dashboard accesible

---

**Cliente:** ${clientName}  
**Fecha:** ${new Date().toISOString().split('T')[0]}
`;
  
  fs.writeFileSync(path.join(targetDir, 'SETUP.md'), setupInstructions);
  success('   Guía SETUP.md creada');
  
  // Resumen final
  log('\n' + '='.repeat(70), 'bright');
  log('🎉 CLONACIÓN COMPLETADA EXITOSAMENTE', 'green');
  log('='.repeat(70), 'bright');
  log('');
  
  success('Instancia creada en:');
  info(`   ${targetDir}`);
  log('');
  
  log('📋 PRÓXIMOS PASOS:', 'bright');
  log('');
  log(`   1. cd ../${clientId}`);
  log(`   2. Editar .env (agregar OPENAI_API_KEY)`);
  log(`   3. Editar config/business.json (personalizar negocio)`);
  log(`   4. npm install`);
  log(`   5. npm start`);
  log('');
  
  info('Ver SETUP.md para instrucciones detalladas');
  log('');
  
} catch (err) {
  error(err.message);
}

/**
 * Copiar directorio recursivamente
 */
function copyDirectory(src, dest, exclude = []) {
  // Crear directorio destino
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Leer contenido
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Verificar si está en la lista de exclusión
    if (exclude.includes(entry.name)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

