const express = require('express');
const router = express.Router();
const { crearEstudiante, obtenerEstudiantes } = require('../controllers/estudianteController');

router.post('/', crearEstudiante);
router.get('/', obtenerEstudiantes);

module.exports = router;