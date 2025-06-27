require("dotenv").config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/servitech';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB:', MONGODB_URI))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// Importa las rutas DESPUÉS de la conexión y middlewares
const userRoutes = require("./routes/usuarios");
app.use("/api/usuarios", userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});

module.exports = app;