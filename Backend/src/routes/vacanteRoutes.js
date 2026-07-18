
const express = require('express');
const router = express.Router();
const vacanteController = require('../controllers/vacanteController');
const { verificarToken, exigirRol } = require('../middleware/auth');

router.get('/',                      verificarToken, exigirRol('egresado'), vacanteController.listarVacantes);
router.get('/perfil/:cedula',        verificarToken, exigirRol('egresado'), vacanteController.perfilEgresado);
router.get('/mias/:cedula',          verificarToken, exigirRol('egresado'), vacanteController.misPostulaciones);
router.get('/:idVacante',            verificarToken, exigirRol('egresado'), vacanteController.obtenerVacante);
router.post('/:idVacante/postular',  verificarToken, exigirRol('egresado'), vacanteController.postularse);

module.exports = router;