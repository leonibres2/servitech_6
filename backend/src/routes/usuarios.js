// ===============================
// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas de usuarios
const router = express.Router();

// Importa bcryptjs para el manejo seguro de contraseñas (hash y comparación)
const bcrypt = require("bcryptjs");

// Importa el modelo Usuario desde models.js para interactuar con la base de datos
const { Usuario } = require("../models/models");

// Importa jsonwebtoken para la generación y verificación de tokens JWT
const jwt = require("jsonwebtoken");

// ===============================
// Ruta para login de usuario
// Endpoint: POST /login
// Permite a un usuario autenticarse con email y contraseña, devolviendo un token JWT si es exitoso.
router.post("/login", async (req, res) => {
  // Extrae email y password del cuerpo de la solicitud
  const { email, password } = req.body;
  // Valida que ambos campos estén presentes
  if (!email || !password) {
    // Si faltan campos, responde con error 400 (Bad Request)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    // Busca el usuario por email en la base de datos
    const user = await Usuario.findOne({ email });
    if (!user) {
      // Si no existe el usuario, responde con error de credenciales inválidas
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Compara la contraseña ingresada con el hash almacenado usando bcrypt
    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
      // Si la contraseña no coincide, responde con error de credenciales inválidas
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Genera un token JWT con los datos del usuario (id y email)
    const token = jwt.sign(
      { id: user._id, email: user.email }, // Payload del token
      process.env.JWT_SECRET, // Clave secreta para firmar el token
      { expiresIn: "2h" } // El token expira en 2 horas
    );
    // Convierte el usuario a objeto plano y elimina el hash de la contraseña por seguridad
    const userObj = user.toObject();
    delete userObj.password_hash;
    // Devuelve el usuario autenticado y el token generado
    res.json({ usuario: userObj, token });
  } catch (err) {
    // Maneja errores internos y muestra el error real en consola para depuración
    console.error("Error real en login:", err);
    res
      .status(500)
      .json({ error: "Error al iniciar sesión", detalle: err.message });
  }
});

// ===============================
// Ruta para registrar un nuevo usuario
// Endpoint: POST /
// Permite registrar un nuevo usuario en la base de datos, validando que el email no esté repetido y almacenando la contraseña de forma segura.
router.post("/", async (req, res) => {
  // Extrae los campos requeridos del cuerpo de la solicitud
  const { nombre, apellido, email, password } = req.body;
  // Valida que todos los campos obligatorios estén presentes
  if (!nombre || !apellido || !email || !password) {
    // Si falta algún campo, responde con error 400 (Bad Request)
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    // Muestra en consola los datos recibidos (para depuración y trazabilidad)
    console.log("Intentando registrar usuario:", { nombre, apellido, email });
    // Verifica si el email ya está registrado en la base de datos
    const existe = await Usuario.findOne({ email });
    if (existe) {
      // Si ya existe, responde con error 409 (Conflict) y mensaje descriptivo
      console.log("El correo ya está registrado:", email);
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    // Hashea la contraseña antes de guardarla usando bcrypt (10 saltos)
    const password_hash = await bcrypt.hash(password, 10);
    // Crea una nueva instancia de Usuario con los datos recibidos y valores por defecto
    const nuevoUsuario = new Usuario({
      nombre, // Nombre del usuario
      apellido, // Apellido del usuario
      email, // Email único
      password_hash, // Contraseña hasheada
      es_experto: false, // Por defecto no es experto
      estado: "activo", // Estado inicial
    });

    // Muestra en consola el usuario a guardar (sin el password_hash por seguridad)
    try {
      // Guarda el usuario en la base de datos MongoDB
      const usuarioGuardado = await nuevoUsuario.save();
      console.log("Usuario guardado en MongoDB:", usuarioGuardado);
      // Convierte el usuario guardado a objeto plano y elimina el hash de la contraseña
      const userObj = usuarioGuardado.toObject();
      delete userObj.password_hash;
      // Devuelve el usuario creado y mensaje de éxito
      res
        .status(201)
        .json({ mensaje: "Usuario creado correctamente", usuario: userObj });
    } catch (saveErr) {
      // Si ocurre un error al guardar en la base de datos, lo muestra en consola y responde con 500
      console.error("Error al guardar usuario en MongoDB:", saveErr);
      res
        .status(500)
        .json({ error: "Error al guardar usuario", detalle: saveErr.message });
    }
  } catch (err) {
    // Para errores generales en el proceso de registro
    console.error("Error al crear usuario:", err);
    res
      .status(500)
      .json({ error: "Error al crear usuario", detalle: err.message });
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
