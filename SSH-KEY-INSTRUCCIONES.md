# 🔑 Tu Clave SSH para DigitalOcean

## ✅ Clave SSH Generada Exitosamente

Tu par de claves SSH ha sido creado en:
```
Clave privada: C:\Users\Perrita\.ssh\id_rsa
Clave pública:  C:\Users\Perrita\.ssh\id_rsa.pub
```

**⚠️ IMPORTANTE:**
- La **clave privada** (`id_rsa`) NUNCA se comparte - queda en tu PC
- La **clave pública** (`id_rsa.pub`) es la que agregas a DigitalOcean

---

## 📋 Paso 1: Copiar tu Clave Pública

Ejecuta este comando en PowerShell para copiar tu clave al portapapeles:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub | Set-Clipboard
```

O manualmente:
```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

---

## 🌐 Paso 2: Agregar a DigitalOcean

### Opción A: Durante la creación del Droplet

1. Ve a: https://cloud.digitalocean.com/droplets/new
2. En la sección **"Authentication"**:
   - Selecciona **"SSH Key"**
   - Click en **"New SSH Key"**
3. En el campo **"SSH key content"**:
   - Pega tu clave pública (Ctrl+V)
4. En el campo **"Name"**:
   - Escribe: `PC-Perrita` o `ia-comercial-key`
5. Click **"Add SSH Key"**
6. Continúa creando tu Droplet

### Opción B: Agregar a cuenta existente

1. Ve a: https://cloud.digitalocean.com/account/security
2. Click en **"Add SSH Key"**
3. Pega tu clave pública
4. Nombra la clave: `PC-Perrita`
5. Click **"Add SSH Key"**

---

## 🔌 Paso 3: Conectarte al Servidor

Una vez que tu Droplet esté creado (con la IP, por ejemplo: `165.227.123.45`):

```powershell
# Conectar por SSH (reemplaza con tu IP)
ssh root@165.227.123.45
```

La primera vez te preguntará:
```
The authenticity of host '165.227.123.45' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Escribe: `yes` y presiona Enter.

**¡Estarás conectado sin necesidad de contraseña!** 🎉

---

## 🔐 Seguridad

### ✅ Lo que hicimos:

1. **Generamos un par de claves RSA de 4096 bits**
   - Muy seguro (prácticamente imposible de romper)

2. **Sin passphrase**
   - Para facilitar conexión automática
   - Para producción avanzada, podrías agregar passphrase

3. **Fingerprint único**
   - SHA256: `EXfVuB6WDFw/D0RF50KfzfbQo0b3ejObELasuC8eLcQ`

### 🛡️ Mejores Prácticas:

- ✅ **Nunca compartas** tu clave privada (`id_rsa`)
- ✅ **Haz backup** de tu clave privada en lugar seguro
- ✅ **Una clave por dispositivo** (no copies la misma a múltiples PCs)
- ✅ **Revoca claves viejas** cuando cambies de PC

---

## 📂 Ubicación de tus Claves

```
C:\Users\Perrita\.ssh\
├── id_rsa          ← Clave PRIVADA (NO compartir)
└── id_rsa.pub      ← Clave PÚBLICA (OK compartir)
```

---

## 🔧 Comandos Útiles

### Ver tu clave pública:
```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

### Copiar clave al portapapeles:
```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub | Set-Clipboard
```

### Ver fingerprint:
```powershell
ssh-keygen -lf $env:USERPROFILE\.ssh\id_rsa.pub
```

### Probar conexión SSH:
```powershell
# Reemplaza con tu IP de DigitalOcean
ssh root@165.227.123.45
```

---

## 🆘 Troubleshooting

### Problema: "Permission denied (publickey)"

**Solución:**
- Verifica que agregaste la clave correcta a DigitalOcean
- Asegúrate de seleccionar la clave al crear el Droplet
- En DigitalOcean, ve a Droplet → Access → View Console

### Problema: "Could not open a connection to your authentication agent"

**Solución:**
```powershell
# Iniciar ssh-agent
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_rsa
```

### Problema: Perdí mi clave privada

**Solución:**
- Genera una nueva clave (este mismo proceso)
- Agrégala a DigitalOcean
- En el Droplet existente, actualiza `~/.ssh/authorized_keys`

---

## 🎯 Siguiente Paso

Una vez que hayas agregado tu clave SSH a DigitalOcean:

1. **Crea tu Droplet** siguiendo `DESPLIEGUE-DIGITALOCEAN.md`
2. **Selecciona tu SSH Key** durante la creación
3. **Conecta vía SSH:** `ssh root@TU_IP`
4. **Continúa con el despliegue** 🚀

---

## 📝 Resumen

✅ Clave SSH generada  
✅ Ubicación: `C:\Users\Perrita\.ssh\`  
✅ Tipo: RSA 4096 bits  
✅ Fingerprint: `EXfVuB6WDFw/D0RF50KfzfbQo0b3ejObELasuC8eLcQ`  

**Próximo paso:** Copiar la clave pública y agregarla a DigitalOcean.

---

**¡Tu clave SSH está lista! 🔑**

