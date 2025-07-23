// ===============================
// 📄 RUTAS DE CATEGORÍAS
// Este archivo define todas las rutas HTTP para la gestión de categorías en el sistema.
// Cada línea está documentada para explicar su propósito y funcionamiento.
// ===============================

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas
const router = express.Router();

// Importa el modelo de categorías para interactuar con la colección de categorías en MongoDB
const Categoria = require("../models/categorias");

// Importa el modelo de expertos para validar dependencias antes de eliminar categorías
const Experto = require("../models/expertos");

// ===============================
// 📋 OBTENER TODAS LAS CATEGORÍAS
// GET /api/categorias
// Devuelve un listado de todas las categorías registradas en el sistema.
router.get("/", async (req, res) => {
  try {
    // Busca todas las categorías sin filtros
    const categorias = await Categoria.find();
    // Devuelve el listado en formato JSON
    res.json(categorias);
  } catch (err) {
    // Si ocurre un error, responde con 500 y el mensaje de error
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// ➕ CREAR UNA NUEVA CATEGORÍA
// POST /api/categorias
// Permite crear una nueva categoría, validando que el nombre sea único y obligatorio.
router.post("/", async (req, res) => {
  try {
    // Valida que el campo nombre esté presente en el body
    if (!req.body.nombre) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }
    // Valida que no exista otra categoría con el mismo nombre
    const existe = await Categoria.findOne({ nombre: req.body.nombre });
    if (existe) {
      return res
        .status(400)
        .json({ message: "Ya existe una categoría con ese nombre" });
    }
    // Crea una nueva instancia del modelo Categoria con los datos recibidos
    const categoria = new Categoria({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
    });
    // Guarda la nueva categoría en la base de datos
    const nuevaCategoria = await categoria.save();
    // Devuelve la categoría creada con status 201
    res.status(201).json(nuevaCategoria);
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 400
    console.error("Error al crear categoría:", err);
    res.status(400).json({ message: err.message });
  }
});

// ===============================
// ✏️ ACTUALIZAR UNA CATEGORÍA
// PUT /api/categorias/:id
// Permite actualizar el nombre y descripción de una categoría existente, validando unicidad.
router.put("/:id", async (req, res) => {
  try {
    // Valida que el campo nombre esté presente
    if (!req.body.nombre) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }
    // Valida que no exista otra categoría con el mismo nombre (excluyendo la actual)
    const existe = await Categoria.findOne({
      nombre: req.body.nombre,
      _id: { $ne: req.params.id },
    });
    if (existe) {
      return res
        .status(400)
        .json({ message: "Ya existe una categoría con ese nombre" });
    }
    // Actualiza la categoría y devuelve el documento actualizado
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, descripcion: req.body.descripcion },
      { new: true }
    );
    // Si no se encuentra la categoría, responde con 404
    if (!categoria)
      return res.status(404).json({ message: "Categoría no encontrada" });
    // Devuelve la categoría actualizada
    res.json(categoria);
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 400
    console.error("Error al actualizar categoría:", err);
    res.status(400).json({ message: err.message });
  }
});

// ===============================
// 🗑️ ELIMINAR UNA CATEGORÍA
// DELETE /api/categorias/:id
// Permite eliminar una categoría solo si no tiene expertos asociados.
router.delete("/:id", async (req, res) => {
  try {
    // Busca si existen expertos asociados a la categoría
    const expertos = await Experto.find({ categorias: req.params.id });
    // Si hay expertos, no permite la eliminación y responde con error
    if (expertos.length > 0) {
      return res
        .status(400)
        .json({
          message:
            "No se puede eliminar la categoría porque tiene expertos asociados",
        });
    }
    // Elimina la categoría por su ID
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
    // Si no se encuentra la categoría, responde con 404
    if (!categoria)
      return res.status(404).json({ message: "Categoría no encontrada" });
    // Devuelve mensaje de éxito
    res.json({ message: "Categoría eliminada" });
  } catch (err) {
    // Si ocurre un error, imprime en consola y responde con 500
    console.error("Error al eliminar categoría:", err);
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// 🔍 BUSCAR Y PAGINAR CATEGORÍAS
// GET /api/categorias/buscar?q=palabra&page=1&limit=10
// Permite buscar categorías por nombre y paginar los resultados.
router.get("/buscar", async (req, res) => {
  try {
    // Obtiene los parámetros de búsqueda y paginación de la query
    const { q = "", page = 1, limit = 10 } = req.query;
    // Construye la consulta de búsqueda (si q está vacío, no aplica filtro)
    const query = q ? { nombre: { $regex: q, $options: "i" } } : {};
    // Busca categorías aplicando paginación
    const categorias = await Categoria.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    // Cuenta el total de resultados para la consulta
    const total = await Categoria.countDocuments(query);
    // Devuelve las categorías encontradas y el total
    res.json({ categorias, total });
  } catch (err) {
    // Si ocurre un error, responde con 500 y el mensaje de error
    res.status(500).json({ message: err.message });
  }
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
