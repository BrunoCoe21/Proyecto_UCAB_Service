// ============================================================================
//  src/controllers/empleadoController.js  ·  UCAB-Services
// ----------------------------------------------------------------------------
//  Perfil del EMPLEADO autenticado (docente o personal_administrativo).
//  Es el equivalente, para estos roles, de lo que estudianteController hace
//  para los estudiantes: traer los datos básicos + los datos propios del rol.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ----------------------------------------------------------------------------
//  GET /api/empleados/:cedula
//  Devuelve los datos del usuario + lo que tenga en docente y/o en
//  personal_administrativo (un empleado podría tener ambos roles, aunque no
//  es el caso típico). El frontend pinta lo que venga no nulo.
// ----------------------------------------------------------------------------
exports.obtenerPerfil = async (req, res) => {
  try {
    const { cedula } = req.params;

    const usuario = await sequelize.query(
      `SELECT cedula_identidad, primer_nombre, primer_apellido, correo_institucional,
              numero_telefono, estado_cuenta, intentos_fallidos_auth,
              estatus_verificacion_dos_pasos, ult_fecha_cambio_cont, ultima_conexion
       FROM usuario WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (usuario.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const docente = await sequelize.query(
      `SELECT escalafon_docente, carga_horaria_semanal, codigo_invest
       FROM docente WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );

    const administrativo = await sequelize.query(
      `SELECT carga_horaria, cargo, unidad_adscripcion_pre
       FROM personal_administrativo WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );

    // Periodo de vinculación vigente (para mostrar "Activo desde...")
    const vinculacion = await sequelize.query(
      `SELECT fecha_inicio, fecha_finalizacion, rol_activo
       FROM periodo_vinculacion
       WHERE cedula_identidad = :cedula
         AND (fecha_finalizacion IS NULL OR fecha_finalizacion >= CURRENT_DATE)
       ORDER BY fecha_inicio DESC LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );

    res.json({
      usuario: usuario[0],
      docente: docente[0] || null,
      administrativo: administrativo[0] || null,
      vinculacion: vinculacion[0] || null
    });

  } catch (error) {
    console.error('Error al obtener perfil de empleado:', error);
    res.status(500).json({ error: 'No se pudo obtener el perfil.' });
  }
};



// ----------------------------------------------------------------------------
//  GET /api/empleados/:cedula/trayectoria
//  Devuelve TODOS los periodos de vinculacion del empleado, con un detalle
//  breve por rol (escalafon si fue docente, cargo si fue administrativo).
// ----------------------------------------------------------------------------
exports.obtenerTrayectoria = async (req, res) => {
  try {
    const { cedula } = req.params;
    const trayectoria = await sequelize.query(
      `SELECT p.fecha_inicio, p.fecha_finalizacion, p.rol_activo,
              CASE
                WHEN p.rol_activo = 'docente' THEN d.escalafon_docente
                WHEN p.rol_activo = 'personal_administrativo' THEN pa.cargo
                ELSE NULL
              END AS detalle
       FROM periodo_vinculacion p
       LEFT JOIN docente d                  ON d.cedula_identidad  = p.cedula_identidad AND p.rol_activo='docente'
       LEFT JOIN personal_administrativo pa ON pa.cedula_identidad = p.cedula_identidad AND p.rol_activo='personal_administrativo'
       WHERE p.cedula_identidad = :cedula
       ORDER BY p.fecha_inicio DESC`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    res.json({ trayectoria });
  } catch (error) {
    console.error('Error al obtener trayectoria:', error);
    res.status(500).json({ error: 'No se pudo obtener la trayectoria.' });
  }
};