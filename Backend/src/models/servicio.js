// src/models/servicio.js
// ----------------------------------------------------------------------------
// CORRECCIÓN: el modelo anterior declaraba 'nombre_servicio', columna que NO
// existe en la tabla real. La columna correcta es 'descripcion_detallada'.
// También faltaban id_entidad, tipo_categoria, nombre_sede y
// requisitos_de_acceso, que sí existen en la tabla y se necesitan para
// mostrar el detalle del servicio en "Mis Solicitudes".
// ----------------------------------------------------------------------------
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Servicio = sequelize.define('servicio', {
  codigo_servicio: {
    type: DataTypes.STRING(20),
    primaryKey: true   // Clave natural como 'SERV-001'
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
    validate: { min: 0 }   // refleja el CHECK chk_precio de la base
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