// Modelo de Experto
// Este archivo define el esquema y el modelo para los expertos de la plataforma ServiTech.
// Permite almacenar la información profesional, categorías, especialidad y estado de los expertos.

// Importa mongoose, la biblioteca ODM para MongoDB, para definir el esquema y el modelo.
const mongoose = require("mongoose");

// Define el esquema del experto, especificando los campos y sus restricciones.
const expertoSchema = new mongoose.Schema({
  // Referencia al usuario base (debe existir en la colección de usuarios)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  // Categorías en las que el experto está registrado
  categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }],
  // Especialidad principal del experto
  especialidad: { type: String, required: true },
  // Descripción del perfil profesional
  descripcion: { type: String, required: true },
  // Precio por hora de asesoría
  precio: { type: Number, required: true },
  // Habilidades o tecnologías que maneja
  skills: [{ type: String }],
  // Estado de disponibilidad
  activo: { type: Boolean, default: true },
  // Calificación promedio
  calificacion: {
    promedio: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 },
  },
  // Horario de disponibilidad
  horario: {
    dias_disponibles: [{ type: String }],
    hora_inicio: { type: String },
    hora_fin: { type: String },
  },
  // Fecha de registro
  fechaRegistro: { type: Date, default: Date.now },
});

// Exporta el modelo de experto para ser utilizado en otras partes de la aplicación.
module.exports = mongoose.model("Experto", expertoSchema);
