const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.listarVinculos = async (req, res) => {
  try {
    const cedulaRegistrador = req.usuario.cedula;
    const vinculos = await sequelize.query(
      `SELECT v.ci, v.nombre, v.fecha_nac, v.parentesco, v.estado_vinculo,
              v.fecha_inicio_vinculo, v.fecha_fin_vinculo, r.cedula_empleado AS cedula_registrador,
              CASE
                WHEN cm.ci IS NOT NULL THEN 'menor'
                WHEN cme.ci IS NOT NULL THEN 'mayor_estudiante'
                ELSE 'sin_subtipo'
              END AS subtipo,
              cm.esquema_vacunacion, cm.centro_edu_inic,
              cme.constancia_estudio_ext, cme.certificado_solteria,
              date_part('year', age(v.fecha_nac)) AS edad_actual
       FROM vinculo_familiar v
       JOIN registra r                    ON r.ci = v.ci
       LEFT JOIN carga_menor cm           ON cm.ci = v.ci
       LEFT JOIN carga_mayor_estudiante cme ON cme.ci = v.ci
       WHERE r.cedula_empleado = :cedulaRegistrador
       ORDER BY v.estado_vinculo, v.nombre`,
      { replacements: { cedulaRegistrador }, type: QueryTypes.SELECT }
    );
    res.json(vinculos);
  } catch (error) {
    console.error('Error al listar vínculos familiares:', error);
    res.status(500).json({ error: 'No se pudieron cargar los vínculos familiares.' });
  }
};

exports.obtenerVinculo = async (req, res) => {
  try {
    const { ci } = req.params;
    const vinculos = await sequelize.query(
      `SELECT v.*,
              CASE WHEN cm.ci IS NOT NULL THEN 'menor'
                   WHEN cme.ci IS NOT NULL THEN 'mayor_estudiante'
                   ELSE 'sin_subtipo' END AS subtipo,
              cm.esquema_vacunacion, cm.centro_edu_inic,
              cme.constancia_estudio_ext, cme.certificado_solteria
       FROM vinculo_familiar v
       LEFT JOIN carga_menor cm ON cm.ci = v.ci
       LEFT JOIN carga_mayor_estudiante cme ON cme.ci = v.ci
       WHERE v.ci = :ci LIMIT 1`,
      { replacements: { ci }, type: QueryTypes.SELECT }
    );
    if (vinculos.length === 0) return res.status(404).json({ error: 'Vinculo no encontrado.' });
    res.json(vinculos[0]);
  } catch (error) {
    console.error('Error al obtener vinculo:', error);
    res.status(500).json({ error: 'No se pudo obtener el vinculo.' });
  }
};

exports.registrarVinculo = async (req, res) => {
  const {
    ci, nombre, fecha_nac, parentesco, fecha_inicio_vinculo,
    subtipo, esquema_vacunacion, centro_edu_inic,
    constancia_estudio_ext, certificado_solteria
  } = req.body;

  const cedulaRegistrador = req.usuario.cedula;

  if (!ci || !nombre || !fecha_nac || !parentesco) {
    return res.status(400).json({ error: 'Cédula, nombre, fecha de nacimiento y parentesco son obligatorios.' });
  }
  if (subtipo === 'mayor_estudiante' && (!constancia_estudio_ext || !certificado_solteria)) {
    return res.status(400).json({ error: 'La constancia de estudio y el certificado de soltería son obligatorios para un mayor estudiante.' });
  }

  const t = await sequelize.transaction();
  try {
    await sequelize.query(
      `INSERT INTO vinculo_familiar
         (ci, nombre, fecha_nac, parentesco, estado_vinculo, fecha_inicio_vinculo)
       VALUES (:ci, :nombre, :fecha_nac, :parentesco, 'activo', :fecha_inicio_vinculo)`,
      { replacements: { ci, nombre, fecha_nac, parentesco,
                        fecha_inicio_vinculo: fecha_inicio_vinculo || new Date() },
        type: QueryTypes.INSERT, transaction: t }
    );

    await sequelize.query(
      `INSERT INTO registra (ci, cedula_empleado, fecha_registro)
       VALUES (:ci, :cedulaRegistrador, CURRENT_DATE)`,
      { replacements: { ci, cedulaRegistrador },
        type: QueryTypes.INSERT, transaction: t }
    );

    if (subtipo === 'menor') {
      await sequelize.query(
        `INSERT INTO carga_menor (ci, esquema_vacunacion, centro_edu_inic)
         VALUES (:ci, :esquema_vacunacion, :centro_edu_inic)`,
        { replacements: { ci, esquema_vacunacion: esquema_vacunacion || null, centro_edu_inic: centro_edu_inic || null },
          type: QueryTypes.INSERT, transaction: t }
      );
    } else if (subtipo === 'mayor_estudiante') {
      await sequelize.query(
        `INSERT INTO carga_mayor_estudiante (ci, constancia_estudio_ext, certificado_solteria)
         VALUES (:ci, :constancia_estudio_ext, :certificado_solteria)`,
        { replacements: { ci, constancia_estudio_ext, certificado_solteria },
          type: QueryTypes.INSERT, transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ mensaje: 'Familiar registrado correctamente.' });

  } catch (error) {
    await t.rollback();
    console.error('Error al registrar vínculo:', error);
    res.status(400).json({ error: error.message || 'No se pudo registrar el familiar.' });
  }
};

exports.editarVinculo = async (req, res) => {
  const { ci } = req.params;
  const { nombre, parentesco, fecha_nac, subtipo, esquema_vacunacion, centro_edu_inic,
          constancia_estudio_ext, certificado_solteria } = req.body;

  const t = await sequelize.transaction();
  try {
    const existe = await sequelize.query(
      `SELECT ci FROM vinculo_familiar WHERE ci = :ci LIMIT 1`,
      { replacements: { ci }, type: QueryTypes.SELECT, transaction: t }
    );
    if (existe.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Vinculo no encontrado.' });
    }

    await sequelize.query(
      `UPDATE vinculo_familiar
       SET nombre = COALESCE(:nombre, nombre),
           parentesco = COALESCE(:parentesco, parentesco),
           fecha_nac = COALESCE(:fecha_nac, fecha_nac)
       WHERE ci = :ci`,
      { replacements: { ci, nombre: nombre || null, parentesco: parentesco || null, fecha_nac: fecha_nac || null },
        type: QueryTypes.UPDATE, transaction: t }
    );

    if (subtipo !== undefined) {
      const subtipoActual = await sequelize.query(
        `SELECT (SELECT 1 FROM carga_menor cm WHERE cm.ci = :ci)            AS es_menor,
                (SELECT 1 FROM carga_mayor_estudiante cme WHERE cme.ci = :ci) AS es_mayor`,
        { replacements: { ci }, type: QueryTypes.SELECT, transaction: t }
      );
      const esMenor = !!subtipoActual[0].es_menor;
      const esMayor = !!subtipoActual[0].es_mayor;

      if (subtipo !== 'menor' && esMenor) {
        await sequelize.query(`DELETE FROM carga_menor WHERE ci = :ci`,
          { replacements: { ci }, type: QueryTypes.DELETE, transaction: t });
      }
      if (subtipo !== 'mayor_estudiante' && esMayor) {
        await sequelize.query(`DELETE FROM carga_mayor_estudiante WHERE ci = :ci`,
          { replacements: { ci }, type: QueryTypes.DELETE, transaction: t });
      }
      if (subtipo === 'menor' && !esMenor) {
        await sequelize.query(
          `INSERT INTO carga_menor (ci, esquema_vacunacion, centro_edu_inic)
           VALUES (:ci, :esquema_vacunacion, :centro_edu_inic)`,
          { replacements: { ci, esquema_vacunacion: esquema_vacunacion || null,
                            centro_edu_inic: centro_edu_inic || null },
            type: QueryTypes.INSERT, transaction: t });
      }
      if (subtipo === 'mayor_estudiante' && !esMayor) {
        if (!constancia_estudio_ext || !certificado_solteria) {
          await t.rollback();
          return res.status(400).json({
            error: 'Para cambiar el subtipo a "Mayor estudiante" son obligatorios la constancia de estudio y el certificado de solteria.'
          });
        }
        await sequelize.query(
          `INSERT INTO carga_mayor_estudiante (ci, constancia_estudio_ext, certificado_solteria)
           VALUES (:ci, :constancia_estudio_ext, :certificado_solteria)`,
          { replacements: { ci, constancia_estudio_ext, certificado_solteria },
            type: QueryTypes.INSERT, transaction: t });
      }
    }

    if (esquema_vacunacion !== undefined || centro_edu_inic !== undefined) {
      await sequelize.query(
        `UPDATE carga_menor
         SET esquema_vacunacion = COALESCE(:esquema_vacunacion, esquema_vacunacion),
             centro_edu_inic = COALESCE(:centro_edu_inic, centro_edu_inic)
         WHERE ci = :ci`,
        { replacements: { ci, esquema_vacunacion: esquema_vacunacion || null, centro_edu_inic: centro_edu_inic || null },
          type: QueryTypes.UPDATE, transaction: t }
      );
    }
    if (constancia_estudio_ext !== undefined || certificado_solteria !== undefined) {
      await sequelize.query(
        `UPDATE carga_mayor_estudiante
         SET constancia_estudio_ext = COALESCE(:constancia_estudio_ext, constancia_estudio_ext),
             certificado_solteria = COALESCE(:certificado_solteria, certificado_solteria)
         WHERE ci = :ci`,
        { replacements: { ci, constancia_estudio_ext: constancia_estudio_ext || null, certificado_solteria: certificado_solteria || null },
          type: QueryTypes.UPDATE, transaction: t }
      );
    }

    await t.commit();
    res.json({ mensaje: 'Vinculo actualizado correctamente.' });

  } catch (error) {
    await t.rollback();
    console.error('Error al editar vinculo:', error);
    res.status(400).json({ error: error.message || 'No se pudo editar el vinculo.' });
  }
};

exports.inactivarVinculo = async (req, res) => {
  try {
    const { ci } = req.params;
    const resultado = await sequelize.query(
      `UPDATE vinculo_familiar
       SET estado_vinculo = 'inactivo', fecha_fin_vinculo = CURRENT_DATE
       WHERE ci = :ci AND estado_vinculo = 'activo'`,
      { replacements: { ci }, type: QueryTypes.UPDATE }
    );
    if (resultado[1] === 0) {
      return res.status(404).json({ error: 'Vinculo no encontrado o ya estaba inactivo.' });
    }
    res.json({ mensaje: 'Vinculo dado de baja correctamente.' });
  } catch (error) {
    console.error('Error al inactivar vinculo:', error);
    res.status(400).json({ error: error.message || 'No se pudo dar de baja el vinculo.' });
  }
};