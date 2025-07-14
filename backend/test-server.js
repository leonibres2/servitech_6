// Servidor de prueba básico usando Express para verificar funcionamiento del entorno

const express = require('express'); // Importa el framework Express
const app = express(); // Inicializa la aplicación Express
const PORT = 8080; // Puerto en el que se ejecuta el servidor de prueba

// Ruta principal para verificar que el servidor responde correctamente
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de prueba funcionando', puerto: PORT });
  // Responde con un mensaje JSON indicando que el servidor está activo
});

// Inicia el servidor y muestra un mensaje en consola cuando está listo
app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
});
