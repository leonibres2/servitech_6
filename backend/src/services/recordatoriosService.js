/**
 * ⏰ SISTEMA DE RECORDATORIOS - SERVITECH
 * Gestiona recordatorios automáticos para asesorías
 * Fecha: 6 de julio de 2025
 */

const cron = require('node-cron');
const { Asesoria, Notificacion, ConfiguracionSistema } = require('../models/models');

class SistemaRecordatorios {
  constructor() {
    this.tareas = new Map();
    this.inicializado = false;
  }

  /**
   * 🚀 Inicializar sistema de recordatorios
   */
  async inicializar() {
    if (this.inicializado) {
      console.log('⚠️ Sistema de recordatorios ya inicializado');
      return;
    }

    console.log('🚀 Iniciando sistema de recordatorios...');

    try {
      // Programar tarea cada 5 minutos para procesar notificaciones pendientes
      this.tareas.set('procesarNotificaciones', cron.schedule('*/5 * * * *', async () => {
        await this.procesarNotificacionesPendientes();
      }, { scheduled: false }));

      // Programar tarea cada hora para verificar asesorías próximas
      this.tareas.set('verificarProximas', cron.schedule('0 * * * *', async () => {
        await this.verificarAsesoriaProximas();
      }, { scheduled: false }));

      // Programar tarea diaria para limpiar notificaciones antiguas
      this.tareas.set('limpiezaDiaria', cron.schedule('0 2 * * *', async () => {
        await this.limpiarNotificacionesAntiguas();
      }, { scheduled: false }));

      // Iniciar todas las tareas
      this.tareas.forEach(tarea => tarea.start());

      this.inicializado = true;
      console.log('✅ Sistema de recordatorios inicializado correctamente');

    } catch (error) {
      console.error('❌ Error inicializando sistema de recordatorios:', error);
    }
  }

  /**
   * 🛑 Detener sistema de recordatorios
   */
  detener() {
    console.log('🛑 Deteniendo sistema de recordatorios...');
    
    this.tareas.forEach((tarea, nombre) => {
      tarea.stop();
      console.log(`📅 Tarea ${nombre} detenida`);
    });

    this.inicializado = false;
    console.log('✅ Sistema de recordatorios detenido');
  }

  /**
   * 📬 Procesar notificaciones programadas pendientes
   */
  async procesarNotificacionesPendientes() {
    try {
      const ahora = new Date();
      
      // Buscar notificaciones programadas que deben enviarse
      const notificacionesPendientes = await Notificacion.find({
        'programada.esProgramada': true,
        'programada.enviada': false,
        'programada.fechaEnvio': { $lte: ahora }
      }).populate('usuario', 'nombre apellido email');

      console.log(`📬 Procesando ${notificacionesPendientes.length} notificaciones pendientes`);

      for (const notificacion of notificacionesPendientes) {
        try {
          await this.enviarNotificacion(notificacion);
          
          // Marcar como enviada
          notificacion.programada.enviada = true;
          notificacion.estado = 'enviada';
          await notificacion.save();

        } catch (error) {
          console.error(`❌ Error enviando notificación ${notificacion._id}:`, error);
        }
      }

    } catch (error) {
      console.error('❌ Error procesando notificaciones pendientes:', error);
    }
  }

  /**
   * 🔍 Verificar asesorías próximas y crear recordatorios
   */
  async verificarAsesoriaProximas() {
    try {
      const configuracionRecordatorio = await ConfiguracionSistema.findOne({
        clave: 'notificaciones.recordatorio_default'
      });

      const minutosRecordatorio = configuracionRecordatorio ? configuracionRecordatorio.valor : 30;
      
      // Calcular ventana de tiempo para recordatorios
      const ahora = new Date();
      const tiempoLimite = new Date(ahora.getTime() + (minutosRecordatorio * 60 * 1000));

      // Buscar asesorías que necesitan recordatorio
      const asesoriasPorRecordar = await Asesoria.find({
        estado: 'confirmada',
        fechaHora: {
          $gte: ahora,
          $lte: tiempoLimite
        },
        'recordatorios.clienteNotificado': false
      }).populate('cliente experto', 'nombre apellido email');

      console.log(`⏰ Encontradas ${asesoriasPorRecordar.length} asesorías para recordar`);

      for (const asesoria of asesoriasPorRecordar) {
        try {
          await this.crearRecordatoriosAsesoria(asesoria, minutosRecordatorio);
          
          // Marcar como notificado
          asesoria.recordatorios.clienteNotificado = true;
          asesoria.recordatorios.expertoNotificado = true;
          asesoria.recordatorios.ultimoRecordatorio = new Date();
          await asesoria.save();

        } catch (error) {
          console.error(`❌ Error creando recordatorios para asesoría ${asesoria._id}:`, error);
        }
      }

      // Verificar asesorías que deberían haber iniciado
      await this.verificarAsesoriasSinIniciar();

    } catch (error) {
      console.error('❌ Error verificando asesorías próximas:', error);
    }
  }

  /**
   * 📱 Crear recordatorios para una asesoría específica
   */
  async crearRecordatoriosAsesoria(asesoria, minutosAntes) {
    const tiempoRestante = Math.round((asesoria.fechaHora.getTime() - Date.now()) / (1000 * 60));

    // Recordatorio para el cliente
    await Notificacion.crear({
      usuario: asesoria.cliente._id,
      tipo: 'recordatorio',
      categoria: 'warning',
      titulo: '⏰ Recordatorio de asesoría',
      mensaje: `Tu asesoría con ${asesoria.experto.nombre} ${asesoria.experto.apellido} está programada para dentro de ${tiempoRestante} minutos.`,
      descripcionCorta: `Asesoría en ${tiempoRestante} minutos`,
      icono: 'clock',
      color: '#ffc107',
      canales: {
        inApp: { enviado: true },
        email: { enviar: true },
        push: { enviar: true }
      },
      acciones: [{
        etiqueta: 'Ver Asesoría',
        tipo: 'route',
        valor: `/asesorias/${asesoria._id}`,
        estilo: 'primary'
      }, {
        etiqueta: 'Unirse Ahora',
        tipo: 'url',
        valor: asesoria.videollamada.enlaceCliente,
        estilo: 'success'
      }],
      referencia: {
        modelo: 'Asesoria',
        id: asesoria._id
      }
    });

    // Recordatorio para el experto
    await Notificacion.crear({
      usuario: asesoria.experto._id,
      tipo: 'recordatorio',
      categoria: 'warning',
      titulo: '⏰ Recordatorio de asesoría',
      mensaje: `Tu asesoría con ${asesoria.cliente.nombre} ${asesoria.cliente.apellido} está programada para dentro de ${tiempoRestante} minutos.`,
      descripcionCorta: `Asesoría en ${tiempoRestante} minutos`,
      icono: 'clock',
      color: '#ffc107',
      canales: {
        inApp: { enviado: true },
        email: { enviar: true },
        push: { enviar: true }
      },
      acciones: [{
        etiqueta: 'Ver Asesoría',
        tipo: 'route',
        valor: `/asesorias/${asesoria._id}`,
        estilo: 'primary'
      }, {
        etiqueta: 'Unirse Ahora',
        tipo: 'url',
        valor: asesoria.videollamada.enlaceExperto,
        estilo: 'success'
      }],
      referencia: {
        modelo: 'Asesoria',
        id: asesoria._id
      }
    });

    console.log(`✅ Recordatorios creados para asesoría ${asesoria.codigoAsesoria}`);
  }

  /**
   * 🔍 Verificar asesorías que no han iniciado a tiempo
   */
  async verificarAsesoriasSinIniciar() {
    try {
      const ahora = new Date();
      const tiempoGracia = 15 * 60 * 1000; // 15 minutos de gracia
      const tiempoLimite = new Date(ahora.getTime() - tiempoGracia);

      const asesoriasSinIniciar = await Asesoria.find({
        estado: 'confirmada',
        fechaHora: { $lte: tiempoLimite }
      }).populate('cliente experto', 'nombre apellido email');

      for (const asesoria of asesoriasSinIniciar) {
        // Marcar como no-show y notificar
        asesoria.estado = 'no-show-cliente';
        await asesoria.save();

        // Notificar al experto
        await Notificacion.crear({
          usuario: asesoria.experto._id,
          tipo: 'asesoria',
          categoria: 'warning',
          titulo: 'Cliente no se presentó',
          mensaje: `El cliente ${asesoria.cliente.nombre} no se presentó a la asesoría programada.`,
          referencia: {
            modelo: 'Asesoria',
            id: asesoria._id
          }
        });

        console.log(`⚠️ Asesoría ${asesoria.codigoAsesoria} marcada como no-show`);
      }

    } catch (error) {
      console.error('❌ Error verificando asesorías sin iniciar:', error);
    }
  }

  /**
   * 📧 Enviar notificación (placeholder para integración real)
   */
  async enviarNotificacion(notificacion) {
    // Aquí se integrarían los servicios reales de email, SMS, push, etc.
    console.log(`📧 Enviando notificación: ${notificacion.titulo} a ${notificacion.usuario.nombre}`);

    // Simular envío de email
    if (notificacion.canales.email.enviar) {
      console.log(`📨 Email enviado a ${notificacion.usuario.email}`);
      notificacion.canales.email.enviado = true;
      notificacion.canales.email.fechaEnvio = new Date();
    }

    // Simular envío de push
    if (notificacion.canales.push.enviar) {
      console.log(`📱 Push notification enviada`);
      notificacion.canales.push.enviado = true;
      notificacion.canales.push.fechaEnvio = new Date();
    }

    // Marcar como entregada in-app
    notificacion.canales.inApp.enviado = true;
  }

  /**
   * 🧹 Limpiar notificaciones antiguas
   */
  async limpiarNotificacionesAntiguas() {
    try {
      const treintaDiasAtras = new Date();
      treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

      // Eliminar notificaciones antiguas ya leídas
      const resultado = await Notificacion.deleteMany({
        'canales.inApp.leido': true,
        fechaCreacion: { $lte: treintaDiasAtras }
      });

      console.log(`🧹 Limpieza: ${resultado.deletedCount} notificaciones antiguas eliminadas`);

    } catch (error) {
      console.error('❌ Error limpiando notificaciones:', error);
    }
  }

  /**
   * 📊 Obtener estadísticas del sistema
   */
  async obtenerEstadisticas() {
    try {
      const stats = {
        notificacionesPendientes: await Notificacion.countDocuments({
          'programada.esProgramada': true,
          'programada.enviada': false
        }),
        asesoriaProximas: await Asesoria.countDocuments({
          estado: 'confirmada',
          fechaHora: {
            $gte: new Date(),
            $lte: new Date(Date.now() + (24 * 60 * 60 * 1000)) // Próximas 24 horas
          }
        }),
        recordatoriosEnviados: await Notificacion.countDocuments({
          tipo: 'recordatorio',
          fechaCreacion: {
            $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) // Últimas 24 horas
          }
        }),
        sistemaActivo: this.inicializado
      };

      return stats;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
}

// Instancia singleton del sistema
const sistemaRecordatorios = new SistemaRecordatorios();

module.exports = sistemaRecordatorios;
