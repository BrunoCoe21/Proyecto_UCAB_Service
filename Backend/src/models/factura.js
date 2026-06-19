// src/models/factura.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Factura = sequelize.define('factura', {
  num_control: { 
    type: DataTypes.STRING(30), 
    primaryKey: true // Clave natural como 'FAC-001' 
  },
  numero_folio: { 
    type: DataTypes.STRING(30), 
    allowNull: true // Relación opcional con folio_consumo [cite: 583]
  },
  cedula_identidad: { 
    type: DataTypes.INTEGER, 
    allowNull: true // Destinatario tipo Usuario [cite: 430]
  },
  id_entidad: { 
    type: DataTypes.INTEGER, 
    allowNull: true // Destinatario tipo Organización [cite: 430]
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
        // Implementación de R14: Pagada implica saldo = 0 
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
      // Implementación de R12: XOR lógico entre usuario y entidad 
      const tieneUsuario = this.cedula_identidad !== null && this.cedula_identidad !== undefined;
      const tieneEntidad = this.id_entidad !== null && this.id_entidad !== undefined;
      if ((tieneUsuario && tieneEntidad) || (!tieneUsuario && !tieneEntidad)) {
        throw new Error('La factura debe asociarse a un usuario O a una organización, no a ambos ni a ninguno.');
      }
    }
  }
});

module.exports = Factura;