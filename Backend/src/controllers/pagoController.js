// src/controllers/pagoController.js
const { Factura, Pago } = require('../models');

// OBTENER FACTURAS Y SALDOS DE UN ESTUDIANTE
exports.obtenerFacturasEstudiante = async (req, res) => {
  try {
    const { cedula } = req.params;

    const facturas = await Factura.findAll({
      where: { cedula_identidad: cedula }
    });

    // Formateamos para el frontend
    const resultado = facturas.map(fac => ({
      id_factura: fac.num_control,
      descripcion_concepto: `Ref: ${fac.num_control} - Aranceles Universitarios`,
      saldo_restante: fac.saldo,
      estatus: fac.estatus.toUpperCase() // PENDIENTE, PARCIAL, PAGADA
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};