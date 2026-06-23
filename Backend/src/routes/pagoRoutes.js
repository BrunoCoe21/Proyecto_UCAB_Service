// ============================================================================
//  src/routes/pagoRoutes.js  ·  UCAB-Services  ·  MÓDULO DE FINANZAS
//  Se monta en app.js como:  app.use('/api/facturas', pagoRoutes);
//  Por eso las rutas de abajo cuelgan de /api/facturas.
// ============================================================================
const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken, exigirRol } = require('../middleware/auth');

// Estado de cuenta del estudiante: todas sus facturas con saldo y estatus.
//   GET /api/facturas/estudiante/:cedula
router.get('/estudiante/:cedula',
  verificarToken,
  exigirRol('estudiante', 'egresado'),
  pagoController.obtenerFacturasEstudiante
);

// Detalle de una factura: líneas de cargo + abonos realizados.
//   GET /api/facturas/:numControl/detalle
router.get('/:numControl/detalle',
  verificarToken,
  exigirRol('estudiante', 'egresado'),
  pagoController.obtenerDetalleFactura
);

// Registrar un pago contra una factura (pasarela).
//   POST /api/facturas/:numControl/pagar
router.post('/:numControl/pagar',
  verificarToken,
  exigirRol('estudiante', 'egresado'),
  pagoController.registrarPago
);

module.exports = router;