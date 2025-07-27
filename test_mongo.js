const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/servitech";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("¡Conexión exitosa!");
    return mongoose.disconnect();
  })
  .catch((err) => {
    console.error("Error de conexión:", err);
  });
