// Rutas para Categorías
const express = require('express');
const router = express.Router();
const Categoria = require('../models/categorias');
const Experto = require('../models/expertos');

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear una nueva categoría
router.post('/', async (req, res) => {
  try {
    if (!req.body.nombre) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }
    // Validar unicidad del nombre al crear
    const existe = await Categoria.findOne({ nombre: req.body.nombre });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    // Crear la nueva categoría
    // Usar el modelo de Categoria para crear un nuevo documento
    const categoria = new Categoria({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion
    });
    const nuevaCategoria = await categoria.save();
    res.status(201).json(nuevaCategoria);
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(400).json({ message: err.message });
  }
});

// Actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    if (!req.body.nombre) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }
    // Validar que la categoría exista
    const existe = await Categoria.findOne({ nombre: req.body.nombre, _id: { $ne: req.params.id } });
    if (existe) {
      return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    // Actualizar la categoría
    // Usar { new: true } para devolver el documento actualizado
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { nombre: req.body.nombre, descripcion: req.body.descripcion },
      { new: true }
    ); 
    // Si no se encuentra la categoría, devolver 404
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(categoria);
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    res.status(400).json({ message: err.message });
  }
});

// Eliminar categoría solo si no tiene expertos asociados
router.delete('/:id', async (req, res) => {
  try { 
    // Verificar si hay expertos asociados a la categoría
    // Si hay expertos, no permitir la eliminación
    const expertos = await Experto.find({ categorias: req.params.id });
    if (expertos.length > 0) {
      return res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene expertos asociados' });
    }
    const categoria = await Categoria.findByIdAndDelete(req.params.id);
    if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

// Buscar y paginar categorías
router.get('/buscar', async (req, res) => {
  try {
    // Obtener parámetros de búsqueda y paginación
    // q: término de búsqueda, page: número de página, limit: número de resultados
    const { q = '', page = 1, limit = 10 } = req.query;
    // Construir la consulta de búsqueda
    // Si q está vacío, no aplicar filtro
    const query = q ? { nombre: { $regex: q, $options: 'i' } } : {};
    // Buscar categorías con paginación
    const categorias = await Categoria.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Categoria.countDocuments(query);
    // Devolver las categorías y el total de resultados
    res.json({ categorias, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
