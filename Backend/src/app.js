const express = require('express');
const cors = require('cors');

// Rutas existentes
const estudianteRoutes = require('./routes/estudianteRoutes');
const sedeRoutes = require('./routes/sedeRoutes');
const edificacionRoutes = require('./routes/edificacionRoutes');
// NUEVA ruta
const espacioFisicoRoutes = require('./routes/espacioFisicoRoutes');
//Ruta de autenticacion
const authRoutes = require('./routes/authRoutes');
//ruta de usuario
const usuarioRoutes = require('./routes/usuarioRoutes');


const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/edificaciones', edificacionRoutes);
app.use('/api/espacios', espacioFisicoRoutes);  // <--- NUEVA
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error en el servidor' });
});

module.exports = app;