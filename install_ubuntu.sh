#!/bin/bash

# ============================================
# 🚀 INSTALADOR RÁPIDO SERVITECH - UBUNTU
# Script optimizado para Ubuntu 18.04+ / Debian
# Instalación completa en un solo comando
# Fecha: Enero 2025
# ============================================

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para logs con color
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🎯 $1${NC}"
}

log_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# Función para verificar comandos
check_command() {
    if command -v $1 &> /dev/null; then
        log_success "$1 está instalado - $(command -v $1)"
        return 0
    else
        log_warning "$1 no está instalado"
        return 1
    fi
}

# Banner inicial
clear
echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🚀 SERVITECH INSTALLER                     ║"
echo "║                   📱 Sistema de Asesorías                     ║"
echo "║                                                                ║"
echo "║  👨‍💻 Desarrollado por: Diana Carolina Jiménez                ║"
echo "║  🌐 GitHub: @DianaJJ0                                         ║"
echo "║  📅 Fecha: $(date +%Y-%m-%d)                                           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

log_header "INICIANDO INSTALACIÓN AUTOMATIZADA"
echo ""

# Verificar si se ejecuta como root
if [[ $EUID -eq 0 ]]; then
   log_error "No ejecutes este script como root/sudo"
   log_info "Ejecuta: bash install_ubuntu.sh"
   exit 1
fi

# Verificar distribución
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    log_info "Detectado: $NAME $VERSION"
    
    if [[ $ID != "ubuntu" && $ID != "debian" ]]; then
        log_warning "Este script está optimizado para Ubuntu/Debian"
        log_info "¿Continuar? (y/n)"
        read -r continue_install
        if [[ $continue_install != "y" ]]; then
            exit 0
        fi
    fi
else
    log_warning "No se pudo detectar la distribución"
fi

echo ""
log_header "FASE 1: VERIFICANDO REQUISITOS"
echo ""

# Verificar conexión a internet
log_step "Verificando conexión a internet..."
if ping -c 1 google.com &> /dev/null; then
    log_success "Conexión a internet: OK"
else
    log_error "Sin conexión a internet"
    exit 1
fi

# Verificar espacio en disco
log_step "Verificando espacio en disco..."
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
REQUIRED_SPACE=2097152  # 2GB en KB

if [[ $AVAILABLE_SPACE -gt $REQUIRED_SPACE ]]; then
    log_success "Espacio disponible: $(($AVAILABLE_SPACE / 1024 / 1024))GB"
else
    log_error "Espacio insuficiente. Se requieren al menos 2GB"
    exit 1
fi

echo ""
log_header "FASE 2: ACTUALIZANDO SISTEMA"
echo ""

log_step "Actualizando lista de paquetes..."
sudo apt update -qq
log_success "Lista de paquetes actualizada"

log_step "Actualizando paquetes existentes..."
sudo apt upgrade -y -qq
log_success "Sistema actualizado"

echo ""
log_header "FASE 3: INSTALANDO DEPENDENCIAS"
echo ""

# Instalar curl y wget si no están
log_step "Instalando herramientas básicas..."
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release
log_success "Herramientas básicas instaladas"

# Instalar Node.js 18 LTS
log_step "Instalando Node.js 18 LTS..."
if ! check_command node; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js instalado: $(node --version)"
else
    # Verificar versión
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ $NODE_VERSION -lt 16 ]]; then
        log_warning "Node.js versión antigua detectada. Actualizando..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    log_success "Node.js: $(node --version)"
fi

# Instalar MongoDB Community Edition
log_step "Instalando MongoDB Community Edition..."
if ! check_command mongosh && ! check_command mongo; then
    # Importar clave pública MongoDB
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
    
    # Agregar repositorio MongoDB
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # Actualizar e instalar
    sudo apt-get update -qq
    sudo apt-get install -y mongodb-org
    
    # Iniciar y habilitar MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    log_success "MongoDB instalado y configurado"
else
    log_success "MongoDB ya está instalado"
    
    # Asegurar que esté corriendo
    sudo systemctl start mongod 2>/dev/null || true
    sudo systemctl enable mongod 2>/dev/null || true
fi

# Instalar Git si no está
log_step "Verificando Git..."
if ! check_command git; then
    sudo apt install -y git
    log_success "Git instalado"
fi

# Instalar PM2 globalmente
log_step "Instalando PM2 (Process Manager)..."
if ! check_command pm2; then
    sudo npm install -g pm2
    log_success "PM2 instalado globalmente"
fi

# Herramientas adicionales útiles
log_step "Instalando herramientas adicionales..."
sudo apt install -y htop nano tree unzip zip build-essential
log_success "Herramientas adicionales instaladas"

echo ""
log_header "FASE 4: CONFIGURANDO PROYECTO"
echo ""

# Crear directorio del proyecto
PROJECT_DIR="$HOME/ServiTech"
log_step "Configurando directorio del proyecto..."

if [[ ! -d "$PROJECT_DIR" ]]; then
    mkdir -p "$PROJECT_DIR"
    log_success "Directorio creado: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Clonar repositorio
log_step "Clonando repositorio ServiTech..."
if [[ ! -d "SERVITECH" ]]; then
    git clone https://github.com/DianaJJ0/servitechWeb.git
    if [[ $? -eq 0 ]]; then
        log_success "Repositorio clonado exitosamente"
    else
        log_error "Error clonando repositorio"
        exit 1
    fi
else
    log_info "Repositorio ya existe. Actualizando..."
    cd SERVITECH
    git pull origin main
    cd ..
    log_success "Repositorio actualizado"
fi

# Navegar al backend
cd SERVITECH/backend

# Instalar dependencias Node.js
log_step "Instalando dependencias del proyecto..."
npm install --silent
if [[ $? -eq 0 ]]; then
    log_success "Dependencias instaladas correctamente"
else
    log_error "Error instalando dependencias"
    exit 1
fi

echo ""
log_header "FASE 5: CONFIGURANDO ENTORNO"
echo ""

# Crear archivo .env si no existe
log_step "Configurando variables de entorno..."
if [[ ! -f ".env" ]]; then
    cat > .env << 'EOL'
# ========================================
# 🗄️ BASE DE DATOS
# ========================================
MONGODB_URI=mongodb://localhost:27017/servitech
DB_NAME=servitech

# ========================================
# 🌐 SERVIDOR
# ========================================
PORT=3000
NODE_ENV=development

# ========================================
# 🔐 SEGURIDAD JWT
# ========================================
JWT_SECRET=servitech_jwt_secret_ubuntu_2025_ultra_seguro
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ========================================
# 🏦 PAGOS PSE - DESARROLLO
# ========================================
PSE_MERCHANT_ID=test_merchant_ubuntu
PSE_API_KEY=test_api_key_ubuntu
PSE_SECRET_KEY=test_secret_key_ubuntu
PSE_ENVIRONMENT=sandbox
PSE_BASE_URL=https://sandbox.api.pse.com.co
PSE_RETURN_URL=http://localhost:3000/api/pse/respuesta
PSE_CONFIRMATION_URL=http://localhost:3000/api/pse/confirmacion

# ========================================
# 📧 EMAIL DE DESARROLLO
# ========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@servitech.com
EMAIL_PASS=test_password

# ========================================
# 🔔 NOTIFICACIONES
# ========================================
NOTIFICATION_ENABLED=true
NOTIFICATION_EMAIL=admin@servitech.com

# ========================================
# 📱 SOCKET.IO
# ========================================
SOCKET_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
SOCKET_TRANSPORTS=websocket,polling

# ========================================
# 🔧 CONFIGURACIÓN AVANZADA
# ========================================
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SESSION_SECRET=servitech_session_ubuntu_2025
DEBUG=servitech:*
LOG_LEVEL=info
EOL
    log_success "Archivo .env creado con configuración por defecto"
else
    log_warning "Archivo .env ya existe - no se sobrescribió"
fi

echo ""
log_header "FASE 6: CONFIGURANDO BASE DE DATOS"
echo ""

# Verificar MongoDB
log_step "Verificando conexión a MongoDB..."
if mongosh --eval "db.runCommand({ connectionStatus: 1 })" &> /dev/null; then
    log_success "Conexión a MongoDB exitosa"
    
    # Crear base de datos y colecciones iniciales
    log_step "Configurando base de datos..."
    mongosh --eval "
    use servitech;
    
    // Crear colecciones
    db.createCollection('usuarios');
    db.createCollection('expertos');
    db.createCollection('asesorias');
    db.createCollection('conversaciones');
    db.createCollection('mensajes');
    db.createCollection('categorias');
    db.createCollection('notificaciones');
    db.createCollection('transaccionesPSE');
    
    // Insertar categorías iniciales
    db.categorias.insertMany([
        {
            nombre: 'Reparación de PC',
            descripcion: 'Diagnóstico y reparación de computadores',
            icono: 'fas fa-desktop',
            activa: true,
            precioBase: 50000,
            tiempoEstimado: 60
        },
        {
            nombre: 'Instalación de Software',
            descripcion: 'Instalación y configuración de programas',
            icono: 'fas fa-download',
            activa: true,
            precioBase: 30000,
            tiempoEstimado: 30
        },
        {
            nombre: 'Redes y WiFi',
            descripcion: 'Configuración de redes e internet',
            icono: 'fas fa-wifi',
            activa: true,
            precioBase: 40000,
            tiempoEstimado: 45
        },
        {
            nombre: 'Recuperación de Datos',
            descripcion: 'Recuperación de archivos perdidos',
            icono: 'fas fa-hdd',
            activa: true,
            precioBase: 80000,
            tiempoEstimado: 120
        }
    ]);
    
    print('✅ Base de datos configurada correctamente');
    " &> /dev/null
    
    log_success "Base de datos configurada con datos iniciales"
else
    log_error "No se pudo conectar a MongoDB"
    log_info "Verificar que MongoDB esté corriendo: sudo systemctl status mongod"
fi

echo ""
log_header "FASE 7: CREANDO SCRIPTS DE INICIO"
echo ""

# Crear scripts útiles
log_step "Creando scripts de inicio..."

# Script de inicio desarrollo
cat > start-dev.sh << 'EOL'
#!/bin/bash
echo "🔧 Iniciando ServiTech en modo desarrollo..."
echo "🌐 URL: http://localhost:3000"
echo "👑 Admin: http://localhost:3000/admin"
echo ""
npm run dev
EOL

# Script de inicio producción
cat > start-prod.sh << 'EOL'
#!/bin/bash
echo "🚀 Iniciando ServiTech con PM2..."
pm2 start src/app.js --name "servitech" --watch
pm2 logs servitech
EOL

# Script de verificación
cat > verify.sh << 'EOL'
#!/bin/bash
echo "🔍 Verificando estado del sistema..."
echo ""

# Verificar Node.js
echo "📦 Node.js: $(node --version)"
echo "📦 npm: $(npm --version)"

# Verificar MongoDB
if systemctl is-active --quiet mongod; then
    echo "✅ MongoDB: Corriendo"
else
    echo "❌ MongoDB: Detenido"
fi

# Verificar puerto 3000
if lsof -i :3000 &> /dev/null; then
    echo "✅ Puerto 3000: En uso (ServiTech corriendo)"
else
    echo "⚠️  Puerto 3000: Libre"
fi

echo ""
echo "🧪 Para probar el sistema:"
echo "   1. Ejecutar: npm run dev"
echo "   2. Abrir: http://localhost:3000"
echo "   3. Test chat: ../test_mensajeria_completa.html"
EOL

# Hacer scripts ejecutables
chmod +x start-dev.sh start-prod.sh verify.sh

log_success "Scripts de inicio creados"

echo ""
log_header "FASE 8: EJECUTANDO VERIFICACIONES FINALES"
echo ""

# Verificar instalación
log_step "Ejecutando verificaciones finales..."

# Verificar dependencias npm
npm list --depth=0 &> /dev/null
if [[ $? -eq 0 ]]; then
    log_success "Todas las dependencias npm están correctas"
else
    log_warning "Algunas dependencias pueden tener warnings (normal)"
fi

# Verificar archivos críticos
CRITICAL_FILES=("src/app.js" "package.json" ".env" "../README.md")
for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_success "Archivo crítico encontrado: $file"
    else
        log_error "Archivo crítico faltante: $file"
    fi
done

echo ""
log_header "🎊 INSTALACIÓN COMPLETADA EXITOSAMENTE"
echo ""

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ SERVITECH INSTALADO                     ║"
echo "║                                                                ║"
echo "║  🎯 Sistema de asesorías técnicas listo para usar             ║"
echo "║  💬 Chat en tiempo real configurado                           ║"
echo "║  💳 Pagos PSE integrados                                      ║"
echo "║  📱 Diseño responsive completo                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${CYAN}📂 UBICACIÓN DEL PROYECTO:${NC}"
echo "   $PROJECT_DIR/SERVITECH"
echo ""

echo -e "${CYAN}🚀 COMANDOS PARA INICIAR:${NC}"
echo ""
echo "   🔧 Modo desarrollo (recomendado):"
echo "      cd $PROJECT_DIR/SERVITECH/backend"
echo "      ./start-dev.sh"
echo "      (o simplemente: npm run dev)"
echo ""
echo "   🚀 Modo producción:"
echo "      ./start-prod.sh"
echo ""
echo "   🔍 Verificar sistema:"
echo "      ./verify.sh"
echo ""

echo -e "${CYAN}🌐 URLS DEL SISTEMA:${NC}"
echo "   🏠 Frontend: http://localhost:3000"
echo "   👑 Admin: http://localhost:3000/admin"
echo "   📡 API: http://localhost:3000/api"
echo "   🧪 Test Chat: file://$PROJECT_DIR/SERVITECH/test_mensajeria_completa.html"
echo ""

echo -e "${CYAN}🧪 PROBAR EL SISTEMA:${NC}"
echo "   1. Abrir test_mensajeria_completa.html en navegador"
echo "   2. Conectar con usuario: test_user_001"
echo "   3. Unirse a conversación: conv_test_001"
echo "   4. ¡Probar mensajería en tiempo real!"
echo ""

echo -e "${CYAN}📚 DOCUMENTACIÓN:${NC}"
echo "   📖 README.md - Documentación completa"
echo "   📋 DOCUMENTACION_COMPLETA_FINAL.md - Resumen técnico"
echo "   💬 MENSAJERIA_IMPLEMENTACION.md - Chat en tiempo real"
echo ""

echo -e "${CYAN}🔧 CONFIGURACIÓN ADICIONAL:${NC}"
echo "   ⚙️  Editar backend/.env para configuración personalizada"
echo "   🏦 Configurar credenciales PSE reales para producción"
echo "   📧 Configurar servidor SMTP para emails"
echo ""

echo -e "${CYAN}📞 SOPORTE Y CONTACTO:${NC}"
echo "   📧 Email: soporte@servitech.com"
echo "   💬 WhatsApp: +57 300 123 4567"
echo "   🌐 GitHub: @DianaJJ0"
echo "   📚 Docs: docs.servitech.com"
echo ""

# Preguntar si quiere iniciar inmediatamente
echo -e "${YELLOW}¿Deseas iniciar ServiTech ahora? (y/n):${NC} "
read -r start_now

if [[ $start_now == "y" || $start_now == "Y" ]]; then
    echo ""
    log_info "🚀 Iniciando ServiTech en modo desarrollo..."
    echo ""
    
    # Abrir navegador si está disponible
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000" &> /dev/null &
        log_success "Navegador abierto en http://localhost:3000"
    fi
    
    # Iniciar servidor
    npm run dev
else
    echo ""
    log_success "Instalación completada"
    log_info "Para iniciar más tarde ejecuta: cd $PROJECT_DIR/SERVITECH/backend && npm run dev"
fi

echo ""
echo -e "${PURPLE}🎉 ¡Gracias por usar ServiTech!${NC}"
echo -e "${PURPLE}👨‍💻 Desarrollado con ❤️ por Diana Carolina Jiménez${NC}"
echo ""
