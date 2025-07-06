/**
 * 📅 MODELO DE ASESORÍA/CITA - SERVITECH
 * Gestiona las reservas, horarios y estados de las asesorías
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const asesoriaSchema = new Schema({
  // 🔑 Identificación única
  codigoAsesoria: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `ASE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
  },

  // 👥 Participantes
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  experto: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // 📋 Información del servicio
  categoria: {
    type: Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  tipoServicio: {
    type: String,
    enum: ['consulta-rapida', 'asesoria-detallada', 'proyecto-completo', 'emergencia'],
    required: true
  },
  titulo: {
    type: String,
    required: true,
    maxlength: 200
  },
  descripcion: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // 📅 Programación
  fechaHora: {
    type: Date,
    required: true
  },
  duracion: {
    type: Number, // Duración en minutos
    required: true,
    enum: [30, 60, 90, 120], // Duraciones predefinidas
    default: 60
  },
  zonaHoraria: {
    type: String,
    default: 'America/Bogota'
  },

  // 💰 Información de pago
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  moneda: {
    type: String,
    default: 'COP'
  },
  metodoPago: {
    type: String,
    enum: ['tarjeta', 'pse', 'nequi', 'payu', 'daviplata'],
    required: true
  },
  transaccionPago: {
    type: Schema.Types.ObjectId,
    ref: 'TransaccionPSE' // Referencia general a transacciones
  },

  // 📊 Estado y flujo
  estado: {
    type: String,
    enum: [
      'pendiente-pago',     // Creada pero sin pagar
      'pagada',             // Pagada, esperando confirmación
      'confirmada',         // Confirmada por el experto
      'en-curso',           // Asesoría iniciada
      'completada',         // Finalizada exitosamente
      'cancelada-cliente',  // Cancelada por el cliente
      'cancelada-experto',  // Cancelada por el experto
      'no-show-cliente',    // Cliente no se presentó
      'no-show-experto',    // Experto no se presentó
      'reembolsada'         // Dinero devuelto
    ],
    default: 'pendiente-pago'
  },
  
  // 🕐 Historial de estados
  historialEstados: [{
    estado: String,
    fecha: { type: Date, default: Date.now },
    observaciones: String,
    cambiadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  }],

  // 🎥 Información de videollamada
  videollamada: {
    salaId: String,          // ID de la sala virtual
    enlaceCliente: String,   // Enlace para el cliente
    enlaceExperto: String,   // Enlace para el experto
    grabacion: {
      habilitada: { type: Boolean, default: false },
      url: String,
      tamaño: Number // en MB
    },
    iniciadaEn: Date,
    finalizadaEn: Date
  },

  // 📝 Detalles adicionales
  requerimientos: {
    compartirPantalla: { type: Boolean, default: false },
    accesoRemoto: { type: Boolean, default: false },
    archivosPrevios: [String], // URLs de archivos subidos
    notasCliente: String
  },

  // 🔄 Seguimiento
  recordatorios: {
    clienteNotificado: { type: Boolean, default: false },
    expertoNotificado: { type: Boolean, default: false },
    ultimoRecordatorio: Date
  },

  // ⭐ Post-asesoría
  resultado: {
    resumen: String,
    archivosEntregados: [String], // URLs de archivos
    tiempoEfectivo: Number, // Tiempo real de la asesoría en minutos
    calificacionCliente: {
      type: Number,
      min: 1,
      max: 5
    },
    comentarioCliente: String,
    calificacionExperto: {
      type: Number,
      min: 1,
      max: 5
    },
    comentarioExperto: String
  },

  // 📊 Metadatos
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'asesorias'
});

// 📌 Índices para optimizar consultas
asesoriaSchema.index({ cliente: 1, fechaHora: -1 });
asesoriaSchema.index({ experto: 1, fechaHora: -1 });
asesoriaSchema.index({ estado: 1, fechaHora: 1 });
asesoriaSchema.index({ codigoAsesoria: 1 });
asesoriaSchema.index({ fechaHora: 1 });
asesoriaSchema.index({ categoria: 1 });

// 🔄 Middleware para actualizar fechaActualizacion
asesoriaSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  if (this.isModified('estado')) {
    this.historialEstados.push({
      estado: this.estado,
      fecha: new Date(),
      cambiadoPor: this._cambiadoPor || null
    });
  }
  next();
});

// 📋 Métodos del modelo
asesoriaSchema.methods = {
  // Verificar si se puede cancelar
  puedeSerCancelada() {
    const ahora = new Date();
    const tiempoLimite = new Date(this.fechaHora.getTime() - (2 * 60 * 60 * 1000)); // 2 horas antes
    return ['pagada', 'confirmada'].includes(this.estado) && ahora < tiempoLimite;
  },

  // Calcular tiempo restante
  tiempoRestante() {
    const ahora = new Date();
    const diferencia = this.fechaHora.getTime() - ahora.getTime();
    return Math.max(0, Math.floor(diferencia / (1000 * 60))); // minutos
  },

  // Verificar si está próxima (30 minutos)
  estaProxima() {
    return this.tiempoRestante() <= 30 && this.tiempoRestante() > 0;
  },

  // Generar enlace de videollamada
  generarEnlaceVideollamada() {
    if (!this.videollamada.salaId) {
      this.videollamada.salaId = `sala-${this.codigoAsesoria}-${Date.now()}`;
    }
    const baseUrl = process.env.VIDEO_CALL_BASE_URL || 'https://meet.servitech.com';
    this.videollamada.enlaceCliente = `${baseUrl}/sala/${this.videollamada.salaId}?user=cliente&token=${this._id}`;
    this.videollamada.enlaceExperto = `${baseUrl}/sala/${this.videollamada.salaId}?user=experto&token=${this._id}`;
    return this.save();
  }
};

// 📊 Métodos estáticos
asesoriaSchema.statics = {
  // Buscar asesorías por usuario
  async porUsuario(usuarioId, rol = 'cliente') {
    const filtro = rol === 'cliente' ? { cliente: usuarioId } : { experto: usuarioId };
    return this.find(filtro)
      .populate('cliente', 'nombre apellido email')
      .populate('experto', 'nombre apellido email')
      .populate('categoria', 'nombre')
      .sort({ fechaHora: -1 });
  },

  // Buscar asesorías pendientes de confirmación
  async pendientesConfirmacion() {
    return this.find({ estado: 'pagada' })
      .populate('cliente experto categoria')
      .sort({ fechaCreacion: 1 });
  },

  // Estadísticas para dashboard
  async estadisticas(filtro = {}) {
    const pipeline = [
      { $match: filtro },
      {
        $group: {
          _id: '$estado',
          total: { $sum: 1 },
          ingresoTotal: { $sum: '$precio' }
        }
      }
    ];
    return this.aggregate(pipeline);
  }
};

module.exports = mongoose.model('Asesoria', asesoriaSchema);
