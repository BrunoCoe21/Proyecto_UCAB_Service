// src/server.js
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

// Sincronización segura con PostgreSQL
// force: false garantiza que Sequelize no destruya tus tablas de datos existentes al reiniciar
sequelize.sync({ force: false })
  .then(() => {
    console.log(' Conexión con PostgreSQL establecida y modelos sincronizados con éxito.');
    
    // El servidor empieza a escuchar peticiones una vez verificada la base de datos
    app.listen(PORT, () => {
      console.log(`Servidor del ecosistema corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error(' Error crítico al sincronizar la base de datos de UCAB-Services:', err);
  });