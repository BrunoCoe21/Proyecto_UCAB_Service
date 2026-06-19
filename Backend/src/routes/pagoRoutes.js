// src/routes/pagoRoutes.js
const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const verificarToken = require('../middleware/auth');

// Endpoint protegido para consultar el estado de cuenta financiero
router.get('/estudiante/:cedula', verificarToken, pagoController.obtenerFacturasEstudiante);

module.exports = router;