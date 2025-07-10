// Carga variables de entorno desde .env
require("dotenv").config();
const mongoose = require("mongoose");
// Importa express para crear el servidor web
const express = require("express");

// Importa cors para permitir solicitudes de diferentes orígenes
const cors = require("cors");
// Importa path para manejar rutas de archivos
const path = require("path");

// Inicializa la aplicación Express
const app = express();
// Habilita CORS para todas las rutas
app.use(cors());

// Permite recibir y procesar JSON en las solicitudes
app.use(express.json());

// Obtiene la URI de MongoDB desde variables de entorno
const MONGODB_URI = process.env.MONGODB_URI;

// Conecta a la base de datos MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Conectado a MongoDB:", MONGODB_URI);

    // 🚀 Inicializar sistema de recordatorios (temporalmente deshabilitado)
    // const sistemaRecordatorios = require('./services/recordatoriosService');
    // sistemaRecordatorios.inicializar()
    //   .then(() => console.log('✅ Sistema de recordatorios iniciado'))
    //   .catch(err => console.error('❌ Error iniciando recordatorios:', err));

    // 🔔 Inicializar sistema de notificaciones (temporalmente deshabilitado)
    // const notificacionesService = require('./services/notificacionesService');
    // notificacionesService.inicializar()
    //   .then(() => console.log('✅ Sistema de notificaciones iniciado'))
    //   .catch(err => console.error('❌ Error iniciando notificaciones:', err));
  })
  .catch((err) => {
    // Si hay error al conectar, muestra el error y termina el proceso
    console.error("Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// Llama los archivos estáticos del  (HTML, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "../../views")));

// Configura EJS como motor de vistas y define la carpeta de vistas
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));

// Sirve los assets estáticos desde /views/assets
app.use("/assets", express.static(path.join(__dirname, "../../views/assets")));
// Servir archivos subidos de mensajería (acceso público seguro)
app.use(
  "/uploads/mensajeria",
  express.static(path.join(__dirname, "../../uploads/mensajeria"))
);

// Importa las rutas de usuarios DESPUÉS de la conexión y middlewares
const userRoutes = require("./routes/usuarios");
// Asocia las rutas de usuarios al prefijo /api/usuarios
app.use("/api/usuarios", userRoutes);

// Importa las rutas de categorías y expertos
const categoriasRoutes = require("./routes/categorias");
const expertosRoutes = require("./routes/expertos");

// 🏦 Importa las rutas de PSE
const pseRoutes = require("./routes/pse");

// 📅 Importa las rutas de asesorías y disponibilidad
const asesoriasRoutes = require("./routes/asesorias");
const disponibilidadRoutes = require("./routes/disponibilidad");

// 💬 Importa las rutas de mensajería
const mensajeriaRoutes = require("./routes/mensajeria");

// Asocia las rutas al prefijo /api
app.use("/api/categorias", categoriasRoutes);
app.use("/api/expertos", expertosRoutes);
app.use("/api/pse", pseRoutes);
app.use("/api/asesorias", asesoriasRoutes);
app.use("/api/disponibilidad", disponibilidadRoutes);
app.use("/api/mensajeria", mensajeriaRoutes);

// 🆕 Rutas de expertos para vistas (sin prefijo /api)
app.use("/expertos", expertosRoutes);

// Rutas para renderizar vistas EJS
app.get("/", (req, res) => res.render("index"));
app.get("/expertos.html", (req, res) => res.render("expertos"));
app.get("/registro.html", (req, res) => res.render("registro"));
app.get("/login.html", (req, res) => res.render("login"));
app.get("/recuperar-password.html", (req, res) =>
  res.render("recuperar-password")
);
app.get("/calendario.html", (req, res) =>
  res.render("calendario", {
    pageTitle: "Calendario - Agendar Cita",
    expertoSeleccionado: null, // No hay experto seleccionado en acceso directo
  })
);
app.get("/perfil.html", (req, res) => res.render("perfil"));
app.get("/terminos.html", (req, res) => res.render("terminos"));
app.get("/privacidad.html", (req, res) => res.render("privacidad"));
app.get("/contacto.html", (req, res) => res.render("contacto"));
app.get("/confirmacion-asesoria.html", (req, res) =>
  res.render("confirmacion-asesoria")
);
app.get("/pasarela-pagos.html", (req, res) =>
  res.render("pasarela-pagos", {
    pageTitle: "Pasarela de Pago - Servitech",
    expertoSeleccionado: null, // No hay experto seleccionado en acceso directo
  })
);
app.get("/mis-asesorias.html", (req, res) => res.render("mis-asesorias"));
app.get("/mensajes.html", (req, res) => {
  res.render("mensajes");
});
// Agrega aquí más rutas según tus vistas .ejs

// Middleware para manejar rutas no encontradas (solo para API)
app.use("/api", (req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res
    .status(500)
    .json({ message: "Error interno del servidor", error: err.message });
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ mensaje: "API ServiTech funcionando" });
});

// Puerto
const PORT = process.env.PORT || 3000;

// 🚀 Crear servidor HTTP para Socket.IO
const http = require("http");
const server = http.createServer(app);


// 💬 Inicializar servicio de mensajería en tiempo real (ACTIVO)
const socketMensajeriaService = require('./services/socketMensajeriaService');
socketMensajeriaService.inicializar(server);

// Inicia el servidor y muestra un mensaje en consola
server.listen(PORT, () => {
  const actualPort = server.address().port;
  console.log(`🚀 Servidor backend escuchando en puerto ${actualPort}`);
  console.log(`💬 Socket.IO para mensajería activo`);
  console.log(`📡 WebSockets disponibles en ws://localhost:${actualPort}`);
  console.log(`🌐 Accede a la aplicación en: http://localhost:${actualPort}`);
});

// Exporta la app y el servidor para pruebas
module.exports = { app, server };
