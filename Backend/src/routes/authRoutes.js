const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth_middleware');

router.post('/login', authController.login);
router.post('/cambiar-contrasena', verificarToken, authController.cambiarContrasena);

module.exports = router;