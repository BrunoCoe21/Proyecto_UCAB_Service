// src/models/usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('usuario', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  primer_nombre: { type: DataTypes.STRING(50), allowNull: false },
  segundo_nombre: { type: DataTypes.STRING(50), allowNull: true },
  primer_apellido: { type: DataTypes.STRING(50), allowNull: false },
  segundo_apellido: { type: DataTypes.STRING(50), allowNull: true },
  fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
  sexo: { 
    type: DataTypes.CHAR(1), 
    allowNull: false,
    validate: { isIn: [['M', 'F']] } 
  },
  direccion_habitacion_detallada: { type: DataTypes.STRING(200), allowNull: false },
  numero_telefono: { type: DataTypes.STRING(20), allowNull: false },
  correo_institucional: { 
    type: DataTypes.STRING(120), 
    allowNull: false, 
    unique: true 
  },
  intentos_fallidos_auth: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    defaultValue: 0,
    validate: { min: 0 } 
  },
  estado_cuenta: { 
    type: DataTypes.STRING(12), 
    allowNull: false, 
    defaultValue: 'ACTIVA',
    validate: { isIn: [['activa', 'suspendida', 'bloqueada', 'ACTIVA', 'SUSPENDIDA', 'BLOQUEADA']] }
  },
  estatus_verificacion_dos_pasos: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ult_fecha_cambio_cont: { type: DataTypes.DATE, allowNull: true },
  ultima_conexion: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'usuario'
});

module.exports = Usuario;