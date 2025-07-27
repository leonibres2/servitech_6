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
// 📋 OBTENER TODOS LOS EXPERTOS (VERSIÓN OPTIMIZADA CON DEPURACIÓN)
// GET /api/expertos
// Devuelve un listado de todos los expertos registrados, incluyendo los datos del usuario relacionado.
// En tu archivo de rutas expertos.js
// GET /expertos - Lista todos los expertos
router.get("/", async (req, res) => {
  try {
    const expertos = await Experto.find()
      .populate("userId")
      .populate("categorias")
      .lean();

    // Formateamos los datos para la vista
    const expertosFormateados = expertos.map((experto) => ({
      _id: experto._id,
      nombre: experto.userId?.nombre || "Nombre no disponible",
      apellido: experto.userId?.apellido || "",
      usuario: experto.userId?.usuario || "Usuario no disponible",
      foto: "/assets/img/default-avatar.png", // Temporal hasta implementar carga de imágenes
      especialidad: experto.especialidad || "Especialista Servitech",
      descripcion: experto.descripcion || "Descripción no disponible",
      precio: experto.precio
        ? `$${experto.precio.toLocaleString("es-CO")}`
        : "Consultar precio",
      skills: experto.skills || [],
      activo: experto.activo !== false, // Si no es explícitamente false, está activo
      calificacion: {
        promedio: Number(experto.calificacion?.promedio || 5.0),
        total_reviews: experto.calificacion?.total_reviews || 0,
        total: experto.calificacion?.total_reviews || 0,
        estrellas: Math.round(experto.calificacion?.promedio || 5.0),
      },
    }));

    // Log para depuración
    console.log(
      "Valores de activo originales:",
      expertos.map((e) => ({
        id: e._id,
        activo: e.activo,
        tipo: typeof e.activo,
      }))
    );
    console.log(
      "Datos de expertos formateados:",
      JSON.stringify(expertosFormateados, null, 2)
    );

    // Renderizamos la vista con los datos
    res.render("expertos", {
      expertos: expertosFormateados,
      pageTitle: "Nuestros Expertos",
      debug: true,
    });
  } catch (err) {
    console.error("Error al cargar expertos:", err);
    res.status(500).render("error", {
      pageTitle: "Error",
      errorMessage: "Error al cargar la lista de expertos",
    });
  }
});

// ===============================
// � FILTRAR EXPERTOS
// POST /api/expertos/filtrar
// Filtra la lista de expertos según los criterios especificados
router.post("/filtrar", async (req, res) => {
  try {
    const { search, precio, disponibilidad, rating, orderBy } = req.body;

    // Construir query base
    let query = Experto.find().populate("userId");

    // Filtrar por búsqueda (nombre, especialidad o skills)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = query.or([
        { especialidad: searchRegex },
        { skills: searchRegex },
        { "userId.nombre": searchRegex },
        { "userId.apellido": searchRegex },
      ]);
    }

    // Filtrar por precio
    if (precio) {
      const valorPrecio = parseInt(precio);
      // Permitir un margen del 20% arriba y abajo del precio seleccionado
      const precioMin = Math.floor(valorPrecio * 0.8);
      const precioMax = Math.ceil(valorPrecio * 1.2);

      query = query.where("precio").gte(precioMin).lte(precioMax);

      console.log("Filtrando por precio en pesos:", {
        precioSeleccionado: valorPrecio.toLocaleString("es-CO"),
        precioMin: precioMin.toLocaleString("es-CO"),
        precioMax: precioMax.toLocaleString("es-CO"),
      });
    }

    // Filtrar por disponibilidad
    if (disponibilidad && !disponibilidad.includes("Todos los horarios")) {
      query = query.where("activo").equals(true);
      // Aquí puedes agregar más lógica específica para horarios diurnos/nocturnos
    }

    // Filtrar por calificación
    if (rating) {
      let minRating = 0;
      if (rating.includes("5 estrellas")) minRating = 5;
      else if (rating.includes("4+ estrellas")) minRating = 4;

      if (minRating > 0) {
        query = query.where("calificacion.promedio").gte(minRating);
      }
    }

    // Ejecutar query
    let expertos = await query.lean();

    // Formatear resultados
    const expertosFormateados = expertos.map((experto) => ({
      _id: experto._id,
      nombre: experto.userId?.nombre || "Nombre no disponible",
      apellido: experto.userId?.apellido || "",
      usuario: experto.userId?.usuario || "Usuario no disponible",
      foto: "/assets/img/default-avatar.png",
      especialidad: experto.especialidad || "Especialista Servitech",
      descripcion: experto.descripcion || "Descripción no disponible",
      precio: experto.precio
        ? `$${experto.precio.toLocaleString("es-CO")}`
        : "Consultar precio",
      skills: experto.skills || [],
      activo: experto.activo !== false,
      calificacion: {
        promedio: Number(experto.calificacion?.promedio || 5.0),
        total_reviews: experto.calificacion?.total_reviews || 0,
        total: experto.calificacion?.total_reviews || 0,
        estrellas: Math.round(experto.calificacion?.promedio || 5.0),
      },
    }));

    // Ordenar resultados
    if (orderBy) {
      expertosFormateados.sort((a, b) => {
        switch (orderBy) {
          case "Mejor puntuados":
            return b.calificacion.promedio - a.calificacion.promedio;
          case "Precio: menor a mayor":
            return (
              parseFloat(a.precio.replace(/[^0-9]/g, "")) -
              parseFloat(b.precio.replace(/[^0-9]/g, ""))
            );
          case "Precio: mayor a menor":
            return (
              parseFloat(b.precio.replace(/[^0-9]/g, "")) -
              parseFloat(a.precio.replace(/[^0-9]/g, ""))
            );
          case "Nombre (A-Z)":
            return `${a.nombre} ${a.apellido}`.localeCompare(
              `${b.nombre} ${b.apellido}`
            );
          default:
            return 0;
        }
      });
    }

    res.json({
      success: true,
      expertos: expertosFormateados,
      total: expertosFormateados.length,
    });
  } catch (error) {
    console.error("Error al filtrar expertos:", error);
    res.status(500).json({
      success: false,
      message: "Error al filtrar expertos",
      error: error.message,
    });
  }
});

// ===============================
// �📅 OBTENER CALENDARIO DE UN EXPERTO POR ID
// GET /expertos/calendario/:id
// Muestra la vista de calendario para agendar con un experto específico.
router.get("/calendario/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).render("error", {
        pageTitle: "ID Inválido",
        errorMessage: "El ID del experto no es válido",
      });
    }

    const experto = await Experto.findById(req.params.id)
      .populate("userId")
      .populate("categorias");

    if (!experto) {
      return res.status(404).render("error", {
        pageTitle: "Experto no encontrado",
        errorMessage: "El experto solicitado no existe",
      });
    }

    const usuario = experto.userId || {
      nombre: "Nombre no disponible",
      apellido: "",
      email: "",
      telefono: "",
      foto: "/assets/img/default-avatar.png",
    };

    res.render("calendario", {
      experto: experto,
      usuario: usuario,
      pageTitle: `Agendar con ${usuario.nombre} ${usuario.apellido}`,
      expertoSeleccionado: {
        id: experto._id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || "No disponible",
        especialidad: experto.especialidad || "Especialista Servitech",
        descripcion:
          experto.descripcion ||
          `Experto en ${
            experto.especialidad || "su área"
          } con amplia experiencia`,
        foto: usuario.foto || "/assets/img/default-avatar.png",
        categorias: experto.categorias || [],
      },
    });
  } catch (err) {
    console.error("Error al cargar calendario:", err);
    res.status(500).render("error", {
      pageTitle: "Error",
      errorMessage: "Error al cargar el calendario del experto",
    });
  }
});

// [Todas las demás rutas permanecen exactamente igual...]

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
