# 📊 Panel de Leads - Dashboard Comercial

## 🎯 Objetivo

Panel web funcional para visualizar y gestionar leads capturados por el asistente de IA, diseñado para demostraciones comerciales.

---

## 🚀 Acceso Rápido

Una vez iniciado el servidor:

```bash
npm start
```

**Accede al dashboard en:**
```
http://localhost:3000/dashboard
```

---

## ✨ Funcionalidades Implementadas

### 1. Vista de Leads en Tiempo Real

El dashboard se conecta a la API REST y muestra todos los leads capturados:

```javascript
GET /api/leads              // Todos los leads
GET /api/leads?estado=caliente  // Filtrar por estado
GET /api/leads?contactado=false // Filtrar por contactado
```

### 2. Tabla Interactiva con Datos Completos

Cada lead muestra:
- ✅ **Nombre** - Nombre del cliente
- ✅ **Teléfono** - Número de contacto (formato internacional)
- ✅ **Servicio** - Tipo de servicio solicitado
- ✅ **Comuna** - Ubicación del cliente
- ✅ **Estado** - Clasificación (🔥 caliente, 🌡️ tibio, ❄️ frío)
- ✅ **Fecha** - Cuándo se capturó el lead (formato relativo)
- ✅ **Contactado** - Estado de seguimiento

### 3. Filtros Inteligentes

Filtra leads por:
- **Estado**: Caliente, Tibio, Frío
- **Contactado**: Pendiente o Contactado

### 4. Estadísticas en Tiempo Real

El panel muestra contadores automáticos:
- 📊 **Total** - Cantidad total de leads
- 🔥 **Calientes** - Oportunidades reales
- 🌡️ **Tibios** - Interesados
- ❄️ **Fríos** - Consultas generales

### 5. Marcar como Contactado

Actualiza el estado de un lead con un solo clic:

```javascript
PATCH /api/leads/:id  // Marcar como contactado
```

El botón se deshabilita automáticamente después de marcar.

---

## 🎨 Diseño Moderno

### Características de UI/UX:

✅ **Diseño responsive** - Funciona en desktop, tablet y móvil  
✅ **Gradientes modernos** - Visual atractivo para demos comerciales  
✅ **Badges de estado** - Identificación visual clara (colores y emojis)  
✅ **Hover effects** - Interactividad fluida  
✅ **Fecha relativa** - "Hace 2h", "Ayer", etc.  
✅ **Loading states** - Indicadores de carga  
✅ **Empty states** - Mensajes cuando no hay datos  

### Paleta de Colores:

```css
Caliente: #f5576c (Rojo/Rosa) - Alta prioridad
Tibio:    #fee140 (Amarillo) - Interés moderado
Frío:     #00f2fe (Celeste) - Consulta general
```

---

## 📡 API Endpoints Utilizados

### GET /api/leads

Obtiene todos los leads con filtros opcionales.

**Query Parameters:**
- `estado` (opcional): `caliente`, `tibio`, `frio`
- `contactado` (opcional): `true`, `false`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "telefono": "+56912345678",
      "servicio": "instalación",
      "comuna": "Las Condes",
      "estado": "caliente",
      "contactado": 0,
      "fecha_creacion": "2026-01-07T10:30:00Z"
    }
  ]
}
```

---

### GET /api/leads/estadisticas

Obtiene estadísticas agregadas de leads.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "porEstado": {
      "caliente": 5,
      "tibio": 7,
      "frio": 3
    },
    "contactados": 8,
    "pendientes": 7
  }
}
```

---

### PATCH /api/leads/:id

Marca un lead como contactado.

**Método:** `PATCH`  
**URL:** `/api/leads/1`

**Respuesta:**
```json
{
  "success": true,
  "message": "Lead actualizado correctamente"
}
```

---

## 🛠️ Estructura de Archivos

```
public/
├── dashboard.html    ← Panel de leads (NUEVO)
├── index.html        ← Panel anterior (mantener compatibilidad)
├── app.js            ← Lógica del panel anterior (actualizado con /api/)
└── style.css         ← Estilos compartidos

src/infrastructure/http/routes/
└── leads.js          ← Endpoints actualizados con PATCH

server.js             ← Servidor con rutas /api/
```

---

## 🔧 Cambios Técnicos Implementados

### 1. Prefijo `/api/` en Todas las Rutas

**ANTES:**
```javascript
app.use('/chat', chatRoutes);
app.use('/leads', leadsRoutes);
```

**AHORA:**
```javascript
app.use('/api/chat', chatRoutes);
app.use('/api/leads', leadsRoutes);
```

**Beneficios:**
- ✅ Separación clara entre rutas web y API
- ✅ Convención estándar REST
- ✅ Facilita documentación
- ✅ Permite futuras versiones (/api/v2/)

---

### 2. Endpoint PATCH Adicional

Además del endpoint existente `PUT /api/leads/:id/contactado`, se agregó:

```javascript
PATCH /api/leads/:id
```

Esto permite actualizar parcialmente un lead, siguiendo convenciones REST:
- **PUT** - Reemplazo completo del recurso
- **PATCH** - Actualización parcial del recurso

---

### 3. Dashboard HTML Independiente

El nuevo `dashboard.html` es completamente independiente:
- ✅ No depende de `app.js` ni `style.css` antiguos
- ✅ Todo el código está autocontenido (HTML + CSS + JS)
- ✅ Fácil de customizar para diferentes clientes
- ✅ Puede servirse en diferentes dominios

---

## 📊 Demostración Comercial

### Flujo de Demo Recomendado:

1. **Mostrar el chatbot** (http://localhost:3000)
   - Usuario interactúa con el asistente
   - Proporciona datos (nombre, teléfono, servicio)
   - Solicita cotización (lead caliente)

2. **Abrir el dashboard** (http://localhost:3000/dashboard)
   - Ver el lead aparecer en tiempo real
   - Mostrar clasificación automática (caliente)
   - Ver estadísticas actualizadas

3. **Aplicar filtros**
   - Filtrar por "Calientes" para ver solo oportunidades reales
   - Explicar el sistema de clasificación

4. **Marcar como contactado**
   - Hacer clic en "Marcar Contactado"
   - Mostrar que el estado se actualiza
   - El botón se deshabilita

5. **Explicar el valor**
   - Filtrado automático de oportunidades reales
   - No más consultas irrelevantes
   - Notificaciones solo para leads calientes
   - Aumento de eficiencia comercial

---

## 🎯 Casos de Uso

### Para Equipos Comerciales

```
1. Revisar leads calientes del día
   → Filtro: estado=caliente, contactado=false

2. Ver historial completo
   → Sin filtros

3. Seguimiento de pendientes
   → Filtro: contactado=false

4. Análisis de conversiones
   → Estadísticas por estado
```

### Para Gerencia

```
1. Métricas de captura
   → Total leads, distribución por estado

2. Tasa de contacto
   → Contactados vs Pendientes

3. Calidad de leads
   → Proporción de calientes/tibios/fríos
```

---

## 🚀 Mejoras Futuras (Opcionales)

### Funcionalidades Avanzadas:

- [ ] **Paginación** - Para grandes volúmenes de leads
- [ ] **Búsqueda** - Por nombre, teléfono o comuna
- [ ] **Exportar CSV/Excel** - Para análisis externo
- [ ] **Notas** - Agregar comentarios a cada lead
- [ ] **Asignación** - Asignar leads a vendedores
- [ ] **Timeline** - Ver historial de conversación completo
- [ ] **Notificaciones push** - Alertas para leads calientes
- [ ] **Integración CRM** - Exportar a Salesforce, HubSpot, etc.

### Analytics:

- [ ] **Gráficos** - Chart.js para visualizaciones
- [ ] **Tasas de conversión** - Leads → Ventas
- [ ] **Tiempo de respuesta** - Desde captura hasta contacto
- [ ] **Fuentes** - De dónde vienen los leads (web, WhatsApp)

---

## 🔐 Consideraciones de Seguridad

### Para Producción:

```javascript
// Agregar autenticación
app.use('/dashboard', requireAuth);
app.use('/api/leads', requireAuth);

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
}));

// CORS configurado
app.use(cors({
  origin: ['https://tudominio.com'],
  credentials: true
}));
```

---

## 📱 Responsive Design

El dashboard se adapta automáticamente:

### Desktop (>1024px)
- Tabla completa con todas las columnas
- Estadísticas en fila horizontal
- Espaciado amplio

### Tablet (768px - 1024px)
- Tabla ajustada, columnas prioritarias
- Estadísticas en grid 2x2
- Fuente reducida

### Mobile (<768px)
- Vista de tarjetas (cards) en lugar de tabla
- Estadísticas apiladas
- Botones de ancho completo

---

## 🐛 Troubleshooting

### El dashboard no carga leads

**Problema:** No aparecen leads en la tabla.

**Soluciones:**
```bash
1. Verificar que el servidor esté corriendo
   → npm start

2. Verificar endpoint en consola del navegador
   → F12 → Network → Ver request a /api/leads

3. Verificar base de datos
   → node -e "console.log(require('./src/infrastructure/database/connection').exec('SELECT * FROM leads'))"

4. Probar endpoint directo
   → http://localhost:3000/api/leads
```

---

### Error CORS

**Problema:** "Access-Control-Allow-Origin" error.

**Solución:**
```javascript
// Ya implementado en server.js
app.use(cors());
```

---

### Botón "Marcar Contactado" no funciona

**Problema:** No actualiza el estado.

**Solución:**
```bash
1. Verificar endpoint en Network tab
   → Debe ser PATCH /api/leads/:id

2. Verificar respuesta del servidor
   → Debe retornar { success: true }

3. Verificar caso de uso en logs
   → Ver consola del servidor
```

---

## ✅ Checklist de Implementación

- [x] Endpoint GET /api/leads (ya existía)
- [x] Endpoint GET /api/leads?estado=X (ya existía)
- [x] Endpoint PATCH /api/leads/:id (implementado)
- [x] Dashboard HTML con diseño moderno
- [x] Conexión fetch a API
- [x] Tabla con todos los campos requeridos
- [x] Filtros por estado y contactado
- [x] Estadísticas en tiempo real
- [x] Botón marcar como contactado
- [x] Responsive design
- [x] Loading states
- [x] Empty states
- [x] Actualización automática
- [x] Formato de fecha relativo
- [x] Badges visuales de estado

---

## 🎉 Resumen

### Lo que se implementó:

✅ Panel web funcional en `/dashboard`  
✅ Tabla completa con todos los datos de leads  
✅ Filtros por estado (caliente/tibio/frío)  
✅ Filtros por contactado (pendiente/contactado)  
✅ Estadísticas en tiempo real  
✅ Endpoint PATCH /api/leads/:id  
✅ Diseño moderno y responsive  
✅ Actualización automática de datos  
✅ Formato de fechas relativo  
✅ Badges visuales de clasificación  

### Listo para:

🔥 **Demo comercial**  
🔥 **Presentación a clientes**  
🔥 **Uso interno del equipo comercial**  
🔥 **Seguimiento de leads en tiempo real**  

---

## 📞 Uso Inmediato

```bash
# 1. Iniciar servidor
npm start

# 2. Abrir navegador
http://localhost:3000/dashboard

# 3. Ver leads capturados
# 4. Aplicar filtros
# 5. Marcar como contactado
# 6. Mostrar a cliente/equipo
```

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN  
**Última actualización:** Enero 2026

