const express = require("express");
const router = express.Router();
const { Asesoria } = require("../models/models");

// Endpoint temporal para debug: ver las últimas 10 asesorías
router.get("/debug/asesorias", async (req, res) => {
  try {
    const asesorias = await Asesoria.find({}).sort({ fechaHora: -1 }).limit(10);
    res.json({ success: true, data: asesorias });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
