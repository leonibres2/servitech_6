// ===============================
// 💬 RUTAS DE MENSAJERÍA EN TIEMPO REAL - SERVITECH
// Este archivo define todas las rutas HTTP para el sistema de mensajería en tiempo real.
// Cada línea está documentada para explicar su propósito y funcionamiento.
// Fecha: 6 de julio de 2025
// ===============================

// Importa el middleware para subida de archivos (usado en mensajes con adjuntos)
const upload = require("../middleware/upload");

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa el controlador centralizado de mensajería
const MensajeriaController = require("../controllers/mensajeriaController");

// ===============================
// 🔒 MIDDLEWARE DE VALIDACIÓN DE AUTENTICACIÓN
// En producción se debe usar JWT real. Por ahora, permite todas las solicitudes.
const validarAuth = (req, res, next) => {
  // Aquí iría la validación JWT real
  // Por ahora, permitir todas las solicitudes
  next();
};

// ===============================
// 🛡️ MIDDLEWARE DE VALIDACIÓN DE DATOS
// Valida que los datos requeridos estén presentes en POST y PUT
const validarDatos = (req, res, next) => {
  // Validaciones básicas
  if (req.method === "POST" || req.method === "PUT") {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Datos requeridos",
      });
    }
  }
  next();
};

// ===============================
// 📋 RUTAS DE CONVERSACIONES

/**
 * GET /api/mensajeria/conversaciones
 * Lista las conversaciones del usuario autenticado.
 * Query params: tipo, estado, limite, pagina
 */
router.get(
  "/conversaciones",
  validarAuth, // Valida autenticación
  MensajeriaController.listarConversaciones // Controlador que lista conversaciones
);

/**
 * POST /api/mensajeria/conversaciones
 * Crea una nueva conversación.
 * Body: { participantes, tipo, titulo?, asesoriaId? }
 */
router.post(
  "/conversaciones",
  validarAuth, // Valida autenticación
  validarDatos, // Valida datos requeridos
  MensajeriaController.crearConversacion // Controlador que crea la conversación
);

/**
 * GET /api/mensajeria/conversaciones/:conversacionId
 * Obtiene una conversación específica por su ID.
 */
router.get(
  "/conversaciones/:conversacionId",
  validarAuth, // Valida autenticación
  MensajeriaController.obtenerConversacion // Controlador que obtiene la conversación
);

/**
 * PUT /api/mensajeria/conversaciones/:conversacionId/participantes
 * Gestiona los participantes de una conversación (agregar o remover).
 * Body: { accion: 'agregar'|'remover', usuarioId, rol? }
 */
router.put(
  "/conversaciones/:conversacionId/participantes",
  validarAuth, // Valida autenticación
  validarDatos, // Valida datos requeridos
  MensajeriaController.gestionarParticipantes // Controlador que gestiona participantes
);

// ===============================
// 💬 RUTAS DE MENSAJES

/**
 * GET /api/mensajeria/conversaciones/:conversacionId/mensajes
 * Lista los mensajes de una conversación específica.
 * Query params: limite, pagina, desde
 */
router.get(
  "/conversaciones/:conversacionId/mensajes",
  validarAuth, // Valida autenticación
  MensajeriaController.listarMensajes // Controlador que lista mensajes
);

/**
 * POST /api/mensajeria/conversaciones/:conversacionId/mensajes
 * Envía un nuevo mensaje a una conversación (puede incluir archivo adjunto).
 * FormData: { contenido, archivo }
 */
router.post(
  "/conversaciones/:conversacionId/mensajes",
  validarAuth, // Valida autenticación
  upload.single("archivo"), // Middleware para subir archivo adjunto
  MensajeriaController.enviarMensaje // Controlador que envía el mensaje
);

/**
 * PUT /api/mensajeria/mensajes/:mensajeId/editar
 * Edita el contenido de un mensaje existente.
 * Body: { nuevoContenido }
 */
router.put(
  "/mensajes/:mensajeId/editar",
  validarAuth, // Valida autenticación
  validarDatos, // Valida datos requeridos
  MensajeriaController.editarMensaje // Controlador que edita el mensaje
);

/**
 * DELETE /api/mensajeria/mensajes/:mensajeId
 * Elimina un mensaje específico (puede requerir razón).
 * Body: { razon? }
 */
router.delete(
  "/mensajes/:mensajeId",
  validarAuth, // Valida autenticación
  MensajeriaController.eliminarMensaje // Controlador que elimina el mensaje
);

// ===============================
// 👁️ RUTAS DE ESTADO Y LECTURA

/**
 * PUT /api/mensajeria/conversaciones/:conversacionId/leer
 * Marca todos los mensajes de una conversación como leídos.
 */
router.put(
  "/conversaciones/:conversacionId/leer",
  validarAuth, // Valida autenticación
  MensajeriaController.marcarComoLeido // Controlador que marca como leído
);

/**
 * PUT /api/mensajeria/mensajes/:mensajeId/leer
 * Marca un mensaje específico como leído.
 */
router.put(
  "/mensajes/:mensajeId/leer",
  validarAuth, // Valida autenticación
  MensajeriaController.marcarComoLeido // Controlador que marca como leído
);

// ===============================
// ⭐ RUTAS DE INTERACCIONES

/**
 * POST /api/mensajeria/mensajes/:mensajeId/reacciones
 * Agrega o cambia una reacción a un mensaje.
 * Body: { tipo: 'like'|'love'|'laugh'|'angry'|'sad'|'wow'|'thumbs_up'|'thumbs_down' }
 */
router.post(
  "/mensajes/:mensajeId/reacciones",
  validarAuth, // Valida autenticación
  validarDatos, // Valida datos requeridos
  MensajeriaController.agregarReaccion // Controlador que agrega la reacción
);

// ===============================
// 📊 RUTAS DE ESTADÍSTICAS Y REPORTES

/**
 * GET /api/mensajeria/estadisticas
 * Obtiene estadísticas de mensajería del usuario autenticado.
 * Query params: incluirGlobales (para admins)
 */
router.get(
  "/estadisticas",
  validarAuth, // Valida autenticación
  MensajeriaController.obtenerEstadisticas // Controlador que obtiene estadísticas
);

// ===============================
// 🔍 RUTAS DE BÚSQUEDA Y FILTRADO

/**
 * GET /api/mensajeria/buscar
 * Busca mensajes y conversaciones según los filtros y el término de búsqueda.
 * Query params: q (query), tipo, fechaInicio, fechaFin
 */
router.get("/buscar", validarAuth, async (req, res) => {
  try {
    // Obtiene los parámetros de búsqueda y usuario
    const { q, tipo, fechaInicio, fechaFin, limite = 20 } = req.query;
    const { usuario } = req.user || { usuario: req.query.usuarioId };

    // Valida que el término de búsqueda tenga al menos 2 caracteres
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "La búsqueda debe tener al menos 2 caracteres",
      });
    }

    // Construye los filtros de búsqueda
    const filtros = {
      "contenido.texto": { $regex: q, $options: "i" },
      "eliminado.eliminado": false,
    };

    if (tipo) {
      filtros["contenido.tipo"] = tipo;
    }

    if (fechaInicio || fechaFin) {
      filtros.fechaEnvio = {};
      if (fechaInicio) filtros.fechaEnvio.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaEnvio.$lte = new Date(fechaFin);
    }

    // Busca solo en conversaciones donde el usuario es participante
    const { Conversacion, Mensaje } = require("../models/mensajeria");

    const conversacionesUsuario = await Conversacion.find({
      "participantes.usuario": usuario,
      "participantes.activo": true,
    }).select("_id");

    const conversacionesIds = conversacionesUsuario.map((c) => c._id);
    filtros.conversacion = { $in: conversacionesIds };

    // Busca los mensajes que cumplen los filtros
    const mensajes = await Mensaje.find(filtros)
      .populate("remitente", "nombre apellido avatar_url")
      .populate("conversacion", "titulo tipo")
      .sort({ fechaEnvio: -1 })
      .limit(parseInt(limite));

    // Devuelve los resultados encontrados
    res.json({
      success: true,
      resultados: mensajes,
      total: mensajes.length,
      query: q,
    });
  } catch (error) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error en búsqueda:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
});

// ===============================
// 🔧 RUTAS DE UTILIDADES

/**
 * GET /api/mensajeria/health
 * Health check del sistema de mensajería. Verifica conexión y estadísticas básicas.
 */
router.get("/health", async (req, res) => {
  try {
    // Importa los modelos necesarios
    const { Conversacion, Mensaje } = require("../models/mensajeria");

    // Verifica la conexión a la base de datos y cuenta documentos activos
    const totalConversaciones = await Conversacion.countDocuments({
      activa: true,
    });
    const totalMensajes = await Mensaje.countDocuments({
      "eliminado.eliminado": false,
    });

    // Devuelve el estado y estadísticas
    res.json({
      success: true,
      status: "OK",
      timestamp: new Date().toISOString(),
      estadisticas: {
        conversacionesActivas: totalConversaciones,
        mensajesActivos: totalMensajes,
      },
    });
  } catch (error) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error en health check:", error);
    res.status(500).json({
      success: false,
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * POST /api/mensajeria/test
 * Endpoint de prueba para validar funcionalidad del sistema de mensajería.
 */
router.post("/test", async (req, res) => {
  try {
    // Obtiene la acción a ejecutar
    const { accion } = req.body;

    switch (accion) {
      case "crear-conversacion-test":
        // Crea una conversación de prueba
        const { Conversacion } = require("../models/mensajeria");
        const testConv = new Conversacion({
          participantes: [
            { usuario: "60d5ecb54b24a123456789ab", rol: "cliente" },
            { usuario: "60d5ecb54b24a123456789ac", rol: "experto" },
          ],
          tipo: "individual",
          titulo: "Conversación de prueba",
        });
        await testConv.save();

        // Devuelve la conversación creada
        res.json({
          success: true,
          message: "Conversación de prueba creada",
          conversacion: testConv,
        });
        break;

      case "enviar-mensaje-test":
        // Envía un mensaje de prueba
        const { Mensaje } = require("../models/mensajeria");
        const testMensaje = new Mensaje({
          conversacion: req.body.conversacionId || "60d5ecb54b24a123456789ad",
          remitente: "60d5ecb54b24a123456789ab",
          contenido: {
            texto: "Mensaje de prueba desde API",
            tipo: "texto",
          },
          estado: "enviado",
        });
        await testMensaje.save();

        // Devuelve el mensaje enviado
        res.json({
          success: true,
          message: "Mensaje de prueba enviado",
          mensaje: testMensaje,
        });
        break;

      default:
        // Respuesta por defecto si no se especifica acción
        res.json({
          success: true,
          message: "Sistema de mensajería funcionando correctamente",
          acciones_disponibles: [
            "crear-conversacion-test",
            "enviar-mensaje-test",
          ],
        });
    }
  } catch (error) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error en test:", error);
    res.status(500).json({
      success: false,
      message: "Error en prueba",
      error: error.message,
    });
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
