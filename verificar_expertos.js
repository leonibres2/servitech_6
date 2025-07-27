// Script de verificación de expertos y usuarios relacionados
const mongoose = require("mongoose");
const path = require("path");

// Ajusta la ruta según tu estructura
const Experto = require("./backend/src/models/expertos");
const { Usuario } = require("./backend/src/models/models");

const MONGO_URI = "mongodb://localhost:27017/tu_base_de_datos"; // Cambia esto por tu URI real

async function verificarExpertos() {
  await mongoose.connect(MONGO_URI);

  const expertos = await Experto.find({});
  let errores = [];

  for (const exp of expertos) {
    const usuario = await Usuario.findById(exp.userId);
    if (!usuario) {
      errores.push({
        expertoId: exp._id,
        problema: "userId no corresponde a ningún usuario",
      });
      continue;
    }
    if (!usuario.usuario || !usuario.nombre || !usuario.apellido) {
      errores.push({
        expertoId: exp._id,
        userId: exp.userId,
        usuario: usuario.usuario,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        problema: "Faltan datos en el usuario relacionado",
      });
    }
  }

  if (errores.length === 0) {
    console.log("Todos los expertos tienen usuarios válidos y completos.");
  } else {
    console.log("Problemas encontrados:");
    console.table(errores);
  }

  await mongoose.disconnect();
}

verificarExpertos();
