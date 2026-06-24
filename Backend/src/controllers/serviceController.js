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

exports.getAllServicios = async (req, res) => {
  try {
    const servicios = await sequelize.query(
      `SELECT 
         codigo_servicio,
         nombre_sede,
         precio,
         descripcion_detallada,
         requisitos_de_acceso,
         tipo_categoria
       FROM servicio
       ORDER BY tipo_categoria, descripcion_detallada`,
      { type: QueryTypes.SELECT }
    );

    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener todos los servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};



// ... (mantén las funciones existentes)

// Obtener detalle de un servicio con sus pasos de una solicitud ejemplo
exports.getDetalleServicio = async (req, res) => {
  try {
    const { codigo } = req.params;

    // 1. Obtener el servicio
    const servicio = await sequelize.query(
      `SELECT codigo_servicio, nombre_sede, precio, descripcion_detallada, requisitos_de_acceso, tipo_categoria
       FROM servicio
       WHERE codigo_servicio = :codigo`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

    if (!servicio || servicio.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const serv = servicio[0];

    // 2. Obtener una solicitud asociada a este servicio (la más reciente)
    const solicitud = await sequelize.query(
      `SELECT id_solicitud
       FROM solicitud
       WHERE codigo_servicio = :codigo
       ORDER BY fecha_creacion DESC
       LIMIT 1`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

    let pasos = [];
    if (solicitud && solicitud.length > 0) {
      const idSolicitud = solicitud[0].id_solicitud;
      // 3. Obtener pasos de esa solicitud
      pasos = await sequelize.query(
        `SELECT num_paso, nombre_paso, estado_paso
         FROM paso_actividad
         WHERE id_solicitud = :idSolicitud
         ORDER BY num_paso`,
        { replacements: { idSolicitud }, type: QueryTypes.SELECT }
      );
    }

    // 4. Enviar respuesta
    res.json({
      servicio: serv,
      pasos: pasos
    });

  } catch (error) {
    console.error('Error al obtener detalle del servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};