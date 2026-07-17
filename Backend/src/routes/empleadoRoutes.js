// ============================================================================
//  src/routes/empleadoRoutes.js  ·  UCAB-Services
//  Se monta en app.js como:  app.use('/api/empleados', empleadoRoutes);
// ============================================================================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/empleadoController');
const { verificarToken, exigirRol } = require('../middleware/auth');

router.get('/:cedula',
  verificarToken,
  exigirRol('docente', 'administrativo'),
  ctrl.obtenerPerfil
);

router.get('/:cedula/trayectoria',
  verificarToken,
  exigirRol('docente', 'administrativo'),
  ctrl.obtenerTrayectoria
);

module.exports = router;