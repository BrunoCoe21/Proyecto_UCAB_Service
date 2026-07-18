
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken, exigirRol } = require('../middleware/auth');

// docentes y administrativos ahora también acceden a Servicios y pueden
// reservar 
const soloEstudianteEgresado = exigirRol('estudiante', 'egresado', 'docente', 'administrativo');

router.get('/espacios/:nombreSede',      verificarToken, soloEstudianteEgresado, reservaController.listarEspaciosPorSede);
router.post('/verificar',                verificarToken, soloEstudianteEgresado, reservaController.verificarDisponibilidad);
router.post('/:idSolicitud/confirmar',   verificarToken, soloEstudianteEgresado, reservaController.confirmarReserva);
//flujo desde Servicios 
router.post('/crear-con-solicitud',      verificarToken, soloEstudianteEgresado, reservaController.crearSolicitudConReserva);

module.exports = router;