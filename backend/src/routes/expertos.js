// Rutas para Expertos
const express = require('express');
const router = express.Router();
const Experto = require('../models/expertos');
const { Usuario } = require('../models/models');

// Obtener todos los expertos
router.get('/', async (req, res) => {
  try {
    // Trae los datos del usuario relacionados usando populate
    const expertos = await Experto.find().populate('userId');
    res.json(expertos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo experto
router.post('/', async (req, res) => {
  try {
    if (!req.body.userId || !req.body.especialidad) {
      return res.status(400).json({ message: 'userId y especialidad son requeridos' });
    }
    // Validar que el usuario exista
    const usuario = await Usuario.findById(req.body.userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    // Validar que el usuario no sea ya un experto
    const yaExperto = await Experto.findOne({ userId: req.body.userId });
    if (yaExperto) {
      return res.status(400).json({ message: 'El usuario ya es un experto' });
    }
    // Crear el experto
    const experto = new Experto({
      userId: req.body.userId,
      especialidad: req.body.especialidad,
      descripcion: req.body.descripcion
    });
    const nuevoExperto = await experto.save();
    res.status(201).json(nuevoExperto);
  } catch (err) {
    console.error('Error al crear experto:', err);
    res.status(400).json({ message: err.message });
  }
});

// Obtener expertos por categoría
router.get('/categoria/:categoriaId', async (req, res) => {
  try {
    const expertos = await Experto.find({ categorias: req.params.categoriaId, activo: true }).populate('userId').populate('categorias');
    res.json(expertos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Actualizar experto
router.put('/:id', async (req, res) => {
  try {
    const experto = await Experto.findById(req.params.id);
    if (!experto) return res.status(404).json({ message: 'Experto no encontrado' });
    // Solo permitir actualizar ciertos campos
    if (req.body.especialidad) experto.especialidad = req.body.especialidad;
    if (req.body.descripcion) experto.descripcion = req.body.descripcion;
    if (req.body.categorias) experto.categorias = req.body.categorias;
    if (typeof req.body.activo === 'boolean') experto.activo = req.body.activo;
    await experto.save();
    res.json(experto);
  } catch (err) {
    console.error('Error al actualizar experto:', err);
    res.status(400).json({ message: err.message });
  }
});

// Eliminar experto
router.delete('/:id', async (req, res) => {
  try {
    const experto = await Experto.findByIdAndDelete(req.params.id);
    if (!experto) return res.status(404).json({ message: 'Experto no encontrado' });
    res.json({ message: 'Experto eliminado' });
  } catch (err) {
    console.error('Error al eliminar experto:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
