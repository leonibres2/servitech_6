/**
 * 🏦 CONTROLADOR PSE - ACH COLOMBIA
 * Maneja las transacciones PSE reales con ACH Colombia.
 * Este archivo contiene la lógica para iniciar, consultar y recibir confirmaciones de transacciones PSE.
 * Fecha: 6 de julio de 2025
 *
 * Cada método de la clase PSEController está diseñado para interactuar con la API de ACH Colombia y el modelo de transacciones,
 * gestionando la creación, consulta y actualización de transacciones, así como la validación de firmas y el manejo de errores.
 */

// Importa la librería axios para realizar peticiones HTTP a la API de ACH Colombia.
const axios = require("axios");
// Importa la librería crypto-js para generar y verificar firmas de seguridad (hash MD5).
const crypto = require("crypto-js");
// Importa el modelo de transacciones PSE para registrar y consultar transacciones en la base de datos.
const TransaccionPSE = require("../models/transaccionPSE");

// Define la clase controladora de PSE, que agrupa todos los métodos para gestionar transacciones PSE reales y simuladas.
class PSEController {
  constructor() {
    // Configuración de la conexión con ACH Colombia (modo sandbox por defecto).
    // Se obtienen las credenciales y parámetros desde variables de entorno para mayor seguridad y flexibilidad.
    this.config = {
      baseURL: process.env.PSE_BASE_URL || "https://sandbox.api.pse.com.co", // URL base de la API de ACH Colombia (sandbox por defecto).
      merchantId: process.env.PSE_MERCHANT_ID, // ID del comercio registrado en ACH.
      secretKey: process.env.PSE_SECRET_KEY, // Llave secreta para firmar transacciones.
      apiKey: process.env.PSE_API_KEY, // API Key pública para autenticación.
      environment: process.env.PSE_ENVIRONMENT || "sandbox", // Entorno de ejecución (sandbox o producción).
      testMode: process.env.NODE_ENV !== "production", // Indica si está en modo prueba.
    };

    // Validar que las credenciales estén configuradas correctamente.
    if (
      !this.config.merchantId ||
      !this.config.secretKey ||
      !this.config.apiKey
    ) {
      // Si faltan credenciales, se activa el modo simulación y se informa por consola.
      console.log(
        "⚠️  Credenciales PSE no configuradas - Funcionando en modo simulación"
      );
      console.log(
        "   Para habilitar PSE real, configure las variables PSE_* en .env"
      );
      this.simulationMode = true;
    } else {
      // Si las credenciales están presentes, se activa el modo real y se informa por consola.
      console.log("✅ Credenciales PSE configuradas correctamente");
      console.log(`🏦 Modo: ${this.config.environment}`);
      this.simulationMode = false;
    }
  }

  /**
   * 🏪 Obtener lista de bancos disponibles para PSE
   */
  async obtenerBancos(req, res) {
    try {
      console.log("🏦 Obteniendo lista de bancos PSE...");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.publicKey}`,
        Accept: "application/json",
      };

      const response = await axios.get(`${this.config.baseURL}/pse/banks`, {
        headers,
      });

      const bancos = response.data.data || [];

      console.log(`✅ ${bancos.length} bancos obtenidos exitosamente`);

      res.json({
        success: true,
        data: bancos,
        message: "Bancos PSE obtenidos exitosamente",
      });
    } catch (error) {
      console.error("❌ Error al obtener bancos PSE:", error);

      // Si es error de red, devolvemos bancos de prueba
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        console.log("⚠️  Usando bancos de prueba por error de conectividad");

        const bancosPrueba = [
          { id: "1040", name: "BANCO AGRARIO" },
          { id: "1002", name: "BANCO POPULAR" },
          { id: "1032", name: "BANCO FALABELLA" },
          { id: "1012", name: "BANCO CAJA SOCIAL" },
          { id: "1019", name: "SCOTIABANK COLOMBIA" },
          { id: "1066", name: "BANCO COOPERATIVO COOPCENTRAL" },
          { id: "1006", name: "BANCO CORPBANCA" },
          { id: "1051", name: "BANCO DAVIVIENDA" },
          { id: "1001", name: "BANCO DE BOGOTA" },
          { id: "1023", name: "BANCO DE OCCIDENTE" },
        ];

        return res.json({
          success: true,
          data: bancosPrueba,
          message: "Bancos PSE obtenidos (modo prueba)",
          testMode: true,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al obtener bancos PSE",
        error: error.message,
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
        confirmationUrl,
      } = req.body;

      console.log("🚀 Iniciando transacción PSE:", {
        bankCode,
        amount,
        reference,
        userEmail,
      });

      // Validar datos requeridos
      if (!bankCode || !amount || !userEmail || !documentNumber) {
        return res.status(400).json({
          success: false,
          message: "Datos requeridos faltantes para PSE",
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
        documentType: documentType || "CC",
        documentNumber,
        personType: personType || "N",
        status: "PENDING",
        testMode: this.config.testMode,
      });

      await transaccion.save();

      // Preparar datos para ACH Colombia
      const transactionData = {
        merchantId: this.config.merchantId,
        reference: transaccion.reference,
        amount: amount,
        currency: "COP",
        description:
          description || `Pago asesoría ServiTech - ${transaccion.reference}`,
        paymentMethod: "PSE",
        bank: bankCode,
        personType: personType || "N",
        documentType: documentType || "CC",
        documentNumber: documentNumber,
        email: userEmail,
        phone: userPhone || "",
        firstName: userName || "Usuario",
        lastName: "ServiTech",
        responseUrl:
          returnUrl ||
          `${req.protocol}://${req.get("host")}/confirmacion-asesoria`,
        confirmationUrl:
          confirmationUrl ||
          `${req.protocol}://${req.get("host")}/api/pse/webhook`,
      };

      // Generar firma
      const signature = this.generateSignature(transactionData);
      transactionData.signature = signature;

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.secretKey}`,
        Accept: "application/json",
      };

      console.log("📤 Enviando datos a ACH Colombia...");

      try {
        const response = await axios.post(
          `${this.config.baseURL}/pse/transaction`,
          transactionData,
          {
            headers,
            timeout: 30000,
          }
        );

        const achResponse = response.data;

        // Actualizar transacción con respuesta de ACH
        transaccion.achTransactionId = achResponse.transactionId;
        transaccion.pseUrl = achResponse.bankURL;
        transaccion.status = "REDIRECTING";
        transaccion.achResponse = achResponse;
        await transaccion.save();

        console.log(
          "✅ Transacción PSE creada exitosamente:",
          achResponse.transactionId
        );

        res.json({
          success: true,
          data: {
            transactionId: transaccion._id,
            achTransactionId: achResponse.transactionId,
            bankURL: achResponse.bankURL,
            reference: transaccion.reference,
            amount: transaccion.amount,
            status: "REDIRECTING",
          },
          message: "Transacción PSE iniciada exitosamente",
        });
      } catch (achError) {
        console.error(
          "❌ Error en ACH Colombia:",
          achError.response?.data || achError.message
        );

        // Si es error de conectividad, simulamos respuesta para testing
        if (achError.code === "ENOTFOUND" || achError.code === "ECONNREFUSED") {
          console.log("⚠️  Simulando respuesta PSE por error de conectividad");

          // Si ocurre un error de conectividad con ACH Colombia, se simula una respuesta de transacción PSE para pruebas.
          // Se crea un objeto de respuesta simulada con datos ficticios pero estructurados igual que la respuesta real.
          const simulatedResponse = {
            transactionId: `ACH_${Date.now()}`, // ID simulado de la transacción ACH, usando timestamp para unicidad.
            bankURL: `https://sandbox.pse.com.co/checkout?ref=${transaccion.reference}&bank=${bankCode}`, // URL simulada de redirección al banco.
            status: "PENDING", // Estado inicial simulado de la transacción.
            reference: transaccion.reference, // Referencia local de la transacción.
          };

          // Se actualizan los campos de la transacción local con los datos simulados.
          transaccion.achTransactionId = simulatedResponse.transactionId; // Asigna el ID simulado de ACH a la transacción local.
          transaccion.pseUrl = simulatedResponse.bankURL; // Asigna la URL simulada de redirección.
          transaccion.status = "REDIRECTING"; // Cambia el estado a "REDIRECTING" para indicar que el usuario debe ser redirigido al banco.
          transaccion.testMode = true; // Marca la transacción como de prueba/simulación.
          await transaccion.save(); // Guarda los cambios en la base de datos.

          // Devuelve la respuesta simulada al frontend, indicando que la transacción está en modo simulación.
          return res.json({
            success: true,
            data: {
              transactionId: transaccion._id, // ID local de la transacción en la base de datos.
              achTransactionId: simulatedResponse.transactionId, // ID simulado de ACH.
              bankURL: simulatedResponse.bankURL, // URL simulada de redirección al banco.
              reference: transaccion.reference, // Referencia local de la transacción.
              amount: transaccion.amount, // Monto de la transacción.
              status: "REDIRECTING", // Estado de redirección.
            },
            message: "Transacción PSE iniciada (modo simulación)", // Mensaje informativo para el usuario.
            testMode: true, // Indica explícitamente que es una transacción de prueba.
          });
        }

        // Actualizar estado de error
        transaccion.status = "ERROR";
        transaccion.errorMessage =
          achError.response?.data?.message || achError.message;
        await transaccion.save();

        throw achError;
      }
    } catch (error) {
      console.error("❌ Error al iniciar transacción PSE:", error);
      res.status(500).json({
        success: false,
        message: "Error al iniciar transacción PSE",
        error: error.message,
      });
    }
  }

  /**
   * 🔄 Consultar estado de transacción
   */
  async consultarEstado(req, res) {
    try {
      const { transactionId } = req.params;

      console.log("🔍 Consultando estado de transacción:", transactionId);

      const transaccion = await TransaccionPSE.findById(transactionId);

      if (!transaccion) {
        return res.status(404).json({
          success: false,
          message: "Transacción no encontrada",
        });
      }

      // Si tenemos ID de ACH, consultar estado real
      if (transaccion.achTransactionId && !transaccion.testMode) {
        try {
          const headers = {
            Authorization: `Bearer ${this.config.secretKey}`,
            Accept: "application/json",
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

          console.log("✅ Estado actualizado desde ACH:", achStatus.status);
        } catch (achError) {
          console.warn(
            "⚠️  Error al consultar ACH, usando estado local:",
            achError.message
          );
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
          testMode: transaccion.testMode,
        },
        message: "Estado de transacción consultado",
      });
    } catch (error) {
      console.error("❌ Error al consultar estado:", error);
      res.status(500).json({
        success: false,
        message: "Error al consultar estado de transacción",
        error: error.message,
      });
    }
  }

  /**
   * 🎣 Webhook para recibir confirmaciones de pago
   */
  async webhook(req, res) {
    try {
      console.log("🎣 Webhook PSE recibido:", req.body);

      const {
        transactionId,
        reference,
        status,
        amount,
        signature,
        bankProcessDate,
        message,
      } = req.body;

      // Verificar firma
      if (!this.verifySignature(req.body, signature)) {
        console.error("❌ Firma de webhook inválida");
        return res.status(400).json({
          success: false,
          message: "Firma inválida",
        });
      }

      // Buscar transacción por referencia o ID de ACH
      let transaccion = await TransaccionPSE.findOne({
        $or: [{ reference: reference }, { achTransactionId: transactionId }],
      });

      if (!transaccion) {
        console.error("❌ Transacción no encontrada para webhook:", reference);
        return res.status(404).json({
          success: false,
          message: "Transacción no encontrada",
        });
      }

      // Actualizar estado
      const oldStatus = transaccion.status;
      transaccion.status = status;
      transaccion.bankProcessDate = bankProcessDate;
      transaccion.webhookMessage = message;
      transaccion.lastUpdated = new Date();

      // Si el pago fue aprobado
      if (status === "APPROVED" || status === "SUCCESS") {
        transaccion.paidAt = new Date();
        transaccion.finalAmount = amount;
      }

      await transaccion.save();

      console.log(
        `✅ Webhook procesado: ${reference} - ${oldStatus} → ${status}`
      );

      // Aquí puedes agregar lógica adicional como:
      // - Enviar email de confirmación
      // - Actualizar estado de la asesoría
      // - Notificar al experto
      // - etc.

      res.json({
        success: true,
        message: "Webhook procesado exitosamente",
      });
    } catch (error) {
      console.error("❌ Error en webhook PSE:", error);
      res.status(500).json({
        success: false,
        message: "Error procesando webhook",
        error: error.message,
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
      if (email) filter.userEmail = new RegExp(email, "i");

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
            total,
          },
        },
        message: "Transacciones PSE obtenidas",
      });
    } catch (error) {
      console.error("❌ Error al listar transacciones:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener transacciones",
        error: error.message,
      });
    }
  }
}

module.exports = new PSEController();
