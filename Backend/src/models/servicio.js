
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('servicio', {
  codigo_servicio: {
    type: DataTypes.STRING(20),
    primaryKey: true  
  },
  id_entidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipo_categoria: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  nombre_sede: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 0 }  
  },
  descripcion_detallada: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requisitos_de_acceso: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'servicio',
  timestamps: false
});

module.exports = Servicio;