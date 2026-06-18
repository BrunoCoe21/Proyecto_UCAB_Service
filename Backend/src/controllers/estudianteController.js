// backend/src/controllers/estudianteController.js
const Estudiante = require('../models/Estudiante');

// 1. Obtener los estudiantes reales de la BD
exports.obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await Estudiante.findAll(); 
    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear un estudiante con las columnas correctas
exports.crearEstudiante = async (req, res) => {
  try {
    const { cedula_identidad, promedio, uc_aprobadas, semestre_actual, escuela, facultad } = req.body;
    const nuevo = await Estudiante.create({ 
      cedula_identidad, 
      promedio, 
      uc_aprobadas, 
      semestre_actual, 
      escuela, 
      facultad 
    });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};