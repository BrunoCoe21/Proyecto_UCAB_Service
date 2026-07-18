// src/models/estudiante.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estudiante = sequelize.define('estudiante', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  promedio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
  },
  uc_aprobadas: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  semestre_actual: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  escuela: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  facultad: {
    type: DataTypes.STRING(80),
    allowNull: true,
  }
}, {
  tableName: 'estudiante'
});

module.exports = Estudiante;