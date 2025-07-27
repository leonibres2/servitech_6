const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/servitech";

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

const Experto = mongoose.model("Experto", expertoSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  const expertos = await Experto.find({});
  console.log("Expertos encontrados:", expertos.length);
  if (expertos.length > 0) {
    console.log("Primer experto:", expertos[0]);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
