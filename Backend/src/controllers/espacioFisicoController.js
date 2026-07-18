const EspacioFisico = require('../models/espacioFisico');
const Edificacion = require('../models/edificacion');

// Crear un nuevo espacio físico
exports.crearEspacioFisico = async (req, res) => {
  try {
    const {
      nombre_sede,
      nombre_edif,
      num_identificador,
      cap_maxima_aforo,
      tipo_mobiliario,
      tipo_espacio_fisico,
      estado_mantenimiento,
    } = req.body;

    // Verificar que la edificación existe
    const edificacion = await Edificacion.findOne({
      where: { nombre_sede, nombre_edif },
    });
    if (!edificacion) {
      return res.status(400).json({ mensaje: 'La edificación especificada no existe' });
    }

    const nuevo = await EspacioFisico.create({
      nombre_sede,
      nombre_edif,
      num_identificador,
      cap_maxima_aforo,
      tipo_mobiliario,
      tipo_espacio_fisico,
      estado_mantenimiento,
    });

    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ mensaje: 'Ya existe un espacio con ese identificador en esta edificacion' });
    }
    res.status(500).json({ mensaje: 'Error al crear espacio fisico' });
  }
};

// Listar todos los espacios físicos (sin join, solo los espacios)
exports.listarEspaciosFisicos = async (req, res) => {
  try {
    const espacios = await EspacioFisico.findAll({
      order: [
        ['nombre_sede', 'ASC'],
        ['nombre_edif', 'ASC'],
        ['num_identificador', 'ASC'],
      ],
    });
    res.json(espacios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al listar espacios fisicos' });
  }
};

// Obtener un espacio por su clave compuesta
exports.obtenerEspacioFisico = async (req, res) => {
  try {
    const { nombre_sede, nombre_edif, num_identificador } = req.params;
    const espacio = await EspacioFisico.findOne({
      where: { nombre_sede, nombre_edif, num_identificador },
    });
    if (!espacio) {
      return res.status(404).json({ mensaje: 'Espacio físico no encontrado' });
    }
    res.json(espacio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener espacio físico' });
  }
};