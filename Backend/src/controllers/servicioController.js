// src/controllers/servicioController.js
const { Servicio } = require('../models');

// LISTAR TODOS LOS SERVICIOS DISPONIBLES
exports.obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};