/**
 * ⭐ MODELO DE RESEÑA/CALIFICACIÓN - SERVITECH
 * Gestiona las valoraciones y comentarios de los servicios
 * Fecha: 6 de julio de 2025
 */

const mongoose = require("mongoose");
const { Schema } = mongoose;

// Definición del esquema principal de reseña, cada bloque y campo está documentado a detalle:
const reseñaSchema = new Schema(
  {
    // 🆔 Identificación única de la reseña
    codigoReseña: {
      type: String, // Código único generado automáticamente
      unique: true, // No puede repetirse en la colección
      required: true, // Es obligatorio
      default: function () {
        // Genera un código con prefijo, timestamp y string aleatorio para trazabilidad
        return `REV-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 6)
          .toUpperCase()}`;
      },
    },

    // 👥 Participantes de la reseña
    cliente: {
      type: Schema.Types.ObjectId, // Referencia al usuario cliente
      ref: "Usuario", // Relación con el modelo Usuario
      required: true, // Obligatorio
    },
    experto: {
      type: Schema.Types.ObjectId, // Referencia al usuario experto
      ref: "Usuario", // Relación con el modelo Usuario
      required: true, // Obligatorio
    },

    // 🔗 Servicio evaluado
    asesoria: {
      type: Schema.Types.ObjectId, // Referencia a la asesoría evaluada
      ref: "Asesoria", // Relación con el modelo Asesoria
      required: true, // Obligatorio
    },

    // ⭐ Calificaciones detalladas del servicio y del experto
    calificaciones: {
      general: {
        type: Number, // Calificación global (1 a 5)
        required: true, // Obligatoria
        min: 1, // Valor mínimo
        max: 5, // Valor máximo
        validate: {
          validator: Number.isInteger, // Debe ser entero
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
      conocimiento: {
        type: Number, // Evalúa el conocimiento del experto
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
      comunicacion: {
        type: Number, // Evalúa la comunicación
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
      puntualidad: {
        type: Number, // Evalúa la puntualidad
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
      solucionProblemas: {
        type: Number, // Evalúa la capacidad de resolver problemas
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
      calidadPrecio: {
        type: Number, // Evalúa la relación calidad/precio
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: "La calificación debe ser un número entero entre 1 y 5",
        },
      },
    },

    // 📝 Comentarios del cliente sobre el servicio
    comentario: {
      titulo: {
        type: String, // Título opcional del comentario
        maxlength: 200, // Límite de caracteres
      },
      texto: {
        type: String, // Texto principal del comentario
        required: true, // Obligatorio
        maxlength: 2000, // Límite de caracteres
      },
      aspectosPositivos: [String], // Lista de aspectos destacados
      aspectosMejorar: [String], // Lista de aspectos a mejorar
      recomendaria: {
        type: Boolean, // ¿Recomendaría al experto?
        required: true,
      },
    },

    // 📸 Evidencias opcionales (imágenes, videos, documentos)
    evidencias: [
      {
        tipo: {
          type: String, // Tipo de evidencia
          enum: ["imagen", "video", "documento"], // Tipos permitidos
          required: true,
        },
        url: {
          type: String, // URL de la evidencia
          required: true,
        },
        nombre: String, // Nombre del archivo
        tamaño: Number, // Tamaño en bytes
        descripcion: String, // Descripción opcional
      },
    ],

    // 📊 Estado y moderación de la reseña
    estado: {
      type: String, // Estado actual
      enum: ["pendiente", "aprobada", "rechazada", "oculta", "reportada"], // Estados posibles
      default: "pendiente", // Valor inicial
    },
    moderacion: {
      moderadaPor: {
        type: Schema.Types.ObjectId, // Usuario que moderó
        ref: "Usuario",
      },
      fechaModeracion: Date, // Fecha de moderación
      observaciones: String, // Observaciones del moderador
      esApropiada: Boolean, // ¿Es apropiada?
      requiereRevision: Boolean, // ¿Requiere revisión adicional?
    },

    // 🤖 Análisis automático de la reseña (sentimiento, palabras clave, temas, nivel de detalle)
    analisis: {
      sentimiento: {
        tipo: {
          type: String, // Tipo de sentimiento
          enum: ["positivo", "neutral", "negativo"],
          default: "neutral",
        },
        puntuacion: Number, // Puntuación de sentimiento (-1 a 1)
        confianza: Number, // Confianza del análisis (0 a 1)
      },
      palabrasClave: [String], // Palabras clave detectadas
      temasIdentificados: [String], // Temas principales
      nivelDetalle: {
        type: String, // Nivel de detalle del comentario
        enum: ["basico", "detallado", "completo"],
        default: "basico",
      },
    },

    // 🔄 Respuesta del experto a la reseña
    respuestaExperto: {
      texto: {
        type: String, // Texto de la respuesta
        maxlength: 1000,
      },
      fechaRespuesta: Date, // Fecha de la respuesta
      editada: {
        esEditada: { type: Boolean, default: false }, // ¿Fue editada?
        fechaEdicion: Date, // Fecha de edición
      },
    },

    // 👍 Interacciones de otros usuarios con la reseña (útil, reportes)
    interacciones: {
      util: {
        total: { type: Number, default: 0 }, // Total de usuarios que la marcaron como útil
        usuarios: [{ type: Schema.Types.ObjectId, ref: "Usuario" }], // Usuarios que la marcaron como útil
      },
      reportes: [
        {
          usuario: { type: Schema.Types.ObjectId, ref: "Usuario" }, // Usuario que reporta
          motivo: {
            type: String,
            enum: [
              "contenido-inapropiado",
              "spam",
              "informacion-falsa",
              "lenguaje-ofensivo",
              "otro",
            ],
          },
          descripcion: String, // Descripción del reporte
          fecha: { type: Date, default: Date.now },
        },
      ],
    },

    // 📈 Métricas de visualización y compartido
    metricas: {
      visualizaciones: { type: Number, default: 0 }, // Número de veces vista
      compartidas: { type: Number, default: 0 }, // Número de veces compartida
      clicsEnPerfil: { type: Number, default: 0 }, // Clics en el perfil del experto
    },

    // 🎯 Contexto adicional del servicio evaluado
    contextoServicio: {
      duracionReal: Number, // Duración real del servicio (minutos)
      precioFinal: Number, // Precio final pagado
      problemaResuelto: Boolean, // ¿Se resolvió el problema?
      seguimientoRequerido: Boolean, // ¿Requirió seguimiento?
      primeraVez: Boolean, // ¿Primera vez con este experto?
    },

    // 📅 Metadatos de auditoría y control
    fechaCreacion: {
      type: Date,
      default: Date.now, // Fecha de creación
    },
    fechaPublicacion: Date, // Fecha de publicación (cuando es aprobada)
    ip: String, // IP desde donde se creó
    dispositivo: String, // Dispositivo usado
    version: {
      type: Number, // Versión del esquema
      default: 1,
    },
  },
  {
    // Opciones del esquema:
    timestamps: true, // Agrega automáticamente createdAt y updatedAt
    collection: "reseñas", // Fuerza el nombre de la colección
  }
);

// 📌 Índices para optimizar consultas frecuentes y mejorar el rendimiento de las búsquedas en la colección de reseñas
reseñaSchema.index({ experto: 1, estado: 1, fechaPublicacion: -1 }); // Permite buscar rápidamente reseñas recientes de un experto por estado
reseñaSchema.index({ cliente: 1, fechaCreacion: -1 }); // Permite listar reseñas hechas por un cliente, ordenadas por fecha
reseñaSchema.index({ asesoria: 1 }); // Permite buscar reseñas asociadas a una asesoría específica
reseñaSchema.index({ "calificaciones.general": -1, estado: 1 }); // Permite ordenar y filtrar por calificación general y estado
reseñaSchema.index({ estado: 1, fechaCreacion: -1 }); // Permite búsquedas por estado y fecha de creación
// El campo codigoReseña ya tiene índice unique automático por la definición del esquema

// Índice compuesto adicional para búsquedas avanzadas de expertos, ordenando por calificación y fecha
reseñaSchema.index({
  experto: 1,
  estado: 1,
  "calificaciones.general": -1,
  fechaPublicacion: -1,
});

// 🔄 Middleware pre('save') para lógica automática antes de guardar una reseña
reseñaSchema.pre("save", function (next) {
  // Si la calificación general no está establecida, calcularla como promedio de las calificaciones detalladas
  // Esto asegura que siempre haya una calificación global aunque el usuario solo haya llenado las específicas
  if (!this.calificaciones.general && this.calificaciones.conocimiento) {
    // Se arma un array con todas las calificaciones detalladas presentes
    const calificaciones = [
      this.calificaciones.conocimiento,
      this.calificaciones.comunicacion,
      this.calificaciones.puntualidad,
      this.calificaciones.solucionProblemas,
      this.calificaciones.calidadPrecio,
    ].filter((cal) => cal !== undefined);

    // Si hay al menos una calificación, se calcula el promedio y se asigna como general
    if (calificaciones.length > 0) {
      this.calificaciones.general = Math.round(
        calificaciones.reduce((sum, cal) => sum + cal, 0) /
          calificaciones.length
      );
    }
  }

  // Si la reseña pasa a estado 'aprobada' y no tiene fecha de publicación, se la asigna automáticamente
  // Esto permite registrar cuándo fue publicada oficialmente la reseña
  if (
    this.isModified("estado") &&
    this.estado === "aprobada" &&
    !this.fechaPublicacion
  ) {
    this.fechaPublicacion = new Date();
  }

  // Llama a next() para continuar con el guardado
  next();
});

// 📋 Métodos de instancia del modelo Reseña
reseñaSchema.methods = {
  /**
   * Marcar la reseña como útil por un usuario.
   * Si el usuario no la ha marcado antes, se agrega su ID y se incrementa el contador.
   * Permite a otros usuarios indicar que la reseña les resultó útil.
   * @param {ObjectId} usuarioId - ID del usuario que marca como útil
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async marcarComoUtil(usuarioId) {
    const yaMarco = this.interacciones.util.usuarios.includes(usuarioId); // Verifica si ya la marcó
    if (!yaMarco) {
      this.interacciones.util.usuarios.push(usuarioId); // Agrega usuario
      this.interacciones.util.total += 1; // Incrementa total
      return this.save(); // Guarda cambios
    }
    return this; // Si ya la marcó, no hace nada
  },

  /**
   * Quitar la marca de útil de un usuario.
   * Permite a un usuario retirar su voto de utilidad sobre la reseña.
   * @param {ObjectId} usuarioId - ID del usuario
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async quitarMarcaUtil(usuarioId) {
    const index = this.interacciones.util.usuarios.indexOf(usuarioId);
    if (index > -1) {
      this.interacciones.util.usuarios.splice(index, 1); // Quita usuario
      this.interacciones.util.total = Math.max(
        0,
        this.interacciones.util.total - 1
      ); // Decrementa total
      return this.save();
    }
    return this;
  },

  /**
   * Reportar la reseña por un usuario.
   * Agrega un reporte con motivo y descripción. Si hay 3 o más reportes, la reseña se marca para revisión.
   * @param {ObjectId} usuarioId - ID del usuario que reporta
   * @param {String} motivo - Motivo del reporte
   * @param {String} descripcion - Descripción adicional
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async reportar(usuarioId, motivo, descripcion) {
    this.interacciones.reportes.push({
      usuario: usuarioId,
      motivo,
      descripcion,
    });
    // Si tiene muchos reportes, marcar para revisión
    if (this.interacciones.reportes.length >= 3) {
      this.estado = "reportada";
      this.moderacion.requiereRevision = true;
    }
    return this.save();
  },

  /**
   * Aprobar la reseña (moderación).
   * Cambia el estado a 'aprobada', registra la fecha y los datos del moderador.
   * @param {ObjectId} moderadorId - ID del moderador
   * @param {String} observaciones - Observaciones de la moderación
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async aprobar(moderadorId, observaciones) {
    this.estado = "aprobada";
    this.fechaPublicacion = new Date();
    this.moderacion.moderadaPor = moderadorId;
    this.moderacion.fechaModeracion = new Date();
    this.moderacion.observaciones = observaciones;
    this.moderacion.esApropiada = true;
    return this.save();
  },

  /**
   * Rechazar la reseña (moderación).
   * Cambia el estado a 'rechazada' y registra los datos del moderador.
   * @param {ObjectId} moderadorId - ID del moderador
   * @param {String} observaciones - Observaciones de la moderación
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async rechazar(moderadorId, observaciones) {
    this.estado = "rechazada";
    this.moderacion.moderadaPor = moderadorId;
    this.moderacion.fechaModeracion = new Date();
    this.moderacion.observaciones = observaciones;
    this.moderacion.esApropiada = false;
    return this.save();
  },

  /**
   * Incrementar el contador de visualizaciones de la reseña.
   * Se utiliza para métricas de popularidad.
   * @returns {Promise<Reseña>} La reseña actualizada
   */
  async incrementarVisualizaciones() {
    this.metricas.visualizaciones += 1;
    return this.save();
  },

  /**
   * Calcular puntuación de confianza de la reseña.
   * Suma puntos por longitud, detalle, evidencias y utilidad para estimar la confiabilidad.
   * @returns {Number} Puntuación entre 0 y 1
   */
  calcularConfianza() {
    let puntuacion = 0;
    // Longitud del comentario
    if (this.comentario.texto.length > 100) puntuacion += 0.2;
    if (this.comentario.texto.length > 300) puntuacion += 0.1;
    // Calificaciones detalladas
    const calificacionesDetalladas = [
      this.calificaciones.conocimiento,
      this.calificaciones.comunicacion,
      this.calificaciones.puntualidad,
      this.calificaciones.solucionProblemas,
      this.calificaciones.calidadPrecio,
    ].filter((cal) => cal !== undefined).length;
    puntuacion += (calificacionesDetalladas / 5) * 0.3;
    // Evidencias
    if (this.evidencias.length > 0) puntuacion += 0.2;
    // Interacciones positivas
    if (this.interacciones.util.total > 0) {
      puntuacion += Math.min(this.interacciones.util.total * 0.1, 0.2);
    }
    return Math.min(puntuacion, 1); // Máximo 1
  },
};

// 📊 Métodos estáticos del modelo Reseña
reseñaSchema.statics = {
  /**
   * 🔍 porExperto
   * Obtiene todas las reseñas aprobadas de un experto específico, permitiendo aplicar filtros adicionales.
   * @param {ObjectId} expertoId - ID del experto a consultar
   * @param {Object} filtros - Filtros adicionales para la consulta (opcional)
   * @returns {Promise<Array<Reseña>>} Listado de reseñas encontradas
   *
   * Paso a paso:
   * 1. Construye un objeto de consulta con el experto y estado 'aprobada'.
   * 2. Aplica filtros adicionales si se proporcionan.
   * 3. Realiza la búsqueda en la colección, poblando los datos del cliente y la asesoría.
   * 4. Ordena los resultados por fecha de publicación descendente (más recientes primero).
   */
  async porExperto(expertoId, filtros = {}) {
    // Construye el query base: experto y estado 'aprobada'
    const query = {
      experto: expertoId, // ID del experto a buscar
      estado: "aprobada", // Solo reseñas aprobadas
      ...filtros, // Filtros adicionales (por ejemplo, rango de fechas)
    };

    // Busca las reseñas, pobla datos relevantes y ordena por fecha de publicación
    return this.find(query)
      .populate("cliente", "nombre apellido avatar") // Incluye datos del cliente
      .populate("asesoria", "codigoAsesoria titulo categoria") // Incluye datos de la asesoría
      .sort({ fechaPublicacion: -1 }); // Ordena por fecha de publicación descendente
  },

  /**
   * 📊 estadisticasExperto
   * Calcula estadísticas agregadas de las reseñas de un experto: promedios, totales y distribución.
   * @param {ObjectId} expertoId - ID del experto
   * @returns {Promise<Object>} Estadísticas calculadas
   *
   * Paso a paso:
   * 1. Construye un pipeline de agregación para filtrar por experto y estado 'aprobada'.
   * 2. Agrupa los resultados para calcular promedios, totales y distribución de calificaciones.
   * 3. Calcula el porcentaje de recomendación.
   * 4. Devuelve el primer resultado o valores por defecto si no hay reseñas.
   */
  async estadisticasExperto(expertoId) {
    // Pipeline de agregación para calcular estadísticas
    const pipeline = [
      {
        $match: {
          experto: new mongoose.Types.ObjectId(expertoId), // Filtra por experto
          estado: "aprobada", // Solo reseñas aprobadas
        },
      },
      {
        $group: {
          _id: null, // Agrupa todos los resultados
          totalReseñas: { $sum: 1 }, // Total de reseñas
          promedioGeneral: { $avg: "$calificaciones.general" }, // Promedio general
          promedioConocimiento: { $avg: "$calificaciones.conocimiento" },
          promedioComunicacion: { $avg: "$calificaciones.comunicacion" },
          promedioPuntualidad: { $avg: "$calificaciones.puntualidad" },
          promedioSolucionProblemas: {
            $avg: "$calificaciones.solucionProblemas",
          },
          promedioCalidadPrecio: { $avg: "$calificaciones.calidadPrecio" },
          totalRecomendaciones: {
            $sum: { $cond: ["$comentario.recomendaria", 1, 0] }, // Cuenta recomendaciones
          },
          distribucionCalificaciones: {
            $push: "$calificaciones.general", // Array de calificaciones generales
          },
        },
      },
      {
        $addFields: {
          porcentajeRecomendacion: {
            $multiply: [
              { $divide: ["$totalRecomendaciones", "$totalReseñas"] }, // Calcula el porcentaje
              100,
            ],
          },
        },
      },
    ];

    // Ejecuta el pipeline y retorna el resultado o valores por defecto
    const resultado = await this.aggregate(pipeline);
    return (
      resultado[0] || {
        totalReseñas: 0,
        promedioGeneral: 0,
        porcentajeRecomendacion: 0,
      }
    );
  },

  /**
   * 🕑 recientes
   * Obtiene las reseñas más recientes aprobadas, con límite configurable.
   * @param {Number} limite - Número máximo de reseñas a devolver (por defecto 10)
   * @returns {Promise<Array<Reseña>>} Listado de reseñas recientes
   *
   * Paso a paso:
   * 1. Busca reseñas con estado 'aprobada'.
   * 2. Pobla datos de cliente, experto y asesoría.
   * 3. Ordena por fecha de publicación descendente.
   * 4. Limita la cantidad de resultados según el parámetro.
   */
  async recientes(limite = 10) {
    return this.find({ estado: "aprobada" }) // Solo reseñas aprobadas
      .populate("cliente", "nombre apellido avatar") // Pobla datos del cliente
      .populate("experto", "nombre apellido avatar especialidades") // Pobla datos del experto
      .populate("asesoria", "categoria titulo") // Pobla datos de la asesoría
      .sort({ fechaPublicacion: -1 }) // Ordena por fecha de publicación descendente
      .limit(limite); // Limita la cantidad de resultados
  },

  /**
   * 🏆 mejores
   * Obtiene las mejores reseñas (más útiles y mejor calificadas), con límite configurable.
   * @param {Number} limite - Número máximo de reseñas a devolver (por defecto 10)
   * @returns {Promise<Array<Reseña>>} Listado de mejores reseñas
   *
   * Paso a paso:
   * 1. Busca reseñas con estado 'aprobada'.
   * 2. Pobla datos de cliente y experto.
   * 3. Ordena por total de votos útiles, calificación general y fecha de publicación.
   * 4. Limita la cantidad de resultados.
   */
  async mejores(limite = 10) {
    return this.find({ estado: "aprobada" }) // Solo reseñas aprobadas
      .populate("cliente", "nombre apellido avatar") // Pobla datos del cliente
      .populate("experto", "nombre apellido avatar especialidades") // Pobla datos del experto
      .sort({
        "interacciones.util.total": -1, // Más útiles primero
        "calificaciones.general": -1, // Mejor calificación
        fechaPublicacion: -1, // Más recientes
      })
      .limit(limite); // Limita la cantidad de resultados
  },

  /**
   * 🔎 buscar
   * Busca reseñas aprobadas que coincidan con un término de texto en título, comentario o aspectos positivos.
   * Permite aplicar filtros adicionales.
   * @param {String} termino - Término de búsqueda (texto)
   * @param {Object} filtros - Filtros adicionales (opcional)
   * @returns {Promise<Array<Reseña>>} Listado de reseñas encontradas
   *
   * Paso a paso:
   * 1. Construye un query con estado 'aprobada' y condiciones de búsqueda por texto.
   * 2. Aplica filtros adicionales si se proporcionan.
   * 3. Busca y pobla datos de cliente y experto.
   * 4. Ordena por calificación general y fecha de publicación.
   */
  async buscar(termino, filtros = {}) {
    // Construye el query de búsqueda por texto
    const query = {
      estado: "aprobada", // Solo reseñas aprobadas
      $or: [
        { "comentario.titulo": { $regex: termino, $options: "i" } }, // Coincidencia en título
        { "comentario.texto": { $regex: termino, $options: "i" } }, // Coincidencia en texto
        { "comentario.aspectosPositivos": { $in: [new RegExp(termino, "i")] } }, // Coincidencia en aspectos positivos
      ],
      ...filtros, // Filtros adicionales
    };

    // Busca y pobla datos relevantes, ordena por calificación y fecha
    return this.find(query)
      .populate("cliente", "nombre apellido avatar") // Pobla datos del cliente
      .populate("experto", "nombre apellido avatar especialidades") // Pobla datos del experto
      .sort({ "calificaciones.general": -1, fechaPublicacion: -1 }); // Ordena por calificación y fecha
  },

  /**
   * 🕵️‍♂️ pendientesModeracion
   * Obtiene reseñas que están pendientes de moderación o han sido reportadas.
   * @returns {Promise<Array<Reseña>>} Listado de reseñas pendientes de revisión
   *
   * Paso a paso:
   * 1. Busca reseñas con estado 'pendiente' o 'reportada'.
   * 2. Pobla datos de cliente, experto y asesoría.
   * 3. Ordena por fecha de creación ascendente (las más antiguas primero).
   */
  async pendientesModeracion() {
    return this.find({
      estado: { $in: ["pendiente", "reportada"] }, // Estados a revisar
    })
      .populate("cliente", "nombre apellido email") // Pobla datos del cliente
      .populate("experto", "nombre apellido email") // Pobla datos del experto
      .populate("asesoria", "codigoAsesoria titulo") // Pobla datos de la asesoría
      .sort({ fechaCreacion: 1 }); // Ordena por fecha de creación ascendente
  },

  /**
   * 📈 analizarTendencias
   * Analiza tendencias de reseñas aprobadas en un periodo de días, agrupando por día.
   * @param {Number} periodo - Número de días a analizar (por defecto 30)
   * @returns {Promise<Array<Object>>} Estadísticas agrupadas por día
   *
   * Paso a paso:
   * 1. Calcula la fecha de inicio restando el periodo a la fecha actual.
   * 2. Construye un pipeline de agregación para filtrar y agrupar por año, mes y día.
   * 3. Calcula totales, promedios y recomendaciones por día.
   * 4. Ordena los resultados cronológicamente.
   */
  async analizarTendencias(periodo = 30) {
    // Calcula la fecha de inicio del periodo
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - periodo); // Resta los días del periodo

    // Pipeline de agregación para agrupar por día
    const pipeline = [
      {
        $match: {
          estado: "aprobada", // Solo reseñas aprobadas
          fechaPublicacion: { $gte: fechaInicio }, // Solo dentro del periodo
        },
      },
      {
        $group: {
          _id: {
            año: { $year: "$fechaPublicacion" }, // Agrupa por año
            mes: { $month: "$fechaPublicacion" }, // Agrupa por mes
            dia: { $dayOfMonth: "$fechaPublicacion" }, // Agrupa por día
          },
          totalReseñas: { $sum: 1 }, // Total de reseñas por día
          promedioCalificacion: { $avg: "$calificaciones.general" }, // Promedio de calificación
          totalRecomendaciones: {
            $sum: { $cond: ["$comentario.recomendaria", 1, 0] }, // Total de recomendaciones
          },
        },
      },
      {
        $sort: { "_id.año": 1, "_id.mes": 1, "_id.dia": 1 }, // Ordena cronológicamente
      },
    ];

    // Ejecuta el pipeline y retorna las tendencias
    return this.aggregate(pipeline);
  },
};

// ===============================
// 📦 EXPORTACIÓN DEL MODELO
// Se exporta el modelo 'Reseña' basado en el esquema reseñaSchema.
// Esto permite que el modelo sea utilizado en otros módulos de la aplicación para crear,
// consultar, actualizar y eliminar reseñas en la base de datos MongoDB.
//
// Uso típico:
// const Reseña = require('./models/reseña');
// Reseña.find(...), Reseña.create(...), etc.
module.exports = mongoose.model("Reseña", reseñaSchema);
