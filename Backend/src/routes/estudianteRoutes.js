
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth'); 
const estudianteController = require('../controllers/estudianteController');

router.get('/:cedula', verificarToken, estudianteController.obtenerPerfil);

module.exports = router;