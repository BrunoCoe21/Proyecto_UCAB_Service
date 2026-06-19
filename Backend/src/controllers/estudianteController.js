// src/controllers/estudianteController.js
const { Estudiante } = require('../models');

// OBTENER UN ESTUDIANTE POR CÉDULA
exports.obtenerPerfil = async (req, res) => {
  try {
    const { cedula } = req.params;
    
    const perfil = await Estudiante.findOne({
      where: { cedula_identidad: cedula }
    });

    if (!perfil) {
      return res.status(404).json({ error: 'Expediente académico no encontrado.' });
    }

    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};