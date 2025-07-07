#!/bin/bash

# 🔧 Script de Inicio para Desarrollo - ServiTech
# Ejecuta el servidor en modo desarrollo con auto-recarga

echo ""
echo "🔧 ===== INICIANDO SERVITECH - MODO DESARROLLO ====="
echo "📅 $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🌐 URL Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}👑 Panel Admin: http://localhost:3000/admin${NC}"
echo -e "${BLUE}📡 API REST: http://localhost:3000/api${NC}"
echo -e "${BLUE}🔌 WebSocket: ws://localhost:3000${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json no encontrado"
    echo "💡 Ejecuta desde el directorio backend/"
    exit 1
fi

# Verificar MongoDB
echo -e "${YELLOW}🔍 Verificando MongoDB...${NC}"
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB está corriendo${NC}"
elif pgrep mongod > /dev/null; then
    echo -e "${GREEN}✅ MongoDB está corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB no detectado, intentando iniciar...${NC}"
    sudo systemctl start mongod 2>/dev/null || {
        echo "❌ No se pudo iniciar MongoDB automáticamente"
        echo "💡 Inicia MongoDB manualmente: sudo systemctl start mongod"
    }
fi

# Verificar archivo .env
if [[ ! -f ".env" ]]; then
    echo "❌ Archivo .env no encontrado"
    echo "💡 Copia .env.example a .env y configúralo"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Iniciando servidor en modo desarrollo...${NC}"
echo -e "${YELLOW}📝 Logs en tiempo real - Ctrl+C para detener${NC}"
echo ""

# Ejecutar en modo desarrollo
npm run dev
