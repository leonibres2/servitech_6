// ===============================
// 📄 MODELO DE TRANSACCIÓN PSE
// Este archivo define el esquema y modelo de Mongoose para registrar y gestionar
// las transacciones realizadas a través de la pasarela PSE (ACH Colombia).
// Cada campo, middleware e índice está documentado exhaustivamente para explicar
// su propósito, validaciones y lógica asociada.
// ===============================

// Importa el módulo mongoose para interactuar con MongoDB usando esquemas y modelos
const mongoose = require("mongoose");

// Definición del esquema principal de la transacción PSE
const transaccionPSESchema = new mongoose.Schema({
  // ===============================
  // 🔑 Referencia única de la transacción
  // Identificador único generado por el sistema para cada transacción PSE.
  // Es requerido y no puede repetirse en la colección.
  reference: {
    type: String, // Almacena el identificador único de la transacción
    required: true, // Es obligatorio para identificar la transacción
    unique: true, // Garantiza unicidad en la base de datos
  },

  // ===============================
  // 🏦 ID de la transacción en ACH Colombia
  // Identificador único asignado por ACH Colombia (puede ser nulo hasta que la transacción sea procesada)
  achTransactionId: {
    type: String, // Almacena el ID retornado por ACH
    unique: true, // No puede repetirse
    sparse: true, // Permite que el campo sea nulo en algunos documentos
  },

  // ===============================
  // 👤 Información básica del usuario que realiza la transacción
  userEmail: { type: String, required: true }, // Correo electrónico del usuario (obligatorio para notificaciones y trazabilidad)
  userName: { type: String }, // Nombre del usuario (opcional, para mostrar en reportes o logs)
  userPhone: { type: String }, // Teléfono del usuario (opcional, para contacto o validación)

  // ===============================
  // 🏦 Información bancaria PSE del usuario
  bankCode: { type: String, required: true }, // Código del banco seleccionado por el usuario (obligatorio para la transacción)
  personType: { type: String, enum: ["N", "J"], default: "N" }, // Tipo de persona: 'N' (natural) o 'J' (jurídica), por defecto natural
  documentType: {
    type: String,
    enum: ["CC", "CE", "TI", "NIT", "PP"],
    default: "CC",
  }, // Tipo de documento: cédula, extranjería, etc.
  documentNumber: { type: String, required: true }, // Número de documento del usuario (obligatorio)

  // ===============================
  // 💰 Información del pago realizado
  amount: { type: Number, required: true }, // Monto de la transacción (obligatorio)
  currency: { type: String, default: "COP" }, // Moneda de la transacción, por defecto pesos colombianos
  description: { type: String }, // Descripción opcional del pago (puede incluir referencia de servicio, etc.)

  // ===============================
  // 🌐 URLs y redirecciones asociadas al flujo PSE
  pseUrl: { type: String }, // URL de redirección a la pasarela PSE (retornada por el API)
  returnUrl: { type: String }, // URL a la que se redirige al usuario tras el pago
  confirmationUrl: { type: String }, // URL para recibir confirmaciones automáticas (webhook)

  // ===============================
  // 🔄 Estado de la transacción
  // Controla el ciclo de vida de la transacción: pendiente, aprobada, rechazada, etc.
  status: {
    type: String, // Estado actual de la transacción
    enum: [
      "PENDING",
      "REDIRECTING",
      "PROCESSING",
      "APPROVED",
      "REJECTED",
      "FAILED",
      "EXPIRED",
      "ERROR",
    ], // Estados posibles
    default: "PENDING", // Valor inicial al crear la transacción
  },

  // ===============================
  // 📦 Respuesta completa de ACH Colombia (puede contener datos adicionales)
  achResponse: { type: mongoose.Schema.Types.Mixed }, // Permite almacenar cualquier estructura de respuesta (JSON)

  // ===============================
  // 🕒 Información de procesamiento y pago
  bankProcessDate: { type: Date }, // Fecha en que el banco procesó la transacción (opcional)
  paidAt: { type: Date }, // Fecha y hora en que se confirmó el pago (opcional)

  // ===============================
  // 📝 Información adicional y mensajes
  webhookMessage: { type: String }, // Mensaje recibido por webhook (puede contener logs o errores)
  errorMessage: { type: String }, // Mensaje de error en caso de fallo
  finalAmount: { type: Number }, // Monto final cobrado (puede diferir por comisiones, etc.)

  // ===============================
  // 🧪 Modo de prueba
  testMode: { type: Boolean, default: true }, // Indica si la transacción fue realizada en modo test/sandbox

  // ===============================
  // 🗓️ Metadatos de auditoría y control
  createdAt: { type: Date, default: Date.now }, // Fecha de creación del registro
  lastUpdated: { type: Date, default: Date.now }, // Fecha de última actualización (se actualiza por middleware)
});

// ===============================
// 🔄 MIDDLEWARE pre('save')
// Antes de guardar cualquier documento de transacción, actualiza el campo lastUpdated
// Esto permite llevar un control automático de la última modificación del registro
transaccionPSESchema.pre("save", function (next) {
  // Asigna la fecha y hora actual al campo lastUpdated
  this.lastUpdated = new Date();
  next(); // Continúa con el guardado
});

// ===============================
// 📈 ÍNDICES PARA OPTIMIZAR CONSULTAS
// Los índices mejoran el rendimiento de las búsquedas y filtrados frecuentes.
// No se duplican los índices únicos ya definidos en los campos reference y achTransactionId.

// Índice por estado de la transacción, útil para listar por estado (pendiente, aprobada, etc.)
transaccionPSESchema.index({ status: 1 });

// Índice por fecha de creación descendente, útil para mostrar las transacciones más recientes primero
transaccionPSESchema.index({ createdAt: -1 });

// Índice por correo electrónico del usuario, útil para consultar el historial de pagos de un usuario
transaccionPSESchema.index({ userEmail: 1 });

// ===============================
// 📦 EXPORTACIÓN DEL MODELO
// Se exporta el modelo 'TransaccionPSE' basado en el esquema transaccionPSESchema.
// Esto permite que el modelo sea utilizado en otros módulos de la aplicación para crear,
// consultar, actualizar y eliminar transacciones PSE en la base de datos MongoDB.
//
// Ejemplo de uso:
// const TransaccionPSE = require('./models/transaccionPSE');
// TransaccionPSE.find(...), TransaccionPSE.create(...), etc.
module.exports = mongoose.model("TransaccionPSE", transaccionPSESchema);
