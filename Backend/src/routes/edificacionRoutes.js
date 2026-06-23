const express = require('express');
const router = express.Router();
const {
  listarEdificaciones,
  crearEdificacion,
  obtenerEdificacion,
} = require('../controllers/edificacionController');

router.get('/', listarEdificaciones);
router.post('/', crearEdificacion);
router.get('/:nombre_sede/:nombre_edif', obtenerEdificacion);

module.exports = router;