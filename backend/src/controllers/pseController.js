/**
 * 🏦 CONTROLADOR PSE - ACH COLOMBIA
 * Maneja las transacciones PSE reales con ACH Colombia
 * Fecha: 6 de julio de 2025
 */

const axios = require('axios');
const crypto = require('crypto-js');
const TransaccionPSE = require('../models/transaccionPSE');

class PSEController {
    constructor() {
        // Configuración ACH Colombia - Sandbox
        this.config = {
            baseURL: process.env.ACH_BASE_URL || 'https://sandbox.achcolombia.com.co/api',
            merchantId: process.env.ACH_MERCHANT_ID,
            secretKey: process.env.ACH_SECRET_KEY,
            publicKey: process.env.ACH_PUBLIC_KEY,
            testMode: process.env.NODE_ENV !== 'production'
        };

        // Validar configuración
        if (!this.config.merchantId || !this.config.secretKey) {
            console.error('❌ Error: Credenciales de ACH Colombia no configuradas');
        }
    }

    /**
     * 🏪 Obtener lista de bancos disponibles para PSE
     */
    async obtenerBancos(req, res) {
        try {
            console.log('🏦 Obteniendo lista de bancos PSE...');

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.publicKey}`,
                'Accept': 'application/json'
            };

            const response = await axios.get(`${this.config.baseURL}/pse/banks`, {
                headers
            });

            const bancos = response.data.data || [];
            
            console.log(`✅ ${bancos.length} bancos obtenidos exitosamente`);

            res.json({
                success: true,
                data: bancos,
                message: 'Bancos PSE obtenidos exitosamente'
            });

        } catch (error) {
            console.error('❌ Error al obtener bancos PSE:', error);
            
            // Si es error de red, devolvemos bancos de prueba
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.log('⚠️  Usando bancos de prueba por error de conectividad');
                
                const bancosPrueba = [
                    { id: '1040', name: 'BANCO AGRARIO' },
                    { id: '1002', name: 'BANCO POPULAR' },
                    { id: '1032', name: 'BANCO FALABELLA' },
                    { id: '1012', name: 'BANCO CAJA SOCIAL' },
                    { id: '1019', name: 'SCOTIABANK COLOMBIA' },
                    { id: '1066', name: 'BANCO COOPERATIVO COOPCENTRAL' },
                    { id: '1006', name: 'BANCO CORPBANCA' },
                    { id: '1051', name: 'BANCO DAVIVIENDA' },
                    { id: '1001', name: 'BANCO DE BOGOTA' },
                    { id: '1023', name: 'BANCO DE OCCIDENTE' }
                ];

                return res.json({
                    success: true,
                    data: bancosPrueba,
                    message: 'Bancos PSE obtenidos (modo prueba)',
                    testMode: true
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener bancos PSE',
                error: error.message
            });
        }
    }

    /**
     * 💳 Iniciar transacción PSE
     */
    async iniciarTransaccion(req, res) {
        try {
            const {
                bankCode,
                personType,
                documentType,
                documentNumber,
                amount,
                reference,
                description,
                userEmail,
                userName,
                userPhone,
                returnUrl,
                confirmationUrl
            } = req.body;

            console.log('🚀 Iniciando transacción PSE:', {
                bankCode,
                amount,
                reference,
                userEmail
            });

            // Validar datos requeridos
            if (!bankCode || !amount || !userEmail || !documentNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos requeridos faltantes para PSE'
                });
            }

            // Crear registro de transacción local
            const transaccion = new TransaccionPSE({
                reference: reference || this.generateReference(),
                bankCode,
                amount: parseFloat(amount),
                userEmail,
                userName,
                userPhone,
                documentType: documentType || 'CC',
                documentNumber,
                personType: personType || 'N',
                status: 'PENDING',
                testMode: this.config.testMode
            });

            await transaccion.save();

            // Preparar datos para ACH Colombia
            const transactionData = {
                merchantId: this.config.merchantId,
                reference: transaccion.reference,
                amount: amount,
                currency: 'COP',
                description: description || `Pago asesoría ServiTech - ${transaccion.reference}`,
                paymentMethod: 'PSE',
                bank: bankCode,
                personType: personType || 'N',
                documentType: documentType || 'CC',
                documentNumber: documentNumber,
                email: userEmail,
                phone: userPhone || '',
                firstName: userName || 'Usuario',
                lastName: 'ServiTech',
                responseUrl: returnUrl || `${req.protocol}://${req.get('host')}/confirmacion-asesoria`,
                confirmationUrl: confirmationUrl || `${req.protocol}://${req.get('host')}/api/pse/webhook`
            };

            // Generar firma
            const signature = this.generateSignature(transactionData);
            transactionData.signature = signature;

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.secretKey}`,
                'Accept': 'application/json'
            };

            console.log('📤 Enviando datos a ACH Colombia...');

            try {
                const response = await axios.post(`${this.config.baseURL}/pse/transaction`, transactionData, {
                    headers,
                    timeout: 30000
                });

                const achResponse = response.data;

                // Actualizar transacción con respuesta de ACH
                transaccion.achTransactionId = achResponse.transactionId;
                transaccion.pseUrl = achResponse.bankURL;
                transaccion.status = 'REDIRECTING';
                transaccion.achResponse = achResponse;
                await transaccion.save();

                console.log('✅ Transacción PSE creada exitosamente:', achResponse.transactionId);

                res.json({
                    success: true,
                    data: {
                        transactionId: transaccion._id,
                        achTransactionId: achResponse.transactionId,
                        bankURL: achResponse.bankURL,
                        reference: transaccion.reference,
                        amount: transaccion.amount,
                        status: 'REDIRECTING'
                    },
                    message: 'Transacción PSE iniciada exitosamente'
                });

            } catch (achError) {
                console.error('❌ Error en ACH Colombia:', achError.response?.data || achError.message);
                
                // Si es error de conectividad, simulamos respuesta para testing
                if (achError.code === 'ENOTFOUND' || achError.code === 'ECONNREFUSED') {
                    console.log('⚠️  Simulando respuesta PSE por error de conectividad');
                    
                    const simulatedResponse = {
                        transactionId: `ACH_${Date.now()}`,
                        bankURL: `https://sandbox.pse.com.co/checkout?ref=${transaccion.reference}&bank=${bankCode}`,
                        status: 'PENDING',
                        reference: transaccion.reference
                    };

                    transaccion.achTransactionId = simulatedResponse.transactionId;
                    transaccion.pseUrl = simulatedResponse.bankURL;
                    transaccion.status = 'REDIRECTING';
                    transaccion.testMode = true;
                    await transaccion.save();

                    return res.json({
                        success: true,
                        data: {
                            transactionId: transaccion._id,
                            achTransactionId: simulatedResponse.transactionId,
                            bankURL: simulatedResponse.bankURL,
                            reference: transaccion.reference,
                            amount: transaccion.amount,
                            status: 'REDIRECTING'
                        },
                        message: 'Transacción PSE iniciada (modo simulación)',
                        testMode: true
                    });
                }

                // Actualizar estado de error
                transaccion.status = 'ERROR';
                transaccion.errorMessage = achError.response?.data?.message || achError.message;
                await transaccion.save();

                throw achError;
            }

        } catch (error) {
            console.error('❌ Error al iniciar transacción PSE:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar transacción PSE',
                error: error.message
            });
        }
    }

    /**
     * 🔄 Consultar estado de transacción
     */
    async consultarEstado(req, res) {
        try {
            const { transactionId } = req.params;

            console.log('🔍 Consultando estado de transacción:', transactionId);

            const transaccion = await TransaccionPSE.findById(transactionId);
            
            if (!transaccion) {
                return res.status(404).json({
                    success: false,
                    message: 'Transacción no encontrada'
                });
            }

            // Si tenemos ID de ACH, consultar estado real
            if (transaccion.achTransactionId && !transaccion.testMode) {
                try {
                    const headers = {
                        'Authorization': `Bearer ${this.config.secretKey}`,
                        'Accept': 'application/json'
                    };

                    const response = await axios.get(
                        `${this.config.baseURL}/pse/transaction/${transaccion.achTransactionId}`,
                        { headers }
                    );

                    const achStatus = response.data;
                    
                    // Actualizar estado local
                    if (achStatus.status !== transaccion.status) {
                        transaccion.status = achStatus.status;
                        transaccion.lastUpdated = new Date();
                        await transaccion.save();
                    }

                    console.log('✅ Estado actualizado desde ACH:', achStatus.status);

                } catch (achError) {
                    console.warn('⚠️  Error al consultar ACH, usando estado local:', achError.message);
                }
            }

            res.json({
                success: true,
                data: {
                    transactionId: transaccion._id,
                    achTransactionId: transaccion.achTransactionId,
                    reference: transaccion.reference,
                    amount: transaccion.amount,
                    status: transaccion.status,
                    bankCode: transaccion.bankCode,
                    userEmail: transaccion.userEmail,
                    createdAt: transaccion.createdAt,
                    lastUpdated: transaccion.lastUpdated,
                    testMode: transaccion.testMode
                },
                message: 'Estado de transacción consultado'
            });

        } catch (error) {
            console.error('❌ Error al consultar estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al consultar estado de transacción',
                error: error.message
            });
        }
    }

    /**
     * 🎣 Webhook para recibir confirmaciones de pago
     */
    async webhook(req, res) {
        try {
            console.log('🎣 Webhook PSE recibido:', req.body);

            const {
                transactionId,
                reference,
                status,
                amount,
                signature,
                bankProcessDate,
                message
            } = req.body;

            // Verificar firma
            if (!this.verifySignature(req.body, signature)) {
                console.error('❌ Firma de webhook inválida');
                return res.status(400).json({
                    success: false,
                    message: 'Firma inválida'
                });
            }

            // Buscar transacción por referencia o ID de ACH
            let transaccion = await TransaccionPSE.findOne({
                $or: [
                    { reference: reference },
                    { achTransactionId: transactionId }
                ]
            });

            if (!transaccion) {
                console.error('❌ Transacción no encontrada para webhook:', reference);
                return res.status(404).json({
                    success: false,
                    message: 'Transacción no encontrada'
                });
            }

            // Actualizar estado
            const oldStatus = transaccion.status;
            transaccion.status = status;
            transaccion.bankProcessDate = bankProcessDate;
            transaccion.webhookMessage = message;
            transaccion.lastUpdated = new Date();

            // Si el pago fue aprobado
            if (status === 'APPROVED' || status === 'SUCCESS') {
                transaccion.paidAt = new Date();
                transaccion.finalAmount = amount;
            }

            await transaccion.save();

            console.log(`✅ Webhook procesado: ${reference} - ${oldStatus} → ${status}`);

            // Aquí puedes agregar lógica adicional como:
            // - Enviar email de confirmación
            // - Actualizar estado de la asesoría
            // - Notificar al experto
            // - etc.

            res.json({
                success: true,
                message: 'Webhook procesado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error en webhook PSE:', error);
            res.status(500).json({
                success: false,
                message: 'Error procesando webhook',
                error: error.message
            });
        }
    }

    /**
     * 🔐 Generar firma para ACH Colombia
     */
    generateSignature(data) {
        const signatureString = `${data.merchantId}~${data.reference}~${data.amount}~${data.currency}~${this.config.secretKey}`;
        return crypto.MD5(signatureString).toString();
    }

    /**
     * ✅ Verificar firma de webhook
     */
    verifySignature(data, receivedSignature) {
        const expectedSignature = this.generateSignature(data);
        return expectedSignature === receivedSignature;
    }

    /**
     * 🎲 Generar referencia única
     */
    generateReference() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `PSE_${timestamp}_${random}`;
    }

    /**
     * 📋 Listar transacciones (para admin)
     */
    async listarTransacciones(req, res) {
        try {
            const { page = 1, limit = 20, status, email } = req.query;

            const filter = {};
            if (status) filter.status = status;
            if (email) filter.userEmail = new RegExp(email, 'i');

            const transacciones = await TransaccionPSE.find(filter)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await TransaccionPSE.countDocuments(filter);

            res.json({
                success: true,
                data: {
                    transacciones,
                    pagination: {
                        current: page,
                        pages: Math.ceil(total / limit),
                        total
                    }
                },
                message: 'Transacciones PSE obtenidas'
            });

        } catch (error) {
            console.error('❌ Error al listar transacciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener transacciones',
                error: error.message
            });
        }
    }
}

module.exports = new PSEController();
