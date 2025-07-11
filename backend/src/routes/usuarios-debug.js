const express = require("express");
const router = express.Router();
const { Usuario } = require("../models/models");

// Endpoint temporal para debug: ver los datos de un usuario por ID
router.get("/debug/usuario/:id", async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }
    res.json({ success: true, data: usuario });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint temporal para debug: ver todos los usuarios registrados (máx 20)
router.get("/debug/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find({}).limit(20);
    res.json({ success: true, data: usuarios });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
