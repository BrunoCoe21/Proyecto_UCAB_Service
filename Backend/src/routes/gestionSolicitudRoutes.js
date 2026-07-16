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
// QA: "Pasos por Atender" se eliminó del perfil del DOCENTE — la gestión de
// pasos es exclusiva del personal administrativo, también a nivel de API.
router.use(verificarToken, exigirRol('administrativo'));

router.get('/oficinas',                          ctrl.listarOficinas);
router.get('/mis-oficinas',                      ctrl.misOficinas);          // QA: solo su oficina
router.put('/oficinas/:nombreOficina/responsable', ctrl.asignarResponsable); // QA: responsable explícito
router.get('/pasos/:nombreOficina',              ctrl.listarPasosPorOficina);
router.put('/pasos/:idSolicitud/:numPaso',       ctrl.actualizarEstadoPaso);
router.get('/solicitud/:idSolicitud',            ctrl.obtenerSolicitudCompleta);

module.exports = router;