
const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { verificarToken } = require('../middleware/auth');

router.get('/estudiante/:cedula', verificarToken, solicitudController.obtenerPorEstudiante);

router.get('/:idSolicitud/detalle', verificarToken, solicitudController.obtenerDetalle);


router.post('/', verificarToken, solicitudController.crearSolicitud);

module.exports = router;