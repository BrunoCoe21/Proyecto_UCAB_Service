
const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken, exigirRol } = require('../middleware/auth');

// Estado de cuenta del estudiante
//   GET /api/facturas/estudiante/:cedula
router.get('/estudiante/:cedula',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerFacturasEstudiante
);


router.get('/billetera/:cedula',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerBilleteraTai
);

// Detalle de una factura
//   GET /api/facturas/:numControl/detalle
router.get('/:numControl/detalle',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerDetalleFactura
);

// Registrar un pago contra una factura 
//   POST /api/facturas/:numControl/pagar
router.post('/:numControl/pagar',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.registrarPago
);

// -- Verificación de pagos por Caja ------------------------------------------
// Lista los pagos presenciales pendientes de confirmación (para Caja).
//   GET /api/facturas/pagos-pendientes
router.get('/pagos-pendientes',
  verificarToken,
  exigirRol('administrativo'),
  pagoController.listarPagosPendientes
);

// Caja confirma o rechaza un pago.
//   PUT /api/facturas/pagos/:numControl/:fecha/confirmar
router.put('/pagos/:numControl/:fecha/confirmar',
  verificarToken,
  exigirRol('administrativo'),
  pagoController.confirmarPago
);

module.exports = router;