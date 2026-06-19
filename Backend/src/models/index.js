// src/models/index.js
const sequelize = require('../config/database');
const Usuario = require('./usuario');
const Estudiante = require('./estudiante');
const Servicio = require('./servicio');
const Solicitud = require('./solicitud');
const Factura = require('./factura');
const Pago = require('./pago');

// --- Relación de Identidad ---
// El usuario base se vincula con su información académica (jerarquía) [cite: 346, 385]
Usuario.hasOne(Estudiante, { foreignKey: 'cedula_identidad', as: 'DatosAcademicos' });
Estudiante.belongsTo(Usuario, { foreignKey: 'cedula_identidad' });

// --- Relaciones Operativas ---
// Un estudiante puede realizar múltiples solicitudes 
Estudiante.hasMany(Solicitud, { foreignKey: 'cedula_identidad', as: 'Solicitudes' });
Solicitud.belongsTo(Estudiante, { foreignKey: 'cedula_identidad' });

// Un servicio es requerido en múltiples solicitudes 
Servicio.hasMany(Solicitud, { foreignKey: 'codigo_servicio' });
Solicitud.belongsTo(Servicio, { foreignKey: 'codigo_servicio' });

// --- Relaciones Financieras ---
// Las facturas pertenecen a un estudiante (usuario) [cite: 583]
Estudiante.hasMany(Factura, { foreignKey: 'cedula_identidad', as: 'Facturas' });
Factura.belongsTo(Estudiante, { foreignKey: 'cedula_identidad' });

// Una factura recibe múltiples pagos a través del tiempo 
Factura.hasMany(Pago, { foreignKey: 'num_control', as: 'PagosAbonados' });
Pago.belongsTo(Factura, { foreignKey: 'num_control' });

module.exports = {
  sequelize,
  Usuario,
  Estudiante,
  Servicio,
  Solicitud,
  Factura,
  Pago
};