# 🎨 Guía de Personalización - IA Comercial

Esta guía te ayudará a adaptar el sistema para diferentes clientes o negocios.

## 🎯 Casos de Uso

Este sistema puede adaptarse para:
- Servicios técnicos (plomería, electricidad, climatización)
- Servicios profesionales (abogados, contadores, consultores)
- Comercio (tiendas, e-commerce, retail)
- Inmobiliarias (venta y arriendo)
- Salud y bienestar (clínicas, gimnasios, spa)
- Educación (cursos, academias, tutorías)
- Cualquier negocio que capture leads

## 📋 Pasos para Personalizar

### 1. Duplicar el Proyecto para Nuevo Cliente

```bash
# Copiar toda la carpeta
cp -r ia-comercial ia-comercial-cliente1

# Entrar a la nueva carpeta
cd ia-comercial-cliente1
```

### 2. Actualizar Variables de Entorno

Edita `.env`:

```env
# Puerto único para este cliente
PORT=3001

# API Key (puede ser la misma o diferente)
OPENAI_API_KEY=sk-xxxxxxxxx

# Datos del cliente
BUSINESS_NAME=Clima Express
BUSINESS_PHONE=+56987654321
OWNER_EMAIL=contacto@climaexpress.cl
OWNER_PHONE=+56987654321

# WhatsApp del cliente (si corresponde)
WHATSAPP_API_TOKEN=token_del_cliente
WHATSAPP_PHONE_NUMBER_ID=id_del_cliente
WHATSAPP_VERIFY_TOKEN=clima_express_token_123
```

### 3. Personalizar el Prompt del Asistente

Edita `prompts/systemPrompt.txt`. Este es el archivo más importante para personalizar.

#### Ejemplo 1: Empresa de Climatización

```text
Eres un asistente virtual profesional de Clima Express. Tu objetivo es atender consultas de potenciales clientes sobre servicios de aire acondicionado y calefacción, capturar sus datos de contacto y calificar su nivel de interés.

REGLAS IMPORTANTES:
- NUNCA menciones que eres una IA
- Responde de forma natural, amable y profesional
- Mantén las respuestas breves (máximo 2-3 oraciones)
- NO inventes precios ni horarios
- Si no sabes algo, indica que un técnico contactará

SERVICIOS QUE OFRECEMOS:
- Instalación de aire acondicionado
- Mantenimiento preventivo
- Reparación de equipos
- Limpieza de filtros
- Carga de gas refrigerante
- Instalación de calefacción

FLUJO DE CONVERSACIÓN:
1. Saluda cordialmente
2. Pregunta qué necesita
3. Solicita: nombre, teléfono, servicio, comuna, urgencia
4. Confirma que un técnico lo contactará

CALIFICACIÓN:
CALIENTE: Urgencia inmediata, equipo dañado
TIBIO: Mantenimiento o instalación planificada
FRÍO: Solo consulta de precios

TONO: Técnico pero amigable, resolutivo
```

#### Ejemplo 2: Abogado

```text
Eres la asistente del Estudio Jurídico Pérez & Asociados. Atiendes consultas legales, agendas consultas y capturas datos de clientes potenciales.

REGLAS IMPORTANTES:
- NO des asesoría legal específica
- NO menciones que eres IA
- Mantén confidencialidad y profesionalismo
- Respuestas breves y claras

SERVICIOS:
- Derecho de familia
- Derecho laboral
- Contratos comerciales
- Sucesiones y testamentos
- Asesoría corporativa

FLUJO:
1. Saludo profesional
2. Pregunta por su situación legal
3. Solicita: nombre, teléfono, tipo de caso, urgencia
4. Ofrece agendar consulta presencial

CALIFICACIÓN:
CALIENTE: Caso urgente, juicio en curso
TIBIO: Consulta preventiva, contratos
FRÍO: Solo información general

TONO: Profesional, empático, confidencial
```

#### Ejemplo 3: E-commerce

```text
Eres el asistente virtual de TechStore, tienda online de tecnología. Ayudas a clientes con consultas sobre productos, seguimiento de pedidos y devoluciones.

REGLAS:
- NO des precios exactos (pueden cambiar)
- Ofrece dirigir a la web para ver precios
- NO confirmes stock sin verificar
- NUNCA menciones que eres IA

PRODUCTOS:
- Notebooks y laptops
- Smartphones
- Accesorios tecnológicos
- Gaming y consolas
- Audio y video

FLUJO:
1. Saludo amigable
2. Pregunta qué busca
3. Captura: nombre, teléfono, producto de interés
4. Ofrece enviar catálogo o que un asesor contacte

CALIFICACIÓN:
CALIENTE: Quiere comprar ahora, pregunta por pago
TIBIO: Comparando productos
FRÍO: Solo navegando

TONO: Amigable, moderno, cercano
```

### 4. Personalizar Preguntas Específicas

Agrega preguntas específicas según el negocio al prompt:

**Para servicios a domicilio:**
```text
- ¿En qué comuna te encuentras?
- ¿Cuándo necesitas el servicio?
- ¿Es urgente o puede ser programado?
```

**Para profesionales:**
```text
- ¿Cuál es la naturaleza de tu consulta?
- ¿Es tu primera vez con este tema?
- ¿Prefieres reunión presencial o virtual?
```

**Para comercio:**
```text
- ¿Qué producto te interesa?
- ¿Has comprado con nosotros antes?
- ¿Necesitas despacho o retiro en tienda?
```

### 5. Modificar Criterios de Clasificación

En `prompts/systemPrompt.txt`, ajusta los criterios según el negocio:

**Para servicios premium (alta comisión):**
```text
CALIENTE:
- Presupuesto confirmado
- Proyecto grande
- Decisión inmediata

TIBIO:
- Cotizando con varios proveedores
- Proyecto a mediano plazo
- Presupuesto indefinido

FRÍO:
- Solo curiosidad
- Sin presupuesto
- Muy lejano en el tiempo
```

**Para productos de bajo ticket:**
```text
CALIENTE:
- Pregunta por formas de pago
- Quiere comprarlo hoy
- Consulta despacho inmediato

TIBIO:
- Comparando modelos
- Esperando oferta
- Pregunta características

FRÍO:
- Solo mirando
- Sin intención clara
- Pregunta precios muy generales
```

### 6. Ajustar Notificaciones

En `services/notificationService.js`, personaliza los mensajes:

```javascript
console.log(`\n🔥 ¡LEAD CALIENTE EN ${process.env.BUSINESS_NAME}! 🔥`);
console.log(`📱 Cliente: ${lead.nombre}`);
console.log(`⚡ Urgencia: ${lead.urgencia}`);
// Agrega campos específicos según tu negocio
```

### 7. Personalizar el Panel Web (Opcional)

Si quieres cambiar el diseño del panel:

**Editar colores en `public/style.css`:**
```css
:root {
  --primary-color: #2563eb; /* Cambiar por color de marca */
  --success-color: #10b981;
  /* ... más colores ... */
}
```

**Cambiar título en `public/index.html`:**
```html
<title>Mi Empresa - Panel de Leads</title>
<h1>🏢 Mi Empresa</h1>
```

### 8. Agregar Campos Personalizados

Si necesitas capturar información adicional:

**1. Actualizar base de datos (`db/database.js`):**
```javascript
const createLeadsTable = `
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    telefono TEXT,
    servicio TEXT,
    comuna TEXT,
    urgencia TEXT,
    presupuesto TEXT,  -- NUEVO CAMPO
    referencia TEXT,   -- NUEVO CAMPO
    estado TEXT DEFAULT 'frio',
    contactado INTEGER DEFAULT 0,
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;
```

**2. Actualizar prompt para solicitar nuevo campo:**
```text
- ¿Cuál es tu presupuesto aproximado?
- ¿Cómo nos conociste?
```

**3. Actualizar extracción en `services/aiService.js`:**
```javascript
{
  "nombre": "...",
  "telefono": "...",
  "servicio": "...",
  "presupuesto": "...",  // NUEVO
  "referencia": "..."    // NUEVO
}
```

## 🔄 Template para Múltiples Clientes

Si gestionas varios clientes, crea un script:

**`crear-cliente.sh`:**
```bash
#!/bin/bash

CLIENTE=$1
PUERTO=$2

# Copiar template
cp -r ia-comercial-template ia-comercial-$CLIENTE

cd ia-comercial-$CLIENTE

# Crear .env personalizado
cat > .env << EOF
PORT=$PUERTO
OPENAI_API_KEY=$OPENAI_API_KEY
BUSINESS_NAME=$CLIENTE
BUSINESS_PHONE=+56900000000
OWNER_EMAIL=contacto@$CLIENTE.com
OWNER_PHONE=+56900000000
DATABASE_PATH=./db/$CLIENTE.db
EOF

echo "✅ Cliente $CLIENTE creado en puerto $PUERTO"
```

**Uso:**
```bash
./crear-cliente.sh "Clima Express" 3001
./crear-cliente.sh "Estudio Legal" 3002
./crear-cliente.sh "TechStore" 3003
```

## 📊 Gestionar Múltiples Instancias

### Con PM2:
```bash
pm2 start server.js --name cliente1 --cwd /path/to/ia-comercial-cliente1
pm2 start server.js --name cliente2 --cwd /path/to/ia-comercial-cliente2
pm2 start server.js --name cliente3 --cwd /path/to/ia-comercial-cliente3

pm2 save
```

### Con Docker (avanzado):
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Construir y correr
docker build -t ia-comercial .
docker run -d -p 3001:3000 --env-file .env.cliente1 --name cliente1 ia-comercial
docker run -d -p 3002:3000 --env-file .env.cliente2 --name cliente2 ia-comercial
```

## 🎨 Ejemplos de Personalización por Industria

### Servicios Técnicos
- Capturar: tipo de equipo, marca, modelo
- Clasificar por urgencia (equipo sin funcionar = caliente)
- Preguntar por disponibilidad horaria

### Servicios Profesionales
- Capturar: tipo de servicio, experiencia previa
- Clasificar por complejidad del caso
- Ofrecer primera consulta

### E-commerce
- Capturar: producto de interés, presupuesto
- Clasificar por intención de compra
- Ofrecer descuentos o promociones

### Inmobiliaria
- Capturar: tipo de propiedad, sector, presupuesto
- Clasificar por capacidad de compra
- Agendar visitas

## ✅ Checklist de Personalización

- [ ] Carpeta duplicada para nuevo cliente
- [ ] Variables de entorno actualizadas
- [ ] Prompt del asistente personalizado
- [ ] Servicios específicos agregados
- [ ] Criterios de clasificación ajustados
- [ ] Campos personalizados agregados (si aplica)
- [ ] Panel web personalizado (opcional)
- [ ] Puerto único asignado
- [ ] Base de datos separada configurada
- [ ] Servidor probado y funcionando
- [ ] Lead de prueba creado exitosamente

¡Tu sistema está listo para el cliente específico! 🎉

