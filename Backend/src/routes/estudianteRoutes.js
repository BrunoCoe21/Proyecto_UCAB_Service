// src/routes/estudianteRoutes.js
const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const verificarToken = require('../middleware/auth');

// Endpoint protegido para obtener la ficha académica del perfil
router.get('/:cedula', verificarToken, estudianteController.obtenerPerfil);

module.exports = router;