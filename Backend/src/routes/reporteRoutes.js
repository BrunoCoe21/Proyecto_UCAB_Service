// src/routes/reporteRoutes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarToken, exigirRol } = require('../middleware/auth');

// Solo personal administrativo puede ver reportes
router.use(verificarToken, exigirRol('administrativo'));

router.get('/solicitudes', reporteController.reporteSolicitudes);
router.get('/estado-cuenta', reporteController.reporteEstadoCuenta);
router.get('/ingresos-servicio', reporteController.reporteIngresosServicio);
router.get('/ocupacion-espacios', reporteController.reporteOcupacionEspacios);
router.get('/postulaciones', reporteController.reportePostulaciones);
router.get('/recurrencia', reporteController.reporteRecurrencia);
router.get('/becarios', reporteController.reporteBecarios);
router.get('/pagos-metodo', reporteController.reportePagosMetodo);

module.exports = router;