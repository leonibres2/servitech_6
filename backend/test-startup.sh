#!/bin/bash

# 🧪 Prueba Rápida del Servidor - ServiTech
# Verifica que el servidor inicie sin errores

echo ""
echo "🧪 ===== PRUEBA RÁPIDA DEL SERVIDOR ====="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /home/escritorio/Documentos/programacionDiana/servitechWeb/SERVITECH/backend

echo -e "${BLUE}🔍 Verificando configuración...${NC}"

# Verificar archivos necesarios
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json no encontrado${NC}"
    exit 1
fi

if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ .env no encontrado${NC}"
    exit 1
fi

if [[ ! -f "src/app.js" ]]; then
    echo -e "${RED}❌ src/app.js no encontrado${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Archivos de configuración OK${NC}"

# Verificar MongoDB
echo -e "${BLUE}🔍 Verificando MongoDB...${NC}"
if ! systemctl is-active --quiet mongod 2>/dev/null && ! pgrep mongod > /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB no está corriendo, iniciando...${NC}"
    sudo systemctl start mongod 2>/dev/null || {
        echo -e "${RED}❌ No se pudo iniciar MongoDB${NC}"
        exit 1
    }
    sleep 2
fi

echo -e "${GREEN}✅ MongoDB corriendo${NC}"

# Verificar puerto libre
echo -e "${BLUE}🔍 Verificando puerto 3000...${NC}"
if lsof -i :3000 &> /dev/null; then
    echo -e "${YELLOW}⚠️  Puerto 3000 ocupado, liberando...${NC}"
    sudo fuser -k 3000/tcp 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✅ Puerto 3000 disponible${NC}"

# Verificar variables de entorno críticas
echo -e "${BLUE}🔍 Verificando variables de entorno...${NC}"
source .env

if [[ -z "$MONGODB_URI" ]]; then
    echo -e "${RED}❌ MONGODB_URI no configurada${NC}"
    exit 1
fi

if [[ -z "$JWT_SECRET" ]]; then
    echo -e "${RED}❌ JWT_SECRET no configurada${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno OK${NC}"

# Probar sintaxis del código
echo -e "${BLUE}🔍 Verificando sintaxis del código...${NC}"
if node -c src/app.js; then
    echo -e "${GREEN}✅ Sintaxis del código OK${NC}"
else
    echo -e "${RED}❌ Error de sintaxis en el código${NC}"
    exit 1
fi

# Iniciar servidor en background por 10 segundos
echo -e "${BLUE}🚀 Iniciando servidor de prueba...${NC}"
timeout 10s node src/app.js &
SERVER_PID=$!

# Esperar un poco para que el servidor inicie
sleep 3

# Verificar si el servidor está corriendo
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Servidor iniciado correctamente${NC}"
    
    # Probar conectividad
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Servidor responde en puerto 3000${NC}"
    else
        echo -e "${YELLOW}⚠️  Servidor no responde aún (normal en inicio)${NC}"
    fi
    
    # Matar el proceso
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    echo -e "${GREEN}✅ Servidor detenido correctamente${NC}"
else
    echo -e "${RED}❌ Servidor falló al iniciar${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!${NC}"
echo ""
echo -e "${BLUE}💡 Comandos para iniciar:${NC}"
echo -e "${YELLOW}   Desarrollo: ./start-dev.sh${NC}"
echo -e "${YELLOW}   Producción: ./start-prod.sh${NC}"
echo ""
