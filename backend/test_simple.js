// Prueba simple de servidor Express
const express = require('express');
const app = express();
const PORT = 4444;

app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor de prueba funcionando en puerto ${PORT}`);
  console.log(`🌐 Accede a: http://localhost:${PORT}`);
});
