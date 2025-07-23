/**
 * 🔔 MODELO DE NOTIFICACIÓN - SERVITECH
 * Gestiona las notificaciones del sistema.
 * Este archivo define el esquema y modelo de notificaciones para la plataforma SERVITECH.
 * Permite registrar, consultar, actualizar y gestionar notificaciones enviadas a los usuarios por distintos canales (in-app, email, SMS, push, etc).
 * Incluye lógica para expiración, agrupación, métricas, acciones y plantillas de notificación.
 * Fecha: 6 de julio de 2025
 */

// Importa mongoose, la biblioteca ODM para MongoDB en Node.js
const mongoose = require("mongoose");
// Extrae Schema para definir la estructura de los documentos
const { Schema } = mongoose;

// Define el esquema de notificación, que representa cada notificación enviada a un usuario
const notificacionSchema = new Schema(
  {
    // 🆔 Identificación
    // Código único de la notificación, sirve como identificador externo y para trazabilidad
    codigoNotificacion: {
      type: String, // Tipo string para almacenar el código
      unique: true, // Debe ser único en la colección
      required: true, // Obligatorio
      default: function () {
        // Genera un código único usando timestamp y un string aleatorio
        return `NOTIF-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;
      },
    },

    // 👤 Destinatario
    // Referencia al usuario destinatario de la notificación
    usuario: {
      type: Schema.Types.ObjectId, // Almacena el _id del usuario
      ref: "Usuario", // Relaciona con el modelo Usuario
      required: true, // Es obligatorio especificar el destinatario
    },

    // 📝 Contenido
    // Título de la notificación (breve, visible en la lista)
    titulo: {
      type: String,
      required: true, // Obligatorio
      maxlength: 200, // Límite de caracteres
    },
    // Mensaje principal de la notificación (detalle)
    mensaje: {
      type: String,
      required: true, // Obligatorio
      maxlength: 1000, // Límite de caracteres
    },
    // Descripción corta, opcional, para resúmenes o vistas previas
    descripcionCorta: {
      type: String,
      maxlength: 100, // Límite de caracteres
    },

    // 🎯 Tipo y categoría
    // Tipo de notificación (clasifica el propósito principal)
    tipo: {
      type: String,
      enum: [
        "asesoria", // Relacionada con asesorías
        "pago", // Pagos y transacciones
        "mensaje", // Nuevos mensajes
        "sistema", // Actualizaciones del sistema
        "promocion", // Ofertas y promociones
        "recordatorio", // Recordatorios importantes
        "seguridad", // Alertas de seguridad
        "cuenta", // Cambios en la cuenta
        "evaluacion", // Solicitudes de evaluación
      ],
      required: true, // Obligatorio
    },
    // Categoría visual de la notificación (afecta color, icono, etc)
    categoria: {
      type: String,
      enum: [
        "info", // Informativa
        "success", // Éxito/confirmación
        "warning", // Advertencia
        "error", // Error
        "urgent", // Urgente
      ],
      default: "info", // Valor por defecto
    },

    // 🔗 Referencias relacionadas
    // Referencias a otros modelos relacionados (ej: asesoría, mensaje, transacción, etc)
    referencia: {
      modelo: {
        type: String, // Nombre del modelo relacionado
        enum: [
          "Asesoria",
          "Mensaje",
          "Usuario",
          "TransaccionPSE",
          "Conversacion",
        ],
      },
      id: Schema.Types.ObjectId, // ID del documento relacionado
      metadata: Schema.Types.Mixed, // Datos adicionales específicos (flexible)
    },

    // 🎨 Presentación
    // Personalización visual: icono, color, imagen
    icono: {
      type: String,
      default: "bell", // Icono por defecto
    },
    color: {
      type: String,
      default: "#007bff", // Color por defecto
    },
    imagen: String, // URL de imagen opcional para enriquecer la notificación

    // 📱 Canales de entrega
    // Canales de entrega: permite controlar el estado de envío y lectura por cada canal
    canales: {
      inApp: {
        enviado: { type: Boolean, default: false }, // ¿Se envió en la app?
        leido: { type: Boolean, default: false }, // ¿El usuario la leyó?
        fechaLectura: Date, // Fecha de lectura en la app
      },
      email: {
        enviar: { type: Boolean, default: false }, // ¿Debe enviarse por email?
        enviado: { type: Boolean, default: false }, // ¿Ya fue enviada por email?
        fechaEnvio: Date, // Fecha de envío por email
        emailId: String, // ID del email en el proveedor externo
      },
      sms: {
        enviar: { type: Boolean, default: false }, // ¿Debe enviarse por SMS?
        enviado: { type: Boolean, default: false }, // ¿Ya fue enviada por SMS?
        fechaEnvio: Date, // Fecha de envío por SMS
        smsId: String, // ID del SMS en el proveedor externo
      },
      push: {
        enviar: { type: Boolean, default: false }, // ¿Debe enviarse por push?
        enviado: { type: Boolean, default: false }, // ¿Ya fue enviada por push?
        fechaEnvio: Date, // Fecha de envío por push
        pushId: String, // ID del push en el proveedor externo
      },
    },

    // 📅 Programación
    // Programación de envío: permite agendar notificaciones para el futuro
    programada: {
      esProgramada: { type: Boolean, default: false }, // ¿Está programada?
      fechaEnvio: Date, // Fecha programada de envío
      enviada: { type: Boolean, default: false }, // ¿Ya fue enviada?
    },

    // ⏰ Expiración
    // Expiración: controla si la notificación deja de ser válida tras una fecha
    expira: {
      tieneExpiracion: { type: Boolean, default: false }, // ¿Expira?
      fechaExpiracion: Date, // Fecha de expiración
      expirada: { type: Boolean, default: false }, // ¿Ya expiró?
    },

    // 🎯 Acciones
    // Acciones asociadas: botones o enlaces que el usuario puede ejecutar desde la notificación
    acciones: [
      {
        etiqueta: String, // Texto del botón/enlace
        tipo: {
          type: String,
          enum: ["url", "action", "route"], // url: enlace externo, action: acción interna, route: ruta interna
          default: "url",
        },
        valor: String, // URL, acción o ruta
        estilo: {
          type: String,
          enum: [
            "primary",
            "secondary",
            "success",
            "danger",
            "warning",
            "info",
          ], // Apariencia visual
          default: "primary",
        },
      },
    ],

    // 📊 Estado y seguimiento
    // Estado de la notificación (flujo de vida)
    estado: {
      type: String,
      enum: [
        "pendiente",
        "enviada",
        "leida",
        "actuada",
        "expirada",
        "cancelada",
      ], // Estados posibles
      default: "pendiente", // Valor inicial
    },
    // Prioridad para orden y alertas
    prioridad: {
      type: String,
      enum: ["baja", "normal", "alta", "critica"], // Niveles de prioridad
      default: "normal", // Valor por defecto
    },

    // 📈 Métricas
    // Métricas de interacción: seguimiento de apertura, clics, tiempo de lectura, etc
    metricas: {
      abierta: { type: Boolean, default: false }, // ¿Fue abierta?
      fechaApertura: Date, // Fecha de apertura
      clics: { type: Number, default: 0 }, // Número de clics en acciones
      tiempoLectura: Number, // Tiempo de lectura en segundos
      dispositivoLectura: String, // Dispositivo desde el que se leyó
    },

    // 🔄 Agrupación (para notificaciones similares)
    // Agrupación: permite asociar notificaciones similares o resúmenes
    grupoId: String, // ID de grupo de notificaciones
    esResumen: { type: Boolean, default: false }, // ¿Es una notificación resumen?
    notificacionesAgrupadas: [
      { type: Schema.Types.ObjectId, ref: "Notificacion" },
    ], // Referencias a notificaciones agrupadas

    // 📅 Metadatos
    // Metadatos de auditoría y control
    fechaCreacion: {
      type: Date,
      default: Date.now, // Fecha de creación
    },
    creadaPor: {
      type: Schema.Types.ObjectId, // Usuario que creó la notificación
      ref: "Usuario",
    },
    version: {
      type: Number, // Versión del esquema
      default: 1,
    },
  },
  {
    // Opciones del esquema:
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    collection: "notificaciones", // Fuerza el nombre de la colección
  }
);

// 📌 Índices para optimizar consultas frecuentes y mejorar el rendimiento
notificacionSchema.index({ usuario: 1, fechaCreacion: -1 }); // Para listar notificaciones recientes por usuario
notificacionSchema.index({ usuario: 1, estado: 1, fechaCreacion: -1 }); // Para filtrar por estado
notificacionSchema.index({ tipo: 1, fechaCreacion: -1 }); // Para agrupar por tipo
notificacionSchema.index({
  "programada.fechaEnvio": 1,
  "programada.enviada": 1,
}); // Para búsquedas de programadas
notificacionSchema.index({ "expira.fechaExpiracion": 1, "expira.expirada": 1 }); // Para búsquedas de expiradas
notificacionSchema.index({ grupoId: 1 }); // Para agrupación
// El campo codigoNotificacion ya tiene índice unique automático por la definición del esquema

// 🔄 Middleware para verificar expiración automáticamente en cada consulta find
notificacionSchema.pre("find", function () {
  // Marcar como expiradas las notificaciones vencidas antes de devolver resultados
  const ahora = new Date();
  this.model
    .updateMany(
      {
        "expira.tieneExpiracion": true, // Solo notificaciones que expiran
        "expira.fechaExpiracion": { $lte: ahora }, // Ya vencidas
        "expira.expirada": false, // Que aún no estén marcadas como expiradas
      },
      {
        $set: {
          "expira.expirada": true, // Marca como expirada
          estado: "expirada", // Cambia el estado
        },
      }
    )
    .exec(); // Ejecuta la actualización en segundo plano
});

// 📋 Métodos de instancia del modelo Notificacion
notificacionSchema.methods = {
  // Marcar la notificación como leída por el usuario en la app
  async marcarComoLeida() {
    this.canales.inApp.leido = true; // Marca como leída en la app
    this.canales.inApp.fechaLectura = new Date(); // Registra la fecha de lectura
    this.estado = "leida"; // Cambia el estado global
    this.metricas.abierta = true; // Marca como abierta para métricas
    this.metricas.fechaApertura = new Date(); // Fecha de apertura
    return this.save(); // Guarda los cambios
  },

  // Registrar un clic en alguna acción de la notificación
  async registrarClic() {
    this.metricas.clics += 1; // Incrementa el contador de clics
    this.estado = "actuada"; // Cambia el estado a actuada
    return this.save(); // Guarda los cambios
  },

  // Verifica si la notificación está expirada según la fecha de expiración
  estaExpirada() {
    if (!this.expira.tieneExpiracion) return false; // Si no expira, siempre está vigente
    return new Date() > this.expira.fechaExpiracion; // Compara fechas
  },

  // Genera el texto completo de la notificación para enviar por email o SMS
  generarTextoCompleto() {
    let texto = `${this.titulo}\n\n${this.mensaje}`; // Incluye título y mensaje

    if (this.acciones.length > 0) {
      texto += "\n\nAcciones disponibles:";
      this.acciones.forEach((accion) => {
        texto += `\n- ${accion.etiqueta}: ${accion.valor}`; // Lista las acciones
      });
    }

    return texto; // Devuelve el texto completo
  },

  // Simula el envío de la notificación por email (debe integrarse con un servicio real)
  async enviarPorEmail() {
    // Aquí se integraría con el servicio de email externo
    this.canales.email.enviado = true; // Marca como enviada por email
    this.canales.email.fechaEnvio = new Date(); // Fecha de envío
    this.canales.email.emailId = `email-${Date.now()}`; // ID simulado del email

    if (this.estado === "pendiente") {
      this.estado = "enviada"; // Cambia el estado si estaba pendiente
    }

    return this.save(); // Guarda los cambios
  },

  // Simula el envío de la notificación por push notification (debe integrarse con un servicio real)
  async enviarPush() {
    // Aquí se integraría con el servicio de push notifications externo
    this.canales.push.enviado = true; // Marca como enviada por push
    this.canales.push.fechaEnvio = new Date(); // Fecha de envío
    this.canales.push.pushId = `push-${Date.now()}`; // ID simulado del push

    if (this.estado === "pendiente") {
      this.estado = "enviada"; // Cambia el estado si estaba pendiente
    }

    return this.save(); // Guarda los cambios
  },
};

// 📊 Métodos estáticos del modelo Notificacion
notificacionSchema.statics = {
  // Crear una notificación estándar a partir de los datos recibidos
  async crear(datosNotificacion) {
    const notificacion = new this(datosNotificacion); // Crea instancia
    // Envío inmediato por defecto para in-app
    notificacion.canales.inApp.enviado = true;
    // Si no es programada, marcar como enviada
    if (!notificacion.programada.esProgramada) {
      notificacion.estado = "enviada";
    }
    return notificacion.save(); // Guarda en la base de datos
  },

  // Obtener notificaciones de un usuario, con filtros opcionales
  async porUsuario(usuarioId, filtros = {}) {
    const query = { usuario: usuarioId, ...filtros }; // Construye la consulta
    return this.find(query)
      .sort({ fechaCreacion: -1 }) // Ordena por fecha descendente
      .populate("referencia.id"); // Trae datos del documento referenciado
  },

  // Contar notificaciones no leídas de un usuario
  async noLeidas(usuarioId) {
    return this.find({
      usuario: usuarioId,
      "canales.inApp.leido": false,
      estado: { $nin: ["expirada", "cancelada"] },
    }).count(); // Devuelve el número de no leídas
  },

  // Buscar notificaciones programadas pendientes de envío
  async programadasPendientes() {
    const ahora = new Date();
    return this.find({
      "programada.esProgramada": true,
      "programada.enviada": false,
      "programada.fechaEnvio": { $lte: ahora },
    });
  },

  // Crear notificación de asesoría usando plantillas predefinidas
  async crearNotificacionAsesoria(tipo, usuarioId, asesoriaId, datos = {}) {
    // Plantillas para distintos eventos de asesoría
    const plantillas = {
      "nueva-asesoria": {
        titulo: "Nueva asesoría agendada",
        mensaje: "Tu asesoría ha sido confirmada y agendada exitosamente.",
        categoria: "success",
        icono: "calendar-check",
      },
      "recordatorio-asesoria": {
        titulo: "Recordatorio de asesoría",
        mensaje: "Tu asesoría está programada para dentro de 30 minutos.",
        categoria: "warning",
        icono: "clock",
      },
      "asesoria-iniciada": {
        titulo: "Asesoría iniciada",
        mensaje: "Tu asesoría ha comenzado. Puedes ingresar a la videollamada.",
        categoria: "info",
        icono: "video",
      },
      "asesoria-completada": {
        titulo: "Asesoría completada",
        mensaje:
          "Tu asesoría ha finalizado. Te invitamos a calificar el servicio.",
        categoria: "success",
        icono: "check-circle",
      },
      "asesoria-cancelada": {
        titulo: "Asesoría cancelada",
        mensaje:
          "Tu asesoría ha sido cancelada. Se procesará el reembolso correspondiente.",
        categoria: "warning",
        icono: "x-circle",
      },
    };

    const plantilla = plantillas[tipo]; // Selecciona la plantilla según el tipo
    if (!plantilla) {
      throw new Error(`Tipo de notificación no válido: ${tipo}`); // Valida el tipo
    }

    // Crea la notificación usando la plantilla y datos adicionales
    return this.crear({
      usuario: usuarioId,
      tipo: "asesoria",
      ...plantilla,
      ...datos,
      referencia: {
        modelo: "Asesoria",
        id: asesoriaId,
      },
    });
  },

  // Crear notificación de pago usando plantillas predefinidas
  async crearNotificacionPago(estado, usuarioId, transaccionId, datos = {}) {
    // Plantillas para distintos estados de pago
    const plantillas = {
      "pago-exitoso": {
        titulo: "Pago procesado exitosamente",
        mensaje: "Tu pago ha sido procesado correctamente.",
        categoria: "success",
        icono: "credit-card",
      },
      "pago-fallido": {
        titulo: "Error en el pago",
        mensaje: "No se pudo procesar tu pago. Por favor, intenta nuevamente.",
        categoria: "error",
        icono: "alert-circle",
      },
      "reembolso-procesado": {
        titulo: "Reembolso procesado",
        mensaje:
          "Tu reembolso ha sido procesado y se reflejará en tu cuenta pronto.",
        categoria: "info",
        icono: "refresh-ccw",
      },
    };

    const plantilla = plantillas[estado]; // Selecciona la plantilla según el estado
    if (!plantilla) {
      throw new Error(`Estado de pago no válido: ${estado}`); // Valida el estado
    }

    // Crea la notificación usando la plantilla y datos adicionales
    return this.crear({
      usuario: usuarioId,
      tipo: "pago",
      ...plantilla,
      ...datos,
      referencia: {
        modelo: "TransaccionPSE",
        id: transaccionId,
      },
    });
  },

  // Estadísticas agregadas de notificaciones por tipo y estado
  async estadisticas(filtro = {}) {
    const pipeline = [
      { $match: filtro }, // Filtra por los criterios recibidos
      {
        $group: {
          _id: {
            tipo: "$tipo", // Agrupa por tipo
            estado: "$estado", // y por estado
          },
          total: { $sum: 1 }, // Cuenta total
          tasaLectura: {
            $avg: { $cond: [{ $eq: ["$canales.inApp.leido", true] }, 1, 0] }, // Promedio de leídas
          },
        },
      },
    ];
    return this.aggregate(pipeline); // Ejecuta el pipeline de agregación
  },
};

// Exporta el modelo Notificacion para ser usado en el resto de la aplicación
module.exports = mongoose.model("Notificacion", notificacionSchema);
