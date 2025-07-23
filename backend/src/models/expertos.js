// Modelo de Experto
// Este archivo define el esquema y el modelo para los expertos de la plataforma ServiTech.
// Permite almacenar la información profesional, categorías, especialidad y estado de los expertos.

// Importa mongoose, la biblioteca ODM para MongoDB, para definir el esquema y el modelo.
const mongoose = require("mongoose");

// Define el esquema del experto, especificando los campos y sus restricciones.
const expertoSchema = new mongoose.Schema({
  // Referencia al usuario base (debe existir en la colección de usuarios).
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  // Categorías en las que el experto está registrado (referencias a la colección de categorías).
  categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }],
  // Especialidad principal del experto (campo obligatorio).
  especialidad: { type: String, required: true },
  // Descripción opcional del perfil profesional del experto.
  descripcion: { type: String },
  // Estado de actividad del experto (true = activo, false = inactivo).
  activo: { type: Boolean, default: true },
  // Fecha de registro del experto en la plataforma (asignada automáticamente).
  fechaRegistro: { type: Date, default: Date.now },
});

// Exporta el modelo de experto para ser utilizado en otras partes de la aplicación.
module.exports = mongoose.model("Experto", expertoSchema);
