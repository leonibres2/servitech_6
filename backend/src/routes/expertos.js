// ===============================
// 📄 RUTAS DE EXPERTOS
// Este archivo define todas las rutas HTTP para la gestión de expertos en el sistema.
// Cada línea está documentada para explicar su propósito y funcionamiento.
// ===============================

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Importa mongoose para validaciones y manejo de IDs
const mongoose = require("mongoose");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa el modelo de expertos para interactuar con la colección de expertos en MongoDB
const Experto = require("../models/expertos");

// Importa el modelo de usuarios para validar la existencia de usuarios al crear expertos
const { Usuario } = require("../models/models");

// ===============================
// 📋 OBTENER TODOS LOS EXPERTOS
// GET /api/expertos
// Devuelve un listado de todos los expertos registrados, incluyendo los datos del usuario relacionado.
router.get("/", async (req, res) => {
  try {
    // Busca todos los expertos y usa populate para traer los datos del usuario asociado
    const expertos = await Experto.find().populate("userId");
    // Devuelve el listado en formato JSON
    res.json(expertos);
  } catch (err) {
    // Si ocurre un error, responde con 500 y el mensaje de error
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// 🗓️ RENDERIZAR CALENDARIO DE UN EXPERTO
// GET /api/expertos/:id/calendario
// Renderiza la vista del calendario para un experto específico.
// Si el ID no es válido o el experto no existe, usa datos de prueba.
router.get("/:id/calendario", async (req, res) => {
  try {
    // Si el ID no es válido para MongoDB, usar datos de prueba
    let experto;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(
        `⚠️ ID de experto inválido: ${req.params.id}, usando datos de prueba para calendario`
      );
      // Datos de prueba para cuando el ID no es válido
      experto = {
        _id: new mongoose.Types.ObjectId(),
        userId: {
          nombre: "María",
          apellido: "Rodríguez",
          email: "maria.rodriguez@example.com",
          telefono: "+57 300 123 4567",
          foto: "/assets/img/default-avatar.png",
        },
        especialidad: "Desarrollo Web",
        descripcion:
          "Especialista en desarrollo web full-stack con 10 años de experiencia",
        activo: true,
        categorias: [],
      };
    } else {
      // Busca el experto por ID y pobla los datos relacionados
      experto = await Experto.findById(req.params.id)
        .populate("userId")
        .populate("categorias");
      // Si no se encuentra el experto, usa datos de prueba
      if (!experto) {
        console.log(
          `⚠️ Experto no encontrado con ID: ${req.params.id}, usando datos de prueba para calendario`
        );
        experto = {
          _id: req.params.id,
          userId: {
            nombre: "María",
            apellido: "Rodríguez",
            email: "maria.rodriguez@example.com",
            telefono: "+57 300 123 4567",
            foto: "/assets/img/default-avatar.png",
          },
          especialidad: "Desarrollo Web",
          descripcion:
            "Especialista en desarrollo web full-stack con 10 años de experiencia",
          activo: true,
          categorias: [],
        };
      }
    }

    // Renderiza la vista del calendario con los datos del experto
    res.render("calendario", {
      experto: experto,
      usuario: experto.userId || experto, // Fallback para modelo antiguo
      pageTitle: `Agendar cita con ${
        experto.userId ? experto.userId.nombre : experto.nombre || "Experto"
      }`,
      expertoSeleccionado: {
        id: experto._id,
        nombre: experto.userId ? experto.userId.nombre : experto.nombre,
        apellido: experto.userId
          ? experto.userId.apellido || ""
          : experto.apellido || "",
        email: experto.userId ? experto.userId.email : experto.email,
        telefono: experto.userId
          ? experto.userId.telefono || ""
          : experto.telefono || "",
        especialidad: experto.especialidad,
        descripcion:
          experto.descripcion ||
          (experto.userId
            ? `Especialista en ${experto.especialidad}`
            : `Especialista en ${experto.especialidad} con ${
                experto.experiencia || "varios"
              } años de experiencia`),
        foto: experto.userId
          ? experto.userId.foto || "/assets/img/default-avatar.png"
          : experto.foto || "/assets/img/default-avatar.png",
        categorias: experto.categorias,
      },
    });
  } catch (err) {
    // Si ocurre un error, imprime en consola y renderiza mensaje de error
    console.error("Error al obtener experto para calendario:", err);
    res.status(500).send(`
      <div style="text-align: center; padding: 50px;">
        <h1>⚠️ Error interno del servidor</h1>
        <p>Ocurrió un error al cargar la información del experto.</p>
        <a href="/expertos.html">← Volver a la lista de expertos</a>
      </div>
    `);
  }
});

// ===============================
// 🔍 OBTENER UN EXPERTO POR ID
// GET /api/expertos/:id
// Devuelve los datos de un experto específico por su ID, incluyendo usuario y categorías.
router.get("/:id", async (req, res) => {
  try {
    // Busca el experto por ID y pobla los datos relacionados
    const experto = await Experto.findById(req.params.id)
      .populate("userId")
      .populate("categorias");
    // Si no se encuentra el experto, responde con 404
    if (!experto) {
      return res.status(404).json({ message: "Experto no encontrado" });
    }
    // Devuelve el experto encontrado
    res.json(experto);
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error al obtener experto:", err);
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// ➕ CREAR UN NUEVO EXPERTO
// POST /api/expertos
// Permite crear un nuevo experto, validando que el usuario exista y no sea ya experto.
router.post("/", async (req, res) => {
  try {
    // Valida que los campos obligatorios estén presentes
    if (!req.body.userId || !req.body.especialidad) {
      return res
        .status(400)
        .json({ message: "userId y especialidad son requeridos" });
    }
    // Valida que el usuario exista
    const usuario = await Usuario.findById(req.body.userId);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    // Valida que el usuario no sea ya un experto
    const yaExperto = await Experto.findOne({ userId: req.body.userId });
    if (yaExperto) {
      return res.status(400).json({ message: "El usuario ya es un experto" });
    }
    // Crea el experto con los datos recibidos
    const experto = new Experto({
      userId: req.body.userId,
      especialidad: req.body.especialidad,
      descripcion: req.body.descripcion,
    });
    // Guarda el nuevo experto en la base de datos
    const nuevoExperto = await experto.save();
    // Devuelve el experto creado con status 201
    res.status(201).json(nuevoExperto);
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 400
    console.error("Error al crear experto:", err);
    res.status(400).json({ message: err.message });
  }
});

// ===============================
// 🔎 OBTENER EXPERTOS POR CATEGORÍA
// GET /api/expertos/categoria/:categoriaId
// Devuelve un listado de expertos activos que pertenecen a una categoría específica.
router.get("/categoria/:categoriaId", async (req, res) => {
  try {
    // Busca expertos activos por categoría y pobla datos relacionados
    const expertos = await Experto.find({
      categorias: req.params.categoriaId,
      activo: true,
    })
      .populate("userId")
      .populate("categorias");
    // Devuelve el listado en formato JSON
    res.json(expertos);
  } catch (err) {
    // Si ocurre un error, responde con 500 y el mensaje de error
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// ✏️ ACTUALIZAR UN EXPERTO
// PUT /api/expertos/:id
// Permite actualizar los datos de un experto existente (solo campos permitidos).
router.put("/:id", async (req, res) => {
  try {
    // Busca el experto por ID
    const experto = await Experto.findById(req.params.id);
    // Si no se encuentra, responde con 404
    if (!experto)
      return res.status(404).json({ message: "Experto no encontrado" });
    // Solo permite actualizar ciertos campos
    if (req.body.especialidad) experto.especialidad = req.body.especialidad;
    if (req.body.descripcion) experto.descripcion = req.body.descripcion;
    if (req.body.categorias) experto.categorias = req.body.categorias;
    if (typeof req.body.activo === "boolean") experto.activo = req.body.activo;
    // Guarda los cambios
    await experto.save();
    // Devuelve el experto actualizado
    res.json(experto);
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 400
    console.error("Error al actualizar experto:", err);
    res.status(400).json({ message: err.message });
  }
});

// ===============================
// 🗑️ ELIMINAR UN EXPERTO
// DELETE /api/expertos/:id
// Permite eliminar un experto por su ID.
router.delete("/:id", async (req, res) => {
  try {
    // Elimina el experto por su ID
    const experto = await Experto.findByIdAndDelete(req.params.id);
    // Si no se encuentra, responde con 404
    if (!experto)
      return res.status(404).json({ message: "Experto no encontrado" });
    // Devuelve mensaje de éxito
    res.json({ message: "Experto eliminado" });
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error al eliminar experto:", err);
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// 💳 RENDERIZAR PASARELA DE PAGOS DE UN EXPERTO
// GET /api/expertos/:id/pasarela-pagos
// Renderiza la vista de la pasarela de pagos para un experto específico.
// Si el ID no es válido o el experto no existe, usa datos de prueba.
router.get("/:id/pasarela-pagos", async (req, res) => {
  try {
    // Si el ID no es válido para MongoDB, usar datos de prueba
    let experto;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(
        `⚠️ ID de experto inválido: ${req.params.id}, usando datos de prueba`
      );
      // Datos de prueba para cuando el ID no es válido
      experto = {
        _id: new mongoose.Types.ObjectId(),
        userId: {
          nombre: "María",
          apellido: "Rodríguez",
          email: "maria.rodriguez@example.com",
          telefono: "+57 300 123 4567",
          foto: "/assets/img/default-avatar.png",
        },
        especialidad: "Desarrollo Web",
        descripcion:
          "Especialista en desarrollo web full-stack con 10 años de experiencia",
        activo: true,
        categorias: [],
      };
    } else {
      // Busca el experto por ID y pobla los datos relacionados
      experto = await Experto.findById(req.params.id)
        .populate("userId")
        .populate("categorias");
      // Si no se encuentra el experto, usa datos de prueba
      if (!experto) {
        console.log(
          `⚠️ Experto no encontrado con ID: ${req.params.id}, usando datos de prueba`
        );
        experto = {
          _id: req.params.id,
          userId: {
            nombre: "María",
            apellido: "Rodríguez",
            email: "maria.rodriguez@example.com",
            telefono: "+57 300 123 4567",
            foto: "/assets/img/default-avatar.png",
          },
          especialidad: "Desarrollo Web",
          descripcion:
            "Especialista en desarrollo web full-stack con 10 años de experiencia",
          activo: true,
          categorias: [],
        };
      }
    }

    // Renderiza la vista de pasarela de pagos con los datos del experto
    res.render("pasarela-pagos", {
      experto: experto,
      usuario: experto.userId || experto, // Fallback para modelo antiguo
      pageTitle: `Pago - Asesoría con ${
        experto.userId ? experto.userId.nombre : experto.nombre || "Experto"
      }`,
      expertoSeleccionado: {
        id: experto._id,
        nombre: experto.userId ? experto.userId.nombre : experto.nombre,
        apellido: experto.userId
          ? experto.userId.apellido || ""
          : experto.apellido || "",
        email: experto.userId ? experto.userId.email : experto.email,
        telefono: experto.userId
          ? experto.userId.telefono || ""
          : experto.telefono || "",
        especialidad: experto.especialidad,
        descripcion:
          experto.descripcion ||
          (experto.userId
            ? `Especialista en ${experto.especialidad}`
            : `Especialista en ${experto.especialidad} con ${
                experto.experiencia || "varios"
              } años de experiencia`),
        foto: experto.userId
          ? experto.userId.foto || "/assets/img/default-avatar.png"
          : experto.foto || "/assets/img/default-avatar.png",
        categorias: experto.categorias,
      },
    });
  } catch (err) {
    // Si ocurre un error, imprime en consola y renderiza mensaje de error
    console.error("Error al obtener experto para pasarela:", err);
    res.status(500).send(`
      <div style="text-align: center; padding: 50px;">
        <h1>⚠️ Error interno del servidor</h1>
        <p>Ocurrió un error al cargar la información del experto.</p>
        <a href="/expertos.html">← Volver a la lista de expertos</a>
      </div>
    `);
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
