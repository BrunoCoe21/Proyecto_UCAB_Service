// backend/src/controllers/estudianteController.js
const Estudiante = require('../models/Estudiante');

exports.crearEstudiante = async (req, res) => {
  try {
    const { nombre, apellido, correo } = req.body; // Solo estos campos
    // No enviamos fecha_registro, la BD lo genera
    const nuevo = await Estudiante.create({ nombre, apellido, correo });
    res.status(201).json(nuevo);
  } catch (error) {
    // Si el correo ya existe, Sequelize lanza un error de unique constraint
    res.status(400).json({ error: error.message });
  }
};

exports.obtenerEstudiantes = async (req, res) => {
  try {
    const estudiantes = await Estudiante.findAll({
      attributes: ['id', 'nombre', 'apellido', 'correo', 'fecha_registro'],
    });
    res.json(estudiantes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};