// src/app.js
const express = require('express');
const cors = require('cors');

// Importación de enrutadores modulares
const authRoutes = require('./routes/authRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const sedeRoutes = require('./routes/sedeRoutes');
const edificacionRoutes = require('./routes/edificacionRoutes');
const espacioFisicoRoutes = require('./routes/espacioFisicoRoutes');
// --- NUEVO: módulos de bolsa de trabajo, vínculo familiar y perfil de empleado ---
const vacanteRoutes = require('./routes/vacanteRoutes');
const vinculoFamiliarRoutes = require('./routes/vinculoFamiliarRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const gestionSolicitudRoutes = require('./routes/gestionSolicitudRoutes');
const app = express();

// Configuración de Middlewares globales
app.use(cors());
app.use(express.json());

// Registro formal de los Endpoints relacionales de la API
// Nota: Dejé '/api/usuarios' para el login como lo configuró Bruno
app.use('/api/auth', authRoutes);
app.use('/api/estudiantes', estudianteRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/facturas', pagoRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/edificaciones', edificacionRoutes);
app.use('/api/espacios', espacioFisicoRoutes);
// --- NUEVO ---
app.use('/api/vacantes', vacanteRoutes);
app.use('/api/vinculos', vinculoFamiliarRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/gestion', gestionSolicitudRoutes);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno en el servidor de UCAB-Services.' });
});

module.exports = app;