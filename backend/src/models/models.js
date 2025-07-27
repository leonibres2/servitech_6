// Importa mongoose y desestructura Schema y model
// Mongoose es la biblioteca ODM que permite definir esquemas y modelos para MongoDB en Node.js.
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

// Define el esquema de Usuario con los campos y restricciones.
// Este esquema representa a los usuarios registrados en la plataforma, tanto clientes como expertos.
const UsuarioSchema = new Schema(
  {
    usuario: { type: String, required: true, unique: true }, // Nombre de usuario único
    nombre: { type: String, required: true }, // Nombre del usuario (obligatorio)
    apellido: { type: String, required: true }, // Apellido del usuario (obligatorio)
    email: { type: String, required: true, unique: true }, // Email único (obligatorio, usado para login y notificaciones)
    password_hash: { type: String, required: true }, // Hash de la contraseña (nunca se almacena la contraseña en texto plano)
    avatar_url: String, // URL del avatar del usuario (opcional)
    es_experto: { type: Boolean, default: false }, // Indica si el usuario es un experto (permite acceso a funcionalidades de experto)
    fecha_registro: { type: Date, default: Date.now }, // Fecha de registro del usuario en la plataforma
    estado: {
      type: String,
      enum: ["activo", "inactivo", "suspendido"],
      default: "activo",
    }, // Estado del usuario (control de acceso)
    experto: { type: Schema.Types.Mixed, default: null }, // Información adicional si es experto (configuración, especialidades, etc)
  },
  { collection: "usuarios" }
); // Fuerza el nombre de la colección a 'usuarios' para mantener consistencia

// Importar modelos adicionales definidos en otros archivos para centralizar el acceso a todos los modelos de la aplicación.
const Asesoria = require("./asesoria"); // Modelo de asesorías/citas
const Disponibilidad = require("./disponibilidad"); // Modelo de disponibilidad de expertos
const { Conversacion, Mensaje } = require("./mensajeria"); // Modelos de mensajería (conversaciones y mensajes)
const Notificacion = require("./notificacion"); // Modelo de notificaciones
const Reseña = require("./reseña"); // Modelo de reseñas y valoraciones
const {
  ConfiguracionSistema,
  ConfiguracionUsuario,
} = require("./configuracion"); // Modelos de configuración global y de usuario
const TransaccionPSE = require("./transaccionPSE"); // Modelo de transacciones PSE

// Exporta todos los modelos para usarlos en el resto de la aplicación.
// Esto permite importar todos los modelos desde un solo archivo centralizado.
module.exports = {
  Usuario: model("Usuario", UsuarioSchema), // Modelo de usuario principal
  Asesoria, // Modelo de asesoría/cita
  Disponibilidad, // Modelo de disponibilidad de expertos
  Conversacion, // Modelo de conversación de mensajería
  Mensaje, // Modelo de mensaje individual
  Notificacion, // Modelo de notificaciones
  Reseña, // Modelo de reseñas y valoraciones
  ConfiguracionSistema, // Modelo de configuración global del sistema
  ConfiguracionUsuario, // Modelo de configuración personalizada de usuario
  TransaccionPSE, // Modelo de transacciones PSE
};
