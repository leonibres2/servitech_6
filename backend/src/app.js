// Carga variables de entorno desde .env
require("dotenv").config();
const mongoose = require('mongoose');
// Importa express para crear el servidor web
const express = require('express');

// Importa cors para permitir solicitudes de diferentes orígenes
const cors = require('cors');
// Importa path para manejar rutas de archivos
const path = require('path');

// Inicializa la aplicación Express
const app = express();
// Habilita CORS para todas las rutas
app.use(cors());

// Permite recibir y procesar JSON en las solicitudes
app.use(express.json());

// Obtiene la URI de MongoDB desde variables de entorno
const MONGODB_URI = process.env.MONGODB_URI;

// Conecta a la base de datos MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB:', MONGODB_URI))
  .catch(err => {
    // Si hay error al conectar, muestra el error y termina el proceso
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Llama los archivos estáticos del  (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, '../../views')));

// Configura EJS como motor de vistas y define la carpeta de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../../views'));

// Sirve los assets estáticos desde /views/assets
app.use('/assets', express.static(path.join(__dirname, '../../views/assets')));

// Importa las rutas de usuarios DESPUÉS de la conexión y middlewares
const userRoutes = require("./routes/usuarios");
// Asocia las rutas de usuarios al prefijo /api/usuarios
app.use("/api/usuarios", userRoutes);

// Importa las rutas de categorías y expertos
const categoriasRoutes = require('./routes/categorias');
const expertosRoutes = require('./routes/expertos');

// Asocia las rutas al prefijo /api
app.use('/api/categorias', categoriasRoutes);
app.use('/api/expertos', expertosRoutes);

// Rutas para renderizar vistas EJS
app.get('/', (req, res) => res.render('index'));
app.get('/feed.html', (req, res) => res.render('feed'));
app.get('/expertos.html', (req, res) => res.render('expertos'));
app.get('/registro.html', (req, res) => res.render('registro'));
app.get('/terminos.html', (req, res) => res.render('terminos'));
app.get('/privacidad.html', (req, res) => res.render('privacidad'));
// Agrega aquí más rutas según tus vistas .ejs

// Middleware para manejar rutas no encontradas (solo para API)
app.use('/api', (req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

const PORT = process.env.PORT || 3000;
// Inicia el servidor y muestra un mensaje en consola
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

// Exporta la app para pruebas
module.exports = app;