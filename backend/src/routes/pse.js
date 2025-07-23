/**
 * 🏦 RUTAS PSE - ACH COLOMBIA
 * Este archivo define los endpoints HTTP para la integración de pagos PSE reales con ACH Colombia.
 * Cada línea está documentada para explicar su propósito y funcionamiento.
 * Fecha: 6 de julio de 2025
 */

// Importa el framework Express para definir rutas HTTP
const express = require("express");

// Crea una nueva instancia de router de Express para agrupar rutas relacionadas a PSE
const router = express.Router();

// Importa el controlador centralizado de PSE, que contiene la lógica de negocio para cada endpoint
const pseController = require("../controllers/pseController");

/**
 * 📋 ENDPOINTS PRINCIPALES PSE
 * Aquí se definen los endpoints principales para la integración PSE.
 */

// 🏪 GET /api/pse/banks - Obtiene la lista de bancos disponibles para pagos PSE
router.get("/banks", (req, res) => pseController.obtenerBancos(req, res));

// 🚀 POST /api/pse/transaction - Inicia una nueva transacción PSE
router.post("/transaction", (req, res) =>
  pseController.iniciarTransaccion(req, res)
);

// 🔍 GET /api/pse/transaction/:transactionId - Consulta el estado de una transacción específica
router.get("/transaction/:transactionId", (req, res) =>
  pseController.consultarEstado(req, res)
);

// 🎣 POST /api/pse/webhook - Recibe confirmaciones de ACH Colombia (webhook)
router.post("/webhook", (req, res) => pseController.webhook(req, res));

// 📋 GET /api/pse/transactions - Lista todas las transacciones (requiere permisos admin)
router.get("/transactions", (req, res) =>
  pseController.listarTransacciones(req, res)
);

/**
 * 🔧 ENDPOINTS DE UTILIDAD
 * Endpoints adicionales para monitoreo y pruebas.
 */

// ❤️ GET /api/pse/health - Endpoint para verificar el estado del servicio PSE (health check)
router.get("/health", (req, res) => {
  res.json({
    success: true, // Indica si el servicio está funcionando
    service: "PSE Integration", // Nombre del servicio
    version: "1.0.0", // Versión del API
    status: "healthy", // Estado actual
    timestamp: new Date().toISOString(), // Fecha y hora actual
    environment: process.env.NODE_ENV || "development", // Entorno de ejecución
  });
});

// 🧪 GET /api/pse/test - Endpoint de pruebas para validar que la API responde correctamente
router.get("/test", (req, res) => {
  res.json({
    success: true, // Indica si la prueba fue exitosa
    message: "PSE API funcionando correctamente", // Mensaje de éxito
    endpoints: {
      banks: "GET /api/pse/banks", // Endpoint para bancos
      transaction: "POST /api/pse/transaction", // Endpoint para iniciar transacción
      status: "GET /api/pse/transaction/:id", // Endpoint para consultar estado
      webhook: "POST /api/pse/webhook", // Endpoint para webhook
      list: "GET /api/pse/transactions", // Endpoint para listar transacciones
    },
    testMode: process.env.NODE_ENV !== "production", // Indica si está en modo prueba
  });
});

/**
 * 🛡️ MIDDLEWARE DE VALIDACIÓN
 * Middleware para validar los datos de las transacciones PSE antes de procesarlas.
 */

// Middleware para validar los datos enviados en una transacción PSE
const validateTransactionData = (req, res, next) => {
  // Extrae los campos requeridos del cuerpo de la solicitud
  const { bankCode, amount, userEmail, documentNumber } = req.body;

  // Arreglo para acumular errores de validación
  const errors = [];

  // Valida que bankCode esté presente
  if (!bankCode) errors.push("bankCode es requerido");
  // Valida que amount sea un número positivo
  if (!amount || isNaN(amount) || amount <= 0)
    errors.push("amount debe ser un número positivo");
  // Valida que userEmail tenga formato de email válido
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))
    errors.push("userEmail debe ser un email válido");
  // Valida que documentNumber esté presente
  if (!documentNumber) errors.push("documentNumber es requerido");

  // Si hay errores, responde con 400 y los detalles
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Datos de transacción inválidos",
      errors,
    });
  }

  // Si todo está correcto, continúa con el siguiente middleware/controlador
  next();
};

// Aplica la validación solo a las solicitudes POST en /transaction
router.use("/transaction", (req, res, next) => {
  if (req.method === "POST") {
    return validateTransactionData(req, res, next);
  }
  next();
});

/**
 * 📝 DOCUMENTACIÓN DE ENDPOINTS
 * Endpoint para consultar la documentación de la API PSE de ServiTech.
 */

// 📖 GET /api/pse/docs - Devuelve la documentación de la API PSE en formato JSON
router.get("/docs", (req, res) => {
  res.json({
    success: true, // Indica si la consulta fue exitosa
    title: "PSE API Documentation - ServiTech", // Título de la documentación
    version: "1.0.0", // Versión de la API
    baseUrl: `${req.protocol}://${req.get("host")}/api/pse`, // URL base de la API
    endpoints: {
      "GET /banks": {
        description: "Obtener lista de bancos disponibles para PSE",
        response: "Array de bancos con id y name",
      },
      "POST /transaction": {
        description: "Iniciar nueva transacción PSE",
        requiredFields: ["bankCode", "amount", "userEmail", "documentNumber"],
        optionalFields: [
          "personType",
          "documentType",
          "userName",
          "userPhone",
          "description",
        ],
        response: "URL de redirección al banco y datos de transacción",
      },
      "GET /transaction/:id": {
        description: "Consultar estado de transacción específica",
        response: "Estado actual y detalles de la transacción",
      },
      "POST /webhook": {
        description: "Endpoint para recibir confirmaciones de ACH Colombia",
        note: "Solo para uso interno de ACH Colombia",
      },
      "GET /transactions": {
        description: "Listar transacciones (requiere permisos admin)",
        queryParams: ["page", "limit", "status", "email"],
      },
    },
    statusCodes: {
      PENDING: "Transacción creada, esperando usuario",
      REDIRECTING: "Usuario redirigido al banco",
      PROCESSING: "Transacción en proceso en el banco",
      APPROVED: "Pago aprobado exitosamente",
      REJECTED: "Pago rechazado por el banco",
      FAILED: "Error en el proceso de pago",
      EXPIRED: "Transacción expirada",
    },
  });
});

// ===============================
// 📦 EXPORTACIÓN DEL ROUTER
// Exporta el router para que pueda ser utilizado en la configuración principal de rutas de la aplicación.
module.exports = router;
