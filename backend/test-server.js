const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.json({ message: 'Servidor de prueba funcionando', puerto: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en puerto ${PORT}`);
});
