const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UsuarioSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url: String,
  es_experto: { type: Boolean, default: false },
  fecha_registro: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'inactivo', 'suspendido'], default: 'activo' },
  experto: { type: Schema.Types.Mixed, default: null }
}, { collection: 'usuarios' }); // Fuerza el nombre de la colección

module.exports = {
  Usuario: model('Usuario', UsuarioSchema)
};
