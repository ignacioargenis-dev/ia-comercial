# 🔧 Solución: Enlaces de Instagram No Clickeables

## ❌ Problema Identificado

Los enlaces de Instagram en el dashboard no son clickeables porque los leads existentes no tienen el campo `instagram_id` poblado.

---

## 🔍 Causa Raíz

Los leads de Instagram en el dashboard (#53 y #51) fueron creados **antes** de que se implementara la captura del `instagram_id`. Por lo tanto:

```javascript
lead.instagram_id = null  // ← No hay ID guardado
```

La función `formatCanalLink()` verifica:
```javascript
if (canal === 'instagram' && lead.instagram_id) {
  // Crear enlace clickeable
}
```

Como `instagram_id` es `null`, el enlace no se crea.

---

## ✅ Soluciones

### Solución 1: Crear Nuevos Leads de Prueba (Recomendado)

Usa el simulador de Instagram para crear leads nuevos con `instagram_id`:

```bash
# Opción A: Desde terminal
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, necesito instalación urgente",
    "senderId": "test_instagram_001"
  }'

# Continuar la conversación para completar el lead
# El senderId debe ser el MISMO en todos los mensajes
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Me llamo Ana López",
    "senderId": "test_instagram_001"
  }'

curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{
    "message": "+56987654321",
    "senderId": "test_instagram_001"
  }'

curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type": "application/json" \
  -d '{
    "message": "Providencia",
    "senderId": "test_instagram_001"
  }'
```

**Resultado:**
- Lead guardado con `canal: "instagram"`
- Lead guardado con `instagram_id: "test_instagram_001"`
- Enlace clickeable en dashboard: `https://www.instagram.com/direct/t/test_instagram_001`

### Solución 2: Actualizar Leads Existentes Manualmente

Si quieres mantener los leads existentes pero hacerlos clickeables, actualiza manualmente:

**Opción A: Script Node.js**

```javascript
// update-instagram-ids.js
const Database = require('better-sqlite3');
const db = new Database('./database/leads.db');

// Actualizar leads existentes de Instagram con IDs de ejemplo
const updates = [
  { id: 53, instagram_id: 'maria_gonzalez_instagram' },
  { id: 51, instagram_id: 'maria_silva_instagram' }
];

const stmt = db.prepare('UPDATE leads SET instagram_id = ? WHERE id = ?');

updates.forEach(({ id, instagram_id }) => {
  const result = stmt.run(instagram_id, id);
  if (result.changes > 0) {
    console.log(`✅ Lead #${id} actualizado con instagram_id: ${instagram_id}`);
  }
});

db.close();
console.log('\n✅ Actualización completada. Recarga el dashboard.');
```

**Ejecutar:**
```bash
node update-instagram-ids.js
```

**Opción B: SQL Directo (si tienes cliente SQLite)**

```sql
-- Actualizar leads específicos
UPDATE leads SET instagram_id = 'maria_gonzalez_instagram' WHERE id = 53;
UPDATE leads SET instagram_id = 'maria_silva_instagram' WHERE id = 51;
```

**⚠️ Nota:** Los IDs que pongas deben ser IDs reales de Instagram para que el enlace funcione. Si no tienes los IDs reales, usa la Solución 1.

### Solución 3: Probar con Instagram Real

Para capturar IDs reales de Instagram:

1. Configura el webhook de Instagram en producción (ver `README-INSTAGRAM.md`)
2. Haz que un cliente real envíe un DM a tu cuenta de Instagram Business
3. El sistema capturará automáticamente el `instagram_id` real
4. El enlace en el dashboard funcionará correctamente

---

## 🧪 Verificación

### 1. Después de Crear un Nuevo Lead

```bash
# Verificar que el lead tiene instagram_id
curl http://localhost:3000/api/leads | grep -A 10 "instagram"
```

**Debe mostrar:**
```json
{
  "id": 54,
  "nombre": "Ana López",
  "canal": "instagram",
  "instagram_id": "test_instagram_001"  // ← DEBE ESTAR PRESENTE
}
```

### 2. En el Dashboard

1. Abrir `http://localhost:3000/dashboard`
2. Filtrar por "Canal: Instagram"
3. Buscar el lead recién creado
4. Columna "Canal" debe mostrar **[📸 Instagram]** con fondo rosa
5. **Hover** sobre el enlace debe mostrar tooltip: "Abrir conversación en Instagram"
6. **Click** debe abrir nueva pestaña con: `https://www.instagram.com/direct/t/test_instagram_001`

### 3. Inspeccionar HTML

En el dashboard, inspeccionar la celda de "Canal":

**Con instagram_id:**
```html
<td>
  <a href="https://www.instagram.com/direct/t/test_instagram_001" 
     target="_blank" 
     class="instagram-link" 
     title="Abrir conversación en Instagram">
    📸 Instagram
  </a>
</td>
```

**Sin instagram_id:**
```html
<td>
  📸 Instagram  <!-- Solo texto, no enlace -->
</td>
```

---

## 📊 Estado Actual

### Leads Existentes (#53, #51)
- ❌ `instagram_id = null`
- ❌ No clickeables
- ✅ Mostrados correctamente como "📸 Instagram"
- 💡 Solución: Crear nuevos o actualizar manualmente

### Leads Nuevos
- ✅ `instagram_id` capturado automáticamente
- ✅ Enlace clickeable funcionando
- ✅ Abre Instagram Direct correctamente

---

## 🎯 Próximos Pasos

### Recomendación: Crear Leads de Prueba

1. **Abrir terminal**
2. **Ejecutar simulación:**
   ```bash
   curl -X POST http://localhost:3000/api/simulate/instagram \
     -H "Content-Type: application/json" \
     -d '{"message": "Hola", "senderId": "test_001"}'
   ```
3. **Completar conversación** (nombre, teléfono, comuna)
4. **Verificar en dashboard**
5. **Click en enlace de Instagram**

### Para Producción

1. Configurar webhook de Instagram (ver `README-INSTAGRAM.md`)
2. Usuarios reales enviarán DMs
3. IDs capturados automáticamente
4. Enlaces funcionarán con conversaciones reales

---

## ✅ Corrección Aplicada

**Archivo:** `src/infrastructure/http/routes/simulate.js`

**Cambio:**
```javascript
// ANTES (faltaba instagram_id)
lead: result.lead ? {
  id: result.lead.id,
  nombre: result.lead.nombre,
  // ...
  canal: result.lead.canal,
  completo: result.lead.estaCompleto()
} : null

// DESPUÉS (agregado instagram_id)
lead: result.lead ? {
  id: result.lead.id,
  nombre: result.lead.nombre,
  // ...
  canal: result.lead.canal,
  instagram_id: result.lead.instagram_id,  // ← AGREGADO
  completo: result.lead.estaCompleto()
} : null
```

---

## 🎉 Resumen

**Problema:** Enlaces no clickeables  
**Causa:** Leads antiguos sin `instagram_id`  
**Solución:** Crear nuevos leads con simulador  
**Estado:** ✅ Sistema funcionando correctamente para leads nuevos

**Servidor reiniciado:** ✅  
**Corrección aplicada:** ✅

