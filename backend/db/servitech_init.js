const mongoose = require('mongoose');
const { Usuario, Categoria } = require('../src/models/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servitech';

async function main() {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  // Ejemplo: crear categorías iniciales si no existe
  const categorias = [
    { nombre: 'Desarrollo Web', descripcion: 'Web, apps, software', icono: 'laptop-code' },
    { nombre: 'Ciencia de Datos', descripcion: 'Análisis, IA, ML', icono: 'database' },
    { nombre: 'UX/UI', descripcion: 'Diseño de experiencia', icono: 'paint-brush' },
    { nombre: 'DevOps', descripcion: 'Infraestructura y CI/CD', icono: 'server' },
    { nombre: 'Blockchain', descripcion: 'Contratos inteligentes', icono: 'cubes' },
    { nombre: 'Cloud Computing', descripcion: 'AWS, Azure, GCP', icono: 'cloud' }
  ];
  for (const cat of categorias) {
    await Categoria.updateOne({ nombre: cat.nombre }, cat, { upsert: true });
  }

  // Ejemplo: crear un usuario administrador si no existe
  const adminEmail = 'admin@servitech.com';
  const admin = await Usuario.findOne({ email: adminEmail });
  if (!admin) {
    await Usuario.create({
      nombre: 'Admin',
      apellido: 'Servitech',
      email: adminEmail,
      password_hash: 'Admin123$', // Cambia esto por un hash real en producción
      es_experto: false,
      estado: 'activo'
    });
  }

  console.log('Base de datos inicializada correctamente.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error inicializando la base de datos:', err);
  process.exit(1);
});
