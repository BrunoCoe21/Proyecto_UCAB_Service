
const sequelize = require('../config/database');
const Usuario = require('./usuario');
const Estudiante = require('./Estudiante');
const Servicio = require('./servicio');
const Solicitud = require('./solicitud');
const Factura = require('./factura');
const Pago = require('./pago');


Usuario.hasOne(Estudiante, { foreignKey: 'cedula_identidad', as: 'DatosAcademicos' });
Estudiante.belongsTo(Usuario, { foreignKey: 'cedula_identidad' });


Estudiante.hasMany(Solicitud, { foreignKey: 'cedula_identidad', as: 'Solicitudes' });
Solicitud.belongsTo(Estudiante, { foreignKey: 'cedula_identidad' });
 
Servicio.hasMany(Solicitud, { foreignKey: 'codigo_servicio' });
Solicitud.belongsTo(Servicio, { foreignKey: 'codigo_servicio' });


Estudiante.hasMany(Factura, { foreignKey: 'cedula_identidad', as: 'Facturas' });
Factura.belongsTo(Estudiante, { foreignKey: 'cedula_identidad' });

Factura.hasMany(Pago, { foreignKey: 'num_control', as: 'PagosAbonados' });
Pago.belongsTo(Factura, { foreignKey: 'num_control' });

module.exports = {
  sequelize,
  Usuario,
  Estudiante,
  Servicio,
  Solicitud,
  Factura,
  Pago,
 
  usuario: Usuario,
  estudiante: Estudiante
};