// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas de depuración de usuarios
const router = express.Router();

// Importa el modelo Usuario desde los modelos definidos en la aplicación
const { Usuario } = require("../models/models");

// ===============================
// Endpoint temporal para debug: ver los datos de un usuario por ID
// Ruta: GET /debug/usuario/:id
// Permite consultar los datos completos de un usuario específico usando su ID de base de datos.
// Útil para pruebas y depuración en desarrollo.
router.get("/debug/usuario/:id", async (req, res) => {
  try {
    // Busca el usuario por su ID usando Mongoose
    const usuario = await Usuario.findById(req.params.id);
    // Si no se encuentra el usuario, responde con 404 y mensaje descriptivo
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    // Si se encuentra, responde con los datos del usuario
    res.json({ success: true, data: usuario });
  } catch (err) {
    // Si ocurre un error en la consulta, responde con 500 y el mensaje de error
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================
// Endpoint temporal para debug: ver todos los usuarios registrados (máx 20)
// Ruta: GET /debug/usuarios
// Permite obtener una lista de hasta 20 usuarios registrados en la base de datos.
// Útil para pruebas rápidas y depuración en desarrollo.
router.get("/debug/usuarios", async (req, res) => {
  try {
    // Busca todos los usuarios y limita el resultado a 20 documentos
    const usuarios = await Usuario.find({}).limit(20);
    // Responde con la lista de usuarios encontrados
    res.json({ success: true, data: usuarios });
  } catch (err) {
    // Si ocurre un error en la consulta, responde con 500 y el mensaje de error
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
