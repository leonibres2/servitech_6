/**
 * 📅 CONTROLADOR DE DISPONIBILIDAD - SERVITECH
 * Gestiona la disponibilidad de horarios de los expertos
 * Fecha: 6 de julio de 2025
 */

const { Usuario, Asesoria } = require('../models/models');

/**
 * 🕐 Obtener disponibilidad de un experto
 */
const obtenerDisponibilidad = async (req, res) => {
  try {
    const { expertoId } = req.params;
    const { 
      fecha = new Date().toISOString().split('T')[0], // Fecha en formato YYYY-MM-DD
      dias = 7 // Número de días a mostrar
    } = req.query;

    // Verificar que el experto existe
    const experto = await Usuario.findById(expertoId);
    if (!experto || !experto.es_experto) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Calcular rango de fechas
    const fechaInicio = new Date(fecha);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + parseInt(dias));

    // Obtener asesorías existentes en el rango
    const asesoriasExistentes = await Asesoria.find({
      experto: expertoId,
      fechaHora: {
        $gte: fechaInicio,
        $lte: fechaFin
      },
      estado: { $in: ['pagada', 'confirmada', 'en-curso'] }
    }).select('fechaHora duracion estado');

    // Generar calendario de disponibilidad
    const calendario = generarCalendarioDisponibilidad(
      fechaInicio,
      dias,
      asesoriasExistentes,
      experto.experto?.horarios || null
    );

    res.json({
      success: true,
      data: {
        experto: {
          id: experto._id,
          nombre: `${experto.nombre} ${experto.apellido}`,
          especialidades: experto.experto?.especialidades || [],
          tarifa: experto.experto?.tarifa_hora || 0
        },
        calendario,
        fechaInicio,
        fechaFin,
        totalDias: parseInt(dias)
      }
    });

  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * 📊 Obtener horarios disponibles para una fecha específica
 */
const obtenerHorariosDisponibles = async (req, res) => {
  try {
    const { expertoId } = req.params;
    const { fecha, duracion = 60 } = req.query;

    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    // Verificar que el experto existe
    const experto = await Usuario.findById(expertoId);
    if (!experto || !experto.es_experto) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    const fechaConsulta = new Date(fecha);
    
    // Obtener asesorías del día
    const inicioDelDia = new Date(fechaConsulta);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(fechaConsulta);
    finDelDia.setHours(23, 59, 59, 999);

    const asesoriasDelDia = await Asesoria.find({
      experto: expertoId,
      fechaHora: {
        $gte: inicioDelDia,
        $lte: finDelDia
      },
      estado: { $in: ['pagada', 'confirmada', 'en-curso'] }
    }).select('fechaHora duracion');

    // Generar slots disponibles
    const horariosDisponibles = generarSlotsDisponibles(
      fechaConsulta,
      parseInt(duracion),
      asesoriasDelDia,
      experto.experto?.horarios || null
    );

    res.json({
      success: true,
      data: {
        fecha: fechaConsulta,
        duracion: parseInt(duracion),
        horariosDisponibles,
        totalSlots: horariosDisponibles.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * ⚙️ Configurar disponibilidad del experto
 */
const configurarDisponibilidad = async (req, res) => {
  try {
    const { expertoId } = req.params;
    const { 
      horarios = {},
      bloqueosTemporales = [],
      configuracionGeneral = {}
    } = req.body;

    // Verificar que el experto existe y el usuario tiene permisos
    const experto = await Usuario.findById(expertoId);
    if (!experto || !experto.es_experto) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Actualizar configuración de disponibilidad
    if (!experto.experto) {
      experto.experto = {};
    }

    experto.experto.horarios = {
      lunes: horarios.lunes || { activo: false, inicio: '09:00', fin: '17:00' },
      martes: horarios.martes || { activo: false, inicio: '09:00', fin: '17:00' },
      miercoles: horarios.miercoles || { activo: false, inicio: '09:00', fin: '17:00' },
      jueves: horarios.jueves || { activo: false, inicio: '09:00', fin: '17:00' },
      viernes: horarios.viernes || { activo: false, inicio: '09:00', fin: '17:00' },
      sabado: horarios.sabado || { activo: false, inicio: '09:00', fin: '17:00' },
      domingo: horarios.domingo || { activo: false, inicio: '09:00', fin: '17:00' }
    };

    experto.experto.bloqueosTemporales = bloqueosTemporales;
    experto.experto.configuracionDisponibilidad = {
      duracionMinima: configuracionGeneral.duracionMinima || 30,
      duracionMaxima: configuracionGeneral.duracionMaxima || 180,
      tiempoAnticipacion: configuracionGeneral.tiempoAnticipacion || 24, // horas
      descansoEntreCitas: configuracionGeneral.descansoEntreCitas || 15, // minutos
      ...configuracionGeneral
    };

    await experto.save();

    res.json({
      success: true,
      message: 'Disponibilidad configurada exitosamente',
      data: {
        horarios: experto.experto.horarios,
        bloqueosTemporales: experto.experto.bloqueosTemporales,
        configuracion: experto.experto.configuracionDisponibilidad
      }
    });

  } catch (error) {
    console.error('Error configurando disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * 🚫 Bloquear horario temporal
 */
const bloquearHorario = async (req, res) => {
  try {
    const { expertoId } = req.params;
    const { fechaInicio, fechaFin, motivo = 'No disponible' } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de inicio y fin son requeridas'
      });
    }

    const experto = await Usuario.findById(expertoId);
    if (!experto || !experto.es_experto) {
      return res.status(404).json({
        success: false,
        message: 'Experto no encontrado'
      });
    }

    // Inicializar si no existe
    if (!experto.experto.bloqueosTemporales) {
      experto.experto.bloqueosTemporales = [];
    }

    // Agregar bloqueo
    const nuevoBloqueo = {
      id: Date.now().toString(),
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      motivo,
      fechaCreacion: new Date()
    };

    experto.experto.bloqueosTemporales.push(nuevoBloqueo);
    await experto.save();

    res.json({
      success: true,
      message: 'Horario bloqueado exitosamente',
      data: nuevoBloqueo
    });

  } catch (error) {
    console.error('Error bloqueando horario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// ============= FUNCIONES AUXILIARES =============

/**
 * Generar calendario de disponibilidad
 */
function generarCalendarioDisponibilidad(fechaInicio, dias, asesoriasExistentes, horariosConfig) {
  const calendario = [];
  
  for (let i = 0; i < dias; i++) {
    const fecha = new Date(fechaInicio);
    fecha.setDate(fecha.getDate() + i);
    
    const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fecha.getDay()];
    
    // Verificar si el día está activo en la configuración
    const configuracionDia = horariosConfig?.[nombreDia] || { activo: true, inicio: '09:00', fin: '17:00' };
    
    // Contar asesorías del día
    const asesoriasDelDia = asesoriasExistentes.filter(asesoria => {
      const fechaAsesoria = new Date(asesoria.fechaHora);
      return fechaAsesoria.toDateString() === fecha.toDateString();
    });
    
    // Calcular slots disponibles aproximados
    let slotsDisponibles = 0;
    if (configuracionDia.activo) {
      const [horaInicio] = configuracionDia.inicio.split(':').map(Number);
      const [horaFin] = configuracionDia.fin.split(':').map(Number);
      const horasLaborales = horaFin - horaInicio;
      const slotsTeóricos = horasLaborales * 2; // Asumiendo slots de 30 min
      slotsDisponibles = Math.max(0, slotsTeóricos - asesoriasDelDia.length);
    }
    
    calendario.push({
      fecha: fecha.toISOString().split('T')[0],
      diaSemana: nombreDia,
      activo: configuracionDia.activo,
      horarioInicio: configuracionDia.inicio,
      horarioFin: configuracionDia.fin,
      asesoriasReservadas: asesoriasDelDia.length,
      slotsDisponibles,
      disponible: configuracionDia.activo && slotsDisponibles > 0
    });
  }
  
  return calendario;
}

/**
 * Generar slots de tiempo disponibles para una fecha
 */
function generarSlotsDisponibles(fecha, duracion, asesoriasExistentes, horariosConfig) {
  const slots = [];
  const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fecha.getDay()];
  
  // Configuración del día
  const configuracionDia = horariosConfig?.[nombreDia] || { activo: true, inicio: '09:00', fin: '17:00' };
  
  if (!configuracionDia.activo) {
    return slots;
  }
  
  // Parsear horarios
  const [horaInicio, minutoInicio] = configuracionDia.inicio.split(':').map(Number);
  const [horaFin, minutoFin] = configuracionDia.fin.split(':').map(Number);
  
  // Generar slots cada 30 minutos
  const inicioDelDia = new Date(fecha);
  inicioDelDia.setHours(horaInicio, minutoInicio, 0, 0);
  
  const finDelDia = new Date(fecha);
  finDelDia.setHours(horaFin, minutoFin, 0, 0);
  
  const ahora = new Date();
  const tiempoAnticipacion = 2 * 60 * 60 * 1000; // 2 horas de anticipación
  
  let horaActual = new Date(inicioDelDia);
  
  while (horaActual.getTime() + (duracion * 60 * 1000) <= finDelDia.getTime()) {
    // Verificar que el slot sea futuro (con anticipación)
    if (horaActual.getTime() <= ahora.getTime() + tiempoAnticipacion) {
      horaActual.setMinutes(horaActual.getMinutes() + 30);
      continue;
    }
    
    // Verificar conflictos con asesorías existentes
    const tieneConflicto = asesoriasExistentes.some(asesoria => {
      const inicioAsesoria = new Date(asesoria.fechaHora);
      const finAsesoria = new Date(inicioAsesoria.getTime() + (asesoria.duracion * 60 * 1000));
      const finSlot = new Date(horaActual.getTime() + (duracion * 60 * 1000));
      
      return (horaActual < finAsesoria && finSlot > inicioAsesoria);
    });
    
    if (!tieneConflicto) {
      slots.push({
        hora: horaActual.toTimeString().slice(0, 5),
        fechaHora: new Date(horaActual),
        disponible: true
      });
    }
    
    // Avanzar 30 minutos
    horaActual.setMinutes(horaActual.getMinutes() + 30);
  }
  
  return slots;
}

module.exports = {
  obtenerDisponibilidad,
  obtenerHorariosDisponibles,
  configurarDisponibilidad,
  bloquearHorario
};
