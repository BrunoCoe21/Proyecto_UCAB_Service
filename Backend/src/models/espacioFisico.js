const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EspacioFisico = sequelize.define('EspacioFisico', {
  nombre_sede: {
    type: DataTypes.STRING(60),
    primaryKey: true,
    allowNull: false,
  },
  nombre_edif: {
    type: DataTypes.STRING(80),
    primaryKey: true,
    allowNull: false,
  },
  num_identificador: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false,
  },
  cap_maxima_aforo: {
    type: DataTypes.INTEGER,
    validate: { min: 0 },
  },
  tipo_mobiliario: {
    type: DataTypes.STRING(80),
  },
  tipo_espacio_fisico: {
    type: DataTypes.STRING(60),
  },
  estado_mantenimiento: {
    type: DataTypes.STRING(40),
  },
}, {
  tableName: 'espacio_fisico',
  timestamps: false,
});

// ELIMINA LA LÍNEA QUE DICE:
// EspacioFisico.belongsTo(Edificacion, ...);

module.exports = EspacioFisico;