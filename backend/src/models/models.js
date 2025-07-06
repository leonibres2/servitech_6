// Importa mongoose y desestructura Schema y model
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Define el esquema de Usuario con los campos y restricciones
const UsuarioSchema = new Schema({ 
  nombre: { type: String, required: true }, // Nombre del usuario

  apellido: { type: String, required: true }, // Apellido del usuario

  email: { type: String, required: true, unique: true }, // Email único

  password_hash: { type: String, required: true }, // Hash de la contraseña

  avatar_url: String, // URL del avatar (opcional)

  es_experto: { type: Boolean, default: false }, // Indica si es experto

  fecha_registro: { type: Date, default: Date.now }, // Fecha de registro

  estado: { type: String, enum: ['activo', 'inactivo', 'suspendido'], default: 'activo' }, // Estado del usuario

  experto: { type: Schema.Types.Mixed, default: null } // Información adicional si es experto
  }, { collection: 'usuarios' }); // Fuerza el nombre de la colección

// Importar modelos adicionales
const Asesoria = require('./asesoria');
const Disponibilidad = require('./disponibilidad');
const { Conversacion, Mensaje } = require('./mensaje');
const Notificacion = require('./notificacion');
const Reseña = require('./reseña');
const { ConfiguracionSistema, ConfiguracionUsuario } = require('./configuracion');
const TransaccionPSE = require('./transaccionPSE');

// Exporta todos los modelos para usarlos
module.exports = {
  Usuario: model('Usuario', UsuarioSchema),
  Asesoria,
  Disponibilidad,
  Conversacion,
  Mensaje,
  Notificacion,
  Reseña,
  ConfiguracionSistema,
  ConfiguracionUsuario,
  TransaccionPSE
};
