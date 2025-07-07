/**
 * 💬 RUTAS DE MENSAJERÍA EN TIEMPO REAL - SERVITECH
 * Define todas las rutas para el sistema de mensajería
 * Fecha: 6 de julio de 2025
 */

const express = require('express');
const router = express.Router();
const MensajeriaController = require('../controllers/mensajeriaController');

// Middleware de validación básica (en producción usar JWT)
const validarAuth = (req, res, next) => {
  // Aquí iría la validación JWT real
  // Por ahora, permitir todas las solicitudes
  next();
};

// Middleware de validación de datos
const validarDatos = (req, res, next) => {
  // Validaciones básicas
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos'
      });
    }
  }
  next();
};

// 📋 RUTAS DE CONVERSACIONES

/**
 * GET /api/mensajeria/conversaciones
 * Listar conversaciones del usuario autenticado
 * Query params: tipo, estado, limite, pagina
 */
router.get('/conversaciones', validarAuth, MensajeriaController.listarConversaciones);

/**
 * POST /api/mensajeria/conversaciones
 * Crear nueva conversación
 * Body: { participantes, tipo, titulo?, asesoriaId? }
 */
router.post('/conversaciones', validarAuth, validarDatos, MensajeriaController.crearConversacion);

/**
 * GET /api/mensajeria/conversaciones/:conversacionId
 * Obtener conversación específica
 */
router.get('/conversaciones/:conversacionId', validarAuth, MensajeriaController.obtenerConversacion);

/**
 * PUT /api/mensajeria/conversaciones/:conversacionId/participantes
 * Gestionar participantes (agregar/remover)
 * Body: { accion: 'agregar'|'remover', usuarioId, rol? }
 */
router.put('/conversaciones/:conversacionId/participantes', 
  validarAuth, 
  validarDatos, 
  MensajeriaController.gestionarParticipantes
);

// 💬 RUTAS DE MENSAJES

/**
 * GET /api/mensajeria/conversaciones/:conversacionId/mensajes
 * Listar mensajes de una conversación
 * Query params: limite, pagina, desde
 */
router.get('/conversaciones/:conversacionId/mensajes', 
  validarAuth, 
  MensajeriaController.listarMensajes
);

/**
 * POST /api/mensajeria/conversaciones/:conversacionId/mensajes
 * Enviar nuevo mensaje
 * Body: { contenido: {texto, tipo, archivo?, metadatos?}, respuestaA?, prioridad? }
 */
router.post('/conversaciones/:conversacionId/mensajes', 
  validarAuth, 
  validarDatos, 
  MensajeriaController.enviarMensaje
);

/**
 * PUT /api/mensajeria/mensajes/:mensajeId/editar
 * Editar mensaje existente
 * Body: { nuevoContenido }
 */
router.put('/mensajes/:mensajeId/editar', 
  validarAuth, 
  validarDatos, 
  MensajeriaController.editarMensaje
);

/**
 * DELETE /api/mensajeria/mensajes/:mensajeId
 * Eliminar mensaje
 * Body: { razon? }
 */
router.delete('/mensajes/:mensajeId', 
  validarAuth, 
  MensajeriaController.eliminarMensaje
);

// 👁️ RUTAS DE ESTADO Y LECTURA

/**
 * PUT /api/mensajeria/conversaciones/:conversacionId/leer
 * Marcar todos los mensajes como leídos
 */
router.put('/conversaciones/:conversacionId/leer', 
  validarAuth, 
  MensajeriaController.marcarComoLeido
);

/**
 * PUT /api/mensajeria/mensajes/:mensajeId/leer
 * Marcar mensaje específico como leído
 */
router.put('/mensajes/:mensajeId/leer', 
  validarAuth, 
  MensajeriaController.marcarComoLeido
);

// ⭐ RUTAS DE INTERACCIONES

/**
 * POST /api/mensajeria/mensajes/:mensajeId/reacciones
 * Agregar/cambiar reacción a mensaje
 * Body: { tipo: 'like'|'love'|'laugh'|'angry'|'sad'|'wow'|'thumbs_up'|'thumbs_down' }
 */
router.post('/mensajes/:mensajeId/reacciones', 
  validarAuth, 
  validarDatos, 
  MensajeriaController.agregarReaccion
);

// 📊 RUTAS DE ESTADÍSTICAS Y REPORTES

/**
 * GET /api/mensajeria/estadisticas
 * Obtener estadísticas de mensajería del usuario
 * Query params: incluirGlobales (para admins)
 */
router.get('/estadisticas', validarAuth, MensajeriaController.obtenerEstadisticas);

// 🔍 RUTAS DE BÚSQUEDA Y FILTRADO

/**
 * GET /api/mensajeria/buscar
 * Buscar en mensajes y conversaciones
 * Query params: q (query), tipo, fechaInicio, fechaFin
 */
router.get('/buscar', validarAuth, async (req, res) => {
  try {
    const { q, tipo, fechaInicio, fechaFin, limite = 20 } = req.query;
    const { usuario } = req.user || { usuario: req.query.usuarioId };

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    // Construir filtros de búsqueda
    const filtros = {
      'contenido.texto': { $regex: q, $options: 'i' },
      'eliminado.eliminado': false
    };

    if (tipo) {
      filtros['contenido.tipo'] = tipo;
    }

    if (fechaInicio || fechaFin) {
      filtros.fechaEnvio = {};
      if (fechaInicio) filtros.fechaEnvio.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaEnvio.$lte = new Date(fechaFin);
    }

    // Buscar solo en conversaciones donde el usuario es participante
    const { Conversacion, Mensaje } = require('../models/mensajeria');
    
    const conversacionesUsuario = await Conversacion.find({
      'participantes.usuario': usuario,
      'participantes.activo': true
    }).select('_id');

    const conversacionesIds = conversacionesUsuario.map(c => c._id);
    filtros.conversacion = { $in: conversacionesIds };

    const mensajes = await Mensaje.find(filtros)
      .populate('remitente', 'nombre apellido avatar_url')
      .populate('conversacion', 'titulo tipo')
      .sort({ fechaEnvio: -1 })
      .limit(parseInt(limite));

    res.json({
      success: true,
      resultados: mensajes,
      total: mensajes.length,
      query: q
    });

  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🔧 RUTAS DE UTILIDADES

/**
 * GET /api/mensajeria/health
 * Health check del sistema de mensajería
 */
router.get('/health', async (req, res) => {
  try {
    const { Conversacion, Mensaje } = require('../models/mensajeria');
    
    // Verificar conexión a la base de datos
    const totalConversaciones = await Conversacion.countDocuments({ activa: true });
    const totalMensajes = await Mensaje.countDocuments({ 'eliminado.eliminado': false });
    
    res.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      estadisticas: {
        conversacionesActivas: totalConversaciones,
        mensajesActivos: totalMensajes
      }
    });

  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * POST /api/mensajeria/test
 * Endpoint de prueba para validar funcionalidad
 */
router.post('/test', async (req, res) => {
  try {
    const { accion } = req.body;

    switch (accion) {
      case 'crear-conversacion-test':
        const { Conversacion } = require('../models/mensajeria');
        const testConv = new Conversacion({
          participantes: [
            { usuario: '60d5ecb54b24a123456789ab', rol: 'cliente' },
            { usuario: '60d5ecb54b24a123456789ac', rol: 'experto' }
          ],
          tipo: 'individual',
          titulo: 'Conversación de prueba'
        });
        await testConv.save();
        
        res.json({
          success: true,
          message: 'Conversación de prueba creada',
          conversacion: testConv
        });
        break;

      case 'enviar-mensaje-test':
        const { Mensaje } = require('../models/mensajeria');
        const testMensaje = new Mensaje({
          conversacion: req.body.conversacionId || '60d5ecb54b24a123456789ad',
          remitente: '60d5ecb54b24a123456789ab',
          contenido: {
            texto: 'Mensaje de prueba desde API',
            tipo: 'texto'
          },
          estado: 'enviado'
        });
        await testMensaje.save();
        
        res.json({
          success: true,
          message: 'Mensaje de prueba enviado',
          mensaje: testMensaje
        });
        break;

      default:
        res.json({
          success: true,
          message: 'Sistema de mensajería funcionando correctamente',
          acciones_disponibles: ['crear-conversacion-test', 'enviar-mensaje-test']
        });
    }

  } catch (error) {
    console.error('Error en test:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba',
      error: error.message
    });
  }
});

module.exports = router;
