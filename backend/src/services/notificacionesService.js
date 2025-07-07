/**
 * 🔔 SERVICIO DE NOTIFICACIONES PUSH - SERVITECH
 * Gestiona notificaciones en tiempo real y push notifications
 * Fecha: 6 de julio de 2025
 */

const cron = require('node-cron');
const { Conversacion, Mensaje } = require('../models/mensajeria');
const socketMensajeriaService = require('./socketMensajeriaService');

class NotificacionesService {
  constructor() {
    this.tareas_programadas = new Map();
    this.inicializado = false;
  }

  // 🚀 Inicializar servicio de notificaciones
  async inicializar() {
    if (this.inicializado) {
      console.log('⚠️ Servicio de notificaciones ya está inicializado');
      return;
    }

    try {
      // Programar tareas automáticas
      this.programarTareasAutomaticas();
      
      this.inicializado = true;
      console.log('✅ Servicio de notificaciones inicializado');
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando servicio de notificaciones:', error);
      throw error;
    }
  }

  // ⏰ Programar tareas automáticas
  programarTareasAutomaticas() {
    // 🔔 Procesar notificaciones pendientes cada 2 minutos
    cron.schedule('*/2 * * * *', async () => {
      await this.procesarNotificacionesPendientes();
    });

    // 📊 Generar resumen de actividad cada hora
    cron.schedule('0 * * * *', async () => {
      await this.generarResumenActividad();
    });

    // 🧹 Limpiar notificaciones antiguas cada día a las 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.limpiarNotificacionesAntiguas();
    });

    console.log('⏰ Tareas de notificaciones programadas');
  }

  // 🔔 Procesar notificaciones pendientes
  async procesarNotificacionesPendientes() {
    try {
      // Buscar conversaciones con mensajes no leídos
      const conversacionesConNoLeidos = await Conversacion.find({
        'estadisticas.mensajesNoLeidos.cantidad': { $gt: 0 },
        activa: true
      }).populate('participantes.usuario', 'nombre apellido email');

      for (const conversacion of conversacionesConNoLeidos) {
        for (const participante of conversacion.participantes) {
          const noLeidos = conversacion.getMensajesNoLeidos(participante.usuario._id);
          
          if (noLeidos > 0) {
            // Enviar notificación push
            await this.enviarNotificacionMensajesNoLeidos(
              participante.usuario._id, 
              conversacion, 
              noLeidos
            );
          }
        }
      }

    } catch (error) {
      console.error('Error procesando notificaciones pendientes:', error);
    }
  }

  // 📨 Enviar notificación de mensajes no leídos
  async enviarNotificacionMensajesNoLeidos(usuarioId, conversacion, cantidadNoLeidos) {
    try {
      const notificacion = {
        tipo: 'mensajes_no_leidos',
        titulo: `${cantidadNoLeidos} mensaje${cantidadNoLeidos > 1 ? 's' : ''} sin leer`,
        mensaje: `Tienes mensajes pendientes en "${conversacion.titulo || 'Conversación'}"`,
        datos: {
          conversacionId: conversacion._id,
          cantidadNoLeidos,
          tipoConversacion: conversacion.tipo
        },
        acciones: [
          {
            id: 'leer',
            texto: 'Leer mensajes',
            tipo: 'primary'
          },
          {
            id: 'ignorar',
            texto: 'Ignorar',
            tipo: 'secondary'
          }
        ]
      };

      // Enviar por Socket.IO si está conectado
      socketMensajeriaService.enviarNotificacionAUsuario(usuarioId, notificacion);

      // Aquí se podría integrar con servicios externos como:
      // - Firebase Cloud Messaging (FCM)
      // - Apple Push Notification Service (APNS)
      // - Web Push API
      // - Email notifications
      // - SMS notifications

      console.log(`🔔 Notificación enviada a usuario ${usuarioId}: ${cantidadNoLeidos} mensajes no leídos`);

    } catch (error) {
      console.error('Error enviando notificación de mensajes no leídos:', error);
    }
  }

  // 📢 Enviar notificación de nuevo mensaje
  async enviarNotificacionNuevoMensaje(mensaje, conversacion, destinatarios) {
    try {
      await mensaje.populate('remitente', 'nombre apellido avatar_url');
      
      const notificacion = {
        tipo: 'nuevo_mensaje',
        titulo: `Nuevo mensaje de ${mensaje.remitente.nombre}`,
        mensaje: mensaje.contenido.texto?.substring(0, 100) || '[Archivo adjunto]',
        icono: mensaje.remitente.avatar_url,
        datos: {
          conversacionId: conversacion._id,
          mensajeId: mensaje._id,
          remitenteId: mensaje.remitente._id,
          tipoMensaje: mensaje.contenido.tipo
        },
        acciones: [
          {
            id: 'responder',
            texto: 'Responder',
            tipo: 'primary'
          },
          {
            id: 'marcar_leido',
            texto: 'Marcar como leído',
            tipo: 'secondary'
          }
        ]
      };

      // Enviar a cada destinatario
      for (const destinatarioId of destinatarios) {
        if (destinatarioId.toString() !== mensaje.remitente._id.toString()) {
          socketMensajeriaService.enviarNotificacionAUsuario(destinatarioId, notificacion);
        }
      }

      console.log(`📢 Notificación de nuevo mensaje enviada a ${destinatarios.length} usuarios`);

    } catch (error) {
      console.error('Error enviando notificación de nuevo mensaje:', error);
    }
  }

  // 📊 Generar resumen de actividad
  async generarResumenActividad() {
    try {
      const ahora = new Date();
      const unaHoraAtras = new Date(ahora.getTime() - 60 * 60 * 1000);

      // Estadísticas de la última hora
      const mensajesRecientes = await Mensaje.countDocuments({
        fechaEnvio: { $gte: unaHoraAtras },
        'eliminado.eliminado': false
      });

      const conversacionesActivas = await Conversacion.countDocuments({
        fechaUltimaActividad: { $gte: unaHoraAtras },
        activa: true
      });

      // Obtener usuarios más activos
      const usuariosMasActivos = await Mensaje.aggregate([
        {
          $match: {
            fechaEnvio: { $gte: unaHoraAtras },
            'eliminado.eliminado': false
          }
        },
        {
          $group: {
            _id: '$remitente',
            totalMensajes: { $sum: 1 }
          }
        },
        { $sort: { totalMensajes: -1 } },
        { $limit: 5 }
      ]);

      const resumen = {
        periodo: '1 hora',
        estadisticas: {
          mensajesEnviados: mensajesRecientes,
          conversacionesActivas: conversacionesActivas,
          usuariosMasActivos: usuariosMasActivos.length
        },
        timestamp: ahora.toISOString()
      };

      // Emitir resumen a administradores conectados
      if (socketMensajeriaService.getIO()) {
        socketMensajeriaService.getIO().emit('resumen_actividad', resumen);
      }

      console.log(`📊 Resumen de actividad generado: ${mensajesRecientes} mensajes, ${conversacionesActivas} conversaciones activas`);

    } catch (error) {
      console.error('Error generando resumen de actividad:', error);
    }
  }

  // 🧹 Limpiar notificaciones antiguas
  async limpiarNotificacionesAntiguas() {
    try {
      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

      // Limpiar mensajes eliminados muy antiguos
      const mensajesEliminados = await Mensaje.deleteMany({
        'eliminado.eliminado': true,
        'eliminado.fechaEliminacion': { $lt: treintaDiasAtras }
      });

      // Archivar conversaciones inactivas
      const conversacionesArchivadas = await Conversacion.updateMany(
        {
          fechaUltimaActividad: { $lt: treintaDiasAtras },
          estado: 'activa'
        },
        {
          $set: { 
            estado: 'archivada',
            archivada: true
          }
        }
      );

      console.log(`🧹 Limpieza completada: ${mensajesEliminados.deletedCount} mensajes eliminados, ${conversacionesArchivadas.modifiedCount} conversaciones archivadas`);

    } catch (error) {
      console.error('Error en limpieza de notificaciones:', error);
    }
  }

  // 🔔 Enviar notificación personalizada
  async enviarNotificacionPersonalizada(usuarioId, notificacion) {
    try {
      const notificacionCompleta = {
        ...notificacion,
        timestamp: new Date().toISOString(),
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Enviar por Socket.IO
      socketMensajeriaService.enviarNotificacionAUsuario(usuarioId, notificacionCompleta);

      // Aquí se podrían agregar otros canales de notificación
      // como email, SMS, push notifications móviles, etc.

      console.log(`🔔 Notificación personalizada enviada a usuario ${usuarioId}`);
      return true;

    } catch (error) {
      console.error('Error enviando notificación personalizada:', error);
      return false;
    }
  }

  // 📱 Configurar notificaciones push web
  async configurarWebPush(usuarioId, subscription) {
    try {
      // Aquí se guardaría la suscripción de web push
      // En un modelo de base de datos dedicado
      
      console.log(`📱 Web Push configurado para usuario ${usuarioId}`);
      return true;

    } catch (error) {
      console.error('Error configurando Web Push:', error);
      return false;
    }
  }

  // 📊 Obtener estadísticas de notificaciones
  async obtenerEstadisticas() {
    try {
      const estadisticas = {
        notificacionesActivas: this.tareas_programadas.size,
        servicioActivo: this.inicializado,
        ultimaEjecucion: new Date().toISOString(),
        socket: socketMensajeriaService.obtenerEstadisticas()
      };

      return estadisticas;

    } catch (error) {
      console.error('Error obteniendo estadísticas de notificaciones:', error);
      return null;
    }
  }

  // 🛑 Detener servicio
  async detener() {
    try {
      // Cancelar todas las tareas programadas
      for (const [id, tarea] of this.tareas_programadas.entries()) {
        if (tarea && typeof tarea.destroy === 'function') {
          tarea.destroy();
        }
      }
      
      this.tareas_programadas.clear();
      this.inicializado = false;
      
      console.log('🛑 Servicio de notificaciones detenido');

    } catch (error) {
      console.error('Error deteniendo servicio de notificaciones:', error);
    }
  }
}

// Exportar instancia singleton
const notificacionesService = new NotificacionesService();
module.exports = notificacionesService;
