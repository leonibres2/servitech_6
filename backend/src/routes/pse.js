/**
 * 🏦 RUTAS PSE - ACH COLOMBIA
 * Endpoints para transacciones PSE reales
 * Fecha: 6 de julio de 2025
 */

const express = require('express');
const router = express.Router();
const pseController = require('../controllers/pseController');

/**
 * 📋 ENDPOINTS PRINCIPALES PSE
 */

// 🏪 GET /api/pse/banks - Obtener bancos disponibles
router.get('/banks', (req, res) => pseController.obtenerBancos(req, res));

// 🚀 POST /api/pse/transaction - Iniciar transacción PSE
router.post('/transaction', (req, res) => pseController.iniciarTransaccion(req, res));

// 🔍 GET /api/pse/transaction/:transactionId - Consultar estado
router.get('/transaction/:transactionId', (req, res) => pseController.consultarEstado(req, res));

// 🎣 POST /api/pse/webhook - Webhook de confirmación
router.post('/webhook', (req, res) => pseController.webhook(req, res));

// 📋 GET /api/pse/transactions - Listar transacciones (admin)
router.get('/transactions', (req, res) => pseController.listarTransacciones(req, res));

/**
 * 🔧 ENDPOINTS DE UTILIDAD
 */

// ❤️ GET /api/pse/health - Health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'PSE Integration',
        version: '1.0.0',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 🧪 GET /api/pse/test - Endpoint de pruebas
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'PSE API funcionando correctamente',
        endpoints: {
            banks: 'GET /api/pse/banks',
            transaction: 'POST /api/pse/transaction',
            status: 'GET /api/pse/transaction/:id',
            webhook: 'POST /api/pse/webhook',
            list: 'GET /api/pse/transactions'
        },
        testMode: process.env.NODE_ENV !== 'production'
    });
});

/**
 * 🛡️ MIDDLEWARE DE VALIDACIÓN
 */

// Middleware para validar datos de transacción
const validateTransactionData = (req, res, next) => {
    const { bankCode, amount, userEmail, documentNumber } = req.body;
    
    const errors = [];
    
    if (!bankCode) errors.push('bankCode es requerido');
    if (!amount || isNaN(amount) || amount <= 0) errors.push('amount debe ser un número positivo');
    if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) errors.push('userEmail debe ser un email válido');
    if (!documentNumber) errors.push('documentNumber es requerido');
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos de transacción inválidos',
            errors
        });
    }
    
    next();
};

// Aplicar validación a POST /transaction
router.use('/transaction', (req, res, next) => {
    if (req.method === 'POST') {
        return validateTransactionData(req, res, next);
    }
    next();
});

/**
 * 📝 DOCUMENTACIÓN DE ENDPOINTS
 */

// 📖 GET /api/pse/docs - Documentación de la API
router.get('/docs', (req, res) => {
    res.json({
        success: true,
        title: 'PSE API Documentation - ServiTech',
        version: '1.0.0',
        baseUrl: `${req.protocol}://${req.get('host')}/api/pse`,
        endpoints: {
            'GET /banks': {
                description: 'Obtener lista de bancos disponibles para PSE',
                response: 'Array de bancos con id y name'
            },
            'POST /transaction': {
                description: 'Iniciar nueva transacción PSE',
                requiredFields: ['bankCode', 'amount', 'userEmail', 'documentNumber'],
                optionalFields: ['personType', 'documentType', 'userName', 'userPhone', 'description'],
                response: 'URL de redirección al banco y datos de transacción'
            },
            'GET /transaction/:id': {
                description: 'Consultar estado de transacción específica',
                response: 'Estado actual y detalles de la transacción'
            },
            'POST /webhook': {
                description: 'Endpoint para recibir confirmaciones de ACH Colombia',
                note: 'Solo para uso interno de ACH Colombia'
            },
            'GET /transactions': {
                description: 'Listar transacciones (requiere permisos admin)',
                queryParams: ['page', 'limit', 'status', 'email']
            }
        },
        statusCodes: {
            'PENDING': 'Transacción creada, esperando usuario',
            'REDIRECTING': 'Usuario redirigido al banco',
            'PROCESSING': 'Transacción en proceso en el banco',
            'APPROVED': 'Pago aprobado exitosamente',
            'REJECTED': 'Pago rechazado por el banco',
            'FAILED': 'Error en el proceso de pago',
            'EXPIRED': 'Transacción expirada'
        }
    });
});

module.exports = router;
