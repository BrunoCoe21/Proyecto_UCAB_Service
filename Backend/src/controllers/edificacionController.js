const Edificacion = require('../models/edificacion');
const Sede = require('../models/sede');

// Obtener todas las edificaciones
exports.listarEdificaciones = async (req, res) => {
  try {
    const edificaciones = await Edificacion.findAll({
      include: [{ model: Sede, attributes: ['ubicacion', 'factor_ajuste'] }],
      order: [['nombre_sede', 'ASC'], ['nombre_edif', 'ASC']],
    });
    res.json(edificaciones);
  } catch (error) {
    console.error('Error al listar edificaciones:', error);
    res.status(500).json({ mensaje: 'Error al listar edificaciones' });
  }
};

// Crear una nueva edificacion
exports.crearEdificacion = async (req, res) => {
  try {
    const { nombre_sede, nombre_edif, direccion_interna } = req.body;

    const sede = await Sede.findByPk(nombre_sede);
    if (!sede) {
      return res.status(400).json({ mensaje: 'La sede especificada no existe' });
    }

    const nueva = await Edificacion.create({
      nombre_sede,
      nombre_edif,
      direccion_interna,
    });
    res.status(201).json(nueva);
  } catch (error) {
    console.error('Error al crear edificacion:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ mensaje: 'Ya existe una edificacion con ese nombre en esa sede' });
    }
    res.status(500).json({ mensaje: 'Error al crear edificacion' });
  }
};

// Obtener una edificacion por su clave compuesta
exports.obtenerEdificacion = async (req, res) => {
  try {
    const { nombre_sede, nombre_edif } = req.params;
    const edificacion = await Edificacion.findOne({
      where: { nombre_sede, nombre_edif },
      include: [{ model: Sede }],
    });
    if (!edificacion) {
      return res.status(404).json({ mensaje: 'Edificacion no encontrada' });
    }
    res.json(edificacion);
  } catch (error) {
    console.error('Error al obtener edificacion:', error);
    res.status(500).json({ mensaje: 'Error al obtener edificacion' });
  }
};