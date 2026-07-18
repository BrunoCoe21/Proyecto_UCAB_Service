
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gestionSolicitudController');
const { verificarToken, exigirRol } = require('../middleware/auth');


router.use(verificarToken, exigirRol('administrativo'));

router.get('/oficinas',                          ctrl.listarOficinas);
router.get('/mis-oficinas',                      ctrl.misOficinas);          
router.put('/oficinas/:nombreOficina/responsable', ctrl.asignarResponsable); 
router.get('/pasos/:nombreOficina',              ctrl.listarPasosPorOficina);
router.put('/pasos/:idSolicitud/:numPaso',       ctrl.actualizarEstadoPaso);
router.get('/solicitud/:idSolicitud',            ctrl.obtenerSolicitudCompleta);

module.exports = router;