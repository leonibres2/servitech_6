#!/bin/bash

# 🚀 INSTALADOR COMPLETO - SISTEMA DE ASESORÍAS SERVITECH
# Este script configura e instala todo el sistema de gestión de asesorías
# Fecha: 6 de julio de 2025

echo "🎯 ===== INSTALADOR SISTEMA DE ASESORÍAS - SERVITECH ====="
echo "📅 Fecha: $(date)"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Función para verificar comandos
check_command() {
    if command -v $1 &> /dev/null; then
        log_success "$1 está instalado"
        return 0
    else
        log_error "$1 no está instalado"
        return 1
    fi
}

echo "🔍 VERIFICANDO REQUISITOS DEL SISTEMA..."
echo ""

# Verificar Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    log_info "Versión de Node.js: $NODE_VERSION"
else
    log_error "Node.js es requerido. Instálalo desde https://nodejs.org/"
    exit 1
fi

# Verificar npm
if check_command npm; then
    NPM_VERSION=$(npm --version)
    log_info "Versión de npm: $NPM_VERSION"
else
    log_error "npm es requerido"
    exit 1
fi

# Verificar MongoDB
if check_command mongod; then
    log_success "MongoDB está instalado"
else
    log_warning "MongoDB no detectado. Asegúrate de tenerlo instalado y ejecutándose"
fi

echo ""
echo "📦 INSTALANDO DEPENDENCIAS..."
echo ""

# Navegar al directorio backend
BACKEND_DIR="/home/escritorio/Documentos/programacionDiana/servitechWeb/SERVITECH/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Directorio backend no encontrado: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
log_info "Cambiando al directorio: $BACKEND_DIR"

# Instalar dependencias
log_info "Instalando dependencias del proyecto..."
npm install

# Verificar si node-cron está instalado
if npm list node-cron &> /dev/null; then
    log_success "node-cron ya está instalado"
else
    log_info "Instalando node-cron para recordatorios..."
    npm install node-cron
fi

# Verificar otras dependencias críticas
DEPENDENCIES=("express" "mongoose" "cors" "dotenv")

for dep in "${DEPENDENCIES[@]}"; do
    if npm list $dep &> /dev/null; then
        log_success "$dep está instalado"
    else
        log_warning "$dep no encontrado, instalando..."
        npm install $dep
    fi
done

echo ""
echo "🔧 CONFIGURANDO VARIABLES DE ENTORNO..."
echo ""

# Crear .env si no existe
ENV_FILE="$BACKEND_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    log_info "Creando archivo .env..."
    cat > "$ENV_FILE" << EOL
# Configuración de la base de datos
MONGODB_URI=mongodb://localhost:27017/servitech

# Puerto del servidor
PORT=3000

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secreto_jwt_super_seguro_aqui

# Configuración de recordatorios
RECORDATORIOS_ACTIVOS=true
LIMPIAR_NOTIFICACIONES_DIAS=30

# URLs de videollamadas (opcional)
VIDEO_CALL_BASE_URL=https://meet.servitech.com

# Configuración de emails (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_app

# Configuración de PSE (opcional)
PSE_API_URL=https://api.pse.com
PSE_API_KEY=tu_api_key_pse
EOL
    log_success "Archivo .env creado"
else
    log_info "Archivo .env ya existe"
fi

echo ""
echo "📋 VERIFICANDO ESTRUCTURA DE ARCHIVOS..."
echo ""

# Verificar archivos críticos
CRITICAL_FILES=(
    "src/app.js"
    "src/controllers/asesoriaController.js"
    "src/controllers/disponibilidadController.js"
    "src/routes/asesorias.js"
    "src/routes/disponibilidad.js"
    "src/services/recordatoriosService.js"
    "src/models/asesoria.js"
    "src/models/disponibilidad.js"
    "src/models/models.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        log_success "$file existe"
    else
        log_error "$file no encontrado"
    fi
done

echo ""
echo "🧪 EJECUTANDO PRUEBAS DE SINTAXIS..."
echo ""

# Verificar sintaxis de archivos JavaScript
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$BACKEND_DIR/$file" ]; then
        if node -c "$BACKEND_DIR/$file" 2>/dev/null; then
            log_success "$file - sintaxis correcta"
        else
            log_error "$file - error de sintaxis"
        fi
    fi
done

echo ""
echo "🚀 INICIANDO SERVICIOS..."
echo ""

# Verificar si MongoDB está ejecutándose
if pgrep mongod > /dev/null; then
    log_success "MongoDB está ejecutándose"
else
    log_warning "MongoDB no está ejecutándose. Intentando iniciar..."
    
    # Intentar iniciar MongoDB (esto puede variar según el sistema)
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
        sleep 3
        if pgrep mongod > /dev/null; then
            log_success "MongoDB iniciado con systemctl"
        else
            log_warning "No se pudo iniciar MongoDB automáticamente"
        fi
    else
        log_warning "Inicia MongoDB manualmente: sudo service mongod start"
    fi
fi

echo ""
echo "🎮 EJECUTANDO PRUEBAS DEL SISTEMA..."
echo ""

# Iniciar el servidor en segundo plano para pruebas
log_info "Iniciando servidor para pruebas..."
node src/app.js &
SERVER_PID=$!

# Esperar que el servidor inicie
sleep 5

# Probar conexión básica
if curl -s http://localhost:3000/api/asesorias > /dev/null; then
    log_success "Servidor responde correctamente"
    
    # Ejecutar prueba básica de API
    log_info "Ejecutando prueba básica de endpoints..."
    
    # Probar endpoint de estadísticas
    if curl -s http://localhost:3000/api/asesorias/estadisticas > /dev/null; then
        log_success "Endpoint de estadísticas funciona"
    else
        log_warning "Endpoint de estadísticas no responde"
    fi
    
else
    log_error "Servidor no responde en puerto 3000"
fi

# Terminar el servidor de prueba
kill $SERVER_PID 2>/dev/null

echo ""
echo "📊 RESUMEN DE INSTALACIÓN"
echo ""

# Estadísticas finales
TOTAL_FILES=$(find "$BACKEND_DIR/src" -name "*.js" | wc -l)
log_info "Total de archivos JavaScript: $TOTAL_FILES"

TOTAL_MODELS=$(find "$BACKEND_DIR/src/models" -name "*.js" 2>/dev/null | wc -l)
log_info "Modelos creados: $TOTAL_MODELS"

TOTAL_ROUTES=$(find "$BACKEND_DIR/src/routes" -name "*.js" 2>/dev/null | wc -l)
log_info "Rutas configuradas: $TOTAL_ROUTES"

TOTAL_CONTROLLERS=$(find "$BACKEND_DIR/src/controllers" -name "*.js" 2>/dev/null | wc -l)
log_info "Controladores creados: $TOTAL_CONTROLLERS"

echo ""
echo "🎉 ===== INSTALACIÓN COMPLETADA ====="
echo ""
echo "📋 FUNCIONALIDADES INSTALADAS:"
echo "   ✅ Gestión completa de asesorías"
echo "   ✅ Sistema de disponibilidad de expertos"
echo "   ✅ Recordatorios automáticos con cron jobs"
echo "   ✅ Estados de asesoría (pendiente, confirmada, en curso, completada)"
echo "   ✅ API REST completa"
echo "   ✅ Modelos de base de datos optimizados"
echo ""
echo "🚀 PARA INICIAR EL SISTEMA:"
echo "   cd $BACKEND_DIR"
echo "   npm start"
echo ""
echo "🌐 PARA PROBAR EL SISTEMA:"
echo "   • API: http://localhost:3000/api"
echo "   • Demo Frontend: Abrir demo_asesorias_frontend_completa.html"
echo "   • Scripts de prueba: ./demo_asesorias_completo.sh"
echo ""
echo "📚 ENDPOINTS PRINCIPALES:"
echo "   • GET  /api/asesorias - Listar asesorías"
echo "   • POST /api/asesorias - Crear asesoría"
echo "   • GET  /api/disponibilidad/:expertId - Ver disponibilidad"
echo "   • POST /api/disponibilidad - Configurar horarios"
echo "   • PUT  /api/asesorias/:id/confirmar - Confirmar asesoría"
echo "   • PUT  /api/asesorias/:id/iniciar - Iniciar sesión"
echo "   • PUT  /api/asesorias/:id/finalizar - Finalizar asesoría"
echo ""
echo "⚙️  RECORDATORIOS AUTOMÁTICOS:"
echo "   • Configurados para ejecutarse cada 5 minutos"
echo "   • Notificaciones 1 hora antes de cada asesoría"
echo "   • Limpieza automática de datos antiguos"
echo ""
echo "🔮 PRÓXIMOS PASOS RECOMENDADOS:"
echo "   1. Configurar autenticación JWT completa"
echo "   2. Integrar sistema de pagos real"
echo "   3. Implementar videollamadas"
echo "   4. Configurar notificaciones por email/SMS"
echo "   5. Agregar análisis y métricas avanzadas"
echo ""
echo "✨ ¡SISTEMA DE ASESORÍAS SERVITECH LISTO PARA USAR!"

# Hacer el archivo ejecutable si no lo está
CURRENT_DIR=$(pwd)
chmod +x "$CURRENT_DIR/../demo_asesorias_completo.sh" 2>/dev/null
chmod +x "$CURRENT_DIR/../test_asesorias_sistema.sh" 2>/dev/null

echo ""
log_success "Scripts de demostración están listos para ejecutar"
echo ""
