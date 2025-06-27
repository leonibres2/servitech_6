/**
 * @fileoverview
 * Archivo principal de inicialización del backend de Servitech.
 * Configura el servidor Express, middlewares globales y rutas principales de la API.
 * Cumple con buenas prácticas de arquitectura y seguridad para aplicaciones Node.js.
 *
 * Autor: Diana Carolina Jimenez
 * Fecha: 2025-06-04
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware para habilitar CORS (permite peticiones desde otros orígenes)
app.use(cors());

// Middleware para parsear solicitudes JSON
app.use(express.json());

// Importar y montar rutas de usuarios
const userRoutes = require("./routes/usuarios");
app.use("/api/usuarios", userRoutes);

// Aquí se pueden agregar más rutas de la API, por ejemplo:
// const publicacionesRoutes = require("./routes/publicaciones");
// app.use("/api/publicaciones", publicacionesRoutes);

// Puerto de escucha definido por variable de entorno o valor por defecto
const PORT = process.env.PORT || 3000;

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
