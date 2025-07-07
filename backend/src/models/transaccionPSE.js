// Modelo de Transacción PSE
const mongoose = require('mongoose');

const transaccionPSESchema = new mongoose.Schema({
  // Referencia única de la transacción
  reference: { 
    type: String, 
    required: true, 
    unique: true
  },
  
  // ID de la transacción en ACH Colombia
  achTransactionId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  
  // Información básica del usuario
  userEmail: { type: String, required: true },
  userName: { type: String },
  userPhone: { type: String },
  
  // Información bancaria PSE
  bankCode: { type: String, required: true },
  personType: { type: String, enum: ['N', 'J'], default: 'N' },
  documentType: { type: String, enum: ['CC', 'CE', 'TI', 'NIT', 'PP'], default: 'CC' },
  documentNumber: { type: String, required: true },
  
  // Información del pago
  amount: { type: Number, required: true },
  currency: { type: String, default: 'COP' },
  description: { type: String },
  
  // URLs y redirecciones
  pseUrl: { type: String },
  returnUrl: { type: String },
  confirmationUrl: { type: String },
  
  // Estado de la transacción
  status: { 
    type: String, 
    enum: ['PENDING', 'REDIRECTING', 'PROCESSING', 'APPROVED', 'REJECTED', 'FAILED', 'EXPIRED', 'ERROR'],
    default: 'PENDING'
  },
  
  // Respuesta de ACH Colombia
  achResponse: { type: mongoose.Schema.Types.Mixed },
  
  // Información de timestamps
  bankProcessDate: { type: Date },
  paidAt: { type: Date },
  
  // Información adicional
  webhookMessage: { type: String },
  errorMessage: { type: String },
  finalAmount: { type: Number },
  
  // Modo de prueba
  testMode: { type: Boolean, default: true },
  
  // Metadatos
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// Middleware para actualizar lastUpdated
transaccionPSESchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Índices para mejorar rendimiento (sin duplicar unique indexes)
// reference ya tiene índice unique automático
// achTransactionId ya tiene índice unique automático (sparse)
transaccionPSESchema.index({ status: 1 });
transaccionPSESchema.index({ createdAt: -1 });
transaccionPSESchema.index({ userEmail: 1 });

module.exports = mongoose.model('TransaccionPSE', transaccionPSESchema);
