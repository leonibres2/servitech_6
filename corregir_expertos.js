// Script para corregir automáticamente los expertos con datos de usuario faltantes
const mongoose = require("mongoose");

const models = require("./backend/src/models/models");
const Experto = require("./backend/src/models/expertos");
const Usuario = models.Usuario;

const MONGO_URI = "mongodb://127.0.0.1:27017/servitech"; // Usar 127.0.0.1 para evitar problemas de conexión

async function corregirExpertos() {
  await mongoose.connect(MONGO_URI);

  const expertos = await Experto.find({});
  let corregidos = 0;

  for (const exp of expertos) {
    const usuario = await Usuario.findById(exp.userId);
    if (!usuario) {
      console.log(`Experto ${exp._id} tiene un userId inválido: ${exp.userId}`);
      continue;
    }
    let actualizado = false;
    if (!usuario.usuario) {
      usuario.usuario = `usuario${usuario._id.toString().slice(-4)}`;
      actualizado = true;
    }
    if (!usuario.nombre) {
      usuario.nombre = "Nombre";
      actualizado = true;
    }
    if (!usuario.apellido) {
      usuario.apellido = "Apellido";
      actualizado = true;
    }
    if (actualizado) {
      await usuario.save();
      corregidos++;
      console.log(`Usuario corregido: ${usuario._id}`);
    }
  }

  console.log(`Corrección finalizada. Usuarios corregidos: ${corregidos}`);
  await mongoose.disconnect();
}

corregirExpertos();
