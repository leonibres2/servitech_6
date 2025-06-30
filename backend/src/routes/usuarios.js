// Importa express y crea un router
const express = require('express');
const router = express.Router();
// Importa bcryptjs para el manejo seguro de contraseñas
const bcrypt = require('bcryptjs');     
// Importa el modelo Usuario desde models.js
const { Usuario } = require('../models/models');
const jwt = require('jsonwebtoken');

// Ruta para login de usuario
router.post('/login', async (req, res) => {  
  // Extrae email y password de la solicitud
  const { email, password } = req.body;
  if (!email || !password) {
    // Si faltan campos, responde con error 400
    return res.status(400).json({ error: "Faltan campos obligatorios" }); 
  }

  try {
    // Busca el usuario por email
    const user = await Usuario.findOne({ email }); 
    if (!user) { 
      // Si no existe, responde con error de credenciales
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Compara la contraseña ingresada con el hash almacenado
    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
      // Si la contraseña no coincide, responde con error
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Genera un token JWT con los datos del usuario
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET, // <--- CORREGIDO
      { expiresIn: "2h" }
    );
    // Elimina el hash de la respuesta por seguridad
    const userObj = user.toObject();
    delete userObj.password_hash;
    // Devuelve el usuario y el token
    res.json({ usuario: userObj, token });
  } catch (err) {
    // Maneja errores internos y muestra el error real en consola
    console.error("Error real en login:", err);
    res.status(500).json({ error: "Error al iniciar sesión", detalle: err.message });
  }
});

// Ruta para registrar un nuevo usuario
router.post('/', async (req, res) => {
  // Extrae los campos requeridos del cuerpo de la solicitud
  const { nombre, apellido, email, password } = req.body;
  if (!nombre || !apellido || !email || !password) {
    // Si falta algún campo, responde con error 400
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    // Muestra en consola los datos recibidos (para depuración)
    console.log("Intentando registrar usuario:", { nombre, apellido, email });
    // Verifica si el email ya está registrado
    const existe = await Usuario.findOne({ email });
    if (existe) {
      // Si ya existe, responde con error 409
      console.log("El correo ya está registrado:", email);
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    // Hashea la contraseña antes de guardarla
    const password_hash = await bcrypt.hash(password, 10);
    // Crea una nueva instancia de Usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email,
      password_hash,
      es_experto: false,
      estado: "activo"
    });

    // Muestra en consola el usuario a guardar (sin el passwrod_hash por seguridad)
    try {
      // Guarda el usuario en la base de datos
      const usuarioGuardado = await nuevoUsuario.save();
      console.log("Usuario guardado en MongoDB:", usuarioGuardado);
      // Elimina el hash de la respuesta por seguridad
      const userObj = usuarioGuardado.toObject();
      delete userObj.password_hash;
      // Devuelve el usuario creado
      res.status(201).json({ mensaje: "Usuario creado correctamente", usuario: userObj });
    } catch (saveErr) {
      // Por si hay errores al guardar en la base de datos
      console.error("Error al guardar usuario en MongoDB:", saveErr);
      res.status(500).json({ error: "Error al guardar usuario", detalle: saveErr.message });
    }
  } catch (err) {
    // Para errores generales
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear usuario", detalle: err.message });
  }
});

// Exporta el router para ser usado en app.js
module.exports = router;
