// Modelo de Categoría
// Este archivo define el esquema y el modelo para las categorías de asesoría en la plataforma ServiTech.
// Permite clasificar las asesorías según su temática o especialidad.

// Importa mongoose, la biblioteca ODM para MongoDB, para definir el esquema y el modelo.
const mongoose = require("mongoose");

// Define el esquema de la categoría, especificando los campos y sus restricciones.
const categoriaSchema = new mongoose.Schema({
  // Nombre de la categoría (obligatorio), por ejemplo: "Tecnología", "Salud", "Finanzas".
  nombre: { type: String, required: true },
  // Descripción opcional de la categoría, para mayor detalle.
  descripcion: { type: String },
  // Fecha de creación de la categoría, se asigna automáticamente al crear el documento.
  fechaCreacion: { type: Date, default: Date.now },
});

// Exporta el modelo de categoría para ser utilizado en otras partes de la aplicación.
module.exports = mongoose.model("Categoria", categoriaSchema);
