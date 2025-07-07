/**
 * ⚙️ MODELO DE CONFIGURACIÓN - SERVITECH
 * Gestiona las configuraciones del sistema y usuarios
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 🌐 Configuración global del sistema
const configuracionSistemaSchema = new Schema({
  // 🆔 Identificación
  clave: {
    type: String,
    unique: true,
    required: true
  },
  
  // 📝 Información
  nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  categoria: {
    type: String,
    enum: [
      'general',
      'pagos',
      'notificaciones',
      'seguridad',
      'apis',
      'emails',
      'mantenimiento',
      'apariencia',
      'limites',
      'videollamadas'
    ],
    default: 'general'
  },

  // 💾 Valor y tipo
  valor: {
    type: Schema.Types.Mixed,
    required: true
  },
  tipoValor: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object', 'json'],
    required: true
  },
  valorDefecto: Schema.Types.Mixed,

  // 🔒 Permisos y validación
  esPublica: {
    type: Boolean,
    default: false // Por defecto las configuraciones son privadas
  },
  esSoloLectura: {
    type: Boolean,
    default: false
  },
  requiereReinicio: {
    type: Boolean,
    default: false
  },
  validacion: {
    minimo: Number,
    maximo: Number,
    patron: String, // Regex pattern
    opciones: [String], // Valores válidos
    requerido: Boolean
  },

  // 🏷️ Metadatos
  etiquetas: [String],
  version: {
    type: Number,
    default: 1
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  actualizadaPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true,
  collection: 'configuraciones_sistema'
});

// 👤 Configuración personal de usuarios
const configuracionUsuarioSchema = new Schema({
  // 👤 Usuario propietario
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // 🔔 Notificaciones
  notificaciones: {
    email: {
      asesorias: { type: Boolean, default: true },
      mensajes: { type: Boolean, default: true },
      promociones: { type: Boolean, default: false },
      recordatorios: { type: Boolean, default: true },
      actualizaciones: { type: Boolean, default: false }
    },
    push: {
      asesorias: { type: Boolean, default: true },
      mensajes: { type: Boolean, default: true },
      promociones: { type: Boolean, default: false },
      recordatorios: { type: Boolean, default: true }
    },
    sms: {
      asesorias: { type: Boolean, default: false },
      recordatorios: { type: Boolean, default: false },
      seguridad: { type: Boolean, default: true }
    },
    inApp: {
      sonidos: { type: Boolean, default: true },
      vibracion: { type: Boolean, default: true },
      mostrarPrevisualizacion: { type: Boolean, default: true }
    }
  },

  // 🎨 Preferencias de interfaz
  interfaz: {
    tema: {
      type: String,
      enum: ['claro', 'oscuro', 'auto'],
      default: 'auto'
    },
    idioma: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    },
    zonaHoraria: {
      type: String,
      default: 'America/Bogota'
    },
    formatoFecha: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    formatoHora: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    densidadInformacion: {
      type: String,
      enum: ['compacta', 'normal', 'espaciosa'],
      default: 'normal'
    }
  },

  // 📅 Preferencias de calendario
  calendario: {
    vistaPredeterminada: {
      type: String,
      enum: ['mes', 'semana', 'dia', 'lista'],
      default: 'semana'
    },
    horaInicio: {
      type: Number,
      min: 0,
      max: 23,
      default: 8
    },
    horaFin: {
      type: Number,
      min: 0,
      max: 23,
      default: 20
    },
    mostrarFinesSemana: {
      type: Boolean,
      default: true
    },
    recordatorioDefault: {
      type: Number,
      default: 30 // minutos antes
    }
  },

  // 🎥 Configuración de videollamadas
  videollamadas: {
    camaraDefault: {
      type: Boolean,
      default: true
    },
    microfonoDefault: {
      type: Boolean,
      default: true
    },
    calidadVideo: {
      type: String,
      enum: ['baja', 'media', 'alta', 'auto'],
      default: 'auto'
    },
    grabacionAutomatica: {
      type: Boolean,
      default: false
    },
    compartirPantallaDefault: {
      type: Boolean,
      default: false
    }
  },

  // 🔒 Privacidad y seguridad
  privacidad: {
    perfilPublico: {
      type: Boolean,
      default: true
    },
    mostrarEstadoEnLinea: {
      type: Boolean,
      default: true
    },
    permitirContactoDesconocidos: {
      type: Boolean,
      default: false
    },
    autenticacionDosFactor: {
      type: Boolean,
      default: false
    },
    sesionesMultiples: {
      type: Boolean,
      default: true
    }
  },

  // 💰 Preferencias de pago
  pagos: {
    metodoPredeterminado: {
      type: String,
      enum: ['tarjeta', 'pse', 'nequi', 'payu', 'daviplata'],
      default: 'tarjeta'
    },
    guardarMetodos: {
      type: Boolean,
      default: true
    },
    facturaAutomatica: {
      type: Boolean,
      default: false
    },
    monedaPredeterminada: {
      type: String,
      default: 'COP'
    }
  },

  // 📊 Configuración de experto (solo para expertos)
  experto: {
    disponibilidadAutomatica: {
      type: Boolean,
      default: true
    },
    aceptarAsesorias: {
      type: Boolean,
      default: true
    },
    respuestaAutomatica: {
      activa: { type: Boolean, default: false },
      mensaje: { type: String, maxlength: 500 }
    },
    tarifasPersonalizadas: {
      type: Boolean,
      default: false
    },
    tiempoRespuesta: {
      type: Number,
      default: 60 // minutos
    }
  },

  // 📱 Configuración móvil
  movil: {
    sincronizarContactos: {
      type: Boolean,
      default: false
    },
    usarDatosCelular: {
      type: Boolean,
      default: true
    },
    descargarArchivosAuto: {
      type: Boolean,
      default: false
    }
  },

  // 🎯 Preferencias personalizadas (clave-valor libre)
  personalizada: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },

  // 📅 Metadatos
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
  collection: 'configuraciones_usuario'
});

// 📌 Índices
// clave ya tiene índice unique automático
configuracionSistemaSchema.index({ categoria: 1 });
configuracionSistemaSchema.index({ esPublica: 1 });

configuracionUsuarioSchema.index({ usuario: 1 });

// 🔄 Middleware para configuración del sistema
configuracionSistemaSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  if (this.isModified('valor')) {
    this.version += 1;
  }
  next();
});

// 🔄 Middleware para configuración de usuario
configuracionUsuarioSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  next();
});

// 📋 Métodos para configuración del sistema
configuracionSistemaSchema.methods = {
  // Validar valor según reglas
  validarValor(nuevoValor) {
    const validacion = this.validacion;
    
    if (validacion.requerido && !nuevoValor) {
      throw new Error('Valor requerido');
    }
    
    if (this.tipoValor === 'number') {
      if (validacion.minimo !== undefined && nuevoValor < validacion.minimo) {
        throw new Error(`Valor mínimo: ${validacion.minimo}`);
      }
      if (validacion.maximo !== undefined && nuevoValor > validacion.maximo) {
        throw new Error(`Valor máximo: ${validacion.maximo}`);
      }
    }
    
    if (validacion.opciones && !validacion.opciones.includes(nuevoValor)) {
      throw new Error(`Valor debe ser uno de: ${validacion.opciones.join(', ')}`);
    }
    
    if (validacion.patron) {
      const regex = new RegExp(validacion.patron);
      if (!regex.test(nuevoValor)) {
        throw new Error('Valor no cumple el patrón requerido');
      }
    }
    
    return true;
  },

  // Actualizar valor con validación
  async actualizarValor(nuevoValor, usuarioId) {
    this.validarValor(nuevoValor);
    this.valor = nuevoValor;
    this.actualizadaPor = usuarioId;
    return this.save();
  }
};

// 📋 Métodos para configuración de usuario
configuracionUsuarioSchema.methods = {
  // Obtener configuración específica
  obtener(ruta) {
    const partes = ruta.split('.');
    let valor = this.toObject();
    
    for (const parte of partes) {
      valor = valor[parte];
      if (valor === undefined) break;
    }
    
    return valor;
  },

  // Establecer configuración específica
  async establecer(ruta, valor) {
    const partes = ruta.split('.');
    let objeto = this;
    
    for (let i = 0; i < partes.length - 1; i++) {
      if (!objeto[partes[i]]) {
        objeto[partes[i]] = {};
      }
      objeto = objeto[partes[i]];
    }
    
    objeto[partes[partes.length - 1]] = valor;
    return this.save();
  },

  // Restablecer a valores por defecto
  async restablecerDefecto() {
    const defecto = new this.constructor();
    const campos = [
      'notificaciones',
      'interfaz',
      'calendario',
      'videollamadas',
      'privacidad',
      'pagos',
      'experto',
      'movil'
    ];
    
    for (const campo of campos) {
      this[campo] = defecto[campo];
    }
    
    return this.save();
  }
};

// 📊 Métodos estáticos para configuración del sistema
configuracionSistemaSchema.statics = {
  // Obtener configuración por clave
  async obtenerPorClave(clave) {
    return this.findOne({ clave });
  },

  // Obtener configuraciones públicas
  async obtenerPublicas() {
    return this.find({ esPublica: true }).select('clave nombre valor tipoValor descripcion');
  },

  // Obtener por categoría
  async obtenerPorCategoria(categoria) {
    return this.find({ categoria }).sort({ nombre: 1 });
  },

  // Crear configuración predeterminada del sistema
  async crearConfiguracionesDefecto() {
    const configuraciones = [
      {
        clave: 'app.nombre',
        nombre: 'Nombre de la aplicación',
        valor: 'ServiTech',
        tipoValor: 'string',
        categoria: 'general',
        esPublica: true
      },
      {
        clave: 'app.version',
        nombre: 'Versión de la aplicación',
        valor: '1.0.0',
        tipoValor: 'string',
        categoria: 'general',
        esPublica: true
      },
      {
        clave: 'pagos.comision_plataforma',
        nombre: 'Comisión de la plataforma (%)',
        valor: 10,
        tipoValor: 'number',
        categoria: 'pagos',
        validacion: { minimo: 0, maximo: 50 }
      },
      {
        clave: 'asesorias.duracion_maxima',
        nombre: 'Duración máxima de asesoría (minutos)',
        valor: 180,
        tipoValor: 'number',
        categoria: 'general',
        validacion: { minimo: 30, maximo: 480 }
      },
      {
        clave: 'notificaciones.recordatorio_default',
        nombre: 'Recordatorio por defecto (minutos)',
        valor: 30,
        tipoValor: 'number',
        categoria: 'notificaciones',
        validacion: { minimo: 5, maximo: 1440 }
      },
      {
        clave: 'videollamadas.grabacion_automatica',
        nombre: 'Grabación automática habilitada',
        valor: false,
        tipoValor: 'boolean',
        categoria: 'videollamadas'
      },
      {
        clave: 'mantenimiento.modo_activo',
        nombre: 'Modo mantenimiento activo',
        valor: false,
        tipoValor: 'boolean',
        categoria: 'mantenimiento',
        requiereReinicio: true
      }
    ];

    for (const config of configuraciones) {
      await this.findOneAndUpdate(
        { clave: config.clave },
        config,
        { upsert: true, new: true }
      );
    }
  }
};

// 📊 Métodos estáticos para configuración de usuario
configuracionUsuarioSchema.statics = {
  // Obtener o crear configuración de usuario
  async obtenerOCrear(usuarioId) {
    let config = await this.findOne({ usuario: usuarioId });
    
    if (!config) {
      config = new this({ usuario: usuarioId });
      await config.save();
    }
    
    return config;
  },

  // Actualizar configuración masiva
  async actualizarMasiva(filtro, actualizacion) {
    return this.updateMany(filtro, { 
      $set: actualizacion,
      $inc: { version: 1 }
    });
  },

  // Estadísticas de configuraciones
  async estadisticas() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsuarios: { $sum: 1 },
          notificacionesEmailActivas: {
            $sum: { $cond: ['$notificaciones.email.asesorias', 1, 0] }
          },
          notificacionesPushActivas: {
            $sum: { $cond: ['$notificaciones.push.asesorias', 1, 0] }
          },
          temasPopulares: { $push: '$interfaz.tema' }
        }
      }
    ];
    
    return this.aggregate(pipeline);
  }
};

// 📤 Exportar modelos
const ConfiguracionSistema = mongoose.model('ConfiguracionSistema', configuracionSistemaSchema);
const ConfiguracionUsuario = mongoose.model('ConfiguracionUsuario', configuracionUsuarioSchema);

module.exports = { ConfiguracionSistema, ConfiguracionUsuario };
