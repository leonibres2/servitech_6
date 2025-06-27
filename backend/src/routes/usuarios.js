const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Usuario } = require('../models/models');

// Ruta para login de usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Generar token JWT (puedes personalizar el payload y el secreto)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secreto123",
      { expiresIn: "2h" }
    );
    const userObj = user.toObject();
    delete userObj.password_hash;
    res.json({ usuario: userObj, token });
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// Ejemplo: Registrar usuario
router.post('/', async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    console.log("Intentando registrar usuario:", { nombre, apellido, email });
    const existe = await Usuario.findOne({ email });
    if (existe) {
      console.log("El correo ya está registrado:", email);
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password_hash,
      es_experto: false,
      estado: "activo"
    });
    try {
      const usuarioGuardado = await nuevoUsuario.save();
      console.log("Usuario guardado en MongoDB:", usuarioGuardado);
      const userObj = usuarioGuardado.toObject();
      delete userObj.password_hash;
      res.status(201).json({ mensaje: "Usuario creado correctamente", usuario: userObj });
    } catch (saveErr) {
      console.error("Error al guardar usuario en MongoDB:", saveErr);
      res.status(500).json({ error: "Error al guardar usuario", detalle: saveErr.message });
    }
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear usuario", detalle: err.message });
  }
});

module.exports = router;
