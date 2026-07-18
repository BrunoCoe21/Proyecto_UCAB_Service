// src/models/solicitud.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Solicitud = sequelize.define('solicitud', {
  id_solicitud: { 
    type: DataTypes.STRING(30), 
    primaryKey: true 
  },
  cedula_identidad: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  codigo_servicio: { 
    type: DataTypes.STRING(20), 
    allowNull: false 
  },
  estado_general: { 
    type: DataTypes.STRING(25), 
    allowNull: false, 
    defaultValue: 'EN PROCESO' 
  },
  fecha_creacion: { 
    type: DataTypes.DATE, 
    allowNull: false, 
    defaultValue: DataTypes.NOW 
  }
}, {
  tableName: 'solicitud'
});

module.exports = Solicitud;