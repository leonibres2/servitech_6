// Carga variables de entorno desde .env
require("dotenv").config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Inicializa la aplicación Express
const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servitech';
const PORT = process.env.PORT || 8080;

console.log('🔧 Iniciando servidor simplificado...');
console.log('📊 Puerto:', PORT);
console.log('🗄️ MongoDB URI:', MONGODB_URI);

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../../views')));

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Backend ServiTech funcionando',
    timestamp: new Date().toISOString(),
    puerto: PORT 
  });
});

// Importar y usar rutas básicas
const usuariosRoute = require('./routes/usuarios');
app.use('/api/usuarios', usuariosRoute);

// Ruta principal
app.get('/', (req, res) => {
  res.render('index');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ServiTech corriendo en puerto ${PORT}`);
  console.log(`🌐 Acceder en: http://localhost:${PORT}`);
  console.log(`📡 API test: http://localhost:${PORT}/api/test`);
});
