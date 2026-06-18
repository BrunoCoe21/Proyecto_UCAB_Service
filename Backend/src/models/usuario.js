// models/usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  cedula_identidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  primer_nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  segundo_nombre: DataTypes.STRING(50),
  primer_apellido: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  segundo_apellido: DataTypes.STRING(50),
  fecha_nacimiento: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  sexo: {
    type: DataTypes.CHAR(1),
    allowNull: false,
  },
  direccion_habitacion_detallada: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  numero_telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  correo_institucional: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  intentos_fallidos_auth: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  estado_cuenta: {
    type: DataTypes.STRING(12),
    allowNull: false,
    defaultValue: 'activa',
  },
  estatus_verificacion_dos_pasos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  ult_fecha_cambio_cont: DataTypes.DATE,
  ultima_conexion: DataTypes.DATE,
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'usuario',
  timestamps: false,
});

// Método para comparar contraseña (usa bcrypt)
Usuario.prototype.validarPassword = function(password) {
  return bcrypt.compareSync(password, this.password_hash);
};

module.exports = Usuario;