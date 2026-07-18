const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.listarVacantes = async (req, res) => {
  try {
    const vacantes = await sequelize.query(
      `SELECT v.id_vacante, v.cargo_solicitado, v.responsabilidad, v.beneficios,
              v.perfil_buscado, v.estatus_vacante, v.fecha_oferta,
              oe.razon_social AS organizacion
       FROM oportunidad_laboral v
       JOIN organizacion_externa oe ON oe.id_entidad = v.id_entidad
       WHERE v.estatus_vacante = 'disponible'
       ORDER BY v.fecha_oferta DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(vacantes);
  } catch (error) {
    console.error('Error al listar vacantes:', error);
    res.status(500).json({ error: 'No se pudieron cargar las vacantes.' });
  }
};

exports.obtenerVacante = async (req, res) => {
  try {
    const { idVacante } = req.params;
    const vacantes = await sequelize.query(
      `SELECT v.id_vacante, v.cargo_solicitado, v.responsabilidad, v.beneficios,
              v.perfil_buscado, v.estatus_vacante, v.fecha_oferta,
              oe.razon_social AS organizacion, oe.contactos
       FROM oportunidad_laboral v
       JOIN organizacion_externa oe ON oe.id_entidad = v.id_entidad
       WHERE v.id_vacante = :idVacante
       LIMIT 1`,
      { replacements: { idVacante }, type: QueryTypes.SELECT }
    );
    if (vacantes.length === 0) {
      return res.status(404).json({ error: 'Vacante no encontrada.' });
    }
    res.json(vacantes[0]);
  } catch (error) {
    console.error('Error al obtener vacante:', error);
    res.status(500).json({ error: 'No se pudo obtener la vacante.' });
  }
};

exports.misPostulaciones = async (req, res) => {
  try {
    const { cedula } = req.params;
    const postulaciones = await sequelize.query(
      `SELECT p.id_vacante, p.estado_postulacion, p.fecha_postulacion,
              v.cargo_solicitado, oe.razon_social AS organizacion
       FROM postula p
       JOIN oportunidad_laboral v   ON v.id_vacante = p.id_vacante
       JOIN organizacion_externa oe ON oe.id_entidad = v.id_entidad
       WHERE p.cedula_identidad = :cedula
       ORDER BY p.fecha_postulacion DESC`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    res.json(postulaciones);
  } catch (error) {
    console.error('Error al obtener postulaciones:', error);
    res.status(500).json({ error: 'No se pudieron obtener tus postulaciones.' });
  }
};

exports.perfilEgresado = async (req, res) => {
  try {
    const { cedula } = req.params;
    const perfil = await sequelize.query(
      `SELECT indice_academico_final, titulo, anio_graduacion
       FROM egresado WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (perfil.length === 0) {
      return res.status(404).json({ error: 'Perfil de egresado no encontrado.' });
    }
    res.json(perfil[0]);
  } catch (error) {
    console.error('Error al obtener perfil de egresado:', error);
    res.status(500).json({ error: 'No se pudo obtener el perfil.' });
  }
};

exports.postularse = async (req, res) => {
  try {
    const { idVacante } = req.params;
    const cedula = req.usuario.cedula;

    const result = await sequelize.query(
      `SELECT postular_egresado(:cedula, :idVacante) AS resultado`,
      {
        replacements: { cedula, idVacante },
        type: QueryTypes.SELECT
      }
    );

    const jsonResult = result[0]?.resultado;
    if (!jsonResult) {
      throw new Error('No se recibio respuesta de la funcion.');
    }

    const parsed = typeof jsonResult === 'string' ? JSON.parse(jsonResult) : jsonResult;

    if (parsed.success) {
      return res.json({ mensaje: parsed.message });
    } else {
      const msg = parsed.message;
      if (msg.includes('Ya te has postulado')) {
        return res.status(409).json({ error: msg });
      }
      if (msg.includes('no cumple con el perfil')) {
        return res.status(403).json({ error: msg });
      }
      if (msg.includes('no está disponible')) {
        return res.status(400).json({ error: msg });
      }
      if (msg.includes('Vacante no encontrada')) {
        return res.status(404).json({ error: msg });
      }
      if (msg.includes('Egresado no encontrado')) {
        return res.status(404).json({ error: msg });
      }
      return res.status(500).json({ error: msg });
    }

  } catch (error) {
    console.error('Error al postularse:', error);
    res.status(500).json({ error: 'No se pudo registrar la postulacion.' });
  }
};