/**
 * 🚀 SCRIPT DE INICIALIZACIÓN - SERVITECH
 * Configura modelos, datos iniciales y configuraciones del sistema
 * Fecha: 6 de julio de 2025
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Importar modelos
const {
  Usuario,
  Asesoria,
  Conversacion,
  Mensaje,
  Notificacion,
  Reseña,
  ConfiguracionSistema,
  ConfiguracionUsuario,
  TransaccionPSE,
} = require("./src/models/models");

const Categoria = require("./src/models/categorias");
const Experto = require("./src/models/expertos");

/**
 * 🔧 Configurar conexión a MongoDB
 */
async function conectarBaseDatos() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/servitech";

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Conectado a MongoDB");
    return true;
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    return false;
  }
}

/**
 * 🗃️ Crear configuraciones del sistema
 */
async function crearConfiguracionesSistema() {
  console.log("📋 Creando configuraciones del sistema...");

  const configuraciones = [
    // General
    {
      clave: "app.nombre",
      nombre: "Nombre de la aplicación",
      descripcion: "Nombre mostrado en la interfaz",
      valor: "ServiTech",
      tipoValor: "string",
      categoria: "general",
      esPublica: true,
    },
    {
      clave: "app.version",
      nombre: "Versión de la aplicación",
      descripcion: "Versión actual del sistema",
      valor: "1.0.0",
      tipoValor: "string",
      categoria: "general",
      esPublica: true,
    },
    {
      clave: "app.logo_url",
      nombre: "URL del logo",
      descripcion: "Logo principal de la aplicación",
      valor: "/assets/img/logo.png",
      tipoValor: "string",
      categoria: "apariencia",
      esPublica: true,
    },

    // Pagos
    {
      clave: "pagos.comision_plataforma",
      nombre: "Comisión de la plataforma (%)",
      descripcion: "Porcentaje de comisión cobrado por transacción",
      valor: 10,
      tipoValor: "number",
      categoria: "pagos",
      validacion: { minimo: 0, maximo: 50 },
    },
    {
      clave: "pagos.metodos_activos",
      nombre: "Métodos de pago activos",
      descripcion: "Lista de métodos de pago habilitados",
      valor: ["tarjeta", "pse", "nequi", "payu", "daviplata"],
      tipoValor: "array",
      categoria: "pagos",
    },
    {
      clave: "pagos.monto_minimo",
      nombre: "Monto mínimo de transacción (COP)",
      descripcion: "Valor mínimo permitido para asesorías",
      valor: 10000,
      tipoValor: "number",
      categoria: "pagos",
      validacion: { minimo: 1000, maximo: 100000 },
    },

    // Asesorías
    {
      clave: "asesorias.duracion_minima",
      nombre: "Duración mínima (minutos)",
      descripcion: "Tiempo mínimo para una asesoría",
      valor: 30,
      tipoValor: "number",
      categoria: "general",
      validacion: { minimo: 15, maximo: 60 },
    },
    {
      clave: "asesorias.duracion_maxima",
      nombre: "Duración máxima (minutos)",
      descripcion: "Tiempo máximo para una asesoría",
      valor: 180,
      tipoValor: "number",
      categoria: "general",
      validacion: { minimo: 60, maximo: 480 },
    },
    {
      clave: "asesorias.cancelacion_limite_horas",
      nombre: "Límite cancelación (horas)",
      descripcion: "Horas antes de la asesoría para poder cancelar",
      valor: 2,
      tipoValor: "number",
      categoria: "general",
      validacion: { minimo: 1, maximo: 48 },
    },

    // Notificaciones
    {
      clave: "notificaciones.recordatorio_default",
      nombre: "Recordatorio por defecto (minutos)",
      descripcion: "Tiempo de recordatorio antes de asesoría",
      valor: 30,
      tipoValor: "number",
      categoria: "notificaciones",
      validacion: { minimo: 5, maximo: 1440 },
    },
    {
      clave: "notificaciones.email_activo",
      nombre: "Notificaciones por email activas",
      descripcion: "Sistema de emails habilitado",
      valor: true,
      tipoValor: "boolean",
      categoria: "notificaciones",
    },
    {
      clave: "notificaciones.push_activo",
      nombre: "Notificaciones push activas",
      descripcion: "Sistema de push notifications habilitado",
      valor: true,
      tipoValor: "boolean",
      categoria: "notificaciones",
    },

    // Videollamadas
    {
      clave: "videollamadas.grabacion_automatica",
      nombre: "Grabación automática habilitada",
      descripcion: "Grabar asesorías por defecto",
      valor: false,
      tipoValor: "boolean",
      categoria: "videollamadas",
    },
    {
      clave: "videollamadas.calidad_default",
      nombre: "Calidad de video por defecto",
      descripcion: "Calidad inicial de videollamadas",
      valor: "media",
      tipoValor: "string",
      categoria: "videollamadas",
      validacion: { opciones: ["baja", "media", "alta", "auto"] },
    },
    {
      clave: "videollamadas.limite_participantes",
      nombre: "Límite de participantes",
      descripcion: "Máximo número de participantes por sala",
      valor: 10,
      tipoValor: "number",
      categoria: "videollamadas",
      validacion: { minimo: 2, maximo: 50 },
    },

    // Seguridad
    {
      clave: "seguridad.sesion_duracion_horas",
      nombre: "Duración de sesión (horas)",
      descripcion: "Tiempo de expiración de sesiones",
      valor: 24,
      tipoValor: "number",
      categoria: "seguridad",
      validacion: { minimo: 1, maximo: 168 },
    },
    {
      clave: "seguridad.intentos_login_maximos",
      nombre: "Intentos máximos de login",
      descripcion: "Bloqueo temporal tras intentos fallidos",
      valor: 5,
      tipoValor: "number",
      categoria: "seguridad",
      validacion: { minimo: 3, maximo: 10 },
    },

    // Mantenimiento
    {
      clave: "mantenimiento.modo_activo",
      nombre: "Modo mantenimiento activo",
      descripcion: "Bloquear acceso al sistema",
      valor: false,
      tipoValor: "boolean",
      categoria: "mantenimiento",
      requiereReinicio: true,
    },
    {
      clave: "mantenimiento.mensaje",
      nombre: "Mensaje de mantenimiento",
      descripcion: "Texto mostrado durante mantenimiento",
      valor: "Estamos mejorando ServiTech. Volveremos pronto.",
      tipoValor: "string",
      categoria: "mantenimiento",
    },
  ];

  let contador = 0;
  for (const config of configuraciones) {
    try {
      await ConfiguracionSistema.findOneAndUpdate(
        { clave: config.clave },
        config,
        { upsert: true, new: true }
      );
      contador++;
    } catch (error) {
      console.error(
        `❌ Error creando configuración ${config.clave}:`,
        error.message
      );
    }
  }

  console.log(
    `✅ ${contador} configuraciones del sistema creadas/actualizadas`
  );
}

/**
 * 📂 Crear categorías predeterminadas
 */
async function crearCategoriasPredeterminadas() {
  console.log("📂 Creando categorías predeterminadas...");

  const categorias = [
    {
      nombre: "Tecnología e Informática",
      descripcion: "Soporte técnico, programación, redes y sistemas",
    },
    {
      nombre: "Diseño y Creatividad",
      descripcion: "Diseño gráfico, web, UX/UI y contenido visual",
    },
    {
      nombre: "Marketing Digital",
      descripcion: "SEO, SEM, redes sociales y estrategias online",
    },
    {
      nombre: "Negocios y Finanzas",
      descripcion: "Consultoría empresarial, contabilidad y finanzas",
    },
    {
      nombre: "Legal y Jurídico",
      descripcion: "Asesoría legal, contratos y normatividad",
    },
    {
      nombre: "Educación y Tutorías",
      descripcion: "Clases particulares, idiomas y preparación académica",
    },
    {
      nombre: "Salud y Bienestar",
      descripcion: "Consultas médicas, nutrición y bienestar personal",
    },
    {
      nombre: "Arquitectura e Ingeniería",
      descripcion: "Diseño arquitectónico, cálculos y planos técnicos",
    },
  ];

  let contador = 0;
  for (const categoria of categorias) {
    try {
      await Categoria.findOneAndUpdate(
        { nombre: categoria.nombre },
        categoria,
        { upsert: true, new: true }
      );
      contador++;
    } catch (error) {
      console.error(
        `❌ Error creando categoría ${categoria.nombre}:`,
        error.message
      );
    }
  }

  console.log(`✅ ${contador} categorías creadas/actualizadas`);
}

/**
 * 👤 Crear usuario administrador
 */
async function crearUsuarioAdmin() {
  console.log("👤 Creando usuario administrador...");

  const bcrypt = require("bcrypt");

  try {
    // Verificar si ya existe
    const adminExistente = await Usuario.findOne({
      email: "admin@servitech.com",
    });
    if (adminExistente) {
      console.log("ℹ️ Usuario administrador ya existe");
      return;
    }

    // Crear password hash
    const passwordHash = await bcrypt.hash("admin123*", 10);

    const admin = new Usuario({
      nombre: "Administrador",
      apellido: "ServiTech",
      email: "admin@servitech.com",
      password_hash: passwordHash,
      es_experto: false,
      estado: "activo",
      experto: null,
    });

    await admin.save();
    console.log(
      "✅ Usuario administrador creado (admin@servitech.com / admin123*)"
    );
  } catch (error) {
    console.error("❌ Error creando usuario administrador:", error.message);
  }
}

/**
 * 🧪 Crear datos de prueba
 */
async function crearDatosPrueba() {
  console.log("🧪 Creando datos de prueba...");

  try {
    // Solo crear si no existen datos
    const usuariosExistentes = await Usuario.countDocuments();
    if (usuariosExistentes > 1) {
      console.log("ℹ️ Ya existen datos de prueba");
      return;
    }

    const bcrypt = require("bcrypt");

    // Usuario cliente de prueba
    const clientePassword = await bcrypt.hash("cliente123", 10);
    const cliente = new Usuario({
      nombre: "Juan Carlos",
      apellido: "Pérez",
      email: "cliente@test.com",
      password_hash: clientePassword,
      es_experto: false,
      estado: "activo",
    });
    await cliente.save();

    // Usuario experto de prueba
    const expertoPassword = await bcrypt.hash("experto123", 10);
    const experto = new Usuario({
      nombre: "María Elena",
      apellido: "González",
      email: "experto@test.com",
      password_hash: expertoPassword,
      es_experto: true,
      estado: "activo",
      experto: {
        especialidades: ["Desarrollo Web", "JavaScript", "React"],
        experiencia: 5,
        tarifa_hora: 50000,
        disponible: true,
      },
    });
    await experto.save();

    console.log("✅ Usuarios de prueba creados:");
    console.log("   - Cliente: cliente@test.com / cliente123");
    console.log("   - Experto: experto@test.com / experto123");
  } catch (error) {
    console.error("❌ Error creando datos de prueba:", error.message);
  }
}

/**
 * 📊 Crear índices de base de datos
 */
async function crearIndices() {
  console.log("📊 Creando índices de base de datos...");

  try {
    // Los índices ya están definidos en los esquemas de Mongoose
    // Esto los creará automáticamente
    await Usuario.createIndexes();
    await Asesoria.createIndexes();
    await Conversacion.createIndexes();
    await Mensaje.createIndexes();
    await Notificacion.createIndexes();
    await Reseña.createIndexes();
    await ConfiguracionSistema.createIndexes();
    await ConfiguracionUsuario.createIndexes();
    await TransaccionPSE.createIndexes();

    console.log("✅ Índices de base de datos creados");
  } catch (error) {
    console.error("❌ Error creando índices:", error.message);
  }
}

/**
 * 🧹 Verificar integridad de datos
 */
async function verificarIntegridad() {
  console.log("🧹 Verificando integridad de datos...");

  try {
    // Verificar configuraciones críticas
    const configCriticas = [
      "app.nombre",
      "pagos.comision_plataforma",
      "asesorias.duracion_maxima",
      "notificaciones.recordatorio_default",
    ];

    for (const clave of configCriticas) {
      const config = await ConfiguracionSistema.findOne({ clave });
      if (!config) {
        console.warn(`⚠️ Configuración faltante: ${clave}`);
      }
    }

    // Verificar categorías
    const totalCategorias = await Categoria.countDocuments();
    if (totalCategorias === 0) {
      console.warn("⚠️ No hay categorías creadas");
    }

    // Estadísticas generales
    const stats = {
      usuarios: await Usuario.countDocuments(),
      categorias: await Categoria.countDocuments(),
      asesorias: await Asesoria.countDocuments(),
      configuraciones: await ConfiguracionSistema.countDocuments(),
    };

    console.log("📈 Estadísticas del sistema:");
    console.log(`   - Usuarios: ${stats.usuarios}`);
    console.log(`   - Categorías: ${stats.categorias}`);
    console.log(`   - Asesorías: ${stats.asesorias}`);
    console.log(`   - Configuraciones: ${stats.configuraciones}`);

    console.log("✅ Verificación de integridad completada");
  } catch (error) {
    console.error("❌ Error verificando integridad:", error.message);
  }
}

/**
 * 🚀 Ejecutar inicialización completa
 */
async function inicializar() {
  console.log("🚀 Iniciando configuración de ServiTech...\n");

  // Conectar a la base de datos
  const conectado = await conectarBaseDatos();
  if (!conectado) {
    process.exit(1);
  }

  try {
    // Ejecutar pasos de inicialización
    await crearConfiguracionesSistema();
    await crearCategoriasPredeterminadas();
    await crearUsuarioAdmin();
    await crearDatosPrueba();
    await crearIndices();
    await verificarIntegridad();

    console.log("\n🎉 ¡Inicialización completada exitosamente!");
    console.log("\n📋 Resumen:");
    console.log("✅ Modelos de datos configurados");
    console.log("✅ Configuraciones del sistema creadas");
    console.log("✅ Categorías predeterminadas configuradas");
    console.log("✅ Usuario administrador creado");
    console.log("✅ Datos de prueba inicializados");
    console.log("✅ Índices de base de datos optimizados");

    console.log("\n🔑 Credenciales de acceso:");
    console.log("   Admin: admin@servitech.com / admin123*");
    console.log("   Cliente: cliente@test.com / cliente123");
    console.log("   Experto: experto@test.com / experto123");
  } catch (error) {
    console.error("\n❌ Error durante la inicialización:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Conexión a base de datos cerrada");
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  inicializar();
}

module.exports = {
  conectarBaseDatos,
  crearConfiguracionesSistema,
  crearCategoriasPredeterminadas,
  crearUsuarioAdmin,
  crearDatosPrueba,
  crearIndices,
  verificarIntegridad,
  inicializar,
};
