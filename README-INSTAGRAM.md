# 📸 Instagram - Checklist Técnico de Despliegue

## 📋 Guía Completa para Configurar Instagram Messaging API

Este documento proporciona un checklist paso a paso para configurar la integración de Instagram con el sistema de IA comercial.

---

## ⚠️ Requisitos Previos

Antes de comenzar, asegúrate de tener:

- [ ] Cuenta de Instagram convertida a **Instagram Business** o **Instagram Creator**
- [ ] Página de Facebook asociada a la cuenta de Instagram
- [ ] Cuenta de desarrollador en Meta (Facebook Developers)
- [ ] Acceso administrativo a la página de Facebook
- [ ] Dominio público con HTTPS (para webhook)
- [ ] Servidor desplegado y accesible públicamente

---

## 📝 Tabla de Contenidos

1. [Configuración de Cuenta Instagram Business](#1-configuración-de-cuenta-instagram-business)
2. [Configuración en Meta Developers](#2-configuración-en-meta-developers)
3. [Conexión de Instagram a la App](#3-conexión-de-instagram-a-la-app)
4. [Configuración del Webhook](#4-configuración-del-webhook)
5. [Activación de Permisos](#5-activación-de-permisos)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Pruebas Finales](#7-pruebas-finales)
8. [Troubleshooting](#8-troubleshooting)
9. [Limitaciones y Consideraciones](#9-limitaciones-y-consideraciones)

---

## 1. Configuración de Cuenta Instagram Business

### 1.1 Convertir a Instagram Business

**Si tu cuenta ya es Business, salta al paso 1.2**

1. [ ] Abrir Instagram en el móvil
2. [ ] Ir a **Perfil** → **Menú (☰)** → **Configuración**
3. [ ] Seleccionar **Cuenta**
4. [ ] Tocar **Cambiar tipo de cuenta**
5. [ ] Seleccionar **Cambiar a cuenta profesional**
6. [ ] Elegir **Empresa** o **Creador**
7. [ ] Seguir los pasos de configuración

### 1.2 Conectar con Página de Facebook

1. [ ] En Instagram: **Configuración** → **Cuenta** → **Página vinculada**
2. [ ] Seleccionar **Crear una página nueva** o **Conectar página existente**
3. [ ] Autorizar la conexión
4. [ ] Verificar que aparece el nombre de la página

**✅ Checkpoint:** La cuenta de Instagram debe mostrar "Empresa" y tener una página de Facebook vinculada.

---

## 2. Configuración en Meta Developers

### 2.1 Crear Cuenta de Desarrollador

1. [ ] Ir a [https://developers.facebook.com](https://developers.facebook.com)
2. [ ] Iniciar sesión con tu cuenta de Facebook
3. [ ] Aceptar los términos de desarrollador
4. [ ] Completar verificación (si se requiere)

### 2.2 Crear Nueva App

1. [ ] Click en **Mis Apps** (top derecho)
2. [ ] Click en **Crear app**
3. [ ] Seleccionar tipo de app:
   - **Empresa** (recomendado para producción)
   - O **Ninguno** (para desarrollo)
4. [ ] Completar formulario:
   - **Nombre para mostrar:** `[Nombre del Negocio] - IA Comercial`
   - **Correo de contacto:** `[email del administrador]`
   - **Cuenta de empresa:** Seleccionar o crear una
5. [ ] Click en **Crear app**
6. [ ] Completar verificación de seguridad

**✅ Checkpoint:** Deberías ver el dashboard de tu nueva app con un **ID de app**.

### 2.3 Agregar Producto "Messenger"

1. [ ] En el dashboard de tu app, buscar sección **Productos**
2. [ ] Encontrar **Messenger** en la lista
3. [ ] Click en **Configurar** o **Agregar**
4. [ ] Esperar a que se agregue el producto

**Nota:** Messenger es el producto que maneja tanto mensajes de Facebook como de Instagram.

---

## 3. Conexión de Instagram a la App

### 3.1 Configuración de Instagram en Messenger

1. [ ] En el dashboard de la app, ir a **Productos** → **Messenger** → **Configuración de Instagram**
2. [ ] Buscar sección **Páginas de Instagram**
3. [ ] Click en **Conectar cuenta de Instagram**
4. [ ] Seleccionar la página de Facebook asociada
5. [ ] Autorizar los permisos solicitados

**✅ Checkpoint:** Deberías ver tu cuenta de Instagram listada bajo "Páginas de Instagram".

### 3.2 Generar Token de Acceso

1. [ ] En **Configuración de Instagram**, buscar **Tokens de acceso**
2. [ ] Seleccionar tu página de Facebook en el dropdown
3. [ ] Click en **Generar token**
4. [ ] **MUY IMPORTANTE:** Copiar el token generado
   - Este es tu `IG_PAGE_TOKEN`
   - Guárdalo de forma segura
   - **No lo compartas públicamente**

**Formato del token:**
```
EAAxxxxxxxxxxxx...
```

**⚠️ Importante:** Este token **expira**. Para producción, necesitas generar un **token de larga duración**:

1. [ ] Ir a [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. [ ] Seleccionar tu app
3. [ ] En "User or Page", seleccionar tu página
4. [ ] Click en el icono de información (ⓘ) junto al token
5. [ ] Click en **Open in Access Token Tool**
6. [ ] Click en **Extend Access Token**
7. [ ] Copiar el nuevo token de larga duración

---

## 4. Configuración del Webhook

### 4.1 Preparar Servidor

**Requisitos del servidor:**
- [ ] HTTPS obligatorio (no HTTP)
- [ ] Certificado SSL válido
- [ ] Puerto 443 o accesible públicamente
- [ ] Servidor en funcionamiento

**Ejemplo de URL de webhook:**
```
https://tu-dominio.com/api/instagram/webhook
```

**Verificar que el endpoint esté activo:**
```bash
curl https://tu-dominio.com/api/instagram/webhook
```

### 4.2 Generar Token de Verificación

Este token es una **cadena secreta** que tú defines para verificar que Meta está llamando tu webhook.

1. [ ] Generar un token seguro (mínimo 20 caracteres):

```bash
# Opción 1: Generar manualmente
# Usar letras, números y caracteres especiales

# Opción 2: Generar con Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 3: Generar online
# https://randomkeygen.com/
```

**Ejemplo:**
```
ig_webhook_verify_2024_a8f3k9d2j1m5n7p0
```

2. [ ] Guardar este token como `IG_VERIFY_TOKEN`

### 4.3 Configurar Webhook en Meta

1. [ ] En Meta Developers, ir a **Productos** → **Messenger** → **Configuración**
2. [ ] Buscar sección **Webhooks**
3. [ ] En **Instagram**, click en **Agregar URL de devolución de llamada**
4. [ ] Completar formulario:

**URL de devolución de llamada:**
```
https://tu-dominio.com/api/instagram/webhook
```

**Token de verificación:**
```
[Tu IG_VERIFY_TOKEN generado en 4.2]
```

5. [ ] Click en **Verificar y guardar**

**⚠️ Si falla la verificación:**
- Verificar que el servidor esté corriendo
- Verificar que la URL sea HTTPS
- Verificar que `IG_VERIFY_TOKEN` en `.env` coincida exactamente
- Revisar logs del servidor para ver el intento de verificación

**✅ Checkpoint:** Deberías ver un mensaje de "Verificación exitosa" o similar.

### 4.4 Suscribirse a Eventos

1. [ ] Después de verificar, en la sección **Webhooks** → **Instagram**
2. [ ] Click en **Agregar suscripciones**
3. [ ] Seleccionar los siguientes eventos:
   - [ ] **messages** (Obligatorio - para recibir mensajes)
   - [ ] **messaging_postbacks** (Opcional - para botones)
   - [ ] **message_echoes** (Opcional - para eco de mensajes enviados)
4. [ ] Click en **Guardar**

**✅ Checkpoint:** Los eventos seleccionados deben mostrar estado "Activo".

---

## 5. Activación de Permisos

### 5.1 Permisos de Desarrollo

Durante el desarrollo, los permisos se otorgan automáticamente. Sin embargo, para **producción**, necesitas solicitar aprobación.

**Permisos necesarios:**

1. [ ] `instagram_basic` - Acceso básico a perfil
2. [ ] `instagram_manage_messages` - Enviar y recibir mensajes
3. [ ] `pages_manage_metadata` - Gestionar metadata de la página
4. [ ] `pages_read_engagement` - Leer engagement de la página

### 5.2 Solicitar Revisión de App (Para Producción)

**Solo necesario si vas a usar en producción con usuarios reales fuera de tu equipo.**

1. [ ] En Meta Developers, ir a **Revisión de la app**
2. [ ] Click en **Solicitar permisos**
3. [ ] Seleccionar los permisos listados arriba
4. [ ] Para cada permiso, proporcionar:
   - **Caso de uso:** Explicar por qué necesitas el permiso
   - **Screencast:** Video mostrando cómo usas el permiso
   - **Capturas de pantalla:** Screenshots de la funcionalidad
5. [ ] Enviar para revisión
6. [ ] Esperar aprobación (puede tomar varios días)

**Ejemplo de caso de uso:**
```
Permiso: instagram_manage_messages

Caso de uso:
Nuestro sistema de IA automatiza la atención al cliente a través 
de Instagram Direct Messages. Necesitamos este permiso para:
- Recibir mensajes de clientes
- Responder automáticamente con información del negocio
- Capturar datos de leads
- Derivar a un asesor humano cuando sea necesario

El sistema mejora la experiencia del cliente proporcionando 
respuestas instantáneas 24/7.
```

**⚠️ Importante:** Durante el desarrollo y testing, puedes usar la app en "Modo de desarrollo" sin aprobación, pero solo funcionará con cuentas que agregues como testers.

### 5.3 Agregar Testers (Modo Desarrollo)

Si estás en modo desarrollo y quieres probar con cuentas específicas:

1. [ ] Ir a **Roles** → **Roles de Instagram**
2. [ ] Click en **Agregar personas**
3. [ ] Ingresar nombre de usuario de Instagram
4. [ ] Asignar rol (Tester, Desarrollador, etc.)
5. [ ] Enviar invitación
6. [ ] La persona debe aceptar la invitación

### 5.4 Cambiar App a Modo "En vivo"

**Solo hacer esto cuando estés listo para producción y tengas permisos aprobados.**

1. [ ] Ir a **Configuración básica**
2. [ ] Desplazarse hasta **Modo de la app**
3. [ ] Cambiar de "Desarrollo" a "En vivo"
4. [ ] Confirmar el cambio

**⚠️ Advertencia:** En modo "En vivo" sin permisos aprobados, la funcionalidad estará limitada.

---

## 6. Variables de Entorno

### 6.1 Configurar Variables en el Servidor

Editar el archivo `.env` en el servidor:

```bash
# Abrir editor
nano .env
```

### 6.2 Variables de Instagram

Agregar las siguientes variables:

```env
# ═══════════════════════════════════════════════════════════════
# Instagram Messaging API
# ═══════════════════════════════════════════════════════════════

# Token de acceso a la página (Page Access Token)
# Obtenido en Meta Developers > Messenger > Configuración de Instagram
# Formato: EAAxxxxxxxxxxxx...
IG_PAGE_TOKEN=tu_page_access_token_aqui

# Token de verificación del webhook (tú lo defines)
# Debe coincidir con el token configurado en Meta Developers
# Mínimo 20 caracteres, letras y números
IG_VERIFY_TOKEN=tu_token_de_verificacion_aqui

# ═══════════════════════════════════════════════════════════════
```

### 6.3 Ejemplo Completo

```env
# Instagram Messaging API
IG_PAGE_TOKEN=EAABsbCS1iHgBAOZCHfZCxjN7R8kVx2mRW8...
IG_VERIFY_TOKEN=ig_webhook_verify_2024_a8f3k9d2j1m5n7p0
```

### 6.4 Verificar Variables

```bash
# Guardar el archivo (Ctrl + O, Enter, Ctrl + X en nano)

# Verificar que las variables están configuradas
cat .env | grep IG_
```

### 6.5 Reiniciar Servidor

```bash
# Detener servidor actual
# (depende de cómo esté corriendo)

# Si está en PM2:
pm2 restart all

# Si está con systemd:
sudo systemctl restart ia-comercial

# Si está con npm:
# Detener (Ctrl+C) y volver a iniciar:
npm start
```

**✅ Checkpoint:** El servidor debe reiniciarse sin errores.

---

## 7. Pruebas Finales

### 7.1 Verificar Health Check

```bash
curl https://tu-dominio.com/health/detailed
```

**Respuesta esperada:**
```json
{
  "status": "healthy",
  "services": {
    "instagram": {
      "configured": true,
      "status": "healthy"
    }
  }
}
```

**Si `configured: false`:**
- Verificar que `IG_PAGE_TOKEN` esté configurado
- Verificar que el servidor se haya reiniciado

### 7.2 Probar Webhook con Simulador

1. [ ] Ir a Meta Developers → **Messenger** → **Configuración de Instagram**
2. [ ] Buscar sección **Webhooks**
3. [ ] Click en **Probar** junto a tu webhook
4. [ ] Seleccionar evento `messages`
5. [ ] Click en **Enviar al servidor**

**Verificar logs del servidor:**
```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# O si usas PM2:
pm2 logs
```

**Deberías ver:**
```
📸 Instagram webhook received
📸 [INSTAGRAM] Mensaje recibido
```

### 7.3 Prueba Real con Instagram

**Esta es la prueba definitiva:**

1. [ ] Desde tu teléfono móvil o desde otra cuenta (si tienes permisos)
2. [ ] Abrir Instagram
3. [ ] Buscar la cuenta de Instagram Business configurada
4. [ ] Enviar un mensaje directo (DM): **"Hola"**
5. [ ] Esperar respuesta del bot

**Respuesta esperada:**
```
Hola 👋 Gracias por escribirnos. ¿Qué servicio estás buscando hoy?
```

**Si no responde:**
- Ver sección [8. Troubleshooting](#8-troubleshooting)

### 7.4 Prueba de Conversación Completa

1. [ ] Enviar: **"Hola"**
   - **Debe responder** pidiendo servicio

2. [ ] Enviar: **"Necesito instalación"**
   - **Debe responder** pidiendo comuna

3. [ ] Enviar: **"Las Condes"**
   - **Debe responder** pidiendo nombre

4. [ ] Enviar: **"Juan Pérez"**
   - **Debe responder** pidiendo teléfono

5. [ ] Enviar: **"+56912345678"**
   - **Debe responder** confirmando registro

6. [ ] Verificar en Dashboard:
   - [ ] Ir a `https://tu-dominio.com/dashboard`
   - [ ] Buscar el nuevo lead
   - [ ] Verificar que `Canal` = **Instagram** 📸
   - [ ] Verificar que los datos están completos

### 7.5 Verificar Notificaciones

Si el lead fue clasificado como "caliente":

1. [ ] Revisar email configurado en `OWNER_EMAIL`
2. [ ] Buscar email con asunto: **"🔥 Lead caliente desde Instagram"**
3. [ ] Verificar que contiene:
   - Nombre: Juan Pérez
   - Teléfono: +56912345678
   - Servicio: instalación
   - Comuna: Las Condes
   - Canal: 📸 Instagram

**✅ Checkpoint:** Todo el flujo funciona de extremo a extremo.

---

## 8. Troubleshooting

### Problema 1: Webhook no Verifica

**Síntoma:** Error al configurar webhook en Meta Developers.

**Soluciones:**

1. [ ] Verificar que el servidor esté corriendo:
```bash
curl https://tu-dominio.com/health/detailed
```

2. [ ] Verificar que la URL sea HTTPS (no HTTP)

3. [ ] Verificar que `IG_VERIFY_TOKEN` en `.env` coincida exactamente con el configurado en Meta

4. [ ] Ver logs del servidor durante la verificación:
```bash
tail -f logs/combined.log
```

5. [ ] Buscar en logs:
```
📸 Instagram webhook verification attempt
```

6. [ ] Si aparece "Invalid mode or token", el `IG_VERIFY_TOKEN` no coincide

### Problema 2: Bot No Responde

**Síntoma:** Envías mensaje en Instagram pero no hay respuesta.

**Soluciones:**

1. [ ] Verificar que el webhook esté suscrito al evento `messages`

2. [ ] Verificar logs del servidor:
```bash
tail -f logs/combined.log | grep INSTAGRAM
```

3. [ ] Deberías ver:
```
📸 [INSTAGRAM] Mensaje recibido
📸 [INSTAGRAM] Respuesta enviada
```

4. [ ] Si ves "Mensaje recibido" pero no "Respuesta enviada", revisar:
   - OpenAI API key configurada
   - Créditos en cuenta de OpenAI
   - Logs de error

5. [ ] Si no ves "Mensaje recibido", el webhook no está llegando:
   - Verificar suscripciones en Meta Developers
   - Verificar que la app esté en modo correcto (desarrollo/producción)
   - Si estás en modo desarrollo, verificar que tu cuenta sea tester

### Problema 3: Token Expirado

**Síntoma:** Error "Invalid OAuth access token".

**Solución:**

1. [ ] Generar nuevo token de larga duración (ver paso 3.2)
2. [ ] Actualizar `IG_PAGE_TOKEN` en `.env`
3. [ ] Reiniciar servidor

### Problema 4: Error 403 Forbidden

**Síntoma:** Logs muestran error 403 al intentar enviar mensaje.

**Soluciones:**

1. [ ] Verificar permisos en Meta Developers
2. [ ] Si estás en modo desarrollo, agregar cuenta como tester
3. [ ] Si estás en modo producción, verificar que permisos estén aprobados

### Problema 5: Mensajes Duplicados

**Síntoma:** El bot responde dos veces al mismo mensaje.

**Solución:**

1. [ ] Verificar que no haya múltiples instancias del servidor corriendo
2. [ ] Verificar que el webhook esté configurado una sola vez
3. [ ] Revisar que no haya duplicación de suscripciones

### Problema 6: No Aparece en Dashboard

**Síntoma:** Bot responde pero el lead no aparece en el dashboard.

**Soluciones:**

1. [ ] Verificar logs:
```bash
grep "leadGuardado" logs/combined.log
```

2. [ ] Debería mostrar `leadGuardado: true`

3. [ ] Verificar base de datos:
```bash
sqlite3 database/leads.db "SELECT * FROM leads WHERE canal='instagram';"
```

4. [ ] Si no hay registros, revisar errores en `SaveLead` use case

---

## 9. Limitaciones y Consideraciones

### 9.1 Ventana de Mensajería (24 horas)

**Limitación de Instagram:**
- Solo puedes responder a un usuario dentro de las **24 horas** siguientes a su último mensaje
- Después de 24 horas, solo puedes enviar mensajes con "Message Tags" aprobados

**Implicaciones:**
- El bot debe capturar datos rápidamente
- Si el usuario no responde en 24h, no puedes continuar la conversación automáticamente
- Un asesor humano debe continuar después de 24h (si es necesario)

### 9.2 Rate Limits

**Límites de la API de Instagram:**

| Límite | Valor |
|--------|-------|
| Llamadas por hora por usuario | 200 |
| Llamadas por día por aplicación | 4,800 |
| Mensajes por usuario | Sin límite específico, pero sujeto a detección de spam |

**Recomendaciones:**
- No enviar mensajes no solicitados
- Respetar si el usuario no responde
- Implementar delays entre mensajes si es necesario

### 9.3 Tipos de Mensajes Soportados

**Soportados en este sistema:**
- ✅ Mensajes de texto

**Otros tipos (no implementados actualmente):**
- ❌ Imágenes
- ❌ Videos
- ❌ Audio
- ❌ Stickers
- ❌ Plantillas
- ❌ Botones

**Para agregar soporte:** Modificar `src/infrastructure/http/routes/instagram.js`

### 9.4 Modo Desarrollo vs Producción

| Aspecto | Modo Desarrollo | Modo Producción |
|---------|----------------|----------------|
| Permisos | Automáticos | Requieren aprobación |
| Usuarios | Solo testers | Cualquier usuario |
| Limitaciones | Ninguna adicional | Rate limits estrictos |
| Webhook | Funciona | Funciona |
| Revisión de Meta | No requerida | Requerida |

### 9.5 Costos

**Meta/Instagram:**
- ✅ **Gratis** - No hay costo por usar la API de mensajería

**OpenAI:**
- 💵 **Pago por uso** - Cada mensaje procesado consume tokens
- Modelo usado: `gpt-4o-mini`
- Costo aproximado: $0.0001 - $0.0005 por conversación

**Servidor:**
- 💵 **Variable** - Depende del proveedor de hosting
- Requiere HTTPS (certificado SSL puede tener costo)

---

## 10. Checklist de Despliegue Final

### Pre-Despliegue

- [ ] Cuenta Instagram convertida a Business
- [ ] Página de Facebook conectada
- [ ] App creada en Meta Developers
- [ ] Messenger/Instagram configurado en la app
- [ ] Token de acceso generado (larga duración)
- [ ] Token de verificación generado
- [ ] Servidor desplegado con HTTPS

### Configuración

- [ ] Webhook configurado y verificado
- [ ] Suscripción a evento `messages` activa
- [ ] Variables `IG_PAGE_TOKEN` y `IG_VERIFY_TOKEN` en `.env`
- [ ] Servidor reiniciado con nuevas variables
- [ ] Health check pasa (`instagram.configured: true`)

### Testing

- [ ] Prueba con simulador de webhook exitosa
- [ ] Prueba real enviando "Hola" desde Instagram
- [ ] Bot responde correctamente
- [ ] Conversación completa funciona
- [ ] Lead aparece en dashboard con canal "Instagram"
- [ ] Notificación por email recibida (si lead caliente)

### Producción (Opcional)

- [ ] Permisos solicitados en App Review
- [ ] Documentación y videos enviados a Meta
- [ ] Permisos aprobados
- [ ] App cambiada a modo "En vivo"
- [ ] Prueba final con cuenta externa

### Monitoreo Post-Despliegue

- [ ] Logs del servidor monitoreados
- [ ] Dashboard revisado diariamente
- [ ] Rate limits monitoreados
- [ ] Emails de notificación llegando
- [ ] Clientes recibiendo respuestas

---

## 11. Soporte y Recursos

### Documentación Oficial

- **Meta for Developers:** https://developers.facebook.com/
- **Instagram Messaging API:** https://developers.facebook.com/docs/messenger-platform/instagram
- **Graph API Reference:** https://developers.facebook.com/docs/graph-api/reference/instagram-messaging-api

### Herramientas de Meta

- **Graph API Explorer:** https://developers.facebook.com/tools/explorer/
- **Access Token Debugger:** https://developers.facebook.com/tools/debug/accesstoken/
- **Webhook Debugger:** https://developers.facebook.com/tools/webhooks/

### Contacto del Sistema

Si tienes problemas técnicos con el sistema (no con Meta):
- Revisar logs: `logs/combined.log`
- Revisar documentación en el proyecto
- Contactar al equipo de desarrollo

---

## 12. Mantenimiento Continuo

### Tareas Semanales

- [ ] Revisar logs de errores
- [ ] Verificar que el bot responde correctamente
- [ ] Revisar leads capturados desde Instagram

### Tareas Mensuales

- [ ] Verificar que el token de acceso no haya expirado
- [ ] Revisar métricas de conversión por canal
- [ ] Optimizar prompts si es necesario

### Tareas Anuales

- [ ] Renovar token de acceso (si es necesario)
- [ ] Revisar y actualizar permisos de la app
- [ ] Actualizar documentación si hubo cambios

---

## 🎉 ¡Listo para Producción!

Si completaste todos los pasos de este checklist, tu sistema de IA comercial está **100% integrado con Instagram** y listo para capturar leads reales.

**Próximos pasos:**
1. Promocionar tu cuenta de Instagram
2. Incluir "Envíanos un DM" en posts
3. Monitorear conversiones en el dashboard
4. Optimizar mensajes según resultados

---

**Documento creado:** Enero 2025  
**Versión del sistema:** 1.0.0  
**Última actualización:** Enero 2025

