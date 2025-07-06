/**
 * 🛣️ RUTAS DE DISPONIBILIDAD - SERVITECH
 * Define las rutas para gestión de disponibilidad de expertos
 * Fecha: 6 de julio de 2025
 */

const express = require('express');
const router = express.Router();
const {
  obtenerDisponibilidad,
  obtenerHorariosDisponibles,
  configurarDisponibilidad,
  bloquearHorario
} = require('../controllers/disponibilidadController');

/**
 * GET /api/disponibilidad/:expertoId
 * Obtener calendario de disponibilidad de un experto
 * Params: expertoId
 * Query: fecha, dias
 */
router.get('/:expertoId', obtenerDisponibilidad);

/**
 * GET /api/disponibilidad/:expertoId/horarios
 * Obtener horarios disponibles para una fecha específica
 * Params: expertoId
 * Query: fecha, duracion
 */
router.get('/:expertoId/horarios', obtenerHorariosDisponibles);

/**
 * PUT /api/disponibilidad/:expertoId/configurar
 * Configurar disponibilidad general del experto
 * Params: expertoId
 * Body: horarios, bloqueosTemporales, configuracionGeneral
 */
router.put('/:expertoId/configurar', configurarDisponibilidad);

/**
 * POST /api/disponibilidad/:expertoId/bloquear
 * Bloquear horario temporal
 * Params: expertoId
 * Body: fechaInicio, fechaFin, motivo
 */
router.post('/:expertoId/bloquear', bloquearHorario);

module.exports = router;
