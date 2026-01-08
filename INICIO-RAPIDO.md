# ⚡ Inicio Rápido - IA Comercial

Guía express para poner en marcha el sistema en 5 minutos.

## 🚀 Instalación Rápida

```bash
# 1. Entrar a la carpeta
cd ia-comercial

# 2. Instalar dependencias
npm install

# 3. Copiar configuración
cp .env.example .env

# 4. Editar .env y agregar tu API Key de OpenAI
# En Windows: notepad .env
# En Mac/Linux: nano .env

# 5. Iniciar servidor
npm start
```

## ✅ Verificación

1. ¿El servidor inició sin errores? ✓
2. Abre: http://localhost:3000 ✓
3. ¿Ves el panel de leads? ✓
4. Haz clic en el botón 💬 y escribe "Hola" ✓
5. ¿El asistente responde? ✓

**¡Sistema funcionando!** 🎉

## 📝 Configuración Mínima

Edita `.env` con estos datos obligatorios:

```env
OPENAI_API_KEY=sk-tu_clave_aqui
BUSINESS_NAME=Tu Empresa
BUSINESS_PHONE=+56912345678
OWNER_EMAIL=tu@email.com
```

## 🎯 Personalización Básica

Edita `prompts/systemPrompt.txt` para cambiar:
- Servicios que ofreces
- Tono del asistente
- Preguntas que hace

## 🔥 Comandos Útiles

```bash
# Iniciar
npm start

# Modo desarrollo (reinicio automático)
npm run dev

# Ver todos los leads
curl http://localhost:3000/leads

# Enviar mensaje de prueba
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "sessionId": "test123"}'
```

## 📱 Conectar WhatsApp (Después)

1. Crea app en developers.facebook.com
2. Agrega producto WhatsApp
3. Configura webhook: `https://tu-dominio.com/whatsapp/webhook`
4. Copia credenciales al `.env`
5. Reinicia servidor

## 🆘 Problemas Comunes

**"Cannot find module"**
```bash
npm install
```

**"OPENAI_API_KEY is not set"**
- Verifica que el archivo `.env` exista
- Verifica que la clave esté correcta
- No debe haber espacios en la clave

**Puerto en uso**
- Cambia `PORT=3000` a otro número en `.env`

**Error de base de datos**
```bash
rm -rf db/leads.db
npm start
```

## 📖 Más Información

- **Instalación detallada:** Ver `INSTALACION.md`
- **Personalización:** Ver `PERSONALIZACION.md`
- **API completa:** Ver `API.md`
- **README general:** Ver `README.md`

## 🎓 Próximos Pasos

1. ✅ Sistema funcionando
2. 📝 Personaliza el prompt
3. 🎨 Cambia colores del panel (opcional)
4. 📱 Conecta WhatsApp
5. 🌐 Despliega en producción
6. 📊 Monitorea tus leads

¡Disfruta tu asistente de IA! 🤖

