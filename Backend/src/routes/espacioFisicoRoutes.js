const express = require('express');
const router = express.Router();
const {
  crearEspacioFisico,
  listarEspaciosFisicos,
  obtenerEspacioFisico,
} = require('../controllers/espacioFisicoController');

router.post('/', crearEspacioFisico);
router.get('/', listarEspaciosFisicos);
router.get('/:nombre_sede/:nombre_edif/:num_identificador', obtenerEspacioFisico);

module.exports = router;