// src/routes/servicioRoutes.js
const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');
const verificarToken = require('../middleware/auth');

// Endpoint protegido para ver el catálogo de servicios universitarios
router.get('/', verificarToken, servicioController.obtenerServicios);

module.exports = router;