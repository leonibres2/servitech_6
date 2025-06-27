const mongoose = require('mongoose');

// Cambia la URI por la de tu base de datos (local o Atlas)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servitech';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conexión a MongoDB exitosa');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
}

module.exports = connectDB;
