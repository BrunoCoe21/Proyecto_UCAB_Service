const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sede = require('./sede');

const Edificacion = sequelize.define('Edificacion', {
  nombre_sede: { type: DataTypes.STRING(60), primaryKey: true, allowNull: false },
  nombre_edif: { type: DataTypes.STRING(80), primaryKey: true, allowNull: false },
  direccion_interna: { type: DataTypes.STRING(150) },
}, {
  tableName: 'edificacion',
  timestamps: false,
});

Edificacion.belongsTo(Sede, { foreignKey: 'nombre_sede', targetKey: 'nombre_sede' });

module.exports = Edificacion;