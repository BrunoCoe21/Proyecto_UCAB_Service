const Sede = require('../models/sede');

// Obtener todas las sedes (solo el nombre)
exports.obtenerSedes = async (req, res) => {
  try {
    const sedes = await Sede.findAll({
      attributes: ['nombre_sede'], 
      order: [['nombre_sede', 'ASC']],
    });
    res.json(sedes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener sedes' });
  }
};