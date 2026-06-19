// src/app.js
const express = require('express');
const cors = require('cors');

// Importación de enrutadores modulares
const authRoutes = require('./routes/authRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const pagoRoutes = require('./routes/pagoRoutes');

const app = express();

// Configuración de Middlewares globales
app.use(cors()); // Habilita el intercambio de recursos de origen cruzado para el desarrollo local
app.use(express.json()); // Analiza las solicitudes HTTP entrantes con cargas JSON

// Registro formal de los Endpoints relacionales de la API
app.use('/api/usuarios', authRoutes);       // Maneja /api/usuarios/login
app.use('/api/estudiantes', estudianteRoutes); // Maneja /api/estudiantes/:cedula
app.use('/api/solicitudes', solicitudRoutes); // Maneja /api/solicitudes/estudiante/:cedula
app.use('/api/servicios', servicioRoutes);     // Maneja /api/servicios
app.use('/api/facturas', pagoRoutes);         // Maneja /api/facturas/estudiante/:cedula

// Capturador global de errores del servidor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno en el servidor de UCAB-Services.' });
});

module.exports = app;