
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pago = sequelize.define('pago', {
  num_control: {
    type: DataTypes.STRING(20),
    primaryKey: true          
  },
  fecha_movimiento: {
    type: DataTypes.DATE,
    primaryKey: true           
  },
  tasa_bcv: {
    type: DataTypes.DECIMAL(18, 6),
    allowNull: true             
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0.01 }     
  }
}, {
  tableName: 'pago',
  timestamps: false
});

module.exports = Pago;