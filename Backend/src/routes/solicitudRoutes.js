// src/routes/solicitudRoutes.js
const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const verificarToken = require('../middleware/auth');

// Endpoint protegido para el listado de solicitudes del dashboard
router.get('/estudiante/:cedula', verificarToken, solicitudController.obtenerPorEstudiante);

module.exports = router;