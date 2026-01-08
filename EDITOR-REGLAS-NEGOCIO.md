# ⚙️ Editor de Reglas del Negocio

## 🎯 Funcionalidad

El dashboard ahora incluye un **Editor de Reglas del Negocio** que permite modificar cómo el asistente de IA interactúa con los clientes, **sin necesidad de contratar un desarrollador ni reiniciar el sistema**.

---

## 📍 Ubicación

En el dashboard (`http://localhost:3000/dashboard`), encontrarás un botón:

```
⚙️ Reglas del Negocio
```

Ubicado junto al botón de "Actualizar", en la barra de filtros.

---

## 💡 ¿Qué puedes modificar?

El **System Prompt** (prompt del sistema) es el conjunto de instrucciones que definen:

### 1. **Personalidad del Asistente**
- Tono de voz (formal, casual, amigable)
- Nivel de formalidad
- Uso de emojis

### 2. **Reglas de Clasificación**
- Qué hace que un lead sea "caliente" 🔥
- Qué hace que un lead sea "tibio" 🌡️
- Qué hace que un lead sea "frío" ❄️

### 3. **Información del Negocio**
- Servicios ofrecidos
- Áreas de cobertura
- Horarios de atención
- Políticas de precios

### 4. **Flujo de Conversación**
- Qué preguntas hacer primero
- Cómo capturar datos
- Cuándo finalizar la conversación
- Mensajes de cierre

### 5. **Restricciones**
- Qué NO decir
- Información que NO compartir
- Temas a evitar

---

## 🎬 Cómo Usar el Editor

### Paso 1: Abrir el Editor

1. Ve al dashboard: `http://localhost:3000/dashboard`
2. Click en el botón **"⚙️ Reglas del Negocio"**
3. Se abrirá un modal con el prompt actual

### Paso 2: Editar las Reglas

- Verás todo el texto del prompt en un editor
- Es texto plano, fácil de leer y modificar
- Incluye comentarios y secciones organizadas

**Ejemplo de contenido:**

```
Eres un asistente virtual profesional de Climatización Express...

SERVICIOS QUE OFRECEMOS:
- Instalación de sistemas de climatización
- Mantenimiento preventivo y correctivo
- Reparación de equipos
...

REGLAS DE NEGOCIO PARA CLASIFICACIÓN:

🔥 CALIENTE (caliente) - OPORTUNIDAD REAL:
✓ Usa verbos de acción directa: "necesito", "quiero contratar"
✓ Menciona urgencia inmediata: "urgente", "hoy", "mañana"
...
```

### Paso 3: Guardar los Cambios

1. Modifica lo que necesites
2. Click en **"💾 Guardar Cambios"**
3. Confirma que quieres aplicar los cambios
4. ✅ Listo! Los cambios se aplican **inmediatamente**

### Paso 4: Probar

- Ve al chat: `http://localhost:3000/`
- Inicia una conversación
- Verás que el asistente usa las nuevas reglas

---

## 📝 Ejemplos de Modificaciones Comunes

### Ejemplo 1: Cambiar el Nombre del Negocio

**Antes:**
```
Eres un asistente virtual profesional de Climatización Express.
```

**Después:**
```
Eres un asistente virtual profesional de TechSolutions.
```

### Ejemplo 2: Agregar un Nuevo Servicio

**Antes:**
```
SERVICIOS QUE OFRECEMOS:
- Instalación de sistemas de climatización
- Mantenimiento preventivo y correctivo
- Reparación de equipos
```

**Después:**
```
SERVICIOS QUE OFRECEMOS:
- Instalación de sistemas de climatización
- Mantenimiento preventivo y correctivo
- Reparación de equipos
- Venta de repuestos originales
- Asesoría energética
```

### Ejemplo 3: Hacer el Tono Más Formal

**Antes:**
```
TONO Y ESTILO:
- Profesional pero cercano
- Usa emojis ocasionalmente para ser más amigable
```

**Después:**
```
TONO Y ESTILO:
- Formal y profesional
- No usar emojis
- Tratamiento de usted
```

### Ejemplo 4: Cambiar Criterios de "Caliente"

**Antes:**
```
🔥 CALIENTE (caliente):
✓ Usa verbos de acción: "necesito", "quiero contratar"
✓ Menciona urgencia: "urgente", "hoy"
```

**Después:**
```
🔥 CALIENTE (caliente):
✓ Menciona presupuesto aprobado
✓ Solicita visita técnica
✓ Pregunta por disponibilidad inmediata
✓ Es cliente corporativo
```

### Ejemplo 5: Personalizar Mensaje de Cierre

**Antes:**
```
"¡Perfecto! Ya registré todos tus datos. 
Un asesor te contactará en breve."
```

**Después:**
```
"¡Excelente! Hemos registrado tu consulta con éxito. 
Nuestro equipo de expertos se pondrá en contacto contigo 
en las próximas 2 horas para coordinar una visita sin costo."
```

---

## 🔒 Seguridad y Respaldo

### Backup Automático

Cada vez que guardas cambios:
1. Se crea un **backup automático** del prompt anterior
2. Se guarda en: `prompts/systemPrompt.backup.txt`
3. Puedes restaurarlo si algo sale mal

### Validaciones

El sistema valida que:
- ✅ El prompt no esté vacío
- ✅ Tenga al menos 100 caracteres
- ✅ Confirmación antes de guardar

### Restaurar Backup (Si es necesario)

Si los cambios no funcionan como esperabas:

**Opción 1: Via API (para desarrolladores)**
```bash
curl -X POST http://localhost:3000/api/system/prompt/restore
```

**Opción 2: Manualmente**
1. Ve a la carpeta: `prompts/`
2. Copia `systemPrompt.backup.txt`
3. Reemplaza `systemPrompt.txt`
4. El sistema lo cargará automáticamente

---

## ⚡ Aplicación Inmediata

### ¿Necesito Reiniciar?

**NO.** Los cambios se aplican **inmediatamente** sin necesidad de:
- ❌ Reiniciar el servidor
- ❌ Reiniciar Node.js
- ❌ Hacer deploy
- ❌ Limpiar caché

### ¿Cómo funciona?

1. Guardas los cambios
2. El sistema actualiza el archivo `systemPrompt.txt`
3. El `OpenAIClient` recarga el prompt automáticamente
4. La próxima conversación usa las nuevas reglas

### Tiempo de propagación

**Instantáneo:** La próxima conversación que se inicie usará las nuevas reglas.

**Conversaciones existentes:** Las conversaciones en curso seguirán usando las reglas anteriores hasta que finalicen.

---

## 🎯 Casos de Uso

### Caso 1: Nueva Campaña de Marketing

**Situación:**
- Tienes una promoción especial este mes
- Quieres que el asistente la mencione

**Solución:**
1. Abre el editor
2. Busca la sección de servicios
3. Agrega: "Promoción de enero: 20% de descuento en instalaciones"
4. Guarda
5. Todos los nuevos clientes lo verán

### Caso 2: Cambio de Horarios

**Situación:**
- Cambiaste tus horarios de atención
- Ahora también atiendes sábados

**Solución:**
1. Abre el editor
2. Busca "HORARIOS" o "DISPONIBILIDAD"
3. Actualiza: "Lunes a Sábado de 8:00 a 18:00"
4. Guarda
5. El asistente informará los nuevos horarios

### Caso 3: Nuevo Mercado

**Situación:**
- Empezaste a ofrecer servicios corporativos
- Quieres priorizar empresas

**Solución:**
1. Abre el editor
2. En la sección "CALIENTE", agrega:
   ```
   ✓ Menciona ser empresa o corporación
   ✓ Consulta por múltiples unidades
   ✓ Pregunta por contratos mensuales
   ```
3. Guarda
4. Las consultas corporativas se priorizarán automáticamente

### Caso 4: Problemas de Calidad

**Situación:**
- Notas que muchos leads "calientes" no son reales
- Los criterios son muy laxos

**Solución:**
1. Abre el editor
2. Ajusta los criterios de "caliente"
3. Hazlos más estrictos
4. Guarda
5. La clasificación será más precisa

### Caso 5: Temporada Alta

**Situación:**
- Es verano, temporada alta
- Tienes 2-3 días de espera

**Solución:**
1. Abre el editor
2. Actualiza el mensaje de cierre:
   ```
   "Debido a la alta demanda de verano, 
   nuestro equipo te contactará en las próximas 48-72 horas."
   ```
3. Guarda
4. Los clientes tendrán expectativas realistas

---

## 📊 Monitoreo de Cambios

### Ver Cambios Realizados

Los cambios quedan registrados en los logs:

```bash
# Ver logs
tail -f logs/combined-*.log
```

Busca entradas como:
```json
{
  "message": "System prompt updated",
  "oldSize": 12450,
  "newSize": 12680,
  "backup": "prompts/systemPrompt.backup.txt"
}
```

### Historial

- Cada cambio genera un backup
- El backup se sobrescribe con cada nuevo cambio
- Si necesitas historial completo, usa git:

```bash
git add prompts/systemPrompt.txt
git commit -m "Updated business rules for [reason]"
```

---

## ⚠️ Precauciones

### ❌ NO Modifiques

1. **La estructura JSON de respuesta**
   - El asistente DEBE responder en formato JSON
   - No cambies las llaves: `reply`, `lead`, `nombre`, `telefono`, etc.

2. **Las 3 clasificaciones**
   - Mantén: `caliente`, `tibio`, `frio`
   - No cambies los nombres (el sistema depende de ellos)

3. **La instrucción de responder SOLO JSON**
   - Es crítico que el asistente responda JSON puro
   - Sin markdown, sin bloques de código

### ✅ SÍ Puedes Modificar

1. ✅ Nombre del negocio
2. ✅ Servicios ofrecidos
3. ✅ Criterios de clasificación (mantener los 3 estados)
4. ✅ Tono y personalidad
5. ✅ Mensajes y respuestas
6. ✅ Flujo de conversación
7. ✅ Información de contacto

---

## 🐛 Troubleshooting

### "Error al cargar las reglas"

**Causa:** Problema de permisos o archivo no encontrado

**Solución:**
```bash
# Verificar que el archivo existe
ls -la prompts/systemPrompt.txt

# Verificar permisos
chmod 644 prompts/systemPrompt.txt
```

### "El asistente no usa las nuevas reglas"

**Causa:** Conversación existente usando caché

**Solución:**
- Inicia una NUEVA conversación (nuevo sessionId)
- Recarga la página del chat
- Espera 1 minuto para que se propague

### "Los cambios se perdieron"

**Causa:** Error al guardar o archivo sobrescrito

**Solución:**
```bash
# Restaurar desde backup
cp prompts/systemPrompt.backup.txt prompts/systemPrompt.txt
```

### "El asistente responde mal formateado"

**Causa:** Se modificó la estructura JSON

**Solución:**
1. Restaura el backup
2. Revisa que mantengas las instrucciones de formato JSON
3. No elimines las secciones críticas

---

## 🔮 Futuras Mejoras

### Próximas Versiones:

1. **Versiones múltiples**
   - Guardar múltiples versiones del prompt
   - Cambiar entre versiones fácilmente
   - Historial completo de cambios

2. **Editor visual**
   - Interfaz con secciones editables
   - Campos de formulario en vez de texto plano
   - Preview de cambios antes de guardar

3. **Plantillas predefinidas**
   - Plantillas por industria
   - Plantillas por tono (formal, casual, técnico)
   - Plantillas por idioma

4. **A/B Testing**
   - Probar dos versiones del prompt
   - Medir cuál convierte mejor
   - Aplicar automáticamente la mejor

5. **Análisis de efectividad**
   - Ver cómo afectan los cambios a la conversión
   - Métricas antes/después
   - Sugerencias de mejora con IA

---

## 📚 Recursos Adicionales

### Documentos Relacionados:

- `prompts/systemPrompt.txt` - El archivo que editas
- `PERSONALIZACION.md` - Guía de personalización completa
- `API.md` - Documentación de endpoints (incluye `/api/system/prompt`)

### Endpoints de la API:

```bash
# Obtener el prompt actual
GET /api/system/prompt

# Actualizar el prompt
PUT /api/system/prompt
Body: { "prompt": "..." }

# Restaurar desde backup
POST /api/system/prompt/restore
```

---

## ✅ Checklist de Modificación

Antes de guardar cambios, verifica:

- [ ] El nombre del negocio es correcto
- [ ] Los servicios están actualizados
- [ ] Las 3 clasificaciones existen (caliente, tibio, frio)
- [ ] El formato JSON se mantiene
- [ ] El tono es apropiado para tu marca
- [ ] Los mensajes de cierre son claros
- [ ] No hay errores de ortografía
- [ ] La información de contacto es correcta
- [ ] Probaste los cambios en el chat

---

## 🎉 Beneficios

### Para el Negocio:

1. **Autonomía** 🚀
   - No dependes de desarrolladores
   - Cambios inmediatos cuando los necesites
   - Ahorro en costos de mantenimiento

2. **Agilidad** ⚡
   - Adapta el asistente a campañas
   - Responde a cambios del mercado
   - Prueba diferentes enfoques

3. **Control** 🎯
   - Tú decides cómo suena tu marca
   - Ajustas según feedback de clientes
   - Optimizas continuamente

### Para el Usuario/Admin:

1. **Fácil de usar** 👍
   - Interfaz visual simple
   - Sin código complejo
   - Cambios seguros con backup

2. **Inmediato** 💨
   - Sin esperas
   - Sin deploy
   - Sin reiniciar

3. **Seguro** 🔒
   - Backup automático
   - Validaciones
   - Fácil de revertir

---

## 📞 Soporte

¿Necesitas ayuda modificando las reglas?

1. Revisa los ejemplos en este documento
2. Consulta `PERSONALIZACION.md`
3. Prueba cambios pequeños primero
4. Siempre puedes restaurar el backup

---

**Última actualización:** Enero 2026  
**Versión:** 1.0  
**✅ Funcionalidad lista para usar**

