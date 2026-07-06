const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Egresado = sequelize.define('egresado', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  indice_academico_final: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: { min: 0, max: 20 }
  },
  titulo: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  anio_graduacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  tableName: 'egresado',
  timestamps: false,
});

module.exports = Egresado;