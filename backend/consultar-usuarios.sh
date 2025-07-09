#!/bin/bash

# 🔍 Script para Consultar Usuarios - ServiTech
# Consulta usuarios registrados en la base de datos

echo ""
echo "👥 ===== CONSULTA DE USUARIOS SERVITECH ====="
echo "📅 $(date)"
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Verificar que MongoDB esté corriendo
if ! systemctl is-active --quiet mongod 2>/dev/null && ! pgrep mongod > /dev/null; then
    echo -e "${YELLOW}⚠️  MongoDB no está corriendo, iniciando...${NC}"
    sudo systemctl start mongod
    sleep 2
fi

echo -e "${BLUE}🔍 Consultando usuarios en la base de datos...${NC}"
echo ""

# Función para ejecutar consultas MongoDB
run_query() {
    mongosh --quiet --eval "
    use servitech;
    $1
    "
}

# 1. Contar total de usuarios
echo -e "${CYAN}📊 ESTADÍSTICAS GENERALES:${NC}"
TOTAL_USUARIOS=$(run_query "db.usuarios.countDocuments()")
echo "   Total de usuarios registrados: $TOTAL_USUARIOS"

USUARIOS_HOY=$(run_query "db.usuarios.countDocuments({fechaRegistro: {\$gte: new Date(new Date().setHours(0,0,0,0))}})")
echo "   Usuarios registrados hoy: $USUARIOS_HOY"

echo ""

# 2. Mostrar usuarios recientes
echo -e "${CYAN}👤 ÚLTIMOS 5 USUARIOS REGISTRADOS:${NC}"
run_query "
db.usuarios.find({}, {
    nombre: 1, 
    email: 1, 
    fechaRegistro: 1, 
    tipoUsuario: 1,
    _id: 0
}).sort({fechaRegistro: -1}).limit(5).forEach(function(user) {
    print('👤 ' + user.nombre + ' (' + user.email + ')');
    print('   Tipo: ' + (user.tipoUsuario || 'usuario') + ' | Registro: ' + user.fechaRegistro);
    print('');
});
"

echo ""

# 3. Mostrar estadísticas por tipo
echo -e "${CYAN}📈 USUARIOS POR TIPO:${NC}"
run_query "
db.usuarios.aggregate([
    { \$group: { 
        _id: { \$ifNull: ['\$tipoUsuario', 'usuario'] }, 
        count: { \$sum: 1 } 
    }},
    { \$sort: { count: -1 }}
]).forEach(function(result) {
    print('   ' + result._id + ': ' + result.count + ' usuarios');
});
"

echo ""

# 4. Menú interactivo
echo -e "${YELLOW}🔍 OPCIONES DE CONSULTA:${NC}"
echo "1. Ver todos los usuarios"
echo "2. Buscar usuario por email"
echo "3. Buscar usuario por nombre"
echo "4. Ver usuarios expertos"
echo "5. Ver usuarios administradores"
echo "6. Salir"
echo ""

read -p "Selecciona una opción (1-6): " opcion

case $opcion in
    1)
        echo -e "${BLUE}📋 TODOS LOS USUARIOS:${NC}"
        run_query "
        db.usuarios.find({}, {
            nombre: 1,
            email: 1,
            tipoUsuario: 1,
            fechaRegistro: 1,
            activo: 1,
            _id: 0
        }).sort({fechaRegistro: -1}).forEach(function(user) {
            var status = user.activo ? '✅' : '❌';
            var tipo = user.tipoUsuario || 'usuario';
            print(status + ' ' + user.nombre + ' (' + user.email + ')');
            print('   Tipo: ' + tipo + ' | Registro: ' + user.fechaRegistro);
            print('');
        });
        "
        ;;
    2)
        read -p "Ingresa el email a buscar: " email
        echo -e "${BLUE}🔍 BUSCANDO: $email${NC}"
        run_query "
        var user = db.usuarios.findOne({email: '$email'});
        if (user) {
            print('👤 Usuario encontrado:');
            print('   Nombre: ' + user.nombre);
            print('   Email: ' + user.email);
            print('   Tipo: ' + (user.tipoUsuario || 'usuario'));
            print('   Activo: ' + (user.activo ? 'Sí' : 'No'));
            print('   Registro: ' + user.fechaRegistro);
            if (user.telefono) print('   Teléfono: ' + user.telefono);
            if (user.ciudad) print('   Ciudad: ' + user.ciudad);
        } else {
            print('❌ Usuario no encontrado');
        }
        "
        ;;
    3)
        read -p "Ingresa el nombre a buscar: " nombre
        echo -e "${BLUE}🔍 BUSCANDO: $nombre${NC}"
        run_query "
        db.usuarios.find({
            nombre: {
                \$regex: '$nombre',
                \$options: 'i'
            }
        }, {
            nombre: 1,
            email: 1,
            tipoUsuario: 1,
            _id: 0
        }).forEach(function(user) {
            print('👤 ' + user.nombre + ' (' + user.email + ')');
            print('   Tipo: ' + (user.tipoUsuario || 'usuario'));
            print('');
        });
        "
        ;;
    4)
        echo -e "${BLUE}🎓 USUARIOS EXPERTOS:${NC}"
        run_query "
        db.usuarios.find({
            tipoUsuario: 'experto'
        }, {
            nombre: 1,
            email: 1,
            especialidad: 1,
            fechaRegistro: 1,
            _id: 0
        }).forEach(function(user) {
            print('🎓 ' + user.nombre + ' (' + user.email + ')');
            if (user.especialidad) print('   Especialidad: ' + user.especialidad);
            print('   Registro: ' + user.fechaRegistro);
            print('');
        });
        "
        ;;
    5)
        echo -e "${BLUE}👑 USUARIOS ADMINISTRADORES:${NC}"
        run_query "
        db.usuarios.find({
            tipoUsuario: 'admin'
        }, {
            nombre: 1,
            email: 1,
            fechaRegistro: 1,
            _id: 0
        }).forEach(function(user) {
            print('👑 ' + user.nombre + ' (' + user.email + ')');
            print('   Registro: ' + user.fechaRegistro);
            print('');
        });
        "
        ;;
    6)
        echo "👋 ¡Hasta luego!"
        exit 0
        ;;
    *)
        echo "❌ Opción no válida"
        ;;
esac

echo ""
echo -e "${GREEN}✅ Consulta completada${NC}"
echo ""
echo -e "${YELLOW}💡 Comandos útiles adicionales:${NC}"
echo "   mongosh                     # Acceder a MongoDB shell"
echo "   use servitech              # Cambiar a base de datos"
echo "   db.usuarios.find()         # Ver todos los usuarios"
echo "   db.usuarios.find().count() # Contar usuarios"
echo ""
