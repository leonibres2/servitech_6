/**
 * 💬 CONTROLADOR DE MENSAJERÍA EN TIEMPO REAL - SERVITECH
 * Gestiona todas las operaciones de mensajería y conversaciones
 * Fecha: 6 de julio de 2025
 */

const { Conversacion, Mensaje } = require("../models/mensajeria");
const { Usuario } = require("../models/models");

class MensajeriaController {
  // 📋 Listar conversaciones de un usuario
  static async listarConversaciones(req, res) {
    try {
      const { usuario } = req.user || { usuario: req.params.usuarioId }; // En producción usar JWT
      const { tipo, estado, limite = 20, pagina = 1 } = req.query;

      const filtros = {};
      if (tipo) filtros.tipo = tipo;
      if (estado) filtros.estado = estado;

      const conversaciones = await Conversacion.porUsuario(usuario, filtros)
        .limit(parseInt(limite))
        .skip((parseInt(pagina) - 1) * parseInt(limite));

      // Calcular mensajes no leídos totales
      const totalNoLeidos = conversaciones.reduce((total, conv) => {
        return total + conv.getMensajesNoLeidos(usuario);
      }, 0);

      res.json({
        success: true,
        conversaciones,
        paginacion: {
          paginaActual: parseInt(pagina),
          limite: parseInt(limite),
          total: conversaciones.length,
        },
        estadisticas: {
          totalNoLeidos,
          conversacionesActivas: conversaciones.filter(
            (c) => c.estado === "activa"
          ).length,
        },
      });
    } catch (error) {
      console.error("Error al listar conversaciones:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 🆕 Crear nueva conversación
  static async crearConversacion(req, res) {
    try {
      const {
        participantes,
        tipo = "individual",
        titulo,
        asesoriaId,
      } = req.body;
      const { usuario } = req.user || { usuario: req.body.creadorId }; // En producción usar JWT

      // Validar participantes
      if (!participantes || participantes.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Se requieren al menos 2 participantes",
        });
      }

      // Verificar que todos los participantes existan
      const usuariosValidos = await Usuario.find({
        _id: { $in: participantes.map((p) => p.usuarioId) },
      });

      if (usuariosValidos.length !== participantes.length) {
        return res.status(400).json({
          success: false,
          message: "Algunos participantes no existen",
        });
      }

      // Crear conversación
      let conversacion;

      if (tipo === "individual" && participantes.length === 2) {
        // Para conversaciones individuales, verificar si ya existe
        const [usuario1, usuario2] = participantes.map((p) => p.usuarioId);
        conversacion = await Conversacion.crearConversacion(
          usuario1,
          usuario2,
          tipo,
          asesoriaId
        );
      } else {
        // Para conversaciones grupales, crear nueva
        conversacion = new Conversacion({
          participantes: participantes.map((p) => ({
            usuario: p.usuarioId,
            rol: p.rol || "cliente",
          })),
          tipo,
          titulo,
          asesoria: asesoriaId,
          estadisticas: {
            mensajesNoLeidos: participantes.map((p) => ({
              usuario: p.usuarioId,
              cantidad: 0,
            })),
          },
        });

        await conversacion.save();
      }

      // Poblar datos para respuesta
      await conversacion.populate(
        "participantes.usuario",
        "nombre apellido avatar_url es_experto"
      );
      if (asesoriaId) {
        await conversacion.populate("asesoria", "titulo fechaHora estado");
      }

      res.status(201).json({
        success: true,
        conversacion,
        message: "Conversación creada exitosamente",
      });
    } catch (error) {
      console.error("Error al crear conversación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 🔍 Obtener conversación específica
  static async obtenerConversacion(req, res) {
    try {
      const { conversacionId } = req.params;
      const { usuario } = req.user || { usuario: req.query.usuarioId }; // En producción usar JWT

      const conversacion = await Conversacion.findById(conversacionId)
        .populate(
          "participantes.usuario",
          "nombre apellido avatar_url es_experto"
        )
        .populate("asesoria", "titulo fechaHora estado");

      if (!conversacion) {
        return res.status(404).json({
          success: false,
          message: "Conversación no encontrada",
        });
      }

      // Verificar que el usuario sea participante
      if (!conversacion.esParticipante(usuario)) {
        return res.status(403).json({
          success: false,
          message: "No tienes acceso a esta conversación",
        });
      }

      res.json({
        success: true,
        conversacion,
        mensajesNoLeidos: conversacion.getMensajesNoLeidos(usuario),
      });
    } catch (error) {
      console.error("Error al obtener conversación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 💬 Listar mensajes de una conversación
  static async listarMensajes(req, res) {
    try {
      const { conversacionId } = req.params;
      const { limite = 50, pagina = 1, desde } = req.query;
      const { usuario } = req.user || { usuario: req.query.usuarioId }; // En producción usar JWT

      // Verificar acceso a la conversación
      const conversacion = await Conversacion.findById(conversacionId);
      if (!conversacion || !conversacion.esParticipante(usuario)) {
        return res.status(403).json({
          success: false,
          message: "No tienes acceso a esta conversación",
        });
      }

      // Construir filtros
      const filtros = {
        conversacion: conversacionId,
        "eliminado.eliminado": false,
      };

      if (desde) {
        filtros.fechaEnvio = { $gte: new Date(desde) };
      }

      // Obtener mensajes
      const mensajes = await Mensaje.find(filtros)
        .populate("remitente", "nombre apellido avatar_url")
        .populate("respuestaA", "contenido.texto remitente")
        .populate("reacciones.usuario", "nombre apellido")
        .sort({ fechaEnvio: -1 })
        .limit(parseInt(limite))
        .skip((parseInt(pagina) - 1) * parseInt(limite));

      // Marcar mensajes como entregados para este usuario
      await Mensaje.updateMany(
        {
          conversacion: conversacionId,
          remitente: { $ne: usuario },
          estado: "enviado",
        },
        {
          $set: {
            estado: "entregado",
            fechaEntrega: new Date(),
          },
        }
      );

      res.json({
        success: true,
        mensajes: mensajes.reverse(), // Más antiguos primero
        paginacion: {
          paginaActual: parseInt(pagina),
          limite: parseInt(limite),
          total: mensajes.length,
        },
      });
    } catch (error) {
      console.error("Error al listar mensajes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 📤 Enviar mensaje
  static async enviarMensaje(req, res) {
    try {
      const { conversacionId } = req.params;
      let {
        contenido,
        tipo = "texto",
        respuestaA,
        prioridad = "normal",
      } = req.body;
      const { usuario } = req.user || { usuario: req.body.remitenteId }; // En producción usar JWT

      // Si viene como string (por FormData), parsear contenido
      if (typeof contenido === "string") {
        try {
          contenido = JSON.parse(contenido);
        } catch (e) {
          contenido = { texto: contenido };
        }
      }

      // Verificar conversación y permisos
      const conversacion = await Conversacion.findById(conversacionId);
      if (!conversacion) {
        return res.status(404).json({
          success: false,
          message: "Conversación no encontrada",
        });
      }

      if (!conversacion.esParticipante(usuario)) {
        return res.status(403).json({
          success: false,
          message: "No tienes acceso a esta conversación",
        });
      }

      // Verificar permisos de envío
      const participante = conversacion.participantes.find(
        (p) => p.usuario.toString() === usuario.toString()
      );

      if (!participante.permisos.puedeEnviar) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para enviar mensajes",
        });
      }

      // Procesar archivo adjunto si existe
      let archivoAdjunto = null;
      if (req.file) {
        archivoAdjunto = {
          url: `/uploads/mensajeria/${req.file.filename}`,
          nombre: req.file.originalname,
          tipo: req.file.mimetype,
          tamano: req.file.size,
        };
      }

      // Validar contenido
      if (!contenido || (!contenido.texto && !archivoAdjunto)) {
        return res.status(400).json({
          success: false,
          message: "El mensaje debe tener contenido o archivo adjunto",
        });
      }

      // Crear mensaje
      const nuevoMensaje = new Mensaje({
        conversacion: conversacionId,
        remitente: usuario,
        contenido: {
          texto: contenido.texto,
          tipo: archivoAdjunto ? "archivo" : tipo,
          archivo: archivoAdjunto,
          metadatos: contenido.metadatos,
        },
        respuestaA: respuestaA,
        prioridad: prioridad,
        estado: "enviado",
        socketInfo: {
          socketId: req.body.socketId,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent"),
        },
      });

      await nuevoMensaje.save();

      // Poblar datos para respuesta
      await nuevoMensaje.populate("remitente", "nombre apellido avatar_url");
      if (respuestaA) {
        await nuevoMensaje.populate("respuestaA", "contenido.texto remitente");
      }

      res.status(201).json({
        success: true,
        mensaje: nuevoMensaje,
        message: "Mensaje enviado exitosamente",
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 👁️ Marcar mensajes como leídos
  static async marcarComoLeido(req, res) {
    try {
      const { conversacionId, mensajeId } = req.params;
      const { usuario } = req.user || { usuario: req.body.usuarioId }; // En producción usar JWT

      if (mensajeId) {
        // Marcar mensaje específico
        const mensaje = await Mensaje.findById(mensajeId);
        if (!mensaje) {
          return res.status(404).json({
            success: false,
            message: "Mensaje no encontrado",
          });
        }

        await mensaje.marcarComoLeido(usuario);

        res.json({
          success: true,
          message: "Mensaje marcado como leído",
        });
      } else {
        // Marcar todos los mensajes de la conversación
        const conversacion = await Conversacion.findById(conversacionId);
        if (!conversacion) {
          return res.status(404).json({
            success: false,
            message: "Conversación no encontrada",
          });
        }

        await conversacion.marcarTodosComoLeidos(usuario);

        res.json({
          success: true,
          message: "Todos los mensajes marcados como leídos",
        });
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // ✏️ Editar mensaje
  static async editarMensaje(req, res) {
    try {
      const { mensajeId } = req.params;
      const { nuevoContenido } = req.body;
      const { usuario } = req.user || { usuario: req.body.usuarioId }; // En producción usar JWT

      const mensaje = await Mensaje.findById(mensajeId);
      if (!mensaje) {
        return res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
      }

      // Verificar que el usuario sea el remitente
      if (mensaje.remitente.toString() !== usuario.toString()) {
        return res.status(403).json({
          success: false,
          message: "Solo puedes editar tus propios mensajes",
        });
      }

      // Verificar que el mensaje no sea muy antiguo (15 minutos)
      const tiempoLimite = 15 * 60 * 1000; // 15 minutos en ms
      if (Date.now() - mensaje.fechaEnvio.getTime() > tiempoLimite) {
        return res.status(400).json({
          success: false,
          message: "No puedes editar mensajes después de 15 minutos",
        });
      }

      await mensaje.editarMensaje(nuevoContenido);

      res.json({
        success: true,
        mensaje,
        message: "Mensaje editado exitosamente",
      });
    } catch (error) {
      console.error("Error al editar mensaje:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // ⭐ Agregar reacción a mensaje
  static async agregarReaccion(req, res) {
    try {
      const { mensajeId } = req.params;
      const { tipo } = req.body;
      const { usuario } = req.user || { usuario: req.body.usuarioId }; // En producción usar JWT

      const mensaje = await Mensaje.findById(mensajeId);
      if (!mensaje) {
        return res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
      }

      await mensaje.agregarReaccion(usuario, tipo);

      res.json({
        success: true,
        reacciones: mensaje.reacciones,
        message: "Reacción agregada exitosamente",
      });
    } catch (error) {
      console.error("Error al agregar reacción:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 🗑️ Eliminar mensaje
  static async eliminarMensaje(req, res) {
    try {
      const { mensajeId } = req.params;
      const { razon } = req.body;
      const { usuario } = req.user || { usuario: req.body.usuarioId }; // En producción usar JWT

      const mensaje = await Mensaje.findById(mensajeId);
      if (!mensaje) {
        return res.status(404).json({
          success: false,
          message: "Mensaje no encontrado",
        });
      }

      // Verificar permisos
      const conversacion = await Conversacion.findById(mensaje.conversacion);
      const participante = conversacion.participantes.find(
        (p) => p.usuario.toString() === usuario.toString()
      );

      const puedeEliminar =
        mensaje.remitente.toString() === usuario.toString() ||
        participante.permisos.puedeModerar;

      if (!puedeEliminar) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar este mensaje",
        });
      }

      await mensaje.eliminarMensaje(usuario, razon);

      res.json({
        success: true,
        message: "Mensaje eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 📊 Obtener estadísticas de mensajería
  static async obtenerEstadisticas(req, res) {
    try {
      const { usuario } = req.user || { usuario: req.query.usuarioId }; // En producción usar JWT

      // Estadísticas del usuario
      const conversacionesUsuario = await Conversacion.find({
        "participantes.usuario": usuario,
        "participantes.activo": true,
      });

      const totalConversaciones = conversacionesUsuario.length;
      const conversacionesActivas = conversacionesUsuario.filter(
        (c) => c.estado === "activa"
      ).length;

      const totalMensajesNoLeidos = conversacionesUsuario.reduce(
        (total, conv) => {
          return total + conv.getMensajesNoLeidos(usuario);
        },
        0
      );

      // Estadísticas globales (solo para admins)
      let estadisticasGlobales = null;
      // En producción, verificar rol de admin
      if (req.query.incluirGlobales === "true") {
        estadisticasGlobales = await Conversacion.estadisticasGlobales();
      }

      res.json({
        success: true,
        estadisticasUsuario: {
          totalConversaciones,
          conversacionesActivas,
          totalMensajesNoLeidos,
          ultimaActividad:
            conversacionesUsuario.length > 0
              ? Math.max(
                  ...conversacionesUsuario.map((c) => c.fechaUltimaActividad)
                )
              : null,
        },
        estadisticasGlobales,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }

  // 👥 Gestionar participantes de conversación
  static async gestionarParticipantes(req, res) {
    try {
      const { conversacionId } = req.params;
      const { accion, usuarioId, rol } = req.body; // accion: 'agregar' | 'remover'
      const { usuario } = req.user || { usuario: req.body.adminId }; // En producción usar JWT

      const conversacion = await Conversacion.findById(conversacionId);
      if (!conversacion) {
        return res.status(404).json({
          success: false,
          message: "Conversación no encontrada",
        });
      }

      // Verificar permisos de moderación
      const participante = conversacion.participantes.find(
        (p) => p.usuario.toString() === usuario.toString()
      );

      if (!participante || !participante.permisos.puedeModerar) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para gestionar participantes",
        });
      }

      if (accion === "agregar") {
        await conversacion.agregarParticipante(usuarioId, rol);
        res.json({
          success: true,
          message: "Participante agregado exitosamente",
        });
      } else if (accion === "remover") {
        await conversacion.removerParticipante(usuarioId);
        res.json({
          success: true,
          message: "Participante removido exitosamente",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Acción no válida",
        });
      }
    } catch (error) {
      console.error("Error al gestionar participantes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error.message,
      });
    }
  }
}

module.exports = MensajeriaController;
