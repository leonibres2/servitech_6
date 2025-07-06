#!/bin/bash

echo "🧪 Prueba del flujo de Nequi - ServiTech"
echo "========================================"

# Simular datos de cita para localStorage
echo "📅 Configurando datos de cita de prueba..."
cat > test_nequi.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Test Nequi - ServiTech</title>
</head>
<body>
    <h1>Prueba del flujo de Nequi</h1>
    <button onclick="configurarDatosPrueba()">1. Configurar datos de cita</button>
    <button onclick="irAPasarela()">2. Ir a pasarela de pagos</button>
    
    <script>
        function configurarDatosPrueba() {
            const citaData = {
                fecha: '2025-07-15',
                hora: '14:00',
                duracion: '1 hora',
                servicio: 'Desarrollo Web',
                experto: 'Juan Carlos Rodriguez',
                precio: '$25.000 COP',
                descripcion: 'Asesoría técnica en desarrollo web'
            };
            
            localStorage.setItem('citaSeleccionada', JSON.stringify(citaData));
            alert('✅ Datos de cita configurados para prueba');
            console.log('Datos de cita:', citaData);
        }
        
        function irAPasarela() {
            window.location.href = '/pasarela-pagos.html';
        }
    </script>
</body>
</html>
EOF

echo "✅ Archivo de prueba creado: test_nequi.html"
echo ""
echo "📖 Instrucciones para probar Nequi:"
echo "1. Abrir http://localhost:3000/test_nequi.html"
echo "2. Hacer clic en 'Configurar datos de cita'"
echo "3. Hacer clic en 'Ir a pasarela de pagos'"
echo "4. Seleccionar método de pago 'Nequi'"
echo "5. Completar formulario con:"
echo "   - Email: test@ejemplo.com"
echo "   - Celular: 3001234567"
echo "   - PIN: 1234"
echo "6. Hacer clic en 'Continuar con el pago'"
echo "7. Observar animación de procesamiento de Nequi"
echo "8. Verificar datos en la página de confirmación"
echo ""
echo "🎯 Funcionalidades a verificar:"
echo "- ✅ Formateo automático del número de celular"
echo "- ✅ Validación de campos requeridos"
echo "- ✅ Animación específica de procesamiento Nequi"
echo "- ✅ Visualización de datos de Nequi en confirmación"
echo ""
