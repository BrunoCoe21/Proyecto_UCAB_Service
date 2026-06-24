const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Ruta para obtener TODOS los servicios
router.get('/', serviceController.getAllServicios);


// Ruta para obtener detalle de un servicio específico
router.get('/:codigo/detalle', serviceController.getDetalleServicio);


// Ruta para obtener servicios de espacio físico
router.get('/espacios', serviceController.getServiciosEspacios);

module.exports = router;