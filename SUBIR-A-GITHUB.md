# 📤 Guía para Subir el Proyecto a GitHub

## ✅ Paso 1: Repositorio Local Creado

Ya se completó:
- ✅ Repositorio git inicializado
- ✅ Archivos agregados (131 archivos, ~43,000 líneas)
- ✅ Commit inicial creado
- ✅ `.gitignore` configurado correctamente

**Archivos protegidos (NO se subirán):**
- `.env` (credenciales)
- `*.db` (bases de datos)
- `*.log` (logs)
- `node_modules/` (dependencias)
- `logs/` (directorio de logs)

---

## 🌐 Paso 2: Crear Repositorio en GitHub

### Opción A: Desde la Web (Recomendado)

1. **Ir a GitHub:**
   ```
   https://github.com/new
   ```

2. **Configurar el repositorio:**
   - **Repository name:** `ia-comercial` (o el nombre que prefieras)
   - **Description:** "Sistema de IA Comercial Multi-Canal con OpenAI, WhatsApp e Instagram"
   - **Visibility:** 
     - ✅ **Private** (Recomendado si contiene lógica de negocio)
     - ⬜ Public (Si quieres compartir como portfolio)
   - **NO** marcar "Initialize this repository with:"
     - ❌ NO agregar README
     - ❌ NO agregar .gitignore
     - ❌ NO agregar license
     
   (Ya tenemos estos archivos localmente)

3. **Click en "Create repository"**

### Opción B: Desde la CLI de GitHub

```bash
gh repo create ia-comercial --private --source=. --remote=origin --push
```

---

## 🔗 Paso 3: Conectar Repositorio Local con GitHub

GitHub te mostrará comandos después de crear el repo. Usa estos:

### Si creaste repositorio VACÍO (Recomendado):

```bash
# Agregar remote
git remote add origin https://github.com/TU_USUARIO/ia-comercial.git

# Cambiar branch a main (opcional, GitHub usa 'main' por defecto)
git branch -M main

# Hacer push
git push -u origin main
```

### Si por error inicializaste con README:

```bash
# Agregar remote
git remote add origin https://github.com/TU_USUARIO/ia-comercial.git

# Pull con rebase
git pull origin main --rebase

# Push
git push -u origin main
```

---

## 📤 Paso 4: Verificar Subida

1. **Actualiza la página de tu repositorio en GitHub**

2. **Verifica que se subieron:**
   - ✅ README.md (archivo principal)
   - ✅ Todo el código fuente (`src/`, `public/`, etc.)
   - ✅ package.json
   - ✅ Documentación (todos los `.md`)
   - ✅ .gitignore

3. **Verifica que NO se subieron:**
   - ❌ `.env` (debe estar ausente)
   - ❌ `db/leads.db` (debe estar ausente)
   - ❌ `node_modules/` (debe estar ausente)
   - ❌ `logs/` (debe estar ausente)

---

## 🔐 Paso 5: Configurar Secrets (Para CI/CD futuro)

Si planeas usar GitHub Actions:

1. **Ir a tu repositorio → Settings → Secrets and variables → Actions**

2. **Agregar estos secrets:**
   - `OPENAI_API_KEY`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `WHATSAPP_ACCESS_TOKEN`
   - `IG_PAGE_TOKEN`

---

## 📋 Comandos de Referencia Rápida

### Ver status del repositorio
```bash
git status
```

### Ver remote configurado
```bash
git remote -v
```

### Ver historial de commits
```bash
git log --oneline
```

### Agregar más cambios
```bash
git add .
git commit -m "descripción del cambio"
git push
```

---

## 🚨 Problemas Comunes

### Problema 1: "remote origin already exists"

**Solución:**
```bash
git remote remove origin
git remote add origin https://github.com/TU_USUARIO/ia-comercial.git
```

### Problema 2: "failed to push some refs"

**Solución:**
```bash
git pull origin main --rebase
git push -u origin main
```

### Problema 3: "Authentication failed"

**Soluciones:**

**A. Usar Personal Access Token:**
1. Ir a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Scopes: Marcar `repo`
4. Copiar el token
5. Usar como contraseña cuando Git lo pida

**B. Usar SSH (Recomendado):**
```bash
# Generar clave SSH si no tienes
ssh-keygen -t ed25519 -C "tu-email@example.com"

# Agregar a GitHub
# Copiar contenido de ~/.ssh/id_ed25519.pub
# Ir a GitHub → Settings → SSH and GPG keys → New SSH key

# Cambiar remote a SSH
git remote set-url origin git@github.com:TU_USUARIO/ia-comercial.git
```

### Problema 4: ".env se subió por error"

**Solución URGENTE:**
```bash
# Eliminar del repositorio (sin borrar local)
git rm --cached .env

# Commit
git commit -m "fix: remove .env from repository"

# Push
git push

# IMPORTANTE: Rotar TODAS las credenciales que estaban en .env
# - Generar nueva API key de OpenAI
# - Generar nuevos tokens de WhatsApp
# - Generar nuevos tokens de Instagram
# - Cambiar contraseñas de email
```

---

## 📝 Siguientes Pasos Después de Subir

### 1. Actualizar README con tu información

```bash
# Editar README.md para agregar:
- Tu nombre de usuario de GitHub
- URL del repositorio
- Badges (opcional)
- Screenshots (opcional)
```

### 2. Agregar License

```bash
# Crear archivo LICENSE
# Recomendado: MIT License para proyectos open source
```

### 3. Configurar GitHub Pages (Opcional)

Si quieres documentación pública:
- Settings → Pages
- Source: Deploy from a branch
- Branch: main / docs (si creas una carpeta docs)

### 4. Proteger Branch Main

- Settings → Branches → Add rule
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging

---

## 🎉 ¡Listo!

Tu sistema de IA comercial ahora está en GitHub y listo para:
- ✅ Colaboración en equipo
- ✅ Control de versiones
- ✅ CI/CD (futuro)
- ✅ Despliegue automático (futuro)
- ✅ Portfolio profesional

---

## 📞 Comandos Ejecutados (Resumen)

```bash
# Ya ejecutados localmente:
git init                                    ✅
git add .                                   ✅
git commit -m "feat: Sistema completo"     ✅

# Por ejecutar (después de crear repo en GitHub):
git remote add origin https://github.com/TU_USUARIO/ia-comercial.git
git branch -M main
git push -u origin main
```

---

**Siguiente paso:** Crear el repositorio en GitHub y ejecutar los comandos de conexión.

