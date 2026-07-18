const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

exports.getServiciosEspacios = async (req, res) => {
  try {
    console.log('Ejecutando getServiciosEspacios...');

    const servicios = await sequelize.query(
      `SELECT 
         s.codigo_servicio,
         s.nombre_sede,
         s.precio,
         s.descripcion_detallada,
         s.requisitos_de_acceso,
         s.tipo_categoria,
         s.id_entidad,
         e.nombre AS entidad_nombre
       FROM servicio s
       LEFT JOIN entidad_prestadora e ON e.id_entidad = s.id_entidad
       ORDER BY s.tipo_categoria, s.codigo_servicio`,
      { type: QueryTypes.SELECT }
    );

    console.log('Servicios encontrados:', servicios.length);

    if (!servicios || servicios.length === 0) {
      return res.json([]);
    }

    const limites = await sequelize.query(
      `SELECT tipo_categoria, nombre_sede, monto_limt_max
       FROM limite_categoria_sede`,
      { type: QueryTypes.SELECT }
    );

    const limitesMap = {};
    limites.forEach(l => {
      const key = `${l.tipo_categoria}|${l.nombre_sede}`;
      limitesMap[key] = parseFloat(l.monto_limt_max);
    });

    const cargos = await sequelize.query(
      `SELECT codigo_servicio, nombre_concepto, monto, tipo_suplemento
       FROM cargo_adicional`,
      { type: QueryTypes.SELECT }
    );

    const cargosMap = {};
    cargos.forEach(c => {
      if (!cargosMap[c.codigo_servicio]) {
        cargosMap[c.codigo_servicio] = [];
      }
      cargosMap[c.codigo_servicio].push({
        nombre_concepto: c.nombre_concepto,
        monto: parseFloat(c.monto),
        tipo_suplemento: c.tipo_suplemento
      });
    });

    const historialTarifas = await sequelize.query(
      `SELECT codigo_servicio, 
              tarifa_miembro_activo, 
              tarifa_egresado, 
              tarifa_publico_externo
       FROM historial_tarifas
       WHERE fecha_vigencia_inicio <= CURRENT_DATE
         AND (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin >= CURRENT_DATE)`,
      { type: QueryTypes.SELECT }
    );

    const tarifasMap = {};
    historialTarifas.forEach(t => {
      tarifasMap[t.codigo_servicio] = {
        miembro_activo: parseFloat(t.tarifa_miembro_activo),
        egresado: parseFloat(t.tarifa_egresado),
        publico_externo: parseFloat(t.tarifa_publico_externo)
      };
    });

    const acreditaciones = await sequelize.query(
      `SELECT r.codigo_servicio, ar.id_acreditacion, ar.nombre_requisito, ar.tipo_documento
       FROM requiere r
       JOIN acreditacion_requisito ar ON ar.id_acreditacion = r.id_acreditacion`,
      { type: QueryTypes.SELECT }
    );
    const acreditacionesMap = {};
    acreditaciones.forEach(a => {
      if (!acreditacionesMap[a.codigo_servicio]) acreditacionesMap[a.codigo_servicio] = [];
      acreditacionesMap[a.codigo_servicio].push({
        id_acreditacion: a.id_acreditacion,
        nombre_requisito: a.nombre_requisito,
        tipo_documento: a.tipo_documento
      });
    });

    const pasosActividad = await sequelize.query(
      `SELECT 
         p.id_solicitud,
         p.num_paso,
         p.nombre_paso,
         p.nombre_oficina,
         p.estado_paso,
         s.codigo_servicio
       FROM paso_actividad p
       JOIN solicitud s ON s.id_solicitud = p.id_solicitud
       ORDER BY s.codigo_servicio, p.id_solicitud, p.num_paso`,
      { type: QueryTypes.SELECT }
    );

    const pasosMap = {};
    const solicitudesPorServicio = {};
    pasosActividad.forEach(p => {
      if (!solicitudesPorServicio[p.codigo_servicio]) {
        solicitudesPorServicio[p.codigo_servicio] = new Set();
      }
      solicitudesPorServicio[p.codigo_servicio].add(p.id_solicitud);
    });

    for (const [codigo, solicitudes] of Object.entries(solicitudesPorServicio)) {
      const primeraSolicitud = Array.from(solicitudes)[0];
      const pasos = pasosActividad
        .filter(p => p.id_solicitud === primeraSolicitud)
        .sort((a, b) => a.num_paso - b.num_paso)
        .map(p => ({
          num_paso: p.num_paso,
          nombre_paso: p.nombre_paso,
          nombre_oficina: p.nombre_oficina,
          estado_paso: p.estado_paso
        }));
      pasosMap[codigo] = pasos;
    }

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

      const key = `${serv.tipo_categoria}|${serv.nombre_sede}`;
      const limiteMaximo = limitesMap[key] || null;
      const cargosServicio = cargosMap[serv.codigo_servicio] || [];
      const pasosServicio = pasosMap[serv.codigo_servicio] || [];
      
      const tarifas = tarifasMap[serv.codigo_servicio] || {
        miembro_activo: parseFloat(serv.precio),
        egresado: parseFloat(serv.precio) * 0.9,
        publico_externo: parseFloat(serv.precio) * 1.2
      };

      return {
        ...serv,
        limite_maximo: limiteMaximo,
        acreditaciones: acreditacionesMap[serv.codigo_servicio] || [],
        cargos_adicionales: cargosServicio,
        pasos: pasosServicio,
        tarifas: tarifas,
        entidad_nombre: serv.entidad_nombre || 'Entidad no especificada',
        espacios: espacios
      };
    }));

    console.log('Respuesta enviada con', serviciosConEspacios.length, 'servicios');
    res.json(serviciosConEspacios);

  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor.',
      detalle: error.message 
    });
  }
};

exports.getAllServicios = async (req, res) => {
  try {
    const servicios = await sequelize.query(
      `SELECT 
         s.codigo_servicio,
         s.nombre_sede,
         s.precio,
         s.descripcion_detallada,
         s.requisitos_de_acceso,
         s.tipo_categoria,
         s.id_entidad,
         e.nombre AS entidad_nombre
       FROM servicio s
       LEFT JOIN entidad_prestadora e ON e.id_entidad = s.id_entidad
       ORDER BY s.tipo_categoria, s.descripcion_detallada`,
      { type: QueryTypes.SELECT }
    );

    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener todos los servicios:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.getDetalleServicio = async (req, res) => {
  try {
    const { codigo } = req.params;

    const servicio = await sequelize.query(
      `SELECT s.codigo_servicio, s.nombre_sede, s.precio, s.descripcion_detallada, 
              s.requisitos_de_acceso, s.tipo_categoria, s.id_entidad,
              e.nombre AS entidad_nombre
       FROM servicio s
       LEFT JOIN entidad_prestadora e ON e.id_entidad = s.id_entidad
       WHERE s.codigo_servicio = :codigo`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

    if (!servicio || servicio.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const serv = servicio[0];

    const limites = await sequelize.query(
      `SELECT tipo_categoria, nombre_sede, monto_limt_max
       FROM limite_categoria_sede`,
      { type: QueryTypes.SELECT }
    );

    const limitesMap = {};
    limites.forEach(l => {
      const key = `${l.tipo_categoria}|${l.nombre_sede}`;
      limitesMap[key] = parseFloat(l.monto_limt_max);
    });

    const key = `${serv.tipo_categoria}|${serv.nombre_sede}`;
    const limiteMaximo = limitesMap[key] || null;

    const cargos = await sequelize.query(
      `SELECT nombre_concepto, monto, tipo_suplemento
       FROM cargo_adicional
       WHERE codigo_servicio = :codigo`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

    const pasos = await sequelize.query(
      `SELECT p.num_paso, p.nombre_paso, p.nombre_oficina, p.estado_paso
       FROM paso_actividad p
       JOIN solicitud s ON s.id_solicitud = p.id_solicitud
       WHERE s.codigo_servicio = :codigo
       ORDER BY p.num_paso
       LIMIT 10`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

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

    const tarifas = await sequelize.query(
      `SELECT tarifa_miembro_activo, tarifa_egresado, tarifa_publico_externo
       FROM historial_tarifas
       WHERE codigo_servicio = :codigo
         AND fecha_vigencia_inicio <= CURRENT_DATE
         AND (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin >= CURRENT_DATE)
       ORDER BY fecha_vigencia_inicio DESC
       LIMIT 1`,
      { replacements: { codigo }, type: QueryTypes.SELECT }
    );

    res.json({
      servicio: {
        ...serv,
        limite_maximo: limiteMaximo,
        entidad_nombre: serv.entidad_nombre || 'Entidad no especificada'
      },
      cargos_adicionales: cargos,
      pasos: pasos,
      espacios: espacios,
      tarifas: tarifas.length > 0 ? tarifas[0] : null
    });

  } catch (error) {
    console.error('Error al obtener detalle del servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};