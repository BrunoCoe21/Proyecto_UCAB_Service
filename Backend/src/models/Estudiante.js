// backend/src/models/Estudiante.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Estudiante = sequelize.define('Estudiante', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, // Equivalente a DEFAULT CURRENT_TIMESTAMP
  },
}, {
  tableName: 'estudiantes', // Nombre exacto de la tabla en la BD
  timestamps: false,        // Importante: no usar createdAt/updatedAt
  // Si quieres que Sequelize no intente modificar la tabla, puedes poner:
  // freezeTableName: true,
});

module.exports = Estudiante;