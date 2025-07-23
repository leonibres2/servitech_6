/**
 * 📅 CONTROLADOR DE ASESORÍAS - SERVITECH
 * Gestiona todas las operaciones relacionadas con asesorías/citas.
 * Este archivo contiene las funciones principales para crear, consultar, actualizar y cancelar asesorías.
 * Fecha: 6 de julio de 2025
 *
 * Cada función está diseñada para interactuar con los modelos de la base de datos y manejar la lógica de negocio
 * relacionada con el ciclo de vida de una asesoría, incluyendo notificaciones, validaciones y control de estados.
 */

// Importa los modelos principales desde el archivo centralizado de modelos.
// Estos modelos representan las colecciones de la base de datos y permiten realizar operaciones CRUD sobre ellas.
const {
  Asesoria, // Modelo de asesorías, almacena la información de cada cita/asesoría.
  Usuario, // Modelo de usuarios, representa tanto a clientes como a expertos.
  Notificacion, // Modelo para gestionar notificaciones del sistema.
  Conversacion, // Modelo para manejar las conversaciones asociadas a asesorías.
  ConfiguracionSistema, // Modelo para acceder a configuraciones globales del sistema.
  TransaccionPSE, // Modelo para registrar transacciones de pago PSE.
} = require("../models/models");
// Importa el modelo de categorías, que permite clasificar las asesorías.
const Categoria = require("../models/categorias");

/**
 * 📋 Obtener todas las asesorías con filtros
 * Esta función permite consultar asesorías aplicando filtros por usuario, rol, estado, categoría y rango de fechas.
 * Implementa paginación para optimizar la consulta en grandes volúmenes de datos.
 *
 * Paso a paso:
 * 1. Extrae los filtros desde la query del request.
 * 2. Construye el objeto de filtro para la consulta.
 * 3. Aplica filtros adicionales según los parámetros recibidos.
 * 4. Realiza la consulta a la base de datos con paginación y poblado de referencias.
 * 5. Devuelve los resultados junto con información de paginación.
 */
const obtenerAsesorias = async (req, res) => {
  try {
    // Extrae los parámetros de filtro y paginación desde la query del request.
    const {
      usuario, // ID del usuario (cliente o experto) para filtrar asesorías asociadas.
      rol = "cliente", // Rol del usuario (por defecto 'cliente'). Determina el campo a filtrar.
      estado, // Estado de la asesoría (ej: 'pendiente', 'confirmada', etc).
      categoria, // ID de la categoría para filtrar asesorías de una categoría específica.
      fechaDesde, // Fecha de inicio del rango de búsqueda.
      fechaHasta, // Fecha de fin del rango de búsqueda.
      pagina = 1, // Número de página para paginación (por defecto 1).
      limite = 10, // Cantidad de resultados por página (por defecto 10).
    } = req.query;

    // Construir filtro base
    let filtro = {};

    if (usuario) {
      filtro[rol] = usuario;
    }

    if (estado) {
      filtro.estado = estado;
    }

    if (categoria) {
      filtro.categoria = categoria;
    }

    // Filtro por fechas
    if (fechaDesde || fechaHasta) {
      filtro.fechaHora = {};
      if (fechaDesde) {
        filtro.fechaHora.$gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        filtro.fechaHora.$lte = new Date(fechaHasta);
      }
    }

    // Ejecutar consulta con paginación
    const skip = (pagina - 1) * limite;
    const asesorias = await Asesoria.find(filtro)
      .populate("cliente", "nombre apellido email avatar_url")
      .populate("experto", "nombre apellido email avatar_url especialidades")
      .populate("categoria", "nombre descripcion")
      .populate("transaccionPago")
      .sort({ fechaHora: -1 })
      .limit(parseInt(limite))
      .skip(skip);

    // Contar total para paginación
    const total = await Asesoria.countDocuments(filtro);

    res.json({
      success: true,
      data: asesorias,
      pagination: {
        total,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("Error obteniendo asesorías:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 🔍 Obtener una asesoría específica
 */
const obtenerAsesoria = async (req, res) => {
  try {
    const { id } = req.params;

    const asesoria = await Asesoria.findById(id)
      .populate("cliente", "nombre apellido email avatar_url telefono")
      .populate(
        "experto",
        "nombre apellido email avatar_url especialidades experto"
      )
      .populate("categoria", "nombre descripcion")
      .populate("transaccionPago");

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        message: "Asesoría no encontrada",
      });
    }

    res.json({
      success: true,
      data: asesoria,
    });
  } catch (error) {
    console.error("Error obteniendo asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 📝 Crear nueva asesoría
 */
const crearAsesoria = async (req, res) => {
  try {
    console.log("🟢 [crearAsesoria] Body recibido:", req.body);

    // El clienteId siempre viene de la sesión
    const clienteId = req.session?.usuarioId;
    const {
      expertoId,
      categoriaId,
      tipoServicio,
      titulo,
      descripcion,
      fechaHora,
      duracion,
      precio,
      metodoPago,
      requerimientos,
    } = req.body;

    // Validaciones básicas
    if (!clienteId || !expertoId || !categoriaId || !fechaHora || !precio) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos obligatorios (o usuario no autenticado)",
      });
    }

    // Verificar que el cliente y experto existen
    const cliente = await Usuario.findById(clienteId);
    const experto = await Usuario.findById(expertoId);
    const categoria = await Categoria.findById(categoriaId);

    if (!cliente || !experto || !categoria) {
      return res.status(404).json({
        success: false,
        message: "Cliente, experto o categoría no encontrados",
      });
    }

    if (!experto.es_experto) {
      return res.status(400).json({
        success: false,
        message: "El usuario seleccionado no es un experto",
      });
    }

    // Verificar disponibilidad del experto
    const fechaCita = new Date(fechaHora);
    const disponible = await verificarDisponibilidad(
      expertoId,
      fechaCita,
      duracion || 60
    );

    if (!disponible) {
      return res.status(409).json({
        success: false,
        message: "El experto no está disponible en esa fecha y hora",
      });
    }

    // Crear la asesoría
    const nuevaAsesoria = new Asesoria({
      cliente: clienteId,
      experto: expertoId,
      categoria: categoriaId,
      tipoServicio: tipoServicio || "asesoria-detallada",
      titulo,
      descripcion,
      fechaHora: fechaCita,
      duracion: duracion || 60,
      precio,
      metodoPago: metodoPago || "tarjeta",
      requerimientos: requerimientos || {},
      estado: "pendiente-pago",
    });

    await nuevaAsesoria.save();

    // Poblar datos para respuesta
    await nuevaAsesoria.populate([
      { path: "cliente", select: "nombre apellido email" },
      { path: "experto", select: "nombre apellido email" },
      { path: "categoria", select: "nombre" },
    ]);

    // Crear conversación automática
    await Conversacion.crearParaAsesoria(
      nuevaAsesoria._id,
      clienteId,
      expertoId
    );

    // Crear notificaciones
    await Notificacion.crearNotificacionAsesoria(
      "nueva-asesoria",
      clienteId,
      nuevaAsesoria._id,
      {
        descripcionCorta: `Asesoría agendada para ${fechaCita.toLocaleDateString()}`,
      }
    );

    await Notificacion.crearNotificacionAsesoria(
      "nueva-asesoria",
      expertoId,
      nuevaAsesoria._id,
      {
        titulo: "Nueva solicitud de asesoría",
        mensaje:
          "Tienes una nueva solicitud de asesoría pendiente de confirmación.",
        descripcionCorta: "Nueva solicitud recibida",
      }
    );

    res.status(201).json({
      success: true,
      message: "Asesoría creada exitosamente",
      data: nuevaAsesoria,
    });
  } catch (error) {
    console.error("Error creando asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * ✅ Confirmar asesoría (solo experto)
 */
const confirmarAsesoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { expertoId } = req.body;

    const asesoria = await Asesoria.findById(id);

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        message: "Asesoría no encontrada",
      });
    }

    // Verificar que el experto es el propietario de la asesoría
    if (asesoria.experto.toString() !== expertoId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para confirmar esta asesoría",
      });
    }

    // Solo se puede confirmar si está pagada
    if (asesoria.estado !== "pagada") {
      return res.status(400).json({
        success: false,
        message: "La asesoría debe estar pagada para poder confirmarla",
      });
    }

    // Actualizar estado
    asesoria.estado = "confirmada";
    asesoria._cambiadoPor = expertoId;
    await asesoria.save();

    // Generar enlaces de videollamada
    await asesoria.generarEnlaceVideollamada();

    // Notificar al cliente
    await Notificacion.crearNotificacionAsesoria(
      "asesoria-confirmada",
      asesoria.cliente,
      asesoria._id,
      {
        titulo: "Asesoría confirmada",
        mensaje: "Tu asesoría ha sido confirmada por el experto.",
        descripcionCorta: "Asesoría confirmada",
      }
    );

    // Programar recordatorio
    await programarRecordatorio(asesoria);

    res.json({
      success: true,
      message: "Asesoría confirmada exitosamente",
      data: asesoria,
    });
  } catch (error) {
    console.error("Error confirmando asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * ❌ Cancelar asesoría
 */
const cancelarAsesoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, motivo = "" } = req.body;

    const asesoria = await Asesoria.findById(id);

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        message: "Asesoría no encontrada",
      });
    }

    // Verificar permisos
    const esCliente = asesoria.cliente.toString() === usuarioId;
    const esExperto = asesoria.experto.toString() === usuarioId;

    if (!esCliente && !esExperto) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para cancelar esta asesoría",
      });
    }

    // Verificar si se puede cancelar
    if (!asesoria.puedeSerCancelada()) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede cancelar la asesoría. Tiempo límite excedido (2 horas antes)",
      });
    }

    // Determinar nuevo estado
    const nuevoEstado = esCliente ? "cancelada-cliente" : "cancelada-experto";

    asesoria.estado = nuevoEstado;
    asesoria._cambiadoPor = usuarioId;

    // Agregar observaciones al historial
    if (motivo) {
      asesoria.historialEstados.push({
        estado: nuevoEstado,
        fecha: new Date(),
        observaciones: motivo,
        cambiadoPor: usuarioId,
      });
    }

    await asesoria.save();

    // Notificar a la otra parte
    const destinatarioId = esCliente ? asesoria.experto : asesoria.cliente;
    const tituloNotificacion = esCliente
      ? "Asesoría cancelada por el cliente"
      : "Asesoría cancelada por el experto";

    await Notificacion.crearNotificacionAsesoria(
      "asesoria-cancelada",
      destinatarioId,
      asesoria._id,
      {
        titulo: tituloNotificacion,
        mensaje: `La asesoría ha sido cancelada. ${
          motivo ? "Motivo: " + motivo : ""
        }`,
        descripcionCorta: "Asesoría cancelada",
      }
    );

    // Si estaba pagada, iniciar proceso de reembolso
    if (["pagada", "confirmada"].includes(asesoria.estado)) {
      // Aquí se integraría con el sistema de pagos para reembolso
      // Por ahora solo cambiamos el estado
      asesoria.estado = "reembolsada";
      await asesoria.save();
    }

    res.json({
      success: true,
      message: "Asesoría cancelada exitosamente",
      data: asesoria,
    });
  } catch (error) {
    console.error("Error cancelando asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 🚀 Iniciar asesoría
 */
const iniciarAsesoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.body;

    const asesoria = await Asesoria.findById(id);

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        message: "Asesoría no encontrada",
      });
    }

    // Verificar permisos
    const esParticipante = [
      asesoria.cliente.toString(),
      asesoria.experto.toString(),
    ].includes(usuarioId);

    if (!esParticipante) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para iniciar esta asesoría",
      });
    }

    // Verificar estado
    if (asesoria.estado !== "confirmada") {
      return res.status(400).json({
        success: false,
        message: "La asesoría debe estar confirmada para poder iniciarla",
      });
    }

    // Verificar tiempo (puede iniciarse hasta 15 minutos antes)
    const ahora = new Date();
    const tiempoAntes = new Date(asesoria.fechaHora.getTime() - 15 * 60 * 1000);

    if (ahora < tiempoAntes) {
      return res.status(400).json({
        success: false,
        message:
          "La asesoría solo puede iniciarse 15 minutos antes de la hora programada",
      });
    }

    // Actualizar estado
    asesoria.estado = "en-curso";
    asesoria.videollamada.iniciadaEn = ahora;
    asesoria._cambiadoPor = usuarioId;
    await asesoria.save();

    // Notificar al otro participante
    const otroParticipante =
      usuarioId === asesoria.cliente.toString()
        ? asesoria.experto
        : asesoria.cliente;

    await Notificacion.crearNotificacionAsesoria(
      "asesoria-iniciada",
      otroParticipante,
      asesoria._id,
      {
        descripcionCorta: "La asesoría ha comenzado",
      }
    );

    res.json({
      success: true,
      message: "Asesoría iniciada exitosamente",
      data: {
        id: asesoria._id,
        estado: asesoria.estado,
        enlaceVideollamada:
          usuarioId === asesoria.cliente.toString()
            ? asesoria.videollamada.enlaceCliente
            : asesoria.videollamada.enlaceExperto,
      },
    });
  } catch (error) {
    console.error("Error iniciando asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 🏁 Finalizar asesoría
 */
const finalizarAsesoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId, resumen, archivosEntregados = [] } = req.body;

    const asesoria = await Asesoria.findById(id);

    if (!asesoria) {
      return res.status(404).json({
        success: false,
        message: "Asesoría no encontrada",
      });
    }

    // Solo el experto puede finalizar
    if (asesoria.experto.toString() !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: "Solo el experto puede finalizar la asesoría",
      });
    }

    // Verificar estado
    if (asesoria.estado !== "en-curso") {
      return res.status(400).json({
        success: false,
        message: "La asesoría debe estar en curso para poder finalizarla",
      });
    }

    // Calcular tiempo efectivo
    const tiempoEfectivo = asesoria.videollamada.iniciadaEn
      ? Math.round(
          (Date.now() - asesoria.videollamada.iniciadaEn.getTime()) /
            (1000 * 60)
        )
      : asesoria.duracion;

    // Actualizar estado y resultado
    asesoria.estado = "completada";
    asesoria.videollamada.finalizadaEn = new Date();
    asesoria.resultado = {
      resumen: resumen || "",
      archivosEntregados,
      tiempoEfectivo,
    };
    asesoria._cambiadoPor = usuarioId;

    await asesoria.save();

    // Notificar al cliente
    await Notificacion.crearNotificacionAsesoria(
      "asesoria-completada",
      asesoria.cliente,
      asesoria._id,
      {
        descripcionCorta: "Asesoría finalizada exitosamente",
      }
    );

    res.json({
      success: true,
      message: "Asesoría finalizada exitosamente",
      data: asesoria,
    });
  } catch (error) {
    console.error("Error finalizando asesoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 📊 Obtener estadísticas de asesorías
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const { usuarioId, rol, periodo = 30 } = req.query;

    // Calcular fechas
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - parseInt(periodo));

    // Filtro base
    let filtro = {
      fechaHora: { $gte: fechaInicio, $lte: fechaFin },
    };

    if (usuarioId && rol) {
      filtro[rol] = usuarioId;
    }

    // Estadísticas generales
    const estadisticas = await Asesoria.estadisticas(filtro);

    // Asesorías próximas
    const proximasQuery = { ...filtro };
    proximasQuery.fechaHora = { $gte: new Date() };
    proximasQuery.estado = { $in: ["confirmada", "en-curso"] };

    const proximas = await Asesoria.find(proximasQuery)
      .populate("cliente experto categoria")
      .sort({ fechaHora: 1 })
      .limit(5);

    // Conteos por estado
    const porEstado = await Asesoria.aggregate([
      { $match: filtro },
      { $group: { _id: "$estado", total: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        estadisticas,
        proximasAsesorias: proximas,
        distribucionEstados: porEstado,
        periodo: `${periodo} días`,
      },
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

/**
 * 🔍 Verificar disponibilidad de experto
 */
const verificarDisponibilidadExperto = async (req, res) => {
  try {
    const { expertoId } = req.params;
    const { fecha, duracion = 60 } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: "La fecha es requerida",
      });
    }

    const fechaCita = new Date(fecha);
    const disponible = await verificarDisponibilidad(
      expertoId,
      fechaCita,
      parseInt(duracion)
    );

    res.json({
      success: true,
      data: {
        disponible,
        experto: expertoId,
        fecha: fechaCita,
        duracion: parseInt(duracion),
      },
    });
  } catch (error) {
    console.error("Error verificando disponibilidad:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message,
    });
  }
};

// ============= FUNCIONES AUXILIARES =============

/**
 * Verificar disponibilidad de un experto
 */
async function verificarDisponibilidad(expertoId, fechaHora, duracion) {
  const inicioVentana = new Date(fechaHora.getTime() - duracion * 60 * 1000);
  const finVentana = new Date(fechaHora.getTime() + duracion * 60 * 1000);

  const conflictos = await Asesoria.find({
    experto: expertoId,
    estado: { $in: ["pagada", "confirmada", "en-curso"] },
    $or: [
      {
        fechaHora: { $gte: inicioVentana, $lte: finVentana },
      },
      {
        $expr: {
          $and: [
            { $lte: ["$fechaHora", fechaHora] },
            {
              $gte: [
                { $add: ["$fechaHora", { $multiply: ["$duracion", 60000] }] },
                fechaHora,
              ],
            },
          ],
        },
      },
    ],
  });

  return conflictos.length === 0;
}

/**
 * Programar recordatorio automático
 */
async function programarRecordatorio(asesoria) {
  try {
    const tiempoRecordatorio = await ConfiguracionSistema.findOne({
      clave: "notificaciones.recordatorio_default",
    });

    const minutos = tiempoRecordatorio ? tiempoRecordatorio.valor : 30;
    const fechaRecordatorio = new Date(
      asesoria.fechaHora.getTime() - minutos * 60 * 1000
    );

    // Crear notificaciones programadas para cliente y experto
    await Notificacion.crear({
      usuario: asesoria.cliente,
      tipo: "recordatorio",
      titulo: "Recordatorio de asesoría",
      mensaje: `Tu asesoría con ${asesoria.experto.nombre} está programada para dentro de ${minutos} minutos.`,
      categoria: "warning",
      programada: {
        esProgramada: true,
        fechaEnvio: fechaRecordatorio,
      },
      referencia: {
        modelo: "Asesoria",
        id: asesoria._id,
      },
    });

    await Notificacion.crear({
      usuario: asesoria.experto,
      tipo: "recordatorio",
      titulo: "Recordatorio de asesoría",
      mensaje: `Tu asesoría con ${asesoria.cliente.nombre} está programada para dentro de ${minutos} minutos.`,
      categoria: "warning",
      programada: {
        esProgramada: true,
        fechaEnvio: fechaRecordatorio,
      },
      referencia: {
        modelo: "Asesoria",
        id: asesoria._id,
      },
    });
  } catch (error) {
    console.error("Error programando recordatorio:", error);
  }
}

module.exports = {
  obtenerAsesorias,
  obtenerAsesoria,
  crearAsesoria,
  confirmarAsesoria,
  cancelarAsesoria,
  iniciarAsesoria,
  finalizarAsesoria,
  obtenerEstadisticas,
  verificarDisponibilidadExperto,
};
