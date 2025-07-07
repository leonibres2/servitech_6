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

  // 📱 Estado
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

  // 💬 Respuesta a otro mensaje (threading)
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

// 📌 Índices para optimizar consultas
conversacionSchema.index({ 'participantes.usuario': 1, fechaUltimaActividad: -1 });
conversacionSchema.index({ asesoria: 1 });
conversacionSchema.index({ estado: 1, fechaUltimaActividad: -1 });
// codigoConversacion ya tiene índice unique automático

mensajeSchema.index({ conversacion: 1, fechaEnvio: -1 });
mensajeSchema.index({ remitente: 1, fechaEnvio: -1 });
mensajeSchema.index({ 'contenido.tipo': 1 });
mensajeSchema.index({ estado: 1 });
mensajeSchema.index({ 'eliminado.eliminado': 1, fechaEnvio: -1 });

// 🔄 Middleware para actualizar estadísticas
mensajeSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Actualizar estadísticas de la conversación
    await mongoose.model('Conversacion').findByIdAndUpdate(
      this.conversacion,
      {
        $inc: { 'estadisticas.totalMensajes': 1 },
        $set: {
          'estadisticas.ultimoMensaje': {
            contenido: this.contenido.texto?.substring(0, 100) || '[Archivo]',
            remitente: this.remitente,
            fecha: this.fechaEnvio,
            tipo: this.contenido.tipo
          },
          fechaUltimaActividad: new Date()
        }
      }
    );

    // Incrementar contador de mensajes no leídos para otros participantes
    const conversacion = await mongoose.model('Conversacion').findById(this.conversacion);
    if (conversacion) {
      const otrosParticipantes = conversacion.participantes.filter(
        p => p.usuario.toString() !== this.remitente.toString()
      );

      for (const participante of otrosParticipantes) {
        await mongoose.model('Conversacion').updateOne(
          { 
            _id: this.conversacion,
            'estadisticas.mensajesNoLeidos.usuario': participante.usuario
          },
          { $inc: { 'estadisticas.mensajesNoLeidos.$.cantidad': 1 } }
        );
      }
    }
  }
  next();
});

// 📋 Métodos del modelo Mensaje
mensajeSchema.methods = {
  // Marcar como leído por un usuario
  async marcarComoLeido(usuarioId) {
    if (this.remitente.toString() !== usuarioId.toString()) {
      // Agregar a la lista de lectura si no está
      const yaLeido = this.fechaLectura.some(
        l => l.usuario.toString() === usuarioId.toString()
      );

      if (!yaLeido) {
        this.fechaLectura.push({
          usuario: usuarioId,
          fecha: new Date()
        });

        // Actualizar estado si todos los participantes han leído
        const conversacion = await mongoose.model('Conversacion').findById(this.conversacion);
        const totalParticipantes = conversacion.participantes.filter(
          p => p.usuario.toString() !== this.remitente.toString()
        ).length;

        if (this.fechaLectura.length >= totalParticipantes) {
          this.estado = 'leido';
        } else if (this.estado === 'enviado') {
          this.estado = 'entregado';
        }

        // Decrementar contador de no leídos
        await mongoose.model('Conversacion').updateOne(
          { 
            _id: this.conversacion,
            'estadisticas.mensajesNoLeidos.usuario': usuarioId
          },
          { $inc: { 'estadisticas.mensajesNoLeidos.$.cantidad': -1 } }
        );

        await this.save();
      }
    }
  },

  // Editar mensaje
  async editarMensaje(nuevoContenido) {
    if (this.editado.historialEdiciones.length < 5) { // Máximo 5 ediciones
      this.editado.historialEdiciones.push({
        contenido: this.contenido.texto,
        fecha: new Date()
      });
    }
    
    this.contenido.texto = nuevoContenido;
    this.editado.editado = true;
    this.editado.fechaEdicion = new Date();
    
    return this.save();
  },

  // Agregar reacción
  async agregarReaccion(usuarioId, tipoReaccion) {
    // Remover reacción anterior del mismo usuario
    this.reacciones = this.reacciones.filter(
      r => r.usuario.toString() !== usuarioId.toString()
    );
    
    // Agregar nueva reacción
    this.reacciones.push({
      usuario: usuarioId,
      tipo: tipoReaccion,
      fecha: new Date()
    });
    
    return this.save();
  },

  // Eliminar mensaje
  async eliminarMensaje(usuarioId, razon = '') {
    this.eliminado.eliminado = true;
    this.eliminado.fechaEliminacion = new Date();
    this.eliminado.eliminadoPor = usuarioId;
    this.eliminado.razon = razon;
    
    return this.save();
  }
};

// 📋 Métodos del modelo Conversación
conversacionSchema.methods = {
  // Agregar participante
  async agregarParticipante(usuarioId, rol = 'cliente') {
    const yaExiste = this.participantes.some(
      p => p.usuario.toString() === usuarioId.toString()
    );

    if (!yaExiste) {
      this.participantes.push({
        usuario: usuarioId,
        rol: rol,
        fechaIngreso: new Date(),
        activo: true
      });
      
      // Inicializar contador de mensajes no leídos
      this.estadisticas.mensajesNoLeidos.push({
        usuario: usuarioId,
        cantidad: 0
      });
      
      return this.save();
    }
    return this;
  },

  // Remover participante
  async removerParticipante(usuarioId) {
    this.participantes = this.participantes.map(p => {
      if (p.usuario.toString() === usuarioId.toString()) {
        p.activo = false;
      }
      return p;
    });
    
    return this.save();
  },

  // Verificar si usuario es participante activo
  esParticipante(usuarioId) {
    return this.participantes.some(p => 
      p.usuario.toString() === usuarioId.toString() && p.activo
    );
  },

  // Obtener mensajes no leídos para un usuario
  getMensajesNoLeidos(usuarioId) {
    const participante = this.estadisticas.mensajesNoLeidos.find(
      p => p.usuario.toString() === usuarioId.toString()
    );
    return participante ? participante.cantidad : 0;
  },

  // Marcar todos los mensajes como leídos
  async marcarTodosComoLeidos(usuarioId) {
    await mongoose.model('Mensaje').updateMany(
      {
        conversacion: this._id,
        remitente: { $ne: usuarioId },
        estado: { $in: ['enviado', 'entregado'] }
      },
      {
        $push: { 
          fechaLectura: {
            usuario: usuarioId,
            fecha: new Date()
          }
        },
        $set: { estado: 'leido' }
      }
    );

    // Resetear contador
    await this.constructor.updateOne(
      { 
        _id: this._id,
        'estadisticas.mensajesNoLeidos.usuario': usuarioId
      },
      { $set: { 'estadisticas.mensajesNoLeidos.$.cantidad': 0 } }
    );
  },

  // Actualizar estado de conexión de participante
  async actualizarEstadoConexion(usuarioId, enLinea) {
    await this.constructor.updateOne(
      { 
        _id: this._id,
        'participantes.usuario': usuarioId
      },
      { 
        $set: { 
          'participantes.$.enLinea': enLinea,
          'participantes.$.ultimaConexion': new Date()
        }
      }
    );
  }
};

// 📊 Métodos estáticos
conversacionSchema.statics = {
  // Buscar conversaciones de un usuario
  async porUsuario(usuarioId, filtros = {}) {
    const query = {
      'participantes.usuario': usuarioId,
      'participantes.activo': true,
      activa: true,
      ...filtros
    };

    return this.find(query)
      .populate('participantes.usuario', 'nombre apellido avatar_url es_experto')
      .populate('estadisticas.ultimoMensaje.remitente', 'nombre apellido')
      .populate('asesoria', 'titulo fechaHora estado')
      .sort({ fechaUltimaActividad: -1 });
  },

  // Crear conversación entre usuarios
  async crearConversacion(usuario1Id, usuario2Id, tipo = 'individual', asesoriaId = null) {
    // Verificar si ya existe una conversación entre estos usuarios
    const conversacionExistente = await this.findOne({
      tipo: tipo,
      'participantes.usuario': { $all: [usuario1Id, usuario2Id] },
      'participantes': { $size: 2 },
      activa: true
    });

    if (conversacionExistente && !asesoriaId) {
      return conversacionExistente;
    }

    const nuevaConversacion = new this({
      participantes: [
        { usuario: usuario1Id, rol: 'cliente' },
        { usuario: usuario2Id, rol: 'experto' }
      ],
      tipo: tipo,
      asesoria: asesoriaId,
      estadisticas: {
        mensajesNoLeidos: [
          { usuario: usuario1Id, cantidad: 0 },
          { usuario: usuario2Id, cantidad: 0 }
        ]
      }
    });

    return nuevaConversacion.save();
  },

  // Obtener estadísticas globales
  async estadisticasGlobales() {
    const pipeline = [
      { $match: { activa: true } },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          totalMensajes: { $sum: '$estadisticas.totalMensajes' },
          ultimaActividad: { $max: '$fechaUltimaActividad' }
        }
      }
    ];

    return this.aggregate(pipeline);
  }
};

module.exports = {
  Conversacion: mongoose.model('Conversacion', conversacionSchema),
  Mensaje: mongoose.model('Mensaje', mensajeSchema)
};
