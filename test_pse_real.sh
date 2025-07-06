#!/bin/bash

# 🏦 SCRIPT DE PRUEBA PSE REAL - SERVITECH
# Fecha: 6 de julio de 2025

echo "🏦 ====================================="
echo "   PRUEBAS PSE REAL - ACH COLOMBIA"
echo "====================================="
echo ""

# Configuración
BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api/pse"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Función para hacer peticiones HTTP y mostrar resultado
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo ""
    print_status "INFO" "🧪 Probando: $description"
    echo "   📍 $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "   📝 Datos: $data"
        response=$(curl -s -w "\n%{http_code}" -X $method \
                      -H "Content-Type: application/json" \
                      -d "$data" \
                      "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
                      -H "Content-Type: application/json" \
                      "$API_URL$endpoint")
    fi
    
    # Separar cuerpo de respuesta y código HTTP
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        print_status "SUCCESS" "Respuesta HTTP $http_code"
        echo "   📄 Respuesta:"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        print_status "ERROR" "Respuesta HTTP $http_code"
        echo "   📄 Error:"
        echo "$body"
    fi
    
    echo ""
    echo "─────────────────────────────────────"
}

# Verificar si el servidor está ejecutándose
echo "🔍 Verificando servidor..."
if curl -s "$BASE_URL" > /dev/null; then
    print_status "SUCCESS" "Servidor backend está ejecutándose en $BASE_URL"
else
    print_status "ERROR" "Servidor backend no está disponible en $BASE_URL"
    echo "   💡 Ejecuta: cd backend && npm start"
    exit 1
fi

# 1. Health Check
make_request "GET" "/health" "" "Health Check de la API PSE"

# 2. Obtener bancos disponibles
make_request "GET" "/banks" "" "Obtener lista de bancos PSE"

# 3. Documentación de la API
make_request "GET" "/docs" "" "Documentación de la API PSE"

# 4. Crear transacción PSE de prueba
transaction_data='{
    "bankCode": "1051",
    "personType": "N",
    "documentType": "CC",
    "documentNumber": "12345678",
    "amount": 25000,
    "userEmail": "test@servitech.com",
    "userName": "Usuario Prueba",
    "description": "Asesoría de prueba PSE",
    "userPhone": "3001234567"
}'

make_request "POST" "/transaction" "$transaction_data" "Crear transacción PSE de prueba"

# 5. Obtener ID de transacción de la respuesta anterior (simulado)
# En un caso real, parseariamos la respuesta JSON
echo ""
print_status "INFO" "🔍 Para consultar el estado de una transacción específica:"
echo "   1. Copia el ID de transacción de la respuesta anterior"
echo "   2. Ejecuta: curl -X GET $API_URL/transaction/[TRANSACTION_ID]"

# 6. Listar transacciones (admin)
make_request "GET" "/transactions?limit=5" "" "Listar últimas 5 transacciones"

# 7. Probar endpoint de webhook (simulado)
webhook_data='{
    "transactionId": "TEST_TRANSACTION",
    "reference": "PSE_TEST_123",
    "status": "APPROVED",
    "amount": 25000,
    "signature": "test_signature",
    "bankProcessDate": "2025-07-06T22:00:00Z",
    "message": "Transacción aprobada exitosamente"
}'

echo ""
print_status "WARNING" "Webhook solo debe ser llamado por ACH Colombia"
print_status "INFO" "Simulando webhook para pruebas..."
make_request "POST" "/webhook" "$webhook_data" "Simular webhook de confirmación"

# Resumen de URLs útiles
echo ""
echo "🌐 ====================================="
echo "        URLS DE PRUEBA ÚTILES"
echo "====================================="
echo ""
echo "📱 Página de prueba PSE:     $BASE_URL/test_pse_real.html"
echo "🎮 Pasarela de pagos:        $BASE_URL/pasarela-pagos.html"
echo "📅 Calendario:               $BASE_URL/calendario.html"
echo "✅ Confirmación:             $BASE_URL/confirmacion-asesoria.html"
echo ""
echo "🔧 API Endpoints:"
echo "   Health:        GET  $API_URL/health"
echo "   Bancos:        GET  $API_URL/banks"
echo "   Transacción:   POST $API_URL/transaction"
echo "   Estado:        GET  $API_URL/transaction/{id}"
echo "   Webhook:       POST $API_URL/webhook"
echo "   Listar:        GET  $API_URL/transactions"
echo "   Docs:          GET  $API_URL/docs"
echo ""

# Verificar dependencias instaladas
echo "📦 Verificando dependencias..."
if command -v jq &> /dev/null; then
    print_status "SUCCESS" "jq está instalado (para formatear JSON)"
else
    print_status "WARNING" "jq no está instalado. Instala con: sudo apt install jq"
fi

if command -v curl &> /dev/null; then
    print_status "SUCCESS" "curl está instalado"
else
    print_status "ERROR" "curl no está instalado. Instala con: sudo apt install curl"
fi

echo ""
print_status "SUCCESS" "🎉 Pruebas de PSE completadas!"
print_status "INFO" "📖 Revisa la documentación en: $API_URL/docs"
print_status "INFO" "🧪 Usa la página de prueba: $BASE_URL/test_pse_real.html"

echo ""
echo "🔐 ====================================="
echo "     CONFIGURACIÓN DE PRODUCCIÓN"
echo "====================================="
echo ""
echo "Para usar PSE en producción:"
echo "1. 📝 Obtén credenciales reales de ACH Colombia"
echo "2. 🔧 Actualiza el archivo .env con:"
echo "   ACH_BASE_URL=https://api.achcolombia.com.co"
echo "   ACH_MERCHANT_ID=tu_merchant_id_real"
echo "   ACH_SECRET_KEY=tu_secret_key_real"
echo "   ACH_PUBLIC_KEY=tu_public_key_real"
echo "   NODE_ENV=production"
echo "3. 🔒 Configura webhooks en ACH Colombia apuntando a:"
echo "   https://tudominio.com/api/pse/webhook"
echo "4. 🧪 Prueba en sandbox antes de ir a producción"
echo ""

# Información de archivos modificados
echo "📁 ====================================="
echo "        ARCHIVOS IMPLEMENTADOS"
echo "====================================="
echo ""
echo "Backend:"
echo "  🎛️  /backend/src/controllers/pseController.js"
echo "  🛣️  /backend/src/routes/pse.js"
echo "  🗄️  /backend/src/models/transaccionPSE.js"
echo "  ⚙️  /backend/src/app.js (rutas agregadas)"
echo "  🔧 /.env (configuración)"
echo ""
echo "Frontend:"
echo "  🎨 /views/assets/js/pasarela-pagos.js (actualizado)"
echo "  🧪 /test_pse_real.html (página de prueba)"
echo ""
echo "Documentación:"
echo "  📚 /INTEGRACION_PSE_REAL.md"
echo ""

exit 0
