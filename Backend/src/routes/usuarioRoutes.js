const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, exigirRol } = require('../middleware/auth_middleware');

// Ruta pública: registrar un nuevo usuario (no requiere login)
router.post('/', usuarioController.crearUsuario);

// (Opcional) Rutas protegidas para administradores
// router.get('/', verificarToken, exigirRol('administrativo'), usuarioController.listarUsuarios);
// router.get('/:cedula', verificarToken, usuarioController.obtenerUsuario);
// router.put('/:cedula', verificarToken, exigirRol('administrativo'), usuarioController.actualizarUsuario);
// router.delete('/:cedula', verificarToken, exigirRol('administrativo'), usuarioController.eliminarUsuario);

module.exports = router;