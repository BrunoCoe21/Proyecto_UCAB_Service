// ============================================================================
//  src/routes/reservaRoutes.js  ·  UCAB-Services
//  Se monta en app.js como:  app.use('/api/reservas', reservaRoutes);
// ============================================================================
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken, exigirRol } = require('../middleware/auth');

const soloEstudianteEgresado = exigirRol('estudiante', 'egresado');

router.get('/espacios/:nombreSede',      verificarToken, soloEstudianteEgresado, reservaController.listarEspaciosPorSede);
router.post('/verificar',                verificarToken, soloEstudianteEgresado, reservaController.verificarDisponibilidad);
router.post('/:idSolicitud/confirmar',   verificarToken, soloEstudianteEgresado, reservaController.confirmarReserva);
// NUEVO: flujo desde Servicios (la solicitud todavía no existe al abrir el modal)
router.post('/crear-con-solicitud',      verificarToken, soloEstudianteEgresado, reservaController.crearSolicitudConReserva);

module.exports = router;