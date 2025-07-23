/**
 * 🛣️ RUTAS DE ASESORÍAS - SERVITECH
 * Define todas las rutas relacionadas con la gestión de asesorías
 * Fecha: 6 de julio de 2025
 */

// ===============================
// 📄 RUTAS DE ASESORÍAS
// Este archivo define todas las rutas HTTP relacionadas con la gestión de asesorías en el sistema.
// Cada línea está documentada para explicar su propósito, parámetros y funcionamiento.
// ===============================

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa los controladores de asesoría desde el controlador centralizado
const {
  obtenerAsesorias, // Controlador para listar asesorías con filtros
  obtenerAsesoria, // Controlador para obtener una asesoría específica
  crearAsesoria, // Controlador para crear una nueva asesoría
  confirmarAsesoria, // Controlador para confirmar una asesoría (experto)
  cancelarAsesoria, // Controlador para cancelar una asesoría
  iniciarAsesoria, // Controlador para iniciar una asesoría
  finalizarAsesoria, // Controlador para finalizar una asesoría
  obtenerEstadisticas, // Controlador para obtener estadísticas de asesorías
  verificarDisponibilidadExperto, // Controlador para verificar disponibilidad de un experto
} = require("../controllers/asesoriaController");

// ===============================
// 🔒 MIDDLEWARE DE VALIDACIÓN DE USUARIO
// Verifica que el usuario tenga una sesión activa antes de permitir el acceso a rutas protegidas.
// Si no hay sesión, responde con error 401 (no autenticado).
const validarUsuario = (req, res, next) => {
  // Obtiene el ID del usuario autenticado desde la sesión
  const usuarioId = req.session?.usuarioId;
  if (!usuarioId) {
    // Si no hay usuario autenticado, responde con error y mensaje explicativo
    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado (sesión requerida)",
    });
  }
  // Si está autenticado, agrega el usuarioId al request para uso posterior
  req.usuarioId = usuarioId;
  next(); // Continúa con la siguiente función o controlador
};

// ===============================
// 🚦 RUTAS PÚBLICAS (acceso sin autenticación, solo validaciones mínimas)

/**
 * GET /api/asesorias
 * Ruta para obtener una lista de asesorías, permite aplicar filtros por query params.
 * Query params: usuario, rol, estado, categoria, fechaDesde, fechaHasta, pagina, limite
 * Ejemplo: /api/asesorias?usuario=123&estado=pendiente
 */
router.get("/", obtenerAsesorias);

/**
 * GET /api/asesorias/estadisticas
 * Ruta para obtener estadísticas agregadas de asesorías.
 * Query params: usuarioId, rol, periodo
 * Ejemplo: /api/asesorias/estadisticas?usuarioId=123&periodo=30
 */
router.get("/estadisticas", obtenerEstadisticas);

/**
 * GET /api/asesorias/disponibilidad/:expertoId
 * Ruta para verificar la disponibilidad de un experto en una fecha y duración específica.
 * Params: expertoId
 * Query params: fecha, duracion
 * Ejemplo: /api/asesorias/disponibilidad/456?fecha=2025-07-22&duracion=60
 */
router.get("/disponibilidad/:expertoId", verificarDisponibilidadExperto);

/**
 * GET /api/asesorias/:id
 * Ruta para obtener los detalles de una asesoría específica por su ID.
 * Params: id (ID de la asesoría)
 * Ejemplo: /api/asesorias/789
 */
router.get("/:id", obtenerAsesoria);

// ===============================
// 🔐 RUTAS PROTEGIDAS (requieren autenticación de usuario)

/**
 * POST /api/asesorias
 * Ruta para crear una nueva asesoría.
 * Body: expertoId, categoriaId, tipoServicio, titulo, descripcion, fechaHora, duracion, precio, metodoPago, requerimientos
 * El clienteId se toma automáticamente de la sesión activa.
 */
router.post("/", validarUsuario, crearAsesoria);

/**
 * PUT /api/asesorias/:id/confirmar
 * Ruta para que el experto confirme una asesoría asignada.
 * Params: id (ID de la asesoría)
 * Body: expertoId
 */
router.put("/:id/confirmar", validarUsuario, confirmarAsesoria);

/**
 * PUT /api/asesorias/:id/cancelar
 * Ruta para cancelar una asesoría (cliente o experto).
 * Params: id (ID de la asesoría)
 * Body: usuarioId, motivo
 */
router.put("/:id/cancelar", validarUsuario, cancelarAsesoria);

/**
 * PUT /api/asesorias/:id/iniciar
 * Ruta para iniciar una asesoría (cliente o experto).
 * Params: id (ID de la asesoría)
 * Body: usuarioId
 */
router.put("/:id/iniciar", validarUsuario, iniciarAsesoria);

/**
 * PUT /api/asesorias/:id/finalizar
 * Ruta para finalizar una asesoría (solo el experto puede finalizar).
 * Params: id (ID de la asesoría)
 * Body: usuarioId, resumen, archivosEntregados
 */
router.put("/:id/finalizar", validarUsuario, finalizarAsesoria);

// ===============================
// ⚠️ MIDDLEWARE DE MANEJO DE ERRORES
// Captura y responde a errores ocurridos en cualquier ruta de asesorías.
// Proporciona mensajes claros según el tipo de error (validación, cast, otros).

router.use((error, req, res, next) => {
  // Imprime el error en consola para depuración
  console.error("Error en rutas de asesorías:", error);

  // Si el error es de validación de Mongoose, responde con 400 y detalles
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      details: Object.values(error.errors).map((err) => err.message),
    });
  }

  // Si el error es por un ID inválido (CastError), responde con 400
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
    });
  }

  // Para otros errores, responde con 500 y mensaje genérico (o detalle en desarrollo)
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    error:
      process.env.NODE_ENV === "development" ? error.message : "Error interno",
  });
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
