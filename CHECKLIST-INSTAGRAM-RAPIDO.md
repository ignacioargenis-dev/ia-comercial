# ✅ Checklist Rápido - Instagram

## 🚀 Configuración Rápida en 30 Minutos

Guía condensada para configurar Instagram lo más rápido posible.

---

## 1. Instagram Business (5 min)

- [ ] Abrir Instagram → Configuración → Cuenta → Cambiar a Profesional
- [ ] Vincular página de Facebook
- [ ] ✅ Verificar que muestra "Empresa"

---

## 2. Meta Developers (10 min)

### Crear App
- [ ] Ir a https://developers.facebook.com
- [ ] Crear app tipo "Empresa"
- [ ] Agregar producto "Messenger"

### Conectar Instagram
- [ ] Messenger → Configuración de Instagram
- [ ] Conectar cuenta de Instagram
- [ ] Generar Page Access Token
- [ ] **Copiar token** → Este es tu `IG_PAGE_TOKEN`

---

## 3. Webhook (10 min)

### Generar Token de Verificación
```bash
# Copiar este comando y ejecutar:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- [ ] **Copiar resultado** → Este es tu `IG_VERIFY_TOKEN`

### Configurar en Meta
- [ ] Messenger → Webhooks → Instagram
- [ ] URL: `https://tu-dominio.com/api/instagram/webhook`
- [ ] Token: Pegar tu `IG_VERIFY_TOKEN`
- [ ] Click "Verificar y guardar"
- [ ] Suscribirse a evento `messages`

---

## 4. Variables de Entorno (2 min)

Editar `.env`:

```env
IG_PAGE_TOKEN=EAAxxxxxx...
IG_VERIFY_TOKEN=tu_token_generado
```

Reiniciar servidor:
```bash
pm2 restart all
# o
npm start
```

---

## 5. Prueba Final (3 min)

### Health Check
```bash
curl https://tu-dominio.com/health/detailed
```
✅ Debe mostrar: `"instagram": { "configured": true }`

### Prueba Real
1. [ ] Abrir Instagram en móvil
2. [ ] Buscar tu cuenta Business
3. [ ] Enviar DM: **"Hola"**
4. [ ] ✅ Debe responder: "Hola 👋 Gracias por escribirnos..."

### Verificar Dashboard
- [ ] Abrir `https://tu-dominio.com/dashboard`
- [ ] ✅ Ver nuevo lead con canal "Instagram" 📸

---

## 🎉 ¡Listo!

Si todo funciona, Instagram está configurado correctamente.

**Si algo falla:** Ver `README-INSTAGRAM.md` para troubleshooting detallado.

---

## 🔧 Comandos Útiles

```bash
# Ver logs de Instagram
tail -f logs/combined.log | grep INSTAGRAM

# Verificar variables
cat .env | grep IG_

# Test de webhook
curl -X POST https://tu-dominio.com/api/simulate/instagram \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola"}'
```

---

**Tiempo total estimado:** 30 minutos  
**Dificultad:** Media

