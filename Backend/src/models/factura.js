// src/models/factura.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('factura', {
  num_control: { 
    type: DataTypes.STRING(30), 
    primaryKey: true 
  },
  numero_folio: { 
    type: DataTypes.STRING(30), 
    allowNull: true 
  },
  cedula_identidad: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  id_entidad: { 
    type: DataTypes.INTEGER, 
    allowNull: true 
  },
  saldo: { 
    type: DataTypes.DECIMAL(10, 2), 
    allowNull: false 
  },
  estatus: {
    type: DataTypes.STRING(15),
    allowNull: false,
    defaultValue: 'PENDIENTE',
    validate: {
      checkSaldoPagado(value) {
        if (value === 'pagada' && this.saldo > 0) {
          throw new Error('Una factura pagada no puede tener saldo pendiente.');
        }
      }
    }
  }
}, {
  tableName: 'factura',
  validate: {
    checkDestinatarioExclusivo() {
      const tieneUsuario = this.cedula_identidad !== null && this.cedula_identidad !== undefined;
      const tieneEntidad = this.id_entidad !== null && this.id_entidad !== undefined;
      if ((tieneUsuario && tieneEntidad) || (!tieneUsuario && !tieneEntidad)) {
        throw new Error('La factura debe asociarse a un usuario O a una organizacion, no a ambos ni a ninguno.');
      }
    }
  }
});

module.exports = Factura;