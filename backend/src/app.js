// ===============================
// Carga variables de entorno desde el archivo .env para configurar la app
require("dotenv").config();

// Importa mongoose para conectar y gestionar la base de datos MongoDB
const mongoose = require("mongoose");

// Importa express para crear el servidor web y definir rutas
const express = require("express");

// Importa cors para permitir solicitudes de diferentes orígenes (CORS)
const cors = require("cors");

// Importa express-session para manejo de sesiones de usuario
const session = require("express-session");

// Importa path para gestionar rutas de archivos y directorios
const path = require("path");

// ===============================
// Inicializa la aplicación Express
const app = express();

// Habilita CORS con credenciales para permitir solicitudes desde los frontends indicados
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Orígenes permitidos
    credentials: true, // Permite el envío de cookies/sesiones
  })
);

// Configura express-session antes de las rutas para manejo de sesiones de usuario
app.use(
  session({
    secret: process.env.SESSION_SECRET || "servitech_secret", // Clave secreta para firmar la sesión
    resave: false, // No guarda la sesión si no hay cambios
    saveUninitialized: false, // No guarda sesiones vacías
    cookie: {
      secure: false, // true solo si usas https
      httpOnly: true, // Solo accesible por HTTP(S), no JS del cliente
      sameSite: "lax", // Protección CSRF básica
    },
  })
);

// Permite recibir y procesar JSON en las solicitudes entrantes
app.use(express.json());

// ===============================
// Obtiene la URI de MongoDB desde variables de entorno
const MONGODB_URI = process.env.MONGODB_URI;

// Conecta a la base de datos MongoDB usando Mongoose
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    // Si la conexión es exitosa, muestra mensaje en consola
    console.log("Conectado a MongoDB:", MONGODB_URI);

    // Inicializar sistema de recordatorios (temporalmente deshabilitado)
    // const sistemaRecordatorios = require('./services/recordatoriosService');
    // sistemaRecordatorios.inicializar()
    //   .then(() => console.log('Sistema de recordatorios iniciado'))
    //   .catch(err => console.error('Error iniciando recordatorios:', err));

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

// ===============================
// Servir archivos estáticos (HTML, CSS, JS, etc.) desde la carpeta de vistas
app.use(express.static(path.join(__dirname, "../../views")));

// ===============================
// Configura EJS como motor de vistas y define la carpeta de vistas
// Cargar la versión del proyecto desde package.json
const packageJson = require('../../package.json');
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));

// ===============================
// Sirve los assets estáticos desde /views/assets
app.use("/assets", express.static(path.join(__dirname, "../../views/assets")));

// Servir archivos subidos de mensajería (acceso público seguro)
app.use(
  "/uploads/mensajeria",
  express.static(path.join(__dirname, "../../uploads/mensajeria"))
);

// ===============================
// Importa las rutas de usuarios DESPUÉS de la conexión y middlewares
const userRoutes = require("./routes/usuarios");
// Asocia las rutas de usuarios al prefijo /api/usuarios
app.use("/api/usuarios", userRoutes);

// ===============================
// Importa las rutas de categorías y expertos
const categoriasRoutes = require("./routes/categorias");
const expertosRoutes = require("./routes/expertos");

// Importa las rutas de PSE (Pagos Seguros en Línea)
const pseRoutes = require("./routes/pse");

// Importa las rutas de asesorías y disponibilidad
const asesoriasRoutes = require("./routes/asesorias");
const disponibilidadRoutes = require("./routes/disponibilidad");
// Endpoint temporal para debug de asesorías
const asesoriasDebugRoutes = require("./routes/asesorias-debug");

// Importa las rutas de mensajería
const mensajeriaRoutes = require("./routes/mensajeria");

// Endpoint temporal para debug de usuarios
const usuariosDebugRoutes = require("./routes/usuarios-debug");

// ===============================
// Asocia las rutas al prefijo /api para organización REST
app.use("/api/categorias", categoriasRoutes);
app.use("/api/expertos", expertosRoutes);
app.use("/api/pse", pseRoutes);
app.use("/api/asesorias", asesoriasRoutes);
app.use("/api/asesorias/debug", asesoriasDebugRoutes); // Evita conflicto de rutas
app.use("/api/disponibilidad", disponibilidadRoutes);
app.use("/api/mensajeria", mensajeriaRoutes);
app.use("/api/usuarios/debug", usuariosDebugRoutes);

// ===============================
// Rutas de expertos para vistas (sin prefijo /api)
app.use("/expertos", expertosRoutes);

// ===============================
// Rutas para renderizar vistas EJS (cada una asocia una vista .ejs)
app.get("/", (req, res) => res.render("index", { version: packageJson.version }));
app.get("/expertos.html", (req, res) => res.render("expertos", { version: packageJson.version }));
app.get("/registro.html", (req, res) => res.render("registro", { version: packageJson.version }));
app.get("/login.html", (req, res) => res.render("login", { version: packageJson.version }));
app.get("/recuperar-password.html", (req, res) =>
  res.render("recuperar-password", { version: packageJson.version })
);
app.get("/calendario.html", (req, res) =>
  res.render("calendario", {
    pageTitle: "Calendario - Agendar Cita",
    expertoSeleccionado: null,
    version: packageJson.version
  })
);
app.get("/perfil.html", (req, res) => res.render("perfil", { version: packageJson.version }));
app.get("/terminos.html", (req, res) => res.render("terminos", { version: packageJson.version }));
app.get("/privacidad.html", (req, res) => res.render("privacidad", { version: packageJson.version }));
app.get("/contacto.html", (req, res) => res.render("contacto", { version: packageJson.version }));
app.get("/confirmacion-asesoria.html", (req, res) =>
  res.render("confirmacion-asesoria", { version: packageJson.version })
);
app.get("/pasarela-pagos.html", (req, res) =>
  res.render("pasarela-pagos", {
    pageTitle: "Pasarela de Pago - Servitech",
    expertoSeleccionado: null,
    version: packageJson.version
  })
);
// Ruta protegida: Mis Asesorías (debe recibir usuario autenticado)
app.get("/mis-asesorias.html", (req, res) => {
  // Si tienes sesión, usa req.session.usuarioId y req.session.rolUsuario
  // Aquí se simula un usuario autenticado para pruebas
  const usuarioId = req.session?.usuarioId || "64f1e2c1234567890abcdef1"; // <-- reemplaza por tu lógica real
  const rolUsuario = req.session?.rolUsuario || "cliente";
  res.render("mis-asesorias", { usuarioId, rolUsuario, version: packageJson.version });
});
app.get("/mensajes.html", (req, res) => {
  res.render("mensajes", { version: packageJson.version });
});
// Agrega aquí más rutas según tus vistas .ejs

// ===============================
// Middleware para manejar rutas no encontradas (solo para API)
app.use("/api", (req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// ===============================
// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res
    .status(500)
    .json({ message: "Error interno del servidor", error: err.message });
});

// ===============================
// Ruta de prueba para verificar que la API responde correctamente
app.get("/", (req, res) => {
  res.json({ mensaje: "API ServiTech funcionando" });
});

// ===============================
// Puerto de escucha del servidor
const PORT = process.env.PORT || 3000;

// ===============================
// 🚀 Crear servidor HTTP para Socket.IO y tiempo real
const http = require("http");
const server = http.createServer(app);

// 💬 Inicializar servicio de mensajería en tiempo real (Socket.IO)
const socketMensajeriaService = require("./services/socketMensajeriaService");
socketMensajeriaService.inicializar(server);

// ===============================
// Inicia el servidor y muestra un mensaje en consola con información útil
server.listen(PORT, () => {
  const actualPort = server.address().port;
  console.log(`🚀 Servidor backend escuchando en puerto ${actualPort}`);
  console.log(`💬 Socket.IO para mensajería activo`);
  console.log(`📡 WebSockets disponibles en ws://localhost:${actualPort}`);
  console.log(`🌐 Accede a la aplicación en: http://localhost:${actualPort}`);
});

// ===============================
// Exporta la app y el servidor para pruebas y testeo
module.exports = { app, server };
