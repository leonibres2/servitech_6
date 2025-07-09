#!/bin/bash
# Script para crear datos de prueba de expertos

echo "🚀 Creando datos de prueba para expertos..."

# Primero crear usuarios base
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Camilo",
    "apellido": "Martínez Fernández", 
    "email": "camilo.martinez@servitech.com",
    "password": "123456",
    "telefono": "+573001234567",
    "rol": "experto"
  }'

curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ana",
    "apellido": "García López",
    "email": "ana.garcia@servitech.com", 
    "password": "123456",
    "telefono": "+573007654321",
    "rol": "experto"
  }'

curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Roberto",
    "apellido": "Sánchez Torres",
    "email": "roberto.sanchez@servitech.com",
    "password": "123456", 
    "telefono": "+573009876543",
    "rol": "experto"
  }'

echo ""
echo "✅ Usuarios creados. Ahora creando perfiles de expertos..."

# Crear expertos (necesitarás reemplazar los IDs de usuarios con los reales)
# Estos son IDs de ejemplo, en la práctica necesitarías obtener los IDs reales

echo ""
echo "🔧 Para completar la configuración:"
echo "1. Obtén los IDs de los usuarios creados"
echo "2. Crea los perfiles de expertos usando esos IDs"
echo "3. Usa las rutas POST /api/expertos con los datos correspondientes"

echo ""
echo "Ejemplo de comando para crear experto:"
echo 'curl -X POST http://localhost:3000/api/expertos \'
echo '  -H "Content-Type: application/json" \'
echo '  -d "{"userId": "ID_DEL_USUARIO", "especialidad": "Desarrollo Web", "descripcion": "Especialización en desarrollo web y edición..."}"'
