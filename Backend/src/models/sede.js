const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sede = sequelize.define('Sede', {
  nombre_sede: {
    type: DataTypes.STRING(60),
    primaryKey: true,
  },
  ubicacion: DataTypes.STRING(150),
  factor_ajuste: {
    type: DataTypes.NUMERIC(5,3),
    allowNull: false,
    defaultValue: 1.000,
  },
}, {
  tableName: 'sede',
  timestamps: false,
});

module.exports = Sede;