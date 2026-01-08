# ✅ Endpoint de Simulación de Instagram - COMPLETADO

## 🎯 Objetivo Alcanzado

Endpoint para simular mensajes de Instagram sin necesitar la API real de Meta, usando el mismo flujo de IA y guardando leads con `canal="instagram"`.

---

## 📍 Endpoint

### POST `/api/simulate/instagram`

**Request:**
```json
{
  "message": "Hola, necesito instalación urgente",
  "senderId": "demo_user_123"  // Opcional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "respuesta": "¡Hola! Soy el asistente virtual...",
    "lead": {
      "id": 42,
      "nombre": "María González",
      "telefono": "+56912345678",
      "servicio": "instalación",
      "comuna": "Las Condes",
      "estado": "caliente",
      "canal": "instagram",  ← CANAL CORRECTO
      "completo": true
    },
    "metadata": {
      "sessionId": "instagram_demo_user_123",
      "canal": "instagram",
      "simulacion": true
    }
  }
}
```

---

## 🔄 Flujo

```
Cliente envía POST /api/simulate/instagram
    ↓
Validar message (requerido, string, no vacío)
    ↓
Generar sessionId: instagram_{senderId}
    ↓
Procesar con HandleIncomingMessage
    ↓
channel = 'instagram'  ← MISMO FLUJO QUE REAL
    ↓
Lead guardado con canal="instagram" ✓
    ↓
Retornar respuesta JSON
```

---

## 📊 Ejemplo Completo

**Paso 1:**
```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "senderId": "maria_123"}'
```

**Paso 2:**
```bash
curl -X POST http://localhost:3000/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "María, +56912345678, instalación urgente Las Condes", "senderId": "maria_123"}'
```

**Resultado:**
- Lead guardado con `canal="instagram"`
- Aparece en dashboard con 📸 Instagram
- Email enviado si es caliente
- Teléfono clickable para WhatsApp

---

## 🌐 Endpoints Adicionales

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/simulate/instagram` | Simular Instagram |
| `POST /api/simulate/whatsapp` | Simular WhatsApp |
| `POST /api/simulate/web` | Simular Web |
| `GET /api/simulate/status` | Estado del módulo |

---

## ✅ Validaciones

```javascript
✅ message: requerido, string, no vacío
✅ senderId: opcional (se genera automáticamente)
✅ Mismo flujo que Instagram real
✅ Canal guardado correctamente
✅ Notificaciones funcionan
```

---

## 📈 Beneficios

**Para Demos:**
- No requiere Instagram API configurada
- No requiere cuenta Business
- Funciona localmente
- Control total del flujo

**Para Testing:**
- Sin dependencias externas
- Sin rate limits
- Reproducible
- Debugging fácil

---

## 🎉 Estado: **PRODUCTION READY**

Simulación completa de Instagram lista para demos y desarrollo 🚀

---

**Documentación completa:** `SIMULACION-INSTAGRAM.md`  
**Archivo:** `src/infrastructure/http/routes/simulate.js`

