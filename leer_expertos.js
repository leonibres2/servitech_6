const mongoose = require("mongoose");
const Experto = require("./backend/src/models/expertos");
const MONGO_URI = "mongodb://127.0.0.1:27017/servitech";

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
