// src/models/pago.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('pago', {
  num_control: { 
    type: DataTypes.STRING(30), 
    primaryKey: true // Parte 1 de la PK compuesta 
  },
  fecha_movimiento: { 
    type: DataTypes.DATE, 
    primaryKey: true // Parte 2 de la PK compuesta 
  },
  monto_abono: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  }
}, {
  tableName: 'pago'
});

module.exports = Pago;