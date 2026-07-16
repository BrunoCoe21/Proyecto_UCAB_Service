const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/verificar-2fa', authController.verificar2FA);   // 2do paso del login (QA)
router.post('/cambiar-contrasena', verificarToken, authController.cambiarContrasena);
router.post('/logout', verificarToken, authController.logout); 

module.exports = router;