#!/bin/bash

# 🚀 Script de Inicio para Producción - ServiTech
# Ejecuta el servidor con PM2 para producción

echo ""
echo "🚀 ===== INICIANDO SERVITECH - MODO PRODUCCIÓN ====="
echo "📅 $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 no está instalado${NC}"
    echo -e "${YELLOW}💡 Instalando PM2...${NC}"
    sudo npm install -g pm2
    if [[ $? -ne 0 ]]; then
        echo -e "${RED}❌ Error instalando PM2${NC}"
        exit 1
    fi
fi

# Verificar que estamos en el directorio correcto
if [[ ! -f "src/app.js" ]]; then
    echo -e "${RED}❌ Error: src/app.js no encontrado${NC}"
    echo -e "${YELLOW}💡 Ejecuta desde el directorio backend/${NC}"
    exit 1
fi

# Verificar archivo .env
if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ Archivo .env no encontrado${NC}"
    echo -e "${YELLOW}💡 Copia .env.example a .env y configúralo${NC}"
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
        echo -e "${RED}❌ No se pudo iniciar MongoDB automáticamente${NC}"
        echo -e "${YELLOW}💡 Inicia MongoDB manualmente: sudo systemctl start mongod${NC}"
        exit 1
    }
fi

echo ""
echo -e "${GREEN}🚀 Iniciando ServiTech con PM2...${NC}"

# Detener proceso existente si existe
pm2 delete servitech 2>/dev/null || true

# Iniciar con PM2
pm2 start src/app.js --name "servitech" --env production

if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}✅ ServiTech iniciado correctamente con PM2${NC}"
    echo ""
    echo -e "${BLUE}🌐 URLs disponibles:${NC}"
    echo -e "${BLUE}   Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}   Admin: http://localhost:3000/admin${NC}"
    echo -e "${BLUE}   API: http://localhost:3000/api${NC}"
    echo ""
    echo -e "${YELLOW}📊 Comandos útiles:${NC}"
    echo -e "${YELLOW}   pm2 logs servitech    # Ver logs${NC}"
    echo -e "${YELLOW}   pm2 monit            # Monitor en tiempo real${NC}"
    echo -e "${YELLOW}   pm2 restart servitech # Reiniciar${NC}"
    echo -e "${YELLOW}   pm2 stop servitech    # Detener${NC}"
    echo -e "${YELLOW}   pm2 delete servitech  # Eliminar del PM2${NC}"
    echo ""
    
    # Configurar auto-inicio
    echo -e "${YELLOW}🔧 Configurando auto-inicio del sistema...${NC}"
    pm2 startup ubuntu -u $USER --hp $HOME 2>/dev/null || pm2 startup
    pm2 save
    
    echo ""
    echo -e "${GREEN}🎉 ¡ServiTech corriendo en producción!${NC}"
    echo ""
    
    # Mostrar logs
    echo -e "${YELLOW}📝 Mostrando logs en tiempo real (Ctrl+C para salir):${NC}"
    pm2 logs servitech
else
    echo -e "${RED}❌ Error iniciando ServiTech${NC}"
    exit 1
fi
