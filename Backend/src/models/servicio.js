// src/models/servicio.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('servicio', {
  codigo_servicio: { 
    type: DataTypes.STRING(20), 
    primaryKey: true // Clave natural como 'SERV-001' 
  },
  nombre_servicio: { 
    type: DataTypes.STRING(100), 
    allowNull: false 
  },
  precio: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false // Precio base institucional [cite: 419]
  }
}, {
  tableName: 'servicio'
});

module.exports = Servicio;