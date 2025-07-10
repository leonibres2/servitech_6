// Rutas para Expertos
const express = require('express');
const mongoose = require('mongoose');
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

// 🆕 NUEVA RUTA: Renderizar calendario para un experto específico (DEBE IR ANTES que /:id)
router.get('/:id/calendario', async (req, res) => {
  try {
    // Si el ID no es válido para MongoDB, usar datos de prueba
    let experto;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`⚠️ ID de experto inválido: ${req.params.id}, usando datos de prueba para calendario`);
      
      // Datos de prueba para cuando el ID no es válido
      experto = {
        _id: new mongoose.Types.ObjectId(),
        userId: {
          nombre: 'María',
          apellido: 'Rodríguez',
          email: 'maria.rodriguez@example.com',
          telefono: '+57 300 123 4567',
          foto: '/assets/img/default-avatar.png'
        },
        especialidad: 'Desarrollo Web',
        descripcion: 'Especialista en desarrollo web full-stack con 10 años de experiencia',
        activo: true,
        categorias: []
      };
    } else {
      experto = await Experto.findById(req.params.id)
        .populate('userId')
        .populate('categorias');
      
      if (!experto) {
        console.log(`⚠️ Experto no encontrado con ID: ${req.params.id}, usando datos de prueba para calendario`);
        
        // Datos de prueba si no se encuentra el experto
        experto = {
          _id: req.params.id,
          userId: {
            nombre: 'María',
            apellido: 'Rodríguez',
            email: 'maria.rodriguez@example.com',
            telefono: '+57 300 123 4567',
            foto: '/assets/img/default-avatar.png'
          },
          especialidad: 'Desarrollo Web',
          descripcion: 'Especialista en desarrollo web full-stack con 10 años de experiencia',
          activo: true,
          categorias: []
        };
      }
    }

    // Renderizar la vista del calendario con los datos del experto
    res.render('calendario', { 
      experto: experto,
      usuario: experto.userId || experto, // Fallback para modelo antiguo
      pageTitle: `Agendar cita con ${experto.userId ? experto.userId.nombre : (experto.nombre || 'Experto')}`,
      expertoSeleccionado: {
        id: experto._id,
        nombre: experto.userId ? experto.userId.nombre : experto.nombre,
        apellido: experto.userId ? (experto.userId.apellido || '') : (experto.apellido || ''),
        email: experto.userId ? experto.userId.email : experto.email,
        telefono: experto.userId ? (experto.userId.telefono || '') : (experto.telefono || ''),
        especialidad: experto.especialidad,
        descripcion: experto.descripcion || (experto.userId ? `Especialista en ${experto.especialidad}` : `Especialista en ${experto.especialidad} con ${experto.experiencia || 'varios'} años de experiencia`),
        foto: experto.userId ? (experto.userId.foto || '/assets/img/default-avatar.png') : (experto.foto || '/assets/img/default-avatar.png'),
        categorias: experto.categorias
      }
    });
  } catch (err) {
    console.error('Error al obtener experto para calendario:', err);
    res.status(500).send(`
      <div style="text-align: center; padding: 50px;">
        <h1>⚠️ Error interno del servidor</h1>
        <p>Ocurrió un error al cargar la información del experto.</p>
        <a href="/expertos.html">← Volver a la lista de expertos</a>
      </div>
    `);
  }
});

// 🆕 Obtener un experto específico por ID (DEBE IR DESPUÉS de /:id/calendario)
router.get('/:id', async (req, res) => {
  try {
    const experto = await Experto.findById(req.params.id)
      .populate('userId')
      .populate('categorias');
    
    if (!experto) {
      return res.status(404).json({ message: 'Experto no encontrado' });
    }
    
    res.json(experto);
  } catch (err) {
    console.error('Error al obtener experto:', err);
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

// 🆕 NUEVA RUTA: Renderizar pasarela de pagos para un experto específico
router.get('/:id/pasarela-pagos', async (req, res) => {
  try {
    // Si el ID no es válido para MongoDB, usar datos de prueba
    let experto;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log(`⚠️ ID de experto inválido: ${req.params.id}, usando datos de prueba`);
      
      // Datos de prueba para cuando el ID no es válido
      experto = {
        _id: new mongoose.Types.ObjectId(),
        userId: {
          nombre: 'María',
          apellido: 'Rodríguez',
          email: 'maria.rodriguez@example.com',
          telefono: '+57 300 123 4567',
          foto: '/assets/img/default-avatar.png'
        },
        especialidad: 'Desarrollo Web',
        descripcion: 'Especialista en desarrollo web full-stack con 10 años de experiencia',
        activo: true,
        categorias: []
      };
    } else {
      experto = await Experto.findById(req.params.id)
        .populate('userId')
        .populate('categorias');
      
      if (!experto) {
        console.log(`⚠️ Experto no encontrado con ID: ${req.params.id}, usando datos de prueba`);
        
        // Datos de prueba si no se encuentra el experto
        experto = {
          _id: req.params.id,
          userId: {
            nombre: 'María',
            apellido: 'Rodríguez',
            email: 'maria.rodriguez@example.com',
            telefono: '+57 300 123 4567',
            foto: '/assets/img/default-avatar.png'
          },
          especialidad: 'Desarrollo Web',
          descripcion: 'Especialista en desarrollo web full-stack con 10 años de experiencia',
          activo: true,
          categorias: []
        };
      }
    }

    // Renderizar la vista de pasarela de pagos con los datos del experto
    res.render('pasarela-pagos', { 
      experto: experto,
      usuario: experto.userId || experto, // Fallback para modelo antiguo
      pageTitle: `Pago - Asesoría con ${experto.userId ? experto.userId.nombre : (experto.nombre || 'Experto')}`,
      expertoSeleccionado: {
        id: experto._id,
        nombre: experto.userId ? experto.userId.nombre : experto.nombre,
        apellido: experto.userId ? (experto.userId.apellido || '') : (experto.apellido || ''),
        email: experto.userId ? experto.userId.email : experto.email,
        telefono: experto.userId ? (experto.userId.telefono || '') : (experto.telefono || ''),
        especialidad: experto.especialidad,
        descripcion: experto.descripcion || (experto.userId ? `Especialista en ${experto.especialidad}` : `Especialista en ${experto.especialidad} con ${experto.experiencia || 'varios'} años de experiencia`),
        foto: experto.userId ? (experto.userId.foto || '/assets/img/default-avatar.png') : (experto.foto || '/assets/img/default-avatar.png'),
        categorias: experto.categorias
      }
    });
  } catch (err) {
    console.error('Error al obtener experto para pasarela:', err);
    res.status(500).send(`
      <div style="text-align: center; padding: 50px;">
        <h1>⚠️ Error interno del servidor</h1>
        <p>Ocurrió un error al cargar la información del experto.</p>
        <a href="/expertos.html">← Volver a la lista de expertos</a>
      </div>
    `);
  }
});

module.exports = router;
