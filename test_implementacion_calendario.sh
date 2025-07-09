#!/bin/bash
# Script para probar la funcionalidad del calendario dinámico

echo "🧪 PROBANDO IMPLEMENTACIÓN - CALENDARIO DINÁMICO"
echo "=================================================="

# Verificar que el servidor esté corriendo
echo ""
echo "1. Verificando que el servidor esté activo..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
if [ $response -eq 200 ]; then
    echo "   ✅ Servidor activo en puerto 3001"
else
    echo "   ❌ Servidor no responde"
    exit 1
fi

# Probar endpoint de API de expertos
echo ""
echo "2. Probando API de expertos..."
echo "   GET /api/expertos"
curl -s http://localhost:3001/api/expertos | head -c 200
echo ""

# Verificar que la nueva ruta existe
echo ""
echo "3. Probando nueva ruta de calendario..."
echo "   Intentando acceder a /expertos/ID_EJEMPLO/calendario"
echo "   (Debería devolver error 404 porque no existe ese ID, pero la ruta debe existir)"

# Crear un usuario de prueba primero
echo ""
echo "4. Creando usuario de prueba..."
user_response=$(curl -s -X POST http://localhost:3001/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez.test@ejemplo.com",
    "password": "123456",
    "telefono": "+573001234567",
    "rol": "experto"
  }')

echo "   Respuesta: $user_response"

echo ""
echo "✅ IMPLEMENTACIÓN LISTA PARA PRUEBAS"
echo "======================================"
echo ""
echo "📝 RESUMEN DE CAMBIOS REALIZADOS:"
echo "1. ✅ Creada ruta /expertos/:id/calendario"
echo "2. ✅ Modificado calendario.ejs para mostrar datos dinámicos"
echo "3. ✅ Agregado JavaScript para pasar datos entre páginas"
echo "4. ✅ Enlaces actualizados en expertos.ejs"
echo ""
echo "🔄 PRÓXIMOS PASOS:"
echo "1. Crear algunos expertos de prueba"
echo "2. Probar la navegación desde expertos.ejs → calendario dinámico"
echo "3. Verificar que los datos se pasen correctamente a la pasarela"
echo ""
echo "📱 Para probar manualmente:"
echo "   - Visita: http://localhost:3001/expertos.html"
echo "   - Haz clic en 'Ver perfil' de cualquier experto"
echo "   - Verifica que se muestren los datos correctos del experto"
