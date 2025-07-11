/**
 * 🛣️ RUTAS DE ASESORÍAS - SERVITECH
 * Define todas las rutas relacionadas con la gestión de asesorías
 * Fecha: 6 de julio de 2025
 */

const express = require('express');
const router = express.Router();
const {
  obtenerAsesorias,
  obtenerAsesoria,
  crearAsesoria,
  confirmarAsesoria,
  cancelarAsesoria,
  iniciarAsesoria,
  finalizarAsesoria,
  obtenerEstadisticas,
  verificarDisponibilidadExperto
} = require('../controllers/asesoriaController');

// Middleware de validación: requiere sesión activa
const validarUsuario = (req, res, next) => {
  // Usar la sesión para identificar al usuario autenticado
  const usuarioId = req.session?.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado (sesión requerida)'
    });
  }
  req.usuarioId = usuarioId;
  next();
};

// ====== RUTAS PÚBLICAS (con validación mínima) ======

/**
 * GET /api/asesorias
 * Obtener lista de asesorías con filtros
 * Query params: usuario, rol, estado, categoria, fechaDesde, fechaHasta, pagina, limite
 */
router.get('/', obtenerAsesorias);

/**
 * GET /api/asesorias/estadisticas
 * Obtener estadísticas de asesorías
 * Query params: usuarioId, rol, periodo
 */
router.get('/estadisticas', obtenerEstadisticas);

/**
 * GET /api/asesorias/disponibilidad/:expertoId
 * Verificar disponibilidad de un experto
 * Params: expertoId
 * Query params: fecha, duracion
 */
router.get('/disponibilidad/:expertoId', verificarDisponibilidadExperto);

/**
 * GET /api/asesorias/:id
 * Obtener una asesoría específica
 * Params: id
 */
router.get('/:id', obtenerAsesoria);

// ====== RUTAS PROTEGIDAS (requieren autenticación) ======

/**
 * POST /api/asesorias
 * Crear nueva asesoría
 * Body: expertoId, categoriaId, tipoServicio, titulo, descripcion, fechaHora, duracion, precio, metodoPago, requerimientos
 * El clienteId se toma de la sesión activa
 */
router.post('/', validarUsuario, crearAsesoria);

/**
 * PUT /api/asesorias/:id/confirmar
 * Confirmar asesoría (solo experto)
 * Params: id
 * Body: expertoId
 */
router.put('/:id/confirmar', validarUsuario, confirmarAsesoria);

/**
 * PUT /api/asesorias/:id/cancelar
 * Cancelar asesoría
 * Params: id
 * Body: usuarioId, motivo
 */
router.put('/:id/cancelar', validarUsuario, cancelarAsesoria);

/**
 * PUT /api/asesorias/:id/iniciar
 * Iniciar asesoría
 * Params: id
 * Body: usuarioId
 */
router.put('/:id/iniciar', validarUsuario, iniciarAsesoria);

/**
 * PUT /api/asesorias/:id/finalizar
 * Finalizar asesoría (solo experto)
 * Params: id
 * Body: usuarioId, resumen, archivosEntregados
 */
router.put('/:id/finalizar', validarUsuario, finalizarAsesoria);

// ====== MIDDLEWARE DE MANEJO DE ERRORES ======

router.use((error, req, res, next) => {
  console.error('Error en rutas de asesorías:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

module.exports = router;
