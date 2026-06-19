// Backend/src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController'); 

// Mapeamos el POST que viene del login.js del front
router.post('/login', usuarioController.loginReal);

module.exports = router;