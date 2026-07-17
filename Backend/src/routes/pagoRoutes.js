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
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerFacturasEstudiante
);

// Saldo de la billetera TAI del miembro (tabla posee) — reporte QA.
//   GET /api/facturas/billetera/:cedula
//   (Se registra ANTES de '/:numControl/detalle' para que 'billetera' no sea
//    capturado como si fuera un número de control.)
router.get('/billetera/:cedula',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerBilleteraTai
);

// Detalle de una factura: líneas de cargo + abonos realizados.
//   GET /api/facturas/:numControl/detalle
router.get('/:numControl/detalle',
  verificarToken,
  exigirRol('estudiante', 'egresado', 'docente', 'administrativo'),
  pagoController.obtenerDetalleFactura
);

// Registrar un pago contra una factura (pasarela).
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