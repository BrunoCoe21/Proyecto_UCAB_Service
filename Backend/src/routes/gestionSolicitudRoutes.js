// ============================================================================
//  src/routes/gestionSolicitudRoutes.js  ·  UCAB-Services
//  Se monta en app.js como:  app.use('/api/gestion', gestionSolicitudRoutes);
//  Solo para docente y personal_administrativo (son EMPLEADOS).
// ============================================================================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gestionSolicitudController');
const { verificarToken, exigirRol } = require('../middleware/auth');

// El guard se aplica primero; protege todas las rutas declaradas debajo.
router.use(verificarToken, exigirRol('docente', 'administrativo'));

router.get('/oficinas',                          ctrl.listarOficinas);
router.get('/pasos/:nombreOficina',              ctrl.listarPasosPorOficina);
router.put('/pasos/:idSolicitud/:numPaso',       ctrl.actualizarEstadoPaso);
router.get('/solicitud/:idSolicitud',            ctrl.obtenerSolicitudCompleta);

module.exports = router;