#!/bin/bash

# 🔍 Script de Verificación del Sistema - ServiTech
# Verifica el estado de todos los componentes

echo ""
echo "🔍 ===== VERIFICACIÓN DEL SISTEMA SERVITECH ====="
echo "📅 $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función de verificación
check_service() {
    if $1; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

echo -e "${BLUE}📦 VERIFICANDO DEPENDENCIAS...${NC}"
echo ""

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js no instalado${NC}"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm no instalado${NC}"
fi

# Verificar PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo -e "${GREEN}✅ PM2: $PM2_VERSION${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 no instalado (opcional para producción)${NC}"
fi

echo ""
echo -e "${BLUE}🗄️  VERIFICANDO BASE DE DATOS...${NC}"
echo ""

# Verificar MongoDB
if systemctl is-active --quiet mongod 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB: Corriendo (systemctl)${NC}"
elif pgrep mongod > /dev/null; then
    echo -e "${GREEN}✅ MongoDB: Corriendo (proceso)${NC}"
else
    echo -e "${RED}❌ MongoDB: No está corriendo${NC}"
    echo -e "${YELLOW}💡 Iniciar con: sudo systemctl start mongod${NC}"
fi

# Verificar conexión MongoDB
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand({ connectionStatus: 1 })" &> /dev/null; then
        echo -e "${GREEN}✅ Conexión MongoDB: OK${NC}"
    else
        echo -e "${RED}❌ Conexión MongoDB: Falló${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  mongosh no instalado${NC}"
fi

echo ""
echo -e "${BLUE}🚀 VERIFICANDO PROYECTO...${NC}"
echo ""

# Verificar directorio del proyecto
if [[ -f "package.json" ]]; then
    echo -e "${GREEN}✅ package.json encontrado${NC}"
else
    echo -e "${RED}❌ package.json no encontrado${NC}"
    echo -e "${YELLOW}💡 Ejecuta desde el directorio backend/${NC}"
fi

# Verificar src/app.js
if [[ -f "src/app.js" ]]; then
    echo -e "${GREEN}✅ src/app.js encontrado${NC}"
else
    echo -e "${RED}❌ src/app.js no encontrado${NC}"
fi

# Verificar archivo .env
if [[ -f ".env" ]]; then
    echo -e "${GREEN}✅ Archivo .env encontrado${NC}"
    
    # Verificar variables críticas
    if grep -q "MONGODB_URI" .env; then
        echo -e "${GREEN}✅ Variable MONGODB_URI configurada${NC}"
    else
        echo -e "${YELLOW}⚠️  Variable MONGODB_URI no encontrada${NC}"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        echo -e "${GREEN}✅ Variable JWT_SECRET configurada${NC}"
    else
        echo -e "${YELLOW}⚠️  Variable JWT_SECRET no encontrada${NC}"
    fi
    
    if grep -q "PSE_MERCHANT_ID" .env; then
        echo -e "${GREEN}✅ Variables PSE configuradas${NC}"
    else
        echo -e "${YELLOW}⚠️  Variables PSE no encontradas${NC}"
    fi
else
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Copia .env.example a .env${NC}"
fi

# Verificar node_modules
if [[ -d "node_modules" ]]; then
    echo -e "${GREEN}✅ node_modules encontrado${NC}"
else
    echo -e "${RED}❌ node_modules no encontrado${NC}"
    echo -e "${YELLOW}💡 Ejecuta: npm install${NC}"
fi

echo ""
echo -e "${BLUE}🌐 VERIFICANDO PUERTOS...${NC}"
echo ""

# Verificar puerto 3000
if lsof -i :3000 &> /dev/null; then
    PROCESS=$(lsof -i :3000 -t)
    echo -e "${GREEN}✅ Puerto 3000: En uso (PID: $PROCESS)${NC}"
    echo -e "${BLUE}   ServiTech probablemente corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 3000: Libre${NC}"
fi

# Verificar puerto MongoDB (27017)
if lsof -i :27017 &> /dev/null; then
    echo -e "${GREEN}✅ Puerto 27017: MongoDB corriendo${NC}"
else
    echo -e "${YELLOW}⚠️  Puerto 27017: MongoDB no detectado${NC}"
fi

echo ""
echo -e "${BLUE}📊 ESTADO PM2...${NC}"
echo ""

if command -v pm2 &> /dev/null; then
    PM2_LIST=$(pm2 list 2>/dev/null | grep -c "servitech" || echo "0")
    if [[ $PM2_LIST -gt 0 ]]; then
        echo -e "${GREEN}✅ ServiTech en PM2: Detectado${NC}"
        pm2 list | grep servitech
    else
        echo -e "${YELLOW}⚠️  ServiTech en PM2: No encontrado${NC}"
    fi
fi

echo ""
echo -e "${BLUE}🧪 PRUEBAS RÁPIDAS...${NC}"
echo ""

# Test de conectividad si el servidor está corriendo
if lsof -i :3000 &> /dev/null; then
    if curl -s http://localhost:3000 &> /dev/null; then
        echo -e "${GREEN}✅ Servidor HTTP: Responde${NC}"
    else
        echo -e "${YELLOW}⚠️  Servidor HTTP: No responde${NC}"
    fi
    
    if curl -s http://localhost:3000/api &> /dev/null; then
        echo -e "${GREEN}✅ API REST: Accesible${NC}"
    else
        echo -e "${YELLOW}⚠️  API REST: No accesible${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📋 RESUMEN...${NC}"
echo ""

# Contar verificaciones
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Aquí podrías agregar lógica para contar las verificaciones
# Por simplicidad, damos un resumen general

if command -v node &> /dev/null && [[ -f "package.json" ]] && [[ -f ".env" ]]; then
    echo -e "${GREEN}✅ Configuración básica: COMPLETA${NC}"
else
    echo -e "${RED}❌ Configuración básica: INCOMPLETA${NC}"
fi

if systemctl is-active --quiet mongod 2>/dev/null || pgrep mongod > /dev/null; then
    echo -e "${GREEN}✅ Base de datos: OPERATIVA${NC}"
else
    echo -e "${RED}❌ Base de datos: NO OPERATIVA${NC}"
fi

if lsof -i :3000 &> /dev/null; then
    echo -e "${GREEN}✅ Servidor: CORRIENDO${NC}"
else
    echo -e "${YELLOW}⚠️  Servidor: DETENIDO${NC}"
fi

echo ""
echo -e "${BLUE}🔧 COMANDOS ÚTILES:${NC}"
echo ""
echo -e "${YELLOW}  Iniciar desarrollo:${NC}   ./start-dev.sh"
echo -e "${YELLOW}  Iniciar producción:${NC}   ./start-prod.sh"
echo -e "${YELLOW}  Instalar dependencias:${NC} npm install"
echo -e "${YELLOW}  Iniciar MongoDB:${NC}      sudo systemctl start mongod"
echo -e "${YELLOW}  Ver logs PM2:${NC}         pm2 logs servitech"
echo ""

echo -e "${BLUE}🧪 TESTING:${NC}"
echo -e "${YELLOW}  Test servidor:${NC}        ./test_server_quick.sh"
echo -e "${YELLOW}  Test mensajería:${NC}      ../test_mensajeria_completa.html"
echo ""

echo "🔍 ===== VERIFICACIÓN COMPLETADA ====="
echo ""
