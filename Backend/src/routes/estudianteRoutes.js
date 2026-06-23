// src/routes/estudianteRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth'); 
const estudianteController = require('../controllers/estudianteController');

// Endpoint protegido para obtener la ficha académica del perfil
router.get('/:cedula', verificarToken, estudianteController.obtenerPerfil);

module.exports = router;