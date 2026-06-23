// ============================================================================
//  src/controllers/vinculoFamiliarController.js  ·  UCAB-Services
// ----------------------------------------------------------------------------
//  Solo para DOCENTE y PERSONAL_ADMINISTRATIVO (son EMPLEADOS, no el "Admin de
//  la plataforma" — ese rol no existe como usuario de la app en este proyecto,
//  es un rol técnico de PostgreSQL para administrar la base de datos).
//
//  La base de datos ya impone, vía trigger (fn_vinculo_registrador_valido),
//  que solo un docente o administrativo con vinculación vigente puede
//  registrar o editar un vínculo familiar. Por eso este controller no repite
//  esa validación: simplemente usa la cédula del token como registrador, y si
//  el trigger la rechaza, el mensaje de error llega tal cual al frontend.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ----------------------------------------------------------------------------
//  GET /api/vinculos
//  Lista todos los vínculos familiares registrados por CUALQUIER empleado
//  (es información institucional, no privada de quien la registró).
// ----------------------------------------------------------------------------
exports.listarVinculos = async (req, res) => {
  try {
    const vinculos = await sequelize.query(
      `SELECT v.ci, v.nombre, v.fecha_nac, v.parentesco, v.estado_vinculo,
              v.fecha_inicio_vinculo, v.fecha_fin_vinculo, v.cedula_registrador,
              CASE
                WHEN cm.ci IS NOT NULL THEN 'menor'
                WHEN cme.ci IS NOT NULL THEN 'mayor_estudiante'
                ELSE 'sin_subtipo'
              END AS subtipo,
              cm.esquema_vacunacion, cm.centro_edu_inic,
              cme.constancia_estudio_ext, cme.certificado_solteria,
              date_part('year', age(v.fecha_nac)) AS edad_actual
       FROM vinculo_familiar v
       LEFT JOIN carga_menor cm           ON cm.ci = v.ci
       LEFT JOIN carga_mayor_estudiante cme ON cme.ci = v.ci
       ORDER BY v.estado_vinculo, v.nombre`,
      { type: QueryTypes.SELECT }
    );
    res.json(vinculos);
  } catch (error) {
    console.error('Error al listar vínculos familiares:', error);
    res.status(500).json({ error: 'No se pudieron cargar los vínculos familiares.' });
  }
};

// ----------------------------------------------------------------------------
//  GET /api/vinculos/:ci
//  Detalle de un vínculo puntual.
// ----------------------------------------------------------------------------
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
    if (vinculos.length === 0) return res.status(404).json({ error: 'Vínculo no encontrado.' });
    res.json(vinculos[0]);
  } catch (error) {
    console.error('Error al obtener vínculo:', error);
    res.status(500).json({ error: 'No se pudo obtener el vínculo.' });
  }
};

// ----------------------------------------------------------------------------
//  POST /api/vinculos
//  Registra un familiar nuevo. Body esperado:
//    {
//      ci, nombre, fecha_nac, parentesco, fecha_inicio_vinculo,
//      subtipo: 'menor' | 'mayor_estudiante' | 'sin_subtipo',
//      // si subtipo = 'menor':
//      esquema_vacunacion, centro_edu_inic,
//      // si subtipo = 'mayor_estudiante':
//      constancia_estudio_ext, certificado_solteria
//    }
//  El registrador (cedula_registrador) se toma del TOKEN, nunca del body,
//  para que nadie pueda registrar un familiar a nombre de otro empleado.
// ----------------------------------------------------------------------------
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
    // 1) Entidad fuerte vinculo_familiar (el trigger valida al registrador)
    await sequelize.query(
      `INSERT INTO vinculo_familiar
         (ci, cedula_registrador, nombre, fecha_nac, parentesco, estado_vinculo, fecha_inicio_vinculo)
       VALUES (:ci, :cedulaRegistrador, :nombre, :fecha_nac, :parentesco, 'activo', :fecha_inicio_vinculo)`,
      { replacements: { ci, cedulaRegistrador, nombre, fecha_nac, parentesco,
                        fecha_inicio_vinculo: fecha_inicio_vinculo || new Date() },
        type: QueryTypes.INSERT, transaction: t }
    );

    // 2) Subtipo, si aplica (el trigger de disjunción impide que sea ambos)
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
    // subtipo 'sin_subtipo' (ej. cónyuge): no se inserta en ninguna subtabla.

    await t.commit();
    res.status(201).json({ mensaje: 'Familiar registrado correctamente.' });

  } catch (error) {
    await t.rollback();
    console.error('Error al registrar vínculo:', error);
    // Los mensajes del trigger (registrador inválido, sin vinculación vigente)
    // llegan aquí de forma legible gracias al RAISE EXCEPTION de la base.
    res.status(400).json({ error: error.message || 'No se pudo registrar el familiar.' });
  }
};

// ----------------------------------------------------------------------------
//  PUT /api/vinculos/:ci
//  Edita los datos básicos de un vínculo (nombre, parentesco, fechas) y los
//  campos propios de su subtipo, si tiene.
// ----------------------------------------------------------------------------
exports.editarVinculo = async (req, res) => {
  const { ci } = req.params;
  const { nombre, parentesco, fecha_nac, esquema_vacunacion, centro_edu_inic,
          constancia_estudio_ext, certificado_solteria } = req.body;

  const t = await sequelize.transaction();
  try {
    const existe = await sequelize.query(
      `SELECT ci FROM vinculo_familiar WHERE ci = :ci LIMIT 1`,
      { replacements: { ci }, type: QueryTypes.SELECT, transaction: t }
    );
    if (existe.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Vínculo no encontrado.' });
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

    // Actualizar campos del subtipo, si la fila existe en alguna subtabla
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
    res.json({ mensaje: 'Vínculo actualizado correctamente.' });

  } catch (error) {
    await t.rollback();
    console.error('Error al editar vínculo:', error);
    res.status(400).json({ error: error.message || 'No se pudo editar el vínculo.' });
  }
};

// ----------------------------------------------------------------------------
//  PATCH /api/vinculos/:ci/inactivar
//  "Dar de baja" = poner estado_vinculo en 'inactivo' y cerrar fecha_fin.
//  No se borra la fila (se conserva el historial).
// ----------------------------------------------------------------------------
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
      return res.status(404).json({ error: 'Vínculo no encontrado o ya estaba inactivo.' });
    }
    res.json({ mensaje: 'Vínculo dado de baja correctamente.' });
  } catch (error) {
    console.error('Error al inactivar vínculo:', error);
    res.status(400).json({ error: error.message || 'No se pudo dar de baja el vínculo.' });
  }
};