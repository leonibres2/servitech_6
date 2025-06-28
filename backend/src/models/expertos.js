// Modelo de Experto
const mongoose = require('mongoose');

const expertoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }],
  especialidad: { type: String, required: true },
  descripcion: { type: String },
  activo: { type: Boolean, default: true },
  fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Experto', expertoSchema);
