/**
 * 📅 MODELO DE DISPONIBILIDAD DE EXPERTOS - SERVITECH
 * Gestiona los horarios disponibles de los expertos
 * Fecha: 6 de julio de 2025
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const disponibilidadSchema = new Schema({
  // 👨‍💼 Experto al que pertenece la disponibilidad
  experto: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },

  // 📅 Configuración de horarios recurrentes
  horarioRecurrente: {
    habilitado: { type: Boolean, default: true },
    horarios: [{
      diaSemana: {
        type: Number, // 0=Domingo, 1=Lunes, ... 6=Sábado
        required: true,
        min: 0,
        max: 6
      },
      horaInicio: {
        type: String, // Formato "HH:mm" (ej: "09:00")
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      horaFin: {
        type: String, // Formato "HH:mm" (ej: "18:00")
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      activo: { type: Boolean, default: true }
    }]
  },

  // 🚫 Bloques específicos no disponibles
  bloquesNoDisponibles: [{
    fechaInicio: { type: Date, required: true },
    fechaFin: { type: Date, required: true },
    motivo: {
      type: String,
      enum: ['vacaciones', 'enfermedad', 'capacitacion', 'personal', 'mantenimiento'],
      required: true
    },
    descripcion: String,
    fechaCreacion: { type: Date, default: Date.now }
  }],

  // ⏰ Slots específicos habilitados (fuera del horario normal)
  slotsEspeciales: [{
    fecha: { type: Date, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    duracion: { type: Number, default: 60 }, // minutos
    precio: Number, // Precio especial si aplica
    motivo: String,
    fechaCreacion: { type: Date, default: Date.now }
  }],

  // ⚙️ Configuraciones del experto
  configuracion: {
    duracionMinima: { type: Number, default: 30 }, // minutos
    duracionMaxima: { type: Number, default: 120 }, // minutos
    incrementos: { type: Number, default: 30 }, // cada cuántos minutos
    tiempoAnticipacion: { type: Number, default: 120 }, // minutos de anticipación mínima
    tiempoMaximoReserva: { type: Number, default: 30 }, // días máximos para reservar
    pausaEntreAsesorias: { type: Number, default: 15 }, // minutos entre asesorías
    
    // 💰 Precios por duración
    precios: [{
      duracion: Number,
      precio: Number
    }],
    
    // 🌍 Zona horaria
    zonaHoraria: { type: String, default: 'America/Bogota' },
    
    // 📱 Notificaciones
    notificaciones: {
      nuevaReserva: { type: Boolean, default: true },
      recordatorio: { type: Boolean, default: true },
      tiempoRecordatorio: { type: Number, default: 60 } // minutos antes
    }
  },

  // 📊 Estado general
  activo: { type: Boolean, default: true },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'disponibilidades'
});

// 📌 Índices para optimizar consultas
disponibilidadSchema.index({ experto: 1 });
disponibilidadSchema.index({ 'bloquesNoDisponibles.fechaInicio': 1, 'bloquesNoDisponibles.fechaFin': 1 });
disponibilidadSchema.index({ 'slotsEspeciales.fecha': 1 });

// 🔄 Middleware para actualizar fechaActualizacion
disponibilidadSchema.pre('save', function(next) {
  this.fechaActualizacion = new Date();
  next();
});

// 📋 Métodos del modelo
disponibilidadSchema.methods = {
  
  // Verificar si un día está disponible
  estaDiaDisponible(fecha) {
    const diaSemana = fecha.getDay();
    const horarioDelDia = this.horarioRecurrente.horarios.find(h => 
      h.diaSemana === diaSemana && h.activo
    );
    
    if (!horarioDelDia) return false;
    
    // Verificar bloques no disponibles
    const estaBloquedo = this.bloquesNoDisponibles.some(bloque => 
      fecha >= bloque.fechaInicio && fecha <= bloque.fechaFin
    );
    
    return !estaBloquedo;
  },

  // Obtener horario de un día específico
  obtenerHorarioDia(fecha) {
    const diaSemana = fecha.getDay();
    const horario = this.horarioRecurrente.horarios.find(h => 
      h.diaSemana === diaSemana && h.activo
    );
    
    if (!horario) return null;
    
    return {
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      duracionMinima: this.configuracion.duracionMinima,
      incrementos: this.configuracion.incrementos
    };
  },

  // Generar slots disponibles para una fecha
  generarSlotsDisponibles(fecha, asesoriesExistentes = []) {
    const slots = [];
    const horario = this.obtenerHorarioDia(fecha);
    
    if (!horario || !this.estaDiaDisponible(fecha)) {
      return slots;
    }
    
    // Convertir horarios a minutos desde medianoche
    const [inicioHora, inicioMin] = horario.horaInicio.split(':').map(Number);
    const [finHora, finMin] = horario.horaFin.split(':').map(Number);
    
    const inicioMinutos = inicioHora * 60 + inicioMin;
    const finMinutos = finHora * 60 + finMin;
    
    // Generar slots cada X minutos
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += this.configuracion.incrementos) {
      const horaSlot = Math.floor(minutos / 60);
      const minSlot = minutos % 60;
      
      const fechaHoraSlot = new Date(fecha);
      fechaHoraSlot.setHours(horaSlot, minSlot, 0, 0);
      
      // Verificar que no hay conflicto con asesorías existentes
      const hayConflicto = asesoriesExistentes.some(asesoria => {
        const inicioAsesoria = new Date(asesoria.fechaHora);
        const finAsesoria = new Date(inicioAsesoria.getTime() + asesoria.duracion * 60000);
        const finSlot = new Date(fechaHoraSlot.getTime() + this.configuracion.duracionMinima * 60000);
        
        return (fechaHoraSlot < finAsesoria && finSlot > inicioAsesoria);
      });
      
      if (!hayConflicto) {
        slots.push({
          fechaHora: fechaHoraSlot,
          disponible: true,
          duracionesDisponibles: this.configuracion.precios.map(p => ({
            duracion: p.duracion,
            precio: p.precio
          }))
        });
      }
    }
    
    return slots;
  },

  // Bloquear un período
  bloquearPeriodo(fechaInicio, fechaFin, motivo, descripcion = '') {
    this.bloquesNoDisponibles.push({
      fechaInicio,
      fechaFin,
      motivo,
      descripcion,
      fechaCreacion: new Date()
    });
    return this.save();
  }
};

// 📊 Métodos estáticos
disponibilidadSchema.statics = {
  
  // Buscar disponibilidad por experto
  async porExperto(expertoId) {
    return this.findOne({ experto: expertoId, activo: true });
  },

  // Crear disponibilidad por defecto para nuevo experto
  async crearPorDefecto(expertoId) {
    const horarioDefecto = [
      { diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', activo: true }, // Lunes
      { diaSemana: 2, horaInicio: '09:00', horaFin: '17:00', activo: true }, // Martes
      { diaSemana: 3, horaInicio: '09:00', horaFin: '17:00', activo: true }, // Miércoles
      { diaSemana: 4, horaInicio: '09:00', horaFin: '17:00', activo: true }, // Jueves
      { diaSemana: 5, horaInicio: '09:00', horaFin: '17:00', activo: true }  // Viernes
    ];

    const preciosDefecto = [
      { duracion: 30, precio: 50000 },
      { duracion: 60, precio: 90000 },
      { duracion: 90, precio: 130000 },
      { duracion: 120, precio: 160000 }
    ];

    return this.create({
      experto: expertoId,
      horarioRecurrente: {
        habilitado: true,
        horarios: horarioDefecto
      },
      configuracion: {
        duracionMinima: 30,
        duracionMaxima: 120,
        incrementos: 30,
        tiempoAnticipacion: 120,
        tiempoMaximoReserva: 30,
        pausaEntreAsesorias: 15,
        precios: preciosDefecto,
        zonaHoraria: 'America/Bogota'
      },
      activo: true
    });
  },

  // Obtener slots disponibles para múltiples expertos
  async obtenerSlotsMultiples(expertosIds, fechaInicio, fechaFin) {
    const resultados = {};
    
    for (const expertoId of expertosIds) {
      const disponibilidad = await this.porExperto(expertoId);
      if (disponibilidad) {
        resultados[expertoId] = await disponibilidad.generarSlotsDisponibles(fechaInicio);
      }
    }
    
    return resultados;
  }
};

module.exports = mongoose.model('Disponibilidad', disponibilidadSchema);
