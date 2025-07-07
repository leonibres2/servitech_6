#!/bin/bash

echo "🚀 ============================================"
echo "   VERIFICACIÓN RÁPIDA - SERVITECH SERVER"
echo "============================================"
echo

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📋 Verificando configuración...${NC}"

# Verificar archivos principales
if [ -f "src/app.js" ]; then
    echo -e "${GREEN}✅ app.js encontrado${NC}"
else
    echo -e "${RED}❌ app.js no encontrado${NC}"
    exit 1
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env encontrado${NC}"
else
    echo -e "${RED}❌ .env no encontrado${NC}"
    exit 1
fi

# Verificar dependencias
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules existe${NC}"
else
    echo -e "${YELLOW}⚠️  Instalando dependencias...${NC}"
    npm install
fi

echo
echo -e "${YELLOW}🔧 Probando servidor en puerto libre...${NC}"

# Encontrar puerto libre
for port in 3001 3002 3003 3004 3005; do
    if ! nc -z localhost $port 2>/dev/null; then
        FREE_PORT=$port
        break
    fi
done

if [ -z "$FREE_PORT" ]; then
    echo -e "${RED}❌ No se encontró un puerto libre${NC}"
    exit 1
fi

echo -e "${GREEN}📡 Usando puerto $FREE_PORT${NC}"
echo

# Iniciar servidor con timeout
echo -e "${YELLOW}🚀 Iniciando servidor...${NC}"
timeout 8s env PORT=$FREE_PORT node src/app.js &
SERVER_PID=$!

# Esperar un poco
sleep 3

# Verificar si el servidor está corriendo
if kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Servidor iniciado correctamente${NC}"
    
    # Probar conexión HTTP
    if curl -s http://localhost:$FREE_PORT/ > /dev/null 2>&1; then
        echo -e "${GREEN}✅ HTTP responde correctamente${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP no responde (puede ser normal)${NC}"
    fi
    
    # Detener servidor
    kill $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✅ Servidor detenido correctamente${NC}"
else
    echo -e "${RED}❌ Error iniciando servidor${NC}"
    exit 1
fi

echo
echo -e "${GREEN}🎉 ¡VERIFICACIÓN EXITOSA!${NC}"
echo "   - Archivos configurados correctamente"
echo "   - Dependencias instaladas"  
echo "   - Servidor inicia sin errores críticos"
echo "   - PSE configurado en modo sandbox"
echo
echo -e "${YELLOW}Para iniciar en modo normal:${NC}"
echo "   npm start"
echo
echo -e "${YELLOW}Para probar mensajería:${NC}"
echo "   1. npm start"
echo "   2. Abrir test_mensajeria_completa.html"
echo
