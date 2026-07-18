// src/app.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const sedeRoutes = require('./routes/sedeRoutes');
const edificacionRoutes = require('./routes/edificacionRoutes');
const espacioFisicoRoutes = require('./routes/espacioFisicoRoutes');
const vacanteRoutes = require('./routes/vacanteRoutes');
const vinculoFamiliarRoutes = require('./routes/vinculoFamiliarRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const gestionSolicitudRoutes = require('./routes/gestionSolicitudRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Registro de los Endpoints de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/service', serviceRoutes); 
app.use('/api/facturas', pagoRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/edificaciones', edificacionRoutes);
app.use('/api/espacios', espacioFisicoRoutes);
app.use('/api/vacantes', vacanteRoutes);
app.use('/api/vinculos', vinculoFamiliarRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/gestion', gestionSolicitudRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/reportes', reporteRoutes);


// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno en el servidor de UCAB-Services.' });
});

module.exports = app;