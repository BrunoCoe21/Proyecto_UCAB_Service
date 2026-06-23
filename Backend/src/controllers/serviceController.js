const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.getServiciosEspacios = async (req, res) => {
  try {
    // 1. Obtener servicios de la categoría 'Espacios'
    const servicios = await sequelize.query(
      `SELECT 
         s.codigo_servicio,
         s.nombre_sede,
         s.precio,
         s.descripcion_detallada,
         s.requisitos_de_acceso,
         s.tipo_categoria
       FROM servicio s
       WHERE s.tipo_categoria = 'Espacios'
       ORDER BY s.codigo_servicio`,
      { type: QueryTypes.SELECT }
    );

    console.log('Servicios encontrados:', servicios); // Para depuración

    // Si no hay servicios, devolver array vacío
    if (!servicios || servicios.length === 0) {
      return res.json([]);
    }

    // 2. Para cada servicio, obtener los espacios físicos de su sede
    const serviciosConEspacios = await Promise.all(servicios.map(async (serv) => {
      const espacios = await sequelize.query(
        `SELECT 
           ef.nombre_sede,
           ef.nombre_edif,
           ef.num_identificador,
           ef.cap_maxima_aforo,
           ef.tipo_espacio_fisico,
           ef.estado_mantenimiento
         FROM espacio_fisico ef
         WHERE ef.nombre_sede = :sede
         ORDER BY ef.nombre_edif, ef.num_identificador`,
        {
          replacements: { sede: serv.nombre_sede },
          type: QueryTypes.SELECT
        }
      );

      return {
        ...serv,
        espacios: espacios
      };
    }));

    // Asegurar que es un array (por si acaso)
    const resultado = Array.isArray(serviciosConEspacios) ? serviciosConEspacios : [serviciosConEspacios];

    console.log('Resultado a enviar:', resultado); // Para depuración

    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener servicios de espacios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};