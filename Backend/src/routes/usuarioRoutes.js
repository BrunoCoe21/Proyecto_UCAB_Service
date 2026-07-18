
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController'); 


router.post('/login', usuarioController.loginReal);

module.exports = router;