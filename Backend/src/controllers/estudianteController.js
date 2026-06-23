const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.obtenerPerfil = async (req, res) => {
  try {
    const { cedula } = req.params;

    // 1. Datos básicos del estudiante (tu consulta actual)
    const perfil = await sequelize.query(`
      SELECT u.cedula_identidad, u.primer_nombre, u.primer_apellido, 
             u.fecha_nacimiento, u.sexo, u.numero_telefono, 
             u.correo_institucional, u.direccion_habitacion_detallada, 
             u.estado_cuenta, e.promedio, e.uc_aprobadas, e.semestre_actual, 
             e.escuela, e.facultad
      FROM usuario u
      LEFT JOIN estudiante e ON u.cedula_identidad = e.cedula_identidad
      WHERE u.cedula_identidad = :cedula
    `, { replacements: { cedula }, type: QueryTypes.SELECT });

    if (perfil.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 2. NUEVO: Historial de Trayectoria
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
    
    // Combinamos ambos resultados
    const respuesta = { ...perfil[0], trayectoria };
    res.json(respuesta);

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};