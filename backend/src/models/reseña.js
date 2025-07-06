/**
 * ⭐ MODELO DE RESEÑA/CALIFICACIÓN - SERVITECH
 * Gestiona las valoraciones y comentarios de los servicios
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const reseñaSchema = new Schema({
  // 🆔 Identificación
  codigoReseña: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return `REV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
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

  // 🔗 Servicio evaluado
  asesoria: {
    type: Schema.Types.ObjectId,
    ref: 'Asesoria',
    required: true
  },

  // ⭐ Calificaciones detalladas
  calificaciones: {
    general: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    },
    conocimiento: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    },
    comunicacion: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    },
    puntualidad: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    },
    solucionProblemas: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    },
    calidadPrecio: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'La calificación debe ser un número entero entre 1 y 5'
      }
    }
  },

  // 📝 Comentarios
  comentario: {
    titulo: {
      type: String,
      maxlength: 200
    },
    texto: {
      type: String,
      required: true,
      maxlength: 2000
    },
    aspectosPositivos: [String], // Tags de aspectos destacados
    aspectosMejorar: [String],   // Tags de aspectos a mejorar
    recomendaria: {
      type: Boolean,
      required: true
    }
  },

  // 📸 Evidencias (opcional)
  evidencias: [{
    tipo: {
      type: String,
      enum: ['imagen', 'video', 'documento'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    nombre: String,
    tamaño: Number, // en bytes
    descripcion: String
  }],

  // 📊 Estado y moderación
  estado: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada', 'oculta', 'reportada'],
    default: 'pendiente'
  },
  moderacion: {
    moderadaPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    fechaModeracion: Date,
    observaciones: String,
    esApropiada: Boolean,
    requiereRevision: Boolean
  },

  // 🤖 Análisis automático
  analisis: {
    sentimiento: {
      tipo: {
        type: String,
        enum: ['positivo', 'neutral', 'negativo'],
        default: 'neutral'
      },
      puntuacion: Number, // -1 a 1
      confianza: Number   // 0 a 1
    },
    palabrasClave: [String],
    temasIdentificados: [String],
    nivelDetalle: {
      type: String,
      enum: ['basico', 'detallado', 'completo'],
      default: 'basico'
    }
  },

  // 🔄 Respuesta del experto
  respuestaExperto: {
    texto: {
      type: String,
      maxlength: 1000
    },
    fechaRespuesta: Date,
    editada: {
      esEditada: { type: Boolean, default: false },
      fechaEdicion: Date
    }
  },

  // 👍 Interacciones
  interacciones: {
    util: {
      total: { type: Number, default: 0 },
      usuarios: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }]
    },
    reportes: [{
      usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
      motivo: {
        type: String,
        enum: ['contenido-inapropiado', 'spam', 'informacion-falsa', 'lenguaje-ofensivo', 'otro']
      },
      descripcion: String,
      fecha: { type: Date, default: Date.now }
    }]
  },

  // 📈 Métricas
  metricas: {
    visualizaciones: { type: Number, default: 0 },
    compartidas: { type: Number, default: 0 },
    clicsEnPerfil: { type: Number, default: 0 }
  },

  // 🎯 Contexto del servicio
  contextoServicio: {
    duracionReal: Number, // minutos
    precioFinal: Number,
    problemaResuelto: Boolean,
    seguimientoRequerido: Boolean,
    primeraVez: Boolean // ¿Primera vez con este experto?
  },

  // 📅 Metadatos
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaPublicacion: Date,
  ip: String,
  dispositivo: String,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  collection: 'reseñas'
});

// 📌 Índices para optimizar consultas
reseñaSchema.index({ experto: 1, estado: 1, fechaPublicacion: -1 });
reseñaSchema.index({ cliente: 1, fechaCreacion: -1 });
reseñaSchema.index({ asesoria: 1 });
reseñaSchema.index({ 'calificaciones.general': -1, estado: 1 });
reseñaSchema.index({ estado: 1, fechaCreacion: -1 });
reseñaSchema.index({ codigoReseña: 1 });

// Índice compuesto para búsquedas de expertos
reseñaSchema.index({ 
  experto: 1, 
  estado: 1, 
  'calificaciones.general': -1, 
  fechaPublicacion: -1 
});

// 🔄 Middleware para calcular promedio automáticamente
reseñaSchema.pre('save', function(next) {
  // Calcular calificación general si no está establecida
  if (!this.calificaciones.general && this.calificaciones.conocimiento) {
    const calificaciones = [
      this.calificaciones.conocimiento,
      this.calificaciones.comunicacion,
      this.calificaciones.puntualidad,
      this.calificaciones.solucionProblemas,
      this.calificaciones.calidadPrecio
    ].filter(cal => cal !== undefined);
    
    if (calificaciones.length > 0) {
      this.calificaciones.general = Math.round(
        calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length
      );
    }
  }

  // Establecer fecha de publicación si es aprobada
  if (this.isModified('estado') && this.estado === 'aprobada' && !this.fechaPublicacion) {
    this.fechaPublicacion = new Date();
  }

  next();
});

// 📋 Métodos del modelo
reseñaSchema.methods = {
  // Marcar como útil
  async marcarComoUtil(usuarioId) {
    const yaMarco = this.interacciones.util.usuarios.includes(usuarioId);
    if (!yaMarco) {
      this.interacciones.util.usuarios.push(usuarioId);
      this.interacciones.util.total += 1;
      return this.save();
    }
    return this;
  },

  // Quitar marca de útil
  async quitarMarcaUtil(usuarioId) {
    const index = this.interacciones.util.usuarios.indexOf(usuarioId);
    if (index > -1) {
      this.interacciones.util.usuarios.splice(index, 1);
      this.interacciones.util.total = Math.max(0, this.interacciones.util.total - 1);
      return this.save();
    }
    return this;
  },

  // Reportar reseña
  async reportar(usuarioId, motivo, descripcion) {
    this.interacciones.reportes.push({
      usuario: usuarioId,
      motivo,
      descripcion
    });
    
    // Si tiene muchos reportes, marcar para revisión
    if (this.interacciones.reportes.length >= 3) {
      this.estado = 'reportada';
      this.moderacion.requiereRevision = true;
    }
    
    return this.save();
  },

  // Aprobar reseña
  async aprobar(moderadorId, observaciones) {
    this.estado = 'aprobada';
    this.fechaPublicacion = new Date();
    this.moderacion.moderadaPor = moderadorId;
    this.moderacion.fechaModeracion = new Date();
    this.moderacion.observaciones = observaciones;
    this.moderacion.esApropiada = true;
    return this.save();
  },

  // Rechazar reseña
  async rechazar(moderadorId, observaciones) {
    this.estado = 'rechazada';
    this.moderacion.moderadaPor = moderadorId;
    this.moderacion.fechaModeracion = new Date();
    this.moderacion.observaciones = observaciones;
    this.moderacion.esApropiada = false;
    return this.save();
  },

  // Incrementar visualizaciones
  async incrementarVisualizaciones() {
    this.metricas.visualizaciones += 1;
    return this.save();
  },

  // Calcular puntuación de confianza
  calcularConfianza() {
    let puntuacion = 0;
    
    // Longitud del comentario
    if (this.comentario.texto.length > 100) puntuacion += 0.2;
    if (this.comentario.texto.length > 300) puntuacion += 0.1;
    
    // Calificaciones detalladas
    const calificacionesDetalladas = [
      this.calificaciones.conocimiento,
      this.calificaciones.comunicacion,
      this.calificaciones.puntualidad,
      this.calificaciones.solucionProblemas,
      this.calificaciones.calidadPrecio
    ].filter(cal => cal !== undefined).length;
    
    puntuacion += (calificacionesDetalladas / 5) * 0.3;
    
    // Evidencias
    if (this.evidencias.length > 0) puntuacion += 0.2;
    
    // Interacciones positivas
    if (this.interacciones.util.total > 0) {
      puntuacion += Math.min(this.interacciones.util.total * 0.1, 0.2);
    }
    
    return Math.min(puntuacion, 1);
  }
};

// 📊 Métodos estáticos
reseñaSchema.statics = {
  // Reseñas de un experto
  async porExperto(expertoId, filtros = {}) {
    const query = { 
      experto: expertoId, 
      estado: 'aprobada',
      ...filtros 
    };
    
    return this.find(query)
      .populate('cliente', 'nombre apellido avatar')
      .populate('asesoria', 'codigoAsesoria titulo categoria')
      .sort({ fechaPublicacion: -1 });
  },

  // Estadísticas de un experto
  async estadisticasExperto(expertoId) {
    const pipeline = [
      { 
        $match: { 
          experto: new mongoose.Types.ObjectId(expertoId),
          estado: 'aprobada'
        }
      },
      {
        $group: {
          _id: null,
          totalReseñas: { $sum: 1 },
          promedioGeneral: { $avg: '$calificaciones.general' },
          promedioConocimiento: { $avg: '$calificaciones.conocimiento' },
          promedioComunicacion: { $avg: '$calificaciones.comunicacion' },
          promedioPuntualidad: { $avg: '$calificaciones.puntualidad' },
          promedioSolucionProblemas: { $avg: '$calificaciones.solucionProblemas' },
          promedioCalidadPrecio: { $avg: '$calificaciones.calidadPrecio' },
          totalRecomendaciones: { 
            $sum: { $cond: ['$comentario.recomendaria', 1, 0] }
          },
          distribucionCalificaciones: {
            $push: '$calificaciones.general'
          }
        }
      },
      {
        $addFields: {
          porcentajeRecomendacion: {
            $multiply: [
              { $divide: ['$totalRecomendaciones', '$totalReseñas'] },
              100
            ]
          }
        }
      }
    ];

    const resultado = await this.aggregate(pipeline);
    return resultado[0] || {
      totalReseñas: 0,
      promedioGeneral: 0,
      porcentajeRecomendacion: 0
    };
  },

  // Reseñas recientes
  async recientes(limite = 10) {
    return this.find({ estado: 'aprobada' })
      .populate('cliente', 'nombre apellido avatar')
      .populate('experto', 'nombre apellido avatar especialidades')
      .populate('asesoria', 'categoria titulo')
      .sort({ fechaPublicacion: -1 })
      .limit(limite);
  },

  // Mejores reseñas (más útiles)
  async mejores(limite = 10) {
    return this.find({ estado: 'aprobada' })
      .populate('cliente', 'nombre apellido avatar')
      .populate('experto', 'nombre apellido avatar especialidades')
      .sort({ 
        'interacciones.util.total': -1,
        'calificaciones.general': -1,
        fechaPublicacion: -1
      })
      .limit(limite);
  },

  // Buscar reseñas por texto
  async buscar(termino, filtros = {}) {
    const query = {
      estado: 'aprobada',
      $or: [
        { 'comentario.titulo': { $regex: termino, $options: 'i' } },
        { 'comentario.texto': { $regex: termino, $options: 'i' } },
        { 'comentario.aspectosPositivos': { $in: [new RegExp(termino, 'i')] } }
      ],
      ...filtros
    };

    return this.find(query)
      .populate('cliente', 'nombre apellido avatar')
      .populate('experto', 'nombre apellido avatar especialidades')
      .sort({ 'calificaciones.general': -1, fechaPublicacion: -1 });
  },

  // Reseñas pendientes de moderación
  async pendientesModeracion() {
    return this.find({ 
      estado: { $in: ['pendiente', 'reportada'] }
    })
    .populate('cliente', 'nombre apellido email')
    .populate('experto', 'nombre apellido email')
    .populate('asesoria', 'codigoAsesoria titulo')
    .sort({ fechaCreacion: 1 });
  },

  // Analizar tendencias
  async analizarTendencias(periodo = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - periodo);

    const pipeline = [
      {
        $match: {
          estado: 'aprobada',
          fechaPublicacion: { $gte: fechaInicio }
        }
      },
      {
        $group: {
          _id: {
            año: { $year: '$fechaPublicacion' },
            mes: { $month: '$fechaPublicacion' },
            dia: { $dayOfMonth: '$fechaPublicacion' }
          },
          totalReseñas: { $sum: 1 },
          promedioCalificacion: { $avg: '$calificaciones.general' },
          totalRecomendaciones: {
            $sum: { $cond: ['$comentario.recomendaria', 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.año': 1, '_id.mes': 1, '_id.dia': 1 }
      }
    ];

    return this.aggregate(pipeline);
  }
};

module.exports = mongoose.model('Reseña', reseñaSchema);
