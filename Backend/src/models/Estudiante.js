const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estudiante = sequelize.define('Estudiante', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  promedio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  uc_aprobadas: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  semestre_actual: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  escuela: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  facultad: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
}, {
  tableName: 'estudiante', // En singular, tal cual como está en tu pgAdmin
  timestamps: false,       // Evita que busque columnas automáticas como createdAt
});

module.exports = Estudiante;