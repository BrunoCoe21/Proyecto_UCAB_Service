const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Postula = sequelize.define('postula', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  id_vacante: {
    type: DataTypes.STRING(20),
    primaryKey: true,
  },
  estado_postulacion: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Recibida',
    validate: {
      isIn: [['Recibida', 'En Revision', 'Aceptada', 'Rechazada']]
    }
  },
  fecha_postulacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'postula',
  timestamps: false,
});

module.exports = Postula;