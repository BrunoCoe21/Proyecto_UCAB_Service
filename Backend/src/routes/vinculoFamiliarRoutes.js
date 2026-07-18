
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/vinculoFamiliarController');
const { verificarToken, exigirRol } = require('../middleware/auth');

const soloEmpleados = exigirRol('docente', 'administrativo');

// El guard se aplica primero; así protege TODAS las rutas declaradas debajo.
router.use(verificarToken, soloEmpleados);

router.get('/',                ctrl.listarVinculos);
router.get('/:ci',             ctrl.obtenerVinculo);
router.post('/',               ctrl.registrarVinculo);
router.put('/:ci',              ctrl.editarVinculo);
router.put('/:ci/inactivar',    ctrl.inactivarVinculo);

module.exports = router;