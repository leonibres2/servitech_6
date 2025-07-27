const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/servitech";

const usuarioSchema = new mongoose.Schema(
  {
    usuario: String,
    nombre: String,
    apellido: String,
    email: String,
    password_hash: String,
    avatar_url: String,
    es_experto: Boolean,
    fecha_registro: Date,
    estado: String,
    experto: mongoose.Schema.Types.Mixed,
  },
  { collection: "usuarios" }
);

const expertoSchema = new mongoose.Schema(
  {
    userId: mongoose.Schema.Types.ObjectId,
    especialidad: String,
    descripcion: String,
    activo: Boolean,
    fechaRegistro: Date,
  },
  { collection: "expertos" }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);
const Experto = mongoose.model("Experto", expertoSchema);

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
