const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.obtenerPerfil = async (req, res) => {
  try {
    const { cedula } = req.params;

    // Hacemos un JOIN para traer los datos de identidad y los académicos juntos
    const queries = await sequelize.query(`
      SELECT 
        u.cedula_identidad, u.primer_nombre, u.primer_apellido, 
        u.fecha_nacimiento, u.sexo, u.numero_telefono, 
        u.correo_institucional, u.direccion_habitacion_detallada, 
        u.estado_cuenta, u.ultima_conexion,
        e.promedio, e.uc_aprobadas, e.semestre_actual, e.escuela, e.facultad
      FROM usuario u
      LEFT JOIN estudiante e ON u.cedula_identidad = e.cedula_identidad
      WHERE u.cedula_identidad = :cedula
    `, { 
      replacements: { cedula }, 
      type: QueryTypes.SELECT 
    });

    if (queries.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(queries[0]);
  } catch (error) {
    console.error('Error al obtener el perfil del estudiante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};