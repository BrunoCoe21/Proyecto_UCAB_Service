const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OportunidadLaboral = sequelize.define('oportunidad_laboral', {
  id_vacante: {
    type: DataTypes.STRING(20),
    primaryKey: true,
  },
  id_entidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cargo_solicitado: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  responsabilidad: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estatus_vacante: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'disponible',
    validate: {
      isIn: [['disponible', 'finalizada']]
    }
  },
  beneficios: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  perfil_buscado: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fecha_oferta: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'oportunidad_laboral',
  timestamps: false,
});

// Relaciones (se definen después de tener todos los modelos)
module.exports = OportunidadLaboral;