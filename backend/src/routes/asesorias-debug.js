// ===============================
// 📄 RUTA DE DEBUG DE ASESORÍAS
// Este archivo define un endpoint temporal para depuración (debug) que permite
// consultar rápidamente las últimas 10 asesorías registradas en el sistema.
// Cada línea está documentada para explicar su propósito y funcionamiento.
// ===============================

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa el modelo Asesoria desde el archivo de modelos centralizados
const { Asesoria } = require("../models/models");

// ===============================
// 🚧 ENDPOINT DE DEBUG: /debug/asesorias
// Permite obtener las últimas 10 asesorías creadas, ordenadas de la más reciente a la más antigua.
// Útil para pruebas rápidas y monitoreo durante el desarrollo.
router.get("/debug/asesorias", async (req, res) => {
  try {
    // Busca todas las asesorías, las ordena por fechaHora descendente y limita a 10 resultados
    const asesorias = await Asesoria.find({}) // Consulta sin filtros (todas las asesorías)
      .sort({ fechaHora: -1 }) // Ordena por fechaHora descendente (más reciente primero)
      .limit(10); // Limita a 10 resultados

    // Responde con un JSON que indica éxito y devuelve los datos encontrados
    res.json({ success: true, data: asesorias });
  } catch (err) {
    // Si ocurre un error, responde con código 500 y el mensaje de error
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
