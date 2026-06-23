// src/models/pago.js
// ----------------------------------------------------------------------------
// CORRECCIÓN: la columna en la base de datos se llama 'monto' (NUMERIC(12,2)),
// no 'monto_abono'. El modelo anterior tenía ese nombre equivocado y hacía
// fallar cualquier inserción de pago. Aquí queda alineado con el esquema real.
// ----------------------------------------------------------------------------
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('pago', {
  num_control: {
    type: DataTypes.STRING(20),
    primaryKey: true            // Parte 1 de la PK compuesta
  },
  fecha_movimiento: {
    type: DataTypes.DATE,
    primaryKey: true            // Parte 2 de la PK compuesta
  },
  tasa_bcv: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: true             // tasa BCV vigente al momento del pago
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 }     // refleja el CHECK (monto > 0) de la base
  }
}, {
  tableName: 'pago',
  timestamps: false
});

module.exports = Pago;