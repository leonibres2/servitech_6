// Modelo de Categoría
const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({ 
    
  nombre: { type: String, required: true },
  descripcion: { type: String },
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Categoria', categoriaSchema);