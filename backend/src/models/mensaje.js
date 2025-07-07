/**
 * 💬 MODELO DE MENSAJERÍA EN TIEMPO REAL - SERVITECH
 * Sistema completo de mensajería con Socket.io
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 📱 Esquema para conversaciones/chats
const conversacionSchema = new Schema({
  // 🆔 Identificación
  codigoConversacion: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `CONV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
  },

  // 👥 Participantes
  participantes: [{
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    rol: {
      type: String,
      enum: ['cliente', 'experto', 'moderador', 'admin'],
      default: 'cliente'
    },
    fechaIngreso: { type: Date, default: Date.now },
    activo: { type: Boolean, default: true },
    ultimaConexion: Date,
    enLinea: { type: Boolean, default: false },
    permisos: {
      puedeEnviar: { type: Boolean, default: true },
      puedeEliminar: { type: Boolean, default: false },
      puedeModerar: { type: Boolean, default: false }
    }
  }],

  // 🔗 Relación con asesoría (opcional)
  asesoria: {
    type: Schema.Types.ObjectId,
    ref: 'Asesoria'
  },

  // 📋 Información del chat
  titulo: {
    type: String,
    maxlength: 200
  },
  tipo: {
    type: String,
    enum: ['individual', 'grupal', 'asesoria', 'soporte', 'general'],
    default: 'individual'
  },
  descripcion: String,

  // 📊 Estado y estadísticas
  estado: {
    type: String,
    enum: ['activa', 'pausada', 'cerrada', 'archivada'],
    default: 'activa'
  },
  estadisticas: {
    totalMensajes: { type: Number, default: 0 },
    ultimoMensaje: {
      contenido: String,
      remitente: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      fecha: Date,
      tipo: String
    },
    mensajesNoLeidos: [{
      usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      cantidad: { type: Number, default: 0 }
    }]
  },

  // ⚙️ Configuración
  configuracion: {
    notificacionesActivas: { type: Boolean, default: true },
    modoSilencioso: { type: Boolean, default: false },
    tiempoExpiracion: Date,
    encriptada: { type: Boolean, default: false },
    permitirArchivos: { type: Boolean, default: true },
    tamañoMaximoArchivo: { type: Number, default: 10485760 } // 10MB
  },

  // � Estado
  activa: { type: Boolean, default: true },
  archivada: { type: Boolean, default: false },
  fechaCreacion: { type: Date, default: Date.now },
  fechaUltimaActividad: { type: Date, default: Date.now },
  fechaCierre: Date
}, {
  timestamps: true,
  collection: 'conversaciones'
});

// 💬 Esquema para mensajes individuales
const mensajeSchema = new Schema({
  // 🔗 Relación con conversación
  conversacion: {
    type: Schema.Types.ObjectId,
    ref: 'Conversacion',
    required: true
  },

  // 👤 Remitente
  remitente: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // 📝 Contenido del mensaje
  contenido: {
    texto: {
      type: String,
      maxlength: 5000
    },
    tipo: {
      type: String,
      enum: ['texto', 'imagen', 'archivo', 'audio', 'video', 'ubicacion', 'contacto', 'sistema'],
      default: 'texto'
    },
    archivo: {
      url: String,
      nombre: String,
      tamaño: Number, // en bytes
      mimeType: String
    },
    metadatos: {
      duracion: Number, // para audio/video en segundos
      dimensiones: {
        ancho: Number,
        alto: Number
      },
      ubicacion: {
        latitud: Number,
        longitud: Number,
        direccion: String
      },
      vista_previa: String // URL de thumbnail
    }
  },

  // ⏰ Información temporal
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  fechaEntrega: Date,
  fechaLectura: [{
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    fecha: { type: Date, default: Date.now }
  }],

  // 📊 Estado del mensaje en tiempo real
  estado: {
    type: String,
    enum: ['enviando', 'enviado', 'entregado', 'leido', 'error'],
    default: 'enviando'
  },

  // 🔄 Edición y modificación
  editado: {
    editado: { type: Boolean, default: false },
    fechaEdicion: Date,
    historialEdiciones: [{
      contenido: String,
      fecha: { type: Date, default: Date.now }
    }]
  },

  // � Respuesta a otro mensaje (threading)
  respuestaA: {
    type: Schema.Types.ObjectId,
    ref: 'Mensaje'
  },

  // ⭐ Reacciones y interacciones
  reacciones: [{
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    tipo: {
      type: String,
      enum: ['like', 'love', 'laugh', 'angry', 'sad', 'wow', 'thumbs_up', 'thumbs_down'],
      default: 'like'
    },
    fecha: { type: Date, default: Date.now }
  }],

  // 🗑️ Eliminación
  eliminado: {
    eliminado: { type: Boolean, default: false },
    fechaEliminacion: Date,
    eliminadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    razon: String
  },

  // 🔐 Seguridad y moderación
  moderacion: {
    reportado: { type: Boolean, default: false },
    aprobado: { type: Boolean, default: true },
    razonReporte: String,
    moderadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },

  // 📡 Información técnica para tiempo real
  socketInfo: {
    socketId: String,
    ipAddress: String,
    userAgent: String
  },

  // 🎯 Prioridad y urgencia
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'urgente'],
    default: 'normal'
  }
}, {
  timestamps: true,
  collection: 'mensajes'
});
    default: 'enviado'
  },

  // 👀 Lectura por participantes
  lecturaPor: [{
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    fechaLectura: {
      type: Date,
      default: Date.now
    }
  }],

  // 🔄 Respuesta a mensaje (para hilos)
  respondieA: {
    type: Schema.Types.ObjectId,
    ref: 'Mensaje'
  },

  // ✏️ Edición
  editado: {
    esEditado: {
      type: Boolean,
      default: false
    },
    fechaEdicion: Date,
    contenidoOriginal: String
  },

  // 🗑️ Eliminación
  eliminado: {
    esEliminado: {
      type: Boolean,
      default: false
    },
    fechaEliminacion: Date,
    eliminadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    }
  },

  // 📅 Metadatos
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  ip: String,
  dispositivo: String
}, {
  timestamps: true,
  collection: 'mensajes'
});

// 📌 Índices para optimizar consultas
conversacionSchema.index({ 'participantes.usuario': 1, ultimaActividad: -1 });
conversacionSchema.index({ asesoria: 1 });
conversacionSchema.index({ estado: 1, ultimaActividad: -1 });
conversacionSchema.index({ codigoConversacion: 1 });

mensajeSchema.index({ conversacion: 1, fechaEnvio: -1 });
mensajeSchema.index({ emisor: 1, fechaEnvio: -1 });
mensajeSchema.index({ 'contenido.tipo': 1 });
mensajeSchema.index({ estado: 1 });

// 🔄 Middleware para conversaciones
conversacionSchema.pre('save', function(next) {
  this.ultimaActividad = new Date();
  next();
});

// 🔄 Middleware para mensajes
mensajeSchema.pre('save', function(next) {
  // Actualizar contador de mensajes en la conversación
  if (this.isNew) {
    this.model('Conversacion').findByIdAndUpdate(
      this.conversacion,
      { 
        $inc: { totalMensajes: 1 },
        $set: { ultimaActividad: new Date() }
      }
    ).exec();
  }
  next();
});

// 📋 Métodos para conversaciones
conversacionSchema.methods = {
  // Agregar participante
  async agregarParticipante(usuarioId, rol) {
    const yaExiste = this.participantes.some(p => p.usuario.toString() === usuarioId.toString());
    if (!yaExiste) {
      this.participantes.push({ usuario: usuarioId, rol });
      return this.save();
    }
    return this;
  },

  // Remover participante
  async removerParticipante(usuarioId) {
    this.participantes = this.participantes.filter(p => p.usuario.toString() !== usuarioId.toString());
    return this.save();
  },

  // Verificar si usuario es participante
  esParticipante(usuarioId) {
    return this.participantes.some(p => 
      p.usuario.toString() === usuarioId.toString() && p.activo
    );
  },

  // Obtener mensajes no leídos para un usuario
  async mensajesNoLeidos(usuarioId) {
    const Mensaje = this.model('Mensaje');
    return Mensaje.find({
      conversacion: this._id,
      emisor: { $ne: usuarioId },
      'lecturaPor.usuario': { $ne: usuarioId },
      'eliminado.esEliminado': false
    }).count();
  }
};

// 📋 Métodos para mensajes
mensajeSchema.methods = {
  // Marcar como leído por un usuario
  async marcarComoLeido(usuarioId) {
    const yaLeido = this.lecturaPor.some(l => l.usuario.toString() === usuarioId.toString());
    if (!yaLeido) {
      this.lecturaPor.push({ usuario: usuarioId, fechaLectura: new Date() });
      this.estado = 'leido';
      return this.save();
    }
    return this;
  },

  // Editar mensaje
  async editar(nuevoContenido) {
    if (this.contenido.tipo === 'texto') {
      this.editado.contenidoOriginal = this.contenido.texto;
      this.contenido.texto = nuevoContenido;
      this.editado.esEditado = true;
      this.editado.fechaEdicion = new Date();
      return this.save();
    }
    throw new Error('Solo se pueden editar mensajes de texto');
  },

  // Eliminar mensaje (soft delete)
  async eliminar(usuarioId) {
    this.eliminado.esEliminado = true;
    this.eliminado.fechaEliminacion = new Date();
    this.eliminado.eliminadoPor = usuarioId;
    return this.save();
  }
};

// 📊 Métodos estáticos para conversaciones
conversacionSchema.statics = {
  // Buscar conversaciones de un usuario
  async porUsuario(usuarioId) {
    return this.find({
      'participantes.usuario': usuarioId,
      'participantes.activo': true
    })
    .populate('participantes.usuario', 'nombre apellido email avatar')
    .populate('asesoria', 'codigoAsesoria titulo estado')
    .sort({ ultimaActividad: -1 });
  },

  // Crear conversación para asesoría
  async crearParaAsesoria(asesoriaId, clienteId, expertoId) {
    const conversacion = new this({
      asesoria: asesoriaId,
      tipo: 'pre-asesoria',
      titulo: `Asesoría ${asesoriaId}`,
      participantes: [
        { usuario: clienteId, rol: 'cliente' },
        { usuario: expertoId, rol: 'experto' }
      ]
    });
    return conversacion.save();
  }
};

// 📊 Métodos estáticos para mensajes
mensajeSchema.statics = {
  // Obtener mensajes de una conversación
  async porConversacion(conversacionId, limite = 50, pagina = 1) {
    const skip = (pagina - 1) * limite;
    return this.find({ 
      conversacion: conversacionId,
      'eliminado.esEliminado': false
    })
    .populate('emisor', 'nombre apellido avatar')
    .populate('respondieA', 'contenido.texto emisor')
    .sort({ fechaEnvio: -1 })
    .limit(limite)
    .skip(skip);
  },

  // Buscar mensajes por contenido
  async buscar(conversacionId, termino) {
    return this.find({
      conversacion: conversacionId,
      'contenido.texto': { $regex: termino, $options: 'i' },
      'eliminado.esEliminado': false
    })
    .populate('emisor', 'nombre apellido')
    .sort({ fechaEnvio: -1 });
  }
};

// 📤 Exportar modelos
const Conversacion = mongoose.model('Conversacion', conversacionSchema);
const Mensaje = mongoose.model('Mensaje', mensajeSchema);

module.exports = { Conversacion, Mensaje };
