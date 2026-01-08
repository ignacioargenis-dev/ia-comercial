# 📋 Guía Rápida - Configurar para un Cliente

## ⚡ 5 Minutos para Configurar

### Paso 1: Editar config/business.json

```json
{
  "business": {
    "name": "TU EMPRESA AQUÍ",
    "phone": "+56912345678",
    "email": "contacto@tuempresa.cl"
  }
}
```

### Paso 2: Configurar Servicios

```json
{
  "services": [
    {
      "id": "servicio1",
      "name": "Nombre del Servicio",
      "description": "Descripción breve"
    }
  ]
}
```

### Paso 3: Definir Cobertura

```json
{
  "coverage": {
    "communes": [
      "Santiago",
      "Providencia",
      "Las Condes"
    ]
  }
}
```

### Paso 4: Ajustar Horarios

```json
{
  "schedule": {
    "workingDays": {
      "monday": { "enabled": true, "open": "09:00", "close": "18:00" }
    }
  }
}
```

### Paso 5: Iniciar

```bash
npm start
```

---

## ✅ Verificación Rápida

1. Accede a: http://localhost:3000
2. Pregunta: "¿Qué servicios ofrecen?"
3. Verifica que mencione TU nombre de empresa
4. Verifica que liste TUS servicios

---

## 🎨 Personalizar Tono

```json
{
  "conversationStyle": {
    "tone": "profesional y cercano",
    "formality": "tú",
    "personality": "Amigable y eficiente"
  }
}
```

**Opciones de formality:**
- `"tú"` → Trato informal
- `"usted"` → Trato formal

---

## 🚀 Clonar para Otro Cliente

```bash
# Desde el directorio del proyecto
node scripts/clone-for-client.js nuevo-cliente "Nombre del Cliente"

# Esto crea:
# ../nuevo-cliente/
#   ├── config/business.json (personalizado)
#   ├── .env (plantilla)
#   ├── SETUP.md (instrucciones)
#   └── ...resto de archivos
```

---

## 📝 Campos Importantes

### Obligatorios

```json
{
  "business": {
    "name": "REQUERIDO",
    "industry": "REQUERIDO"
  },
  "services": [
    { "id": "REQUERIDO", "name": "REQUERIDO" }
  ],
  "coverage": {
    "communes": ["REQUERIDO"]
  }
}
```

### Opcionales

- `business.phone`
- `business.email`
- `business.website`
- `schedule.emergencyService`
- `conversationStyle`
- `qualifications`
- `pricing`

---

## 🔧 Troubleshooting

### El bot no menciona mi empresa

✅ **Solución:** Verificar que `business.name` esté correcto en `config/business.json` y reiniciar servidor.

### Servicios no aparecen

✅ **Solución:** Verificar que array `services[]` tenga al menos un elemento con `id` y `name`.

### Error al cargar configuración

✅ **Solución:** Validar que el JSON sea válido (sin comas extras, comillas cerradas).

---

## 📚 Documentación Completa

- `SAAS-MULTICLIENTE.md` - Documentación técnica completa
- `config/business.schema.json` - Schema de validación
- `scripts/clone-for-client.js` - Script de clonación

---

**¿Dudas?** Lee `SAAS-MULTICLIENTE.md` para detalles completos.

