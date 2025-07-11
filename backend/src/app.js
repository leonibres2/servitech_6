// Carga variables de entorno desde .env
require("dotenv").config();
const mongoose = require("mongoose");
// Importa express para crear el servidor web
const express = require("express");

// Importa cors para permitir solicitudes de diferentes orígenes
const cors = require("cors");
// Importa express-session para manejo de sesiones
const session = require("express-session");
// Importa path para manejar rutas de archivos
const path = require("path");

// Inicializa la aplicación Express
const app = express();

// Habilita CORS con credenciales para frontend en otro puerto
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// Configura express-session antes de las rutas
app.use(
  session({
    secret: process.env.SESSION_SECRET || "servitech_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true solo si usas https
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

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
// 🐞 Endpoint temporal para debug de asesorías
const asesoriasDebugRoutes = require("./routes/asesorias-debug");

// 💬 Importa las rutas de mensajería
const mensajeriaRoutes = require("./routes/mensajeria");

// 🐞 Endpoint temporal para debug de usuarios
const usuariosDebugRoutes = require("./routes/usuarios-debug");

// Asocia las rutas al prefijo /api
app.use("/api/categorias", categoriasRoutes);
app.use("/api/expertos", expertosRoutes);
app.use("/api/pse", pseRoutes);
app.use("/api/asesorias", asesoriasRoutes);
app.use("/api/asesorias/debug", asesoriasDebugRoutes); // Evita conflicto de rutas
app.use("/api/disponibilidad", disponibilidadRoutes);
app.use("/api/mensajeria", mensajeriaRoutes);
app.use("/api/usuarios/debug", usuariosDebugRoutes);

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
// Ruta protegida: Mis Asesorías (debe recibir usuario autenticado)
app.get("/mis-asesorias.html", (req, res) => {
  // Si tienes sesión, usa req.session.usuarioId y req.session.rolUsuario
  // Aquí se simula un usuario autenticado para pruebas
  const usuarioId = req.session?.usuarioId || "64f1e2c1234567890abcdef1"; // <-- reemplaza por tu lógica real
  const rolUsuario = req.session?.rolUsuario || "cliente";
  res.render("mis-asesorias", { usuarioId, rolUsuario });
});
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
const socketMensajeriaService = require("./services/socketMensajeriaService");
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
