const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

// Esquema para el perfil de experto (opcional, embebido en Usuario)
const ExpertoSchema = new Schema({
  descripcion: String,
  experiencia: String,
  calificacion: { type: Number, default: 0 },
  verificado: { type: Boolean, default: false },
  categorias: [{ type: Types.ObjectId, ref: 'Categoria' }]
}, { _id: false });

// Esquema de usuario general (puede tener perfil de experto)
const UsuarioSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  avatar_url: String,
  es_experto: { type: Boolean, default: false },
  fecha_registro: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'inactivo', 'suspendido'], default: 'activo' },
  experto: { type: ExpertoSchema, default: null }
});

const CategoriaSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  icono: String
});

const PublicacionSchema = new Schema({
  experto_id: { type: Types.ObjectId, ref: 'Usuario', required: true },
  titulo: { type: String, required: true },
  descripcion: String,
  categoria_id: { type: Types.ObjectId, ref: 'Categoria' },
  precio: Number,
  fecha_publicacion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'inactivo', 'eliminado'], default: 'activo' }
});

const SolicitudSchema = new Schema({
  usuario_id: { type: Types.ObjectId, ref: 'Usuario', required: true },
  publicacion_id: { type: Types.ObjectId, ref: 'Publicacion', required: true },
  mensaje: String,
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'aceptada', 'rechazada', 'finalizada'], default: 'pendiente' }
});

const MensajeSchema = new Schema({
  remitente_id: { type: Types.ObjectId, ref: 'Usuario', required: true },
  destinatario_id: { type: Types.ObjectId, ref: 'Usuario', required: true },
  contenido: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  leido: { type: Boolean, default: false }
});

const CalificacionSchema = new Schema({
  solicitud_id: { type: Types.ObjectId, ref: 'Solicitud', required: true },
  calificacion: { type: Number, min: 1, max: 5, required: true },
  comentario: String,
  fecha: { type: Date, default: Date.now }
});

// Exportar todos los modelos para importar fácilmente en otros archivos
module.exports = {
  Usuario: model('Usuario', UsuarioSchema),
  Categoria: model('Categoria', CategoriaSchema),
  Publicacion: model('Publicacion', PublicacionSchema),
  Solicitud: model('Solicitud', SolicitudSchema),
  Mensaje: model('Mensaje', MensajeSchema),
  Calificacion: model('Calificacion', CalificacionSchema)
};
