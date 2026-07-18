const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ucab_services',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'tu_contraseña',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Cambia a console.log si quieres ver las consultas SQL en la terminal
    define: {
      timestamps: false, // El manual técnico indica que no se usan timestamps automáticos por defecto
      freezeTableName: true // Evita que Sequelize pluralice los nombres de las tablas
    }
  }
);

module.exports = sequelize;