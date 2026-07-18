const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.obtenerPerfil = async (req, res) => {
  try {
    const { cedula } = req.params;

    // 1. Datos basicos del estudiante (tu consulta actual)
    const perfil = await sequelize.query(`
      SELECT u.cedula_identidad, u.primer_nombre, u.primer_apellido, 
             u.fecha_nacimiento, u.sexo, u.numero_telefono, 
             u.correo_institucional, u.direccion_habitacion_detallada, 
             u.estado_cuenta, u.estatus_verificacion_dos_pasos,
             u.intentos_fallidos_auth, u.ult_fecha_cambio_cont, u.ultima_conexion,
             e.promedio, e.uc_aprobadas, e.semestre_actual, 
             e.escuela, e.facultad
      FROM usuario u
      LEFT JOIN estudiante e ON u.cedula_identidad = e.cedula_identidad
      WHERE u.cedula_identidad = :cedula
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

    if (perfil.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });


    const egresado = await sequelize.query(`
      SELECT indice_academico_final, titulo, anio_graduacion
      FROM egresado WHERE cedula_identidad = :cedula LIMIT 1
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

    const becario = await sequelize.query(`
      SELECT tipo_de_beca, estatus, indice_de_mantenimiento
      FROM becario WHERE cedula_identidad = :cedula LIMIT 1
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

    const preparador = await sequelize.query(`
      SELECT asignatura, horas
      FROM preparadores WHERE cedula_identidad = :cedula LIMIT 1
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

    const trayectoria = await sequelize.query(`
      SELECT 
        p.fecha_inicio, 
        p.fecha_finalizacion, 
        p.rol_activo,
        COALESCE(e.promedio, eg.indice_academico_final) AS indice_nota,
        CASE WHEN b.cedula_identidad IS NOT NULL THEN b.tipo_de_beca ELSE 'Regular' END AS condicion_beca
      FROM periodo_vinculacion p
      LEFT JOIN estudiante e ON p.cedula_identidad = e.cedula_identidad AND p.rol_activo = 'estudiante'
      LEFT JOIN egresado eg ON p.cedula_identidad = eg.cedula_identidad AND p.rol_activo = 'egresado'
      LEFT JOIN becario b ON p.cedula_identidad = b.cedula_identidad AND p.rol_activo = 'estudiante'
      WHERE p.cedula_identidad = :cedula 
      ORDER BY p.fecha_inicio DESC
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

  
    const sesionActual = await sequelize.query(`
      SELECT 
        direccion_ip,
        identificador_dispositivo,
        geolocalizacion_aprox,
        fecha_acceso
      FROM sesion
      WHERE cedula_identidad = :cedula
      ORDER BY fecha_acceso DESC
      LIMIT 1
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

 
    const respuesta = { 
      ...perfil[0], 
      trayectoria,
      egresado:   egresado[0]   || null,
      becario:    becario[0]    || null,
      preparador: preparador[0] || null,
      sesion_actual: sesionActual.length > 0 ? sesionActual[0] : null
    };
    
    res.json(respuesta);

  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};