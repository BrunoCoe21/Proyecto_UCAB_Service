const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrganizacionExterna = sequelize.define('organizacion_externa', {
  id_entidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  rif: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  razon_social: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  contactos: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  fecha_de_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  }
}, {
  tableName: 'organizacion_externa',
  timestamps: false,
});

module.exports = OrganizacionExterna;