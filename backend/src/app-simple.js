// ===============================
// Carga variables de entorno desde el archivo .env para configurar la app
require("dotenv").config();

// Importa mongoose para conectar y gestionar la base de datos MongoDB
const mongoose = require("mongoose");

// Importa express para crear el servidor web y definir rutas
const express = require("express");

// Importa cors para permitir solicitudes desde otros orígenes (CORS)
const cors = require("cors");

// Importa path para gestionar rutas de archivos y directorios
const path = require("path");

// ===============================
// Inicializa la aplicación Express
const app = express();

// Habilita CORS para todas las rutas (permite peticiones desde cualquier origen)
app.use(cors());

// Habilita el parseo automático de JSON en las solicitudes entrantes
app.use(express.json());

// ===============================
// Define la URI de conexión a MongoDB y el puerto del servidor
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/servitech";
const PORT = process.env.PORT || 8080;

// Muestra en consola información de arranque
console.log("Iniciando servidor simplificado...");
console.log("Puerto:", PORT);
console.log("MongoDB URI:", MONGODB_URI);

// ===============================
// Conectar a MongoDB usando Mongoose
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // Si la conexión es exitosa, muestra mensaje en consola
    console.log("✅ Conectado a MongoDB");
  })
  .catch((err) => {
    // Si ocurre un error, lo muestra y termina el proceso
    console.error("Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// ===============================
// Servir archivos estáticos desde la carpeta de vistas (por ejemplo, assets públicos)
app.use(express.static(path.join(__dirname, "../../views")));

// ===============================
// Configurar EJS como motor de plantillas para renderizar vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));

// ===============================
// Ruta de prueba para verificar que el backend responde correctamente
app.get("/api/test", (req, res) => {
  res.json({
    message: "✅ Backend ServiTech funcionando", // Mensaje de éxito
    timestamp: new Date().toISOString(), // Fecha y hora actual
    puerto: PORT, // Puerto en el que corre el servidor
  });
});

// ===============================
// Importar y usar rutas básicas de usuarios
const usuariosRoute = require("./routes/usuarios");
app.use("/api/usuarios", usuariosRoute);

// ===============================
// Ruta principal que renderiza la vista index.ejs
app.get("/", (req, res) => {
  res.render("index");
});

// ===============================
// Iniciar el servidor en el puerto especificado
app.listen(PORT, () => {
  // Muestra en consola las URLs útiles para el desarrollador
  console.log(`🚀 Servidor ServiTech corriendo en puerto ${PORT}`);
  console.log(`🌐 Acceder en: http://localhost:${PORT}`);
  console.log(`📡 API test: http://localhost:${PORT}/api/test`);
});
