/**
 * 🔔 MODELO DE NOTIFICACIÓN - SERVITECH
 * Gestiona las notificaciones del sistema
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificacionSchema = new Schema({
  // 🆔 Identificación
  codigoNotificacion: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
  },

  // 👤 Destinatario
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // 📝 Contenido
  titulo: {
    type: String,
    required: true,
    maxlength: 200
  },
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000
  },
  descripcionCorta: {
    type: String,
    maxlength: 100
  },

  // 🎯 Tipo y categoría
  tipo: {
    type: String,
    enum: [
      'asesoria',           // Relacionada con asesorías
      'pago',               // Pagos y transacciones
      'mensaje',            // Nuevos mensajes
      'sistema',            // Actualizaciones del sistema
      'promocion',          // Ofertas y promociones
      'recordatorio',       // Recordatorios importantes
      'seguridad',          // Alertas de seguridad
      'cuenta',             // Cambios en la cuenta
      'evaluacion'          // Solicitudes de evaluación
    ],
    required: true
  },
  categoria: {
    type: String,
    enum: [
      'info',               // Informativa
      'success',            // Éxito/confirmación
      'warning',            // Advertencia
      'error',              // Error
      'urgent'              // Urgente
    ],
    default: 'info'
  },

  // 🔗 Referencias relacionadas
  referencia: {
    modelo: {
      type: String,
      enum: ['Asesoria', 'Mensaje', 'Usuario', 'TransaccionPSE', 'Conversacion'],
    },
    id: Schema.Types.ObjectId,
    metadata: Schema.Types.Mixed // Datos adicionales específicos
  },

  // 🎨 Presentación
  icono: {
    type: String,
    default: 'bell'
  },
  color: {
    type: String,
    default: '#007bff'
  },
  imagen: String, // URL de imagen opcional

  // 📱 Canales de entrega
  canales: {
    inApp: {
      enviado: { type: Boolean, default: false },
      leido: { type: Boolean, default: false },
      fechaLectura: Date
    },
    email: {
      enviar: { type: Boolean, default: false },
      enviado: { type: Boolean, default: false },
      fechaEnvio: Date,
      emailId: String // ID del email en el proveedor
    },
    sms: {
      enviar: { type: Boolean, default: false },
      enviado: { type: Boolean, default: false },
      fechaEnvio: Date,
      smsId: String
    },
    push: {
      enviar: { type: Boolean, default: false },
      enviado: { type: Boolean, default: false },
      fechaEnvio: Date,
      pushId: String
    }
  },

  // 📅 Programación
  programada: {
    esProgramada: { type: Boolean, default: false },
    fechaEnvio: Date,
    enviada: { type: Boolean, default: false }
  },

  // ⏰ Expiración
  expira: {
    tieneExpiracion: { type: Boolean, default: false },
    fechaExpiracion: Date,
    expirada: { type: Boolean, default: false }
  },

  // 🎯 Acciones
  acciones: [{
    etiqueta: String,       // Texto del botón/enlace
    tipo: {
      type: String,
      enum: ['url', 'action', 'route'],
      default: 'url'
    },
    valor: String,          // URL, acción o ruta
    estilo: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      default: 'primary'
    }
  }],

  // 📊 Estado y seguimiento
  estado: {
    type: String,
    enum: ['pendiente', 'enviada', 'leida', 'actuada', 'expirada', 'cancelada'],
    default: 'pendiente'
  },
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'critica'],
    default: 'normal'
  },

  // 📈 Métricas
  metricas: {
    abierta: { type: Boolean, default: false },
    fechaApertura: Date,
    clics: { type: Number, default: 0 },
    tiempoLectura: Number, // segundos
    dispositivoLectura: String
  },

  // 🔄 Agrupación (para notificaciones similares)
  grupoId: String,
  esResumen: { type: Boolean, default: false },
  notificacionesAgrupadas: [{ type: Schema.Types.ObjectId, ref: 'Notificacion' }],

  // 📅 Metadatos
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  creadaPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'notificaciones'
});

// 📌 Índices para optimizar consultas
notificacionSchema.index({ usuario: 1, fechaCreacion: -1 });
notificacionSchema.index({ usuario: 1, estado: 1, fechaCreacion: -1 });
notificacionSchema.index({ tipo: 1, fechaCreacion: -1 });
notificacionSchema.index({ 'programada.fechaEnvio': 1, 'programada.enviada': 1 });
notificacionSchema.index({ 'expira.fechaExpiracion': 1, 'expira.expirada': 1 });
notificacionSchema.index({ grupoId: 1 });
notificacionSchema.index({ codigoNotificacion: 1 });

// 🔄 Middleware para verificar expiración
notificacionSchema.pre('find', function() {
  // Marcar como expiradas las notificaciones vencidas
  const ahora = new Date();
  this.model.updateMany(
    {
      'expira.tieneExpiracion': true,
      'expira.fechaExpiracion': { $lte: ahora },
      'expira.expirada': false
    },
    {
      $set: { 
        'expira.expirada': true,
        estado: 'expirada'
      }
    }
  ).exec();
});

// 📋 Métodos del modelo
notificacionSchema.methods = {
  // Marcar como leída
  async marcarComoLeida() {
    this.canales.inApp.leido = true;
    this.canales.inApp.fechaLectura = new Date();
    this.estado = 'leida';
    this.metricas.abierta = true;
    this.metricas.fechaApertura = new Date();
    return this.save();
  },

  // Registrar clic en acción
  async registrarClic() {
    this.metricas.clics += 1;
    this.estado = 'actuada';
    return this.save();
  },

  // Verificar si está expirada
  estaExpirada() {
    if (!this.expira.tieneExpiracion) return false;
    return new Date() > this.expira.fechaExpiracion;
  },

  // Obtener texto completo para email/SMS
  generarTextoCompleto() {
    let texto = `${this.titulo}\n\n${this.mensaje}`;
    
    if (this.acciones.length > 0) {
      texto += '\n\nAcciones disponibles:';
      this.acciones.forEach(accion => {
        texto += `\n- ${accion.etiqueta}: ${accion.valor}`;
      });
    }
    
    return texto;
  },

  // Enviar por email
  async enviarPorEmail() {
    // Aquí se integraría con el servicio de email
    this.canales.email.enviado = true;
    this.canales.email.fechaEnvio = new Date();
    this.canales.email.emailId = `email-${Date.now()}`;
    
    if (this.estado === 'pendiente') {
      this.estado = 'enviada';
    }
    
    return this.save();
  },

  // Enviar push notification
  async enviarPush() {
    // Aquí se integraría con el servicio de push notifications
    this.canales.push.enviado = true;
    this.canales.push.fechaEnvio = new Date();
    this.canales.push.pushId = `push-${Date.now()}`;
    
    if (this.estado === 'pendiente') {
      this.estado = 'enviada';
    }
    
    return this.save();
  }
};

// 📊 Métodos estáticos
notificacionSchema.statics = {
  // Crear notificación estándar
  async crear(datosNotificacion) {
    const notificacion = new this(datosNotificacion);
    
    // Envío inmediato por defecto para in-app
    notificacion.canales.inApp.enviado = true;
    
    // Si no es programada, marcar como enviada
    if (!notificacion.programada.esProgramada) {
      notificacion.estado = 'enviada';
    }
    
    return notificacion.save();
  },

  // Notificaciones para un usuario
  async porUsuario(usuarioId, filtros = {}) {
    const query = { usuario: usuarioId, ...filtros };
    return this.find(query)
      .sort({ fechaCreacion: -1 })
      .populate('referencia.id');
  },

  // Notificaciones no leídas
  async noLeidas(usuarioId) {
    return this.find({
      usuario: usuarioId,
      'canales.inApp.leido': false,
      estado: { $nin: ['expirada', 'cancelada'] }
    }).count();
  },

  // Notificaciones programadas pendientes
  async programadasPendientes() {
    const ahora = new Date();
    return this.find({
      'programada.esProgramada': true,
      'programada.enviada': false,
      'programada.fechaEnvio': { $lte: ahora }
    });
  },

  // Crear notificación de asesoría
  async crearNotificacionAsesoria(tipo, usuarioId, asesoriaId, datos = {}) {
    const plantillas = {
      'nueva-asesoria': {
        titulo: 'Nueva asesoría agendada',
        mensaje: 'Tu asesoría ha sido confirmada y agendada exitosamente.',
        categoria: 'success',
        icono: 'calendar-check'
      },
      'recordatorio-asesoria': {
        titulo: 'Recordatorio de asesoría',
        mensaje: 'Tu asesoría está programada para dentro de 30 minutos.',
        categoria: 'warning',
        icono: 'clock'
      },
      'asesoria-iniciada': {
        titulo: 'Asesoría iniciada',
        mensaje: 'Tu asesoría ha comenzado. Puedes ingresar a la videollamada.',
        categoria: 'info',
        icono: 'video'
      },
      'asesoria-completada': {
        titulo: 'Asesoría completada',
        mensaje: 'Tu asesoría ha finalizado. Te invitamos a calificar el servicio.',
        categoria: 'success',
        icono: 'check-circle'
      },
      'asesoria-cancelada': {
        titulo: 'Asesoría cancelada',
        mensaje: 'Tu asesoría ha sido cancelada. Se procesará el reembolso correspondiente.',
        categoria: 'warning',
        icono: 'x-circle'
      }
    };

    const plantilla = plantillas[tipo];
    if (!plantilla) {
      throw new Error(`Tipo de notificación no válido: ${tipo}`);
    }

    return this.crear({
      usuario: usuarioId,
      tipo: 'asesoria',
      ...plantilla,
      ...datos,
      referencia: {
        modelo: 'Asesoria',
        id: asesoriaId
      }
    });
  },

  // Crear notificación de pago
  async crearNotificacionPago(estado, usuarioId, transaccionId, datos = {}) {
    const plantillas = {
      'pago-exitoso': {
        titulo: 'Pago procesado exitosamente',
        mensaje: 'Tu pago ha sido procesado correctamente.',
        categoria: 'success',
        icono: 'credit-card'
      },
      'pago-fallido': {
        titulo: 'Error en el pago',
        mensaje: 'No se pudo procesar tu pago. Por favor, intenta nuevamente.',
        categoria: 'error',
        icono: 'alert-circle'
      },
      'reembolso-procesado': {
        titulo: 'Reembolso procesado',
        mensaje: 'Tu reembolso ha sido procesado y se reflejará en tu cuenta pronto.',
        categoria: 'info',
        icono: 'refresh-ccw'
      }
    };

    const plantilla = plantillas[estado];
    if (!plantilla) {
      throw new Error(`Estado de pago no válido: ${estado}`);
    }

    return this.crear({
      usuario: usuarioId,
      tipo: 'pago',
      ...plantilla,
      ...datos,
      referencia: {
        modelo: 'TransaccionPSE',
        id: transaccionId
      }
    });
  },

  // Estadísticas de notificaciones
  async estadisticas(filtro = {}) {
    const pipeline = [
      { $match: filtro },
      {
        $group: {
          _id: {
            tipo: '$tipo',
            estado: '$estado'
          },
          total: { $sum: 1 },
          tasaLectura: {
            $avg: { $cond: [{ $eq: ['$canales.inApp.leido', true] }, 1, 0] }
          }
        }
      }
    ];
    return this.aggregate(pipeline);
  }
};

module.exports = mongoose.model('Notificacion', notificacionSchema);
