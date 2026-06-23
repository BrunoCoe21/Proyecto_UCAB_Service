const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Ruta para obtener servicios de espacio físico
router.get('/espacios', serviceController.getServiciosEspacios);

module.exports = router;