#!/bin/bash
set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 Instalación Automática - Sistema IA Comercial"
echo "═══════════════════════════════════════════════════════════"

# Actualizar sistema
echo "📦 [1/8] Actualizando sistema..."
apt update && DEBIAN_FRONTEND=noninteractive apt upgrade -y

# Instalar Node.js 18
echo "📦 [2/8] Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar software
echo "📦 [3/8] Instalando Git, Nginx, Certbot..."
apt install -y git nginx certbot python3-certbot-nginx

# Instalar PM2
echo "📦 [4/8] Instalando PM2..."
npm install -g pm2

# Habilitar Nginx
systemctl enable nginx
systemctl start nginx

# Clonar repositorio
echo "📦 [5/8] Clonando repositorio..."
mkdir -p /var/www
cd /var/www
if [ -d "ia-comercial" ]; then
    rm -rf ia-comercial
fi
git clone https://github.com/ignacioargenis-dev/ia-comercial.git
cd ia-comercial

# Instalar dependencias
echo "📦 [6/8] Instalando dependencias..."
npm install --production

# Crear directorios y .env
echo "📦 [7/8] Configurando directorios..."
mkdir -p logs db
cp .env.example .env
chmod 600 .env

# Configurar firewall
echo "📦 [8/8] Configurando firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ INSTALACIÓN BASE COMPLETADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Instalado:"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ npm $(npm --version)"
echo "   ✅ PM2"
echo "   ✅ Nginx"
echo "   ✅ Certbot"
echo "   ✅ Firewall UFW"
echo ""
echo "📂 Proyecto en: /var/www/ia-comercial"
echo ""
echo "⚠️  SIGUIENTE PASO:"
echo "   Configura tu .env con:"
echo "   nano /var/www/ia-comercial/.env"
echo ""

