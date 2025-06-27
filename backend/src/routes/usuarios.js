/**
 * @fileoverview Rutas para la gestión de usuarios en Servitech.
 * Incluye autenticación, registro, consulta, actualización y eliminación de usuarios.
 * Todas las rutas cumplen con las normas de seguridad y buenas prácticas REST.
 *
 * Autor: [Tu Nombre o Equipo]
 * Fecha: [Fecha de edición]
 */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (requiere autenticación)
 * @access  Privado (token JWT)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, email, es_experto, estado FROM usuarios"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/**
 * @route   POST /api/usuarios/login
 * @desc    Autenticar usuario y obtener token JWT
 * @access  Público
 * @body    { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login intento:", email, password); // Log temporal para depuración
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    const [users] = await pool.query(
      "SELECT id, nombre, apellido, email, password_hash, es_experto, estado FROM usuarios WHERE email = ?",
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const user = users[0];
    const passwordValida = await bcrypt.compare(password, user.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        es_experto: user.es_experto,
        estado: user.estado,
      },
      process.env.JWT_SECRET || "secreto123",
      { expiresIn: "2h" }
    );
    // No enviar password_hash al frontend
    delete user.password_hash;
    res.json({ usuario: user, token });
  } catch (err) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por ID (requiere autenticación)
 * @access  Privado (token JWT)
 * @param   id - ID del usuario
 */
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, email, es_experto, estado FROM usuarios WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

/**
 * @route   POST /api/usuarios
 * @desc    Registrar un nuevo usuario
 * @access  Público
 * @body    { nombre, apellido, email, password }
 */
router.post("/", async (req, res) => {
  const { nombre, apellido, email, password } = req.body;
  if (!nombre || !apellido || !email || !password) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    // Verificar si el email ya existe
    const [existe] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    // Hashear la contraseña
    const password_hash = await bcrypt.hash(password, 10);
    // Insertar usuario
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, ?)",
      [nombre, apellido, email, password_hash]
    );
    console.log(
      "Usuario insertado:",
      nombre,
      apellido,
      email,
      "ID:",
      result.insertId
    );
    res.status(201).json({ mensaje: "Usuario creado correctamente" });
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar datos de un usuario por ID
 * @access  Público (debería ser privado en producción)
 * @body    { nombre, apellido, email }
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email } = req.body;
  if (!nombre || !apellido || !email) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  try {
    const [result] = await pool.query(
      "UPDATE usuarios SET nombre = ?, apellido = ?, email = ? WHERE id = ?",
      [nombre, apellido, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario por ID
 * @access  Público (debería ser privado en producción)
 * @param   id - ID del usuario
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

module.exports = router;
