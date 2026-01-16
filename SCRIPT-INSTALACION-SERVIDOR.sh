#!/bin/bash
# Script de instalación automática para DigitalOcean
# IP: 167.172.241.42
# Proyecto: ia-comercial

echo "═══════════════════════════════════════════════════════════"
echo "🚀 Instalación Automática - Sistema IA Comercial"
echo "═══════════════════════════════════════════════════════════"
echo ""

# PASO 1: Actualizar sistema
echo "📦 Paso 1/10: Actualizando sistema..."
apt update && apt upgrade -y

# PASO 2: Instalar Node.js 18
echo "📦 Paso 2/10: Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "✅ Node.js instalado:"
node --version
npm --version

# PASO 3: Instalar Git
echo "📦 Paso 3/10: Instalando Git..."
apt install -y git

# PASO 4: Instalar PM2
echo "📦 Paso 4/10: Instalando PM2..."
npm install -g pm2

# PASO 5: Instalar Nginx
echo "📦 Paso 5/10: Instalando Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# PASO 6: Instalar Certbot
echo "📦 Paso 6/10: Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

# PASO 7: Clonar repositorio
echo "📦 Paso 7/10: Clonando repositorio..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/ignacioargenis-dev/ia-comercial.git
cd ia-comercial

# PASO 8: Instalar dependencias
echo "📦 Paso 8/10: Instalando dependencias de Node.js..."
npm install --production

# PASO 9: Crear directorios
echo "📦 Paso 9/10: Creando directorios..."
mkdir -p /var/www/ia-comercial/logs
mkdir -p /var/www/ia-comercial/db

# PASO 10: Preparar .env
echo "📦 Paso 10/10: Preparando archivo .env..."
cp /var/www/ia-comercial/.env.example /var/www/ia-comercial/.env
chmod 600 /var/www/ia-comercial/.env

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Instalación Base Completada"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Software instalado:"
echo "   ✅ Ubuntu actualizado"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ npm $(npm --version)"
echo "   ✅ PM2 $(pm2 --version)"
echo "   ✅ Nginx"
echo "   ✅ Certbot"
echo "   ✅ Git"
echo ""
echo "📂 Repositorio clonado en:"
echo "   /var/www/ia-comercial"
echo ""
echo "⚠️  SIGUIENTE PASO MANUAL:"
echo "   Debes configurar el archivo .env con tus credenciales"
echo "   Comando: nano /var/www/ia-comercial/.env"
echo ""
echo "═══════════════════════════════════════════════════════════"

