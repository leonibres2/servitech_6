/**
 * 🛣️ RUTAS DE DISPONIBILIDAD - SERVITECH
 * Este archivo define todas las rutas HTTP para la gestión de la disponibilidad de expertos.
 * Cada línea está documentada para explicar su propósito, parámetros y funcionamiento.
 * Fecha: 6 de julio de 2025
 */

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa los controladores de disponibilidad desde el controlador centralizado
const {
  obtenerDisponibilidad, // Controlador para obtener el calendario de disponibilidad de un experto
  obtenerHorariosDisponibles, // Controlador para obtener horarios disponibles en una fecha
  configurarDisponibilidad, // Controlador para configurar la disponibilidad general del experto
  bloquearHorario, // Controlador para bloquear un horario temporalmente
} = require("../controllers/disponibilidadController");

/**
 * GET /api/disponibilidad/:expertoId
 * Ruta para obtener el calendario de disponibilidad de un experto.
 * Params: expertoId (ID del experto)
 * Query: fecha (fecha base), dias (cantidad de días a mostrar)
 * Ejemplo: /api/disponibilidad/123?fecha=2025-07-22&dias=7
 */
router.get("/:expertoId", obtenerDisponibilidad);

/**
 * GET /api/disponibilidad/:expertoId/horarios
 * Ruta para obtener los horarios disponibles de un experto en una fecha específica.
 * Params: expertoId (ID del experto)
 * Query: fecha (fecha a consultar), duracion (minutos)
 * Ejemplo: /api/disponibilidad/123/horarios?fecha=2025-07-22&duracion=60
 */
router.get("/:expertoId/horarios", obtenerHorariosDisponibles);

/**
 * PUT /api/disponibilidad/:expertoId/configurar
 * Ruta para configurar la disponibilidad general del experto.
 * Params: expertoId (ID del experto)
 * Body: horarios (array de horarios), bloqueosTemporales (array), configuracionGeneral (objeto)
 * Ejemplo de body: { horarios: [...], bloqueosTemporales: [...], configuracionGeneral: {...} }
 */
router.put("/:expertoId/configurar", configurarDisponibilidad);

/**
 * POST /api/disponibilidad/:expertoId/bloquear
 * Ruta para bloquear un horario temporalmente para un experto.
 * Params: expertoId (ID del experto)
 * Body: fechaInicio (inicio del bloqueo), fechaFin (fin del bloqueo), motivo (opcional)
 * Ejemplo de body: { fechaInicio: '2025-07-22T10:00:00Z', fechaFin: '2025-07-22T12:00:00Z', motivo: 'Reunión interna' }
 */
router.post("/:expertoId/bloquear", bloquearHorario);

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
