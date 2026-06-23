// ============================================================================
//  src/controllers/vacanteController.js  ·  UCAB-Services  ·  BOLSA DE TRABAJO
// ----------------------------------------------------------------------------
//  Solo para EGRESADOS (así lo pide el enunciado: "estudiantes egresados").
//
//  Nota importante sobre el diseño: el esquema real (tabla oportunidad_laboral)
//  NO tiene salario, ubicación, ni un índice mínimo numérico por vacante — esos
//  campos existían solo en el Figma de referencia, que es una guía visual, no
//  el modelo de datos real. Aquí se muestra únicamente lo que la base tiene:
//  cargo_solicitado, responsabilidad, beneficios, perfil_buscado y la entidad
//  externa que publica. El índice académico del egresado se muestra como dato
//  informativo de su perfil, sin comparación automática contra ningún mínimo.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ----------------------------------------------------------------------------
//  GET /api/vacantes
//  Lista las vacantes disponibles, con el nombre de la organización externa
//  que las publicó.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  GET /api/vacantes/:idVacante
//  Detalle completo de una vacante puntual.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  GET /api/vacantes/mias/:cedula
//  Las postulaciones ya hechas por este egresado (para marcar "Postulado" en
//  la lista y no dejar postular dos veces a la misma vacante).
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  GET /api/vacantes/perfil/:cedula
//  Datos del egresado para mostrar en el encabezado de la bolsa de trabajo
//  (índice académico final, título, año de graduación).
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  POST /api/vacantes/:idVacante/postular
//  Registra la postulación del egresado autenticado a una vacante.
//  La PK compuesta (cedula_identidad, id_vacante) ya impide que la misma
//  persona postule dos veces a la misma vacante; ese error se traduce a un
//  mensaje claro en vez de un error genérico de base de datos.
// ----------------------------------------------------------------------------
exports.postularse = async (req, res) => {
  try {
    const { idVacante } = req.params;
    const cedula = req.usuario.cedula;   // viene del token (middleware verificarToken)

    // La vacante debe existir y estar disponible
    const vacante = await sequelize.query(
      `SELECT estatus_vacante FROM oportunidad_laboral WHERE id_vacante = :idVacante LIMIT 1`,
      { replacements: { idVacante }, type: QueryTypes.SELECT }
    );
    if (vacante.length === 0) {
      return res.status(404).json({ error: 'Vacante no encontrada.' });
    }
    if (vacante[0].estatus_vacante !== 'disponible') {
      return res.status(400).json({ error: 'Esta vacante ya no está disponible.' });
    }

    await sequelize.query(
      `INSERT INTO postula (cedula_identidad, id_vacante, estado_postulacion, fecha_postulacion)
       VALUES (:cedula, :idVacante, 'Recibida', CURRENT_DATE)`,
      { replacements: { cedula, idVacante }, type: QueryTypes.INSERT }
    );

    res.json({ mensaje: 'Postulación enviada correctamente.' });

  } catch (error) {
    // Violación de la PK compuesta = ya se había postulado antes
    if (error.name === 'SequelizeUniqueConstraintError' || /duplicate key/i.test(error.message)) {
      return res.status(409).json({ error: 'Ya te has postulado a esta vacante.' });
    }
    console.error('Error al postularse:', error);
    res.status(500).json({ error: 'No se pudo registrar la postulación.' });
  }
};