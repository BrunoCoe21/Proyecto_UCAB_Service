require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false })
  .then(() => {
    console.log('BD sincronizada');
    app.listen(PORT, () => console.log(`Backend en http://localhost:${PORT}`));
  })
  .catch(err => console.error('Error al sincronizar BD:', err));