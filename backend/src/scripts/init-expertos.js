require("dotenv").config();
const mongoose = require("mongoose");
const { Usuario } = require("../models/models");
const Experto = require("../models/expertos");

// URI de conexión a MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/servitech";

// Datos de ejemplo para los expertos
const expertosData = [
  {
    usuario: {
      nombre: "Carlos",
      apellido: "Ramírez",
      email: "carlos.ramirez@servitech.com",
      password_hash: "hashedpassword123", // En producción usar bcrypt
      usuario: "carlos.ramirez",
      es_experto: true,
      foto: "/assets/img/expertos/experto1.jpg",
    },
    experto: {
      especialidad: "Desarrollo Web Full Stack",
      descripcion:
        "Desarrollador Full Stack con 8 años de experiencia en JavaScript, React y Node.js. Especializado en arquitectura de aplicaciones web y desarrollo de APIs RESTful.",
      precio: 75000,
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"],
      activo: true,
      calificacion: {
        promedio: 4.8,
        total_reviews: 24,
      },
    },
  },
  {
    usuario: {
      nombre: "Ana",
      apellido: "Martínez",
      email: "ana.martinez@servitech.com",
      password_hash: "hashedpassword456",
      usuario: "ana.martinez",
      es_experto: true,
      foto: "/assets/img/expertos/experto2.jpg",
    },
    experto: {
      especialidad: "UX/UI Design",
      descripcion:
        "Diseñadora UX/UI con experiencia en diseño de interfaces móviles y web. Experta en Figma y Adobe XD.",
      precio: 65000,
      skills: ["UI Design", "UX Research", "Figma", "Adobe XD", "Prototyping"],
      activo: true,
      calificacion: {
        promedio: 4.9,
        total_reviews: 31,
      },
    },
  },
  {
    usuario: {
      nombre: "David",
      apellido: "López",
      email: "david.lopez@servitech.com",
      password_hash: "hashedpassword789",
      usuario: "david.lopez",
      es_experto: true,
      foto: "/assets/img/expertos/experto3.jpg",
    },
    experto: {
      especialidad: "DevOps & Cloud",
      descripcion:
        "Ingeniero DevOps con amplia experiencia en AWS y Docker. Especializado en CI/CD y automatización de infraestructura.",
      precio: 85000,
      skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform"],
      activo: true,
      calificacion: {
        promedio: 4.7,
        total_reviews: 19,
      },
    },
  },
];

// Función para crear expertos
async function initExpertos() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a MongoDB");

    // Limpiar colecciones existentes
    await Usuario.deleteMany({ es_experto: true });
    await Experto.deleteMany({});
    console.log("Colecciones limpiadas");

    // Crear expertos
    for (const data of expertosData) {
      // Crear usuario
      const usuario = await Usuario.create(data.usuario);
      console.log(`Usuario creado: ${usuario.nombre} ${usuario.apellido}`);

      // Crear experto vinculado al usuario
      const experto = await Experto.create({
        ...data.experto,
        userId: usuario._id,
      });
      console.log(`Experto creado: ${experto.especialidad}`);
    }

    console.log("¡Inicialización completada con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("Error durante la inicialización:", error);
    process.exit(1);
  }
}

// Ejecutar la inicialización
initExpertos();
