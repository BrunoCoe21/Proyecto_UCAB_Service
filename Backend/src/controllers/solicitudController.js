// src/controllers/solicitudController.js
const { Solicitud, Servicio } = require('../models');

// OBTENER SOLICITUDES DE UN ESTUDIANTE (Dashboard)
exports.obtenerPorEstudiante = async (req, res) => {
  try {
    const { cedula } = req.params;
    
    // Aquí ocurre la magia relacional (JOIN automático)
    const solicitudes = await Solicitud.findAll({
      where: { cedula_identidad: cedula },
      include: [{
        model: Servicio,
        attributes: ['nombre_servicio'] // Solo traemos el nombre para no saturar la red
      }],
      order: [['fecha_creacion', 'DESC']] // Las más recientes primero
    });

    // Mapeamos el resultado para que coincida exactamente con lo que espera tu inicio.js
    const resultado = solicitudes.map(sol => ({
      id_solicitud: sol.id_solicitud,
      nombre_servicio: sol.servicio ? sol.servicio.nombre_servicio : 'Trámite Institucional',
      estatus: sol.estado_general,
      fecha_creacion: sol.fecha_creacion
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};