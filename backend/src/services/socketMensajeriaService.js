/**
 * 🚀 SERVICIO DE SOCKET.IO PARA MENSAJERÍA EN TIEMPO REAL - SERVITECH
 * Gestiona todas las conexiones y eventos de Socket.IO
 * Fecha: 6 de julio de 2025
 */

const { Server } = require('socket.io');
const { Conversacion, Mensaje } = require('../models/mensajeria');

class SocketMensajeriaService {
  constructor() {
    this.io = null;
    this.usuarios_conectados = new Map(); // Map de socketId -> userId
    this.salas_conversaciones = new Map(); // Map de conversacionId -> Set de socketIds
  }

  // 🚀 Inicializar Socket.IO
  inicializar(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // En producción, especificar dominios permitidos
        methods: ["GET", "POST"]
      }
    });

    this.configurarEventos();
    console.log('✅ Socket.IO para mensajería inicializado');
  }

  // ⚙️ Configurar todos los eventos de Socket.IO
  configurarEventos() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Usuario conectado: ${socket.id}`);

      // 🔐 Autenticación del usuario
      socket.on('autenticar', async (data) => {
        try {
          const { usuarioId, token } = data;
          
          // En producción, validar JWT token aquí
          // Por ahora, solo validar que el usuario existe
          if (!usuarioId) {
            socket.emit('error', { message: 'Usuario requerido' });
            return;
          }

          // Registrar usuario conectado
          this.usuarios_conectados.set(socket.id, usuarioId);
          socket.usuarioId = usuarioId;

          // Unir a salas de conversaciones del usuario
          await this.unirUsuarioASusConversaciones(socket, usuarioId);

          // Notificar estado de conexión
          this.notificarEstadoConexion(usuarioId, true);

          socket.emit('autenticado', { 
            success: true, 
            usuarioId,
            timestamp: new Date().toISOString()
          });

          console.log(`✅ Usuario autenticado: ${usuarioId} (${socket.id})`);

        } catch (error) {
          console.error('Error en autenticación:', error);
          socket.emit('error', { message: 'Error de autenticación' });
        }
      });

      // 💬 Unirse a una conversación específica
      socket.on('unirse_conversacion', async (data) => {
        try {
          const { conversacionId } = data;
          const usuarioId = socket.usuarioId;

          if (!usuarioId) {
            socket.emit('error', { message: 'Usuario no autenticado' });
            return;
          }

          // Verificar que el usuario sea participante
          const conversacion = await Conversacion.findById(conversacionId);
          if (!conversacion || !conversacion.esParticipante(usuarioId)) {
            socket.emit('error', { message: 'No tienes acceso a esta conversación' });
            return;
          }

          // Unir a la sala
          socket.join(`conversacion_${conversacionId}`);
          
          // Registrar en el mapa de salas
          if (!this.salas_conversaciones.has(conversacionId)) {
            this.salas_conversaciones.set(conversacionId, new Set());
          }
          this.salas_conversaciones.get(conversacionId).add(socket.id);

          // Actualizar estado de conexión en la conversación
          await conversacion.actualizarEstadoConexion(usuarioId, true);

          // Notificar a otros participantes
          socket.to(`conversacion_${conversacionId}`).emit('usuario_conectado', {
            usuarioId,
            conversacionId,
            timestamp: new Date().toISOString()
          });

          socket.emit('unido_conversacion', { 
            conversacionId,
            participantes_conectados: await this.obtenerParticipantesConectados(conversacionId)
          });

          console.log(`👥 Usuario ${usuarioId} se unió a conversación ${conversacionId}`);

        } catch (error) {
          console.error('Error al unirse a conversación:', error);
          socket.emit('error', { message: 'Error al unirse a la conversación' });
        }
      });

      // 📤 Enviar mensaje en tiempo real
      socket.on('enviar_mensaje', async (data) => {
        try {
          const { conversacionId, contenido, tipo = 'texto', respuestaA, prioridad = 'normal' } = data;
          const usuarioId = socket.usuarioId;

          if (!usuarioId) {
            socket.emit('error', { message: 'Usuario no autenticado' });
            return;
          }

          // Verificar conversación y permisos
          const conversacion = await Conversacion.findById(conversacionId);
          if (!conversacion || !conversacion.esParticipante(usuarioId)) {
            socket.emit('error', { message: 'No tienes acceso a esta conversación' });
            return;
          }

          // Crear el mensaje
          const nuevoMensaje = new Mensaje({
            conversacion: conversacionId,
            remitente: usuarioId,
            contenido: {
              texto: contenido.texto,
              tipo: tipo,
              archivo: contenido.archivo,
              metadatos: contenido.metadatos
            },
            respuestaA: respuestaA,
            prioridad: prioridad,
            estado: 'enviado',
            socketInfo: {
              socketId: socket.id,
              ipAddress: socket.handshake.address,
              userAgent: socket.handshake.headers['user-agent']
            }
          });

          await nuevoMensaje.save();

          // Poblar datos para envío
          await nuevoMensaje.populate('remitente', 'nombre apellido avatar_url');
          if (respuestaA) {
            await nuevoMensaje.populate('respuestaA', 'contenido.texto remitente');
          }

          // Emitir a todos los participantes de la conversación
          this.io.to(`conversacion_${conversacionId}`).emit('nuevo_mensaje', {
            mensaje: nuevoMensaje,
            conversacionId,
            timestamp: new Date().toISOString()
          });

          // Notificar entrega al remitente
          socket.emit('mensaje_enviado', {
            mensajeId: nuevoMensaje._id,
            estado: 'enviado',
            timestamp: nuevoMensaje.fechaEnvio
          });

          // Actualizar estado del mensaje a entregado para otros usuarios
          setTimeout(async () => {
            await Mensaje.findByIdAndUpdate(nuevoMensaje._id, {
              estado: 'entregado',
              fechaEntrega: new Date()
            });

            socket.emit('mensaje_actualizado', {
              mensajeId: nuevoMensaje._id,
              estado: 'entregado'
            });
          }, 100);

          console.log(`📨 Mensaje enviado en conversación ${conversacionId} por ${usuarioId}`);

        } catch (error) {
          console.error('Error al enviar mensaje:', error);
          socket.emit('error', { message: 'Error al enviar mensaje' });
        }
      });

      // 👁️ Marcar mensaje como leído
      socket.on('marcar_leido', async (data) => {
        try {
          const { mensajeId, conversacionId } = data;
          const usuarioId = socket.usuarioId;

          if (!usuarioId) {
            socket.emit('error', { message: 'Usuario no autenticado' });
            return;
          }

          if (mensajeId) {
            // Marcar mensaje específico
            const mensaje = await Mensaje.findById(mensajeId);
            if (mensaje) {
              await mensaje.marcarComoLeido(usuarioId);
              
              // Notificar al remitente del mensaje
              this.io.to(`conversacion_${conversacionId}`).emit('mensaje_leido', {
                mensajeId,
                leidoPor: usuarioId,
                timestamp: new Date().toISOString()
              });
            }
          } else if (conversacionId) {
            // Marcar todos los mensajes de la conversación
            const conversacion = await Conversacion.findById(conversacionId);
            if (conversacion) {
              await conversacion.marcarTodosComoLeidos(usuarioId);
              
              socket.to(`conversacion_${conversacionId}`).emit('todos_mensajes_leidos', {
                conversacionId,
                leidoPor: usuarioId,
                timestamp: new Date().toISOString()
              });
            }
          }

        } catch (error) {
          console.error('Error al marcar como leído:', error);
          socket.emit('error', { message: 'Error al marcar como leído' });
        }
      });

      // ✏️ Usuario escribiendo (typing indicator)
      socket.on('escribiendo', (data) => {
        const { conversacionId, escribiendo } = data;
        const usuarioId = socket.usuarioId;

        if (usuarioId && conversacionId) {
          socket.to(`conversacion_${conversacionId}`).emit('usuario_escribiendo', {
            usuarioId,
            conversacionId,
            escribiendo,
            timestamp: new Date().toISOString()
          });
        }
      });

      // ⭐ Agregar reacción en tiempo real
      socket.on('agregar_reaccion', async (data) => {
        try {
          const { mensajeId, tipo } = data;
          const usuarioId = socket.usuarioId;

          if (!usuarioId) {
            socket.emit('error', { message: 'Usuario no autenticado' });
            return;
          }

          const mensaje = await Mensaje.findById(mensajeId);
          if (mensaje) {
            await mensaje.agregarReaccion(usuarioId, tipo);
            
            // Emitir a la conversación
            this.io.to(`conversacion_${mensaje.conversacion}`).emit('reaccion_agregada', {
              mensajeId,
              reacciones: mensaje.reacciones,
              timestamp: new Date().toISOString()
            });
          }

        } catch (error) {
          console.error('Error al agregar reacción:', error);
          socket.emit('error', { message: 'Error al agregar reacción' });
        }
      });

      // 🔄 Salir de conversación
      socket.on('salir_conversacion', async (data) => {
        try {
          const { conversacionId } = data;
          const usuarioId = socket.usuarioId;

          if (conversacionId && usuarioId) {
            socket.leave(`conversacion_${conversacionId}`);
            
            // Remover del mapa de salas
            if (this.salas_conversaciones.has(conversacionId)) {
              this.salas_conversaciones.get(conversacionId).delete(socket.id);
            }

            // Actualizar estado de conexión
            const conversacion = await Conversacion.findById(conversacionId);
            if (conversacion) {
              await conversacion.actualizarEstadoConexion(usuarioId, false);
            }

            // Notificar a otros participantes
            socket.to(`conversacion_${conversacionId}`).emit('usuario_desconectado', {
              usuarioId,
              conversacionId,
              timestamp: new Date().toISOString()
            });

            console.log(`👋 Usuario ${usuarioId} salió de conversación ${conversacionId}`);
          }

        } catch (error) {
          console.error('Error al salir de conversación:', error);
        }
      });

      // 🔌 Desconexión del usuario
      socket.on('disconnect', async () => {
        try {
          const usuarioId = this.usuarios_conectados.get(socket.id);
          
          if (usuarioId) {
            // Notificar estado de desconexión
            this.notificarEstadoConexion(usuarioId, false);
            
            // Limpiar del mapa de usuarios conectados
            this.usuarios_conectados.delete(socket.id);
            
            // Limpiar de todas las salas
            for (const [conversacionId, sockets] of this.salas_conversaciones.entries()) {
              if (sockets.has(socket.id)) {
                sockets.delete(socket.id);
                
                // Actualizar estado de conexión en conversación
                const conversacion = await Conversacion.findById(conversacionId);
                if (conversacion) {
                  await conversacion.actualizarEstadoConexion(usuarioId, false);
                }
                
                // Notificar a otros participantes
                socket.to(`conversacion_${conversacionId}`).emit('usuario_desconectado', {
                  usuarioId,
                  conversacionId,
                  timestamp: new Date().toISOString()
                });
              }
            }

            console.log(`🔌 Usuario desconectado: ${usuarioId} (${socket.id})`);
          }

        } catch (error) {
          console.error('Error en desconexión:', error);
        }
      });

      // 🔧 Ping/Pong para mantener conexión
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  // 👥 Unir usuario a todas sus conversaciones
  async unirUsuarioASusConversaciones(socket, usuarioId) {
    try {
      const conversaciones = await Conversacion.find({
        'participantes.usuario': usuarioId,
        'participantes.activo': true,
        activa: true
      });

      for (const conversacion of conversaciones) {
        const salaId = `conversacion_${conversacion._id}`;
        socket.join(salaId);
        
        // Registrar en el mapa
        if (!this.salas_conversaciones.has(conversacion._id.toString())) {
          this.salas_conversaciones.set(conversacion._id.toString(), new Set());
        }
        this.salas_conversaciones.get(conversacion._id.toString()).add(socket.id);

        // Actualizar estado de conexión
        await conversacion.actualizarEstadoConexion(usuarioId, true);
      }

      console.log(`👥 Usuario ${usuarioId} unido a ${conversaciones.length} conversaciones`);

    } catch (error) {
      console.error('Error al unir a conversaciones:', error);
    }
  }

  // 📡 Notificar cambio de estado de conexión
  notificarEstadoConexion(usuarioId, conectado) {
    this.io.emit('estado_usuario_cambiado', {
      usuarioId,
      conectado,
      timestamp: new Date().toISOString()
    });
  }

  // 👥 Obtener participantes conectados en una conversación
  async obtenerParticipantesConectados(conversacionId) {
    try {
      const sockets = this.salas_conversaciones.get(conversacionId) || new Set();
      const participantesConectados = new Set();

      for (const socketId of sockets) {
        const usuarioId = this.usuarios_conectados.get(socketId);
        if (usuarioId) {
          participantesConectados.add(usuarioId);
        }
      }

      return Array.from(participantesConectados);

    } catch (error) {
      console.error('Error al obtener participantes conectados:', error);
      return [];
    }
  }

  // 📤 Enviar notificación push a usuario específico
  enviarNotificacionAUsuario(usuarioId, notificacion) {
    // Buscar todos los sockets del usuario
    const socketsUsuario = [];
    for (const [socketId, userId] of this.usuarios_conectados.entries()) {
      if (userId === usuarioId) {
        socketsUsuario.push(socketId);
      }
    }

    // Enviar notificación a todos los dispositivos del usuario
    socketsUsuario.forEach(socketId => {
      this.io.to(socketId).emit('notificacion', {
        ...notificacion,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`🔔 Notificación enviada a usuario ${usuarioId} (${socketsUsuario.length} dispositivos)`);
  }

  // 📊 Obtener estadísticas en tiempo real
  obtenerEstadisticas() {
    return {
      usuariosConectados: this.usuarios_conectados.size,
      conversacionesActivas: this.salas_conversaciones.size,
      totalSockets: this.io.engine.clientsCount,
      timestamp: new Date().toISOString()
    };
  }

  // 🚀 Obtener instancia de Socket.IO
  getIO() {
    return this.io;
  }
}

// Exportar instancia singleton
const socketMensajeriaService = new SocketMensajeriaService();
module.exports = socketMensajeriaService;
