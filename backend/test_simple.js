// Prueba simple de servidor Express para validar el entorno y la instalación

const express = require('express'); // Importa el framework Express
const app = express(); // Inicializa la aplicación Express
const PORT = 4444; // Puerto en el que se ejecuta el servidor de prueba

// Ruta principal para verificar que el servidor responde correctamente
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
  // Responde con un mensaje simple indicando que el servidor está activo
});

// Inicia el servidor y muestra un mensaje en consola cuando está listo
app.listen(PORT, () => {
  console.log(`✅ Servidor de prueba funcionando en puerto ${PORT}`);
  console.log(`🌐 Accede a: http://localhost:${PORT}`);
});
