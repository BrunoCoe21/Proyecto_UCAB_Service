const express = require('express');
const cors = require('cors');
const estudianteRoutes = require('./routes/estudianteRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/estudiantes', estudianteRoutes);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor' });
});

module.exports = app;