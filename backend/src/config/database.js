// Importa el módulo mongoose, que es una biblioteca de modelado de objetos MongoDB para Node.js. Permite interactuar con la base de datos MongoDB de manera sencilla y estructurada.
const mongoose = require("mongoose");
// Carga las variables de entorno definidas en un archivo .env al entorno de Node.js. Esto es útil para mantener información sensible, como la URI de la base de datos, fuera del código fuente.
require("dotenv").config();

// Define una función asíncrona llamada connectDB que se encargará de establecer la conexión con la base de datos MongoDB.
const connectDB = async () => {
  try {
    // Intenta conectar a la base de datos MongoDB utilizando la URI proporcionada en la variable de entorno MONGODB_URI.
    // Si no existe la variable de entorno, se conecta a una base de datos local llamada 'servitech'.
    // Se pasan opciones para usar el nuevo parser de URL y el motor de topología unificada, lo que mejora la compatibilidad y estabilidad de la conexión.
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/servitech",
      {
        useNewUrlParser: true, // Indica a Mongoose que use el nuevo parser de URL de MongoDB.
        useUnifiedTopology: true, // Habilita el nuevo motor de administración de conexiones de MongoDB.
      }
    );
    // Si la conexión es exitosa, muestra un mensaje de éxito en la consola.
    console.log("✅ Base de datos conectada exitosamente");
  } catch (error) {
    // Si ocurre un error durante la conexión, muestra el error en la consola con un mensaje descriptivo.
    console.error("❌ Error de conexión a MongoDB:", error);
    // Finaliza el proceso de Node.js con un código de error (1), indicando que la aplicación no puede continuar sin la base de datos.
    process.exit(1);
  }
};

// Exporta la función connectDB para que pueda ser utilizada en otras partes de la aplicación, permitiendo inicializar la conexión a la base de datos desde otros módulos.
module.exports = connectDB;
