const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { generarFolioFacturaYPasoPago } = require('./reservaController');

exports.obtenerPorEstudiante = async (req, res) => {
  try {
    const { cedula } = req.params;

    const solicitudes = await sequelize.query(
      `SELECT s.id_solicitud, s.codigo_servicio, s.estado_general, s.fecha_creacion,
              se.descripcion_detallada AS nombre_servicio
       FROM solicitud s
       LEFT JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE s.cedula_identidad = :cedula
       ORDER BY s.fecha_creacion DESC`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );

    res.json(solicitudes);
  } catch (error) {
    console.error('Error al obtener solicitudes del estudiante:', error);
    res.status(500).json({ error: 'No se pudieron cargar las solicitudes.' });
  }
};

exports.obtenerDetalle = async (req, res) => {
  try {
    const { idSolicitud } = req.params;

    const solicitudes = await sequelize.query(
      `SELECT s.id_solicitud, s.codigo_servicio, s.estado_general, s.fecha_creacion,
              se.descripcion_detallada AS nombre_servicio, se.tipo_categoria,
              se.nombre_sede, se.precio
       FROM solicitud s
       LEFT JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE s.id_solicitud = :idSolicitud
       LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );
    if (solicitudes.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    const solicitud = solicitudes[0];

    const pasos = await sequelize.query(
      `SELECT num_paso, nombre_paso, estado_paso, fecha_inicio, fecha_fin,
              nombre_oficina, responsable_asignado, paso_predecesor
       FROM paso_actividad
       WHERE id_solicitud = :idSolicitud
       ORDER BY num_paso ASC`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    let pasoActual = pasos.find(p => p.estado_paso !== 'completado');
    if (!pasoActual && pasos.length > 0) pasoActual = pasos[pasos.length - 1];

    const acreditaciones = await sequelize.query(
      `SELECT ar.id_acreditacion, ar.nombre_requisito, ar.tipo_documento
       FROM requiere r
       JOIN acreditacion_requisito ar ON ar.id_acreditacion = r.id_acreditacion
       WHERE r.codigo_servicio = :codigoServicio`,
      { replacements: { codigoServicio: solicitud.codigo_servicio }, type: QueryTypes.SELECT }
    );

    const reservas = await sequelize.query(
      `SELECT nombre_sede, nombre_edif, num_identificador, fecha_reserva,
              hora_inicio, hora_fin, estado_reserva, cant_personas
       FROM reserva
       WHERE id_solicitud = :idSolicitud
       LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    const acompanantes = await sequelize.query(
      `SELECT documento_identidad, nombre
       FROM acompanante
       WHERE id_solicitud = :idSolicitud`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    const facturas = await sequelize.query(
      `SELECT f.num_control, f.estatus, f.saldo
       FROM factura f
       JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
       WHERE fc.id_solicitud = :idSolicitud
       LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    res.json({
      solicitud,
      pasos,
      oficinaActual: pasoActual ? {
        nombre_oficina: pasoActual.nombre_oficina,
        responsable_asignado: pasoActual.responsable_asignado
      } : null,
      acreditaciones,
      reserva: reservas[0] || null,
      acompanantes,
      factura: facturas[0] || null
    });

  } catch (error) {
    console.error('Error al obtener detalle de solicitud:', error);
    res.status(500).json({ error: 'No se pudo obtener el detalle de la solicitud.' });
  }
};

const OFICINA_POR_CATEGORIA = {
  'Cultura':            'Direccion de Cultura',
  'Deporte':            'Direccion de Cultura',
  'Educacion Continua': 'Secretaria Academica',
  'Salud':              'Rectorado',
};

exports.crearSolicitud = async (req, res) => {
  const { id_solicitud, cedula_identidad, codigo_servicio } = req.body;

  if (!id_solicitud || !cedula_identidad || !codigo_servicio) {
    return res.status(400).json({ error: 'id_solicitud, cedula_identidad y codigo_servicio son obligatorios.' });
  }

  const t = await sequelize.transaction();
  try {
    const servicios = await sequelize.query(
      `SELECT tipo_categoria, precio, descripcion_detallada FROM servicio WHERE codigo_servicio = :codigo_servicio LIMIT 1`,
      { replacements: { codigo_servicio }, type: QueryTypes.SELECT, transaction: t }
    );
    if (servicios.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    const { tipo_categoria: categoria, precio, descripcion_detallada } = servicios[0];

    if (categoria === 'Cultura' || categoria === 'Deporte') {
      await t.rollback();
      return res.status(400).json({
        error: 'Este servicio requiere reservar un espacio. Use el formulario de reserva en la pantalla de Servicios.'
      });
    }

    await sequelize.query(
      `INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion)
       VALUES (:id_solicitud, :cedula_identidad, :codigo_servicio, 'abierta', CURRENT_TIMESTAMP)`,
      { replacements: { id_solicitud, cedula_identidad, codigo_servicio }, type: QueryTypes.INSERT, transaction: t }
    );

    const oficina = OFICINA_POR_CATEGORIA[categoria] || null;
    await sequelize.query(
      `INSERT INTO paso_actividad (id_solicitud, num_paso, nombre_paso, estado_paso, nombre_oficina)
       VALUES (:id_solicitud, 1, 'Revision de la solicitud', 'pendiente', :oficina)`,
      { replacements: { id_solicitud, oficina }, type: QueryTypes.INSERT, transaction: t }
    );

    if (Number(precio) > 0) {
      await generarFolioFacturaYPasoPago({
        idSolicitud: id_solicitud, codigoServicio: codigo_servicio, precio,
        concepto: descripcion_detallada || codigo_servicio,
        siguienteNumPaso: 2
      }, t);
    }

    await t.commit();
    res.status(201).json({ mensaje: 'Solicitud creada correctamente.', id_solicitud });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear solicitud:', error);
    res.status(400).json({ error: error.message || 'No se pudo crear la solicitud.' });
  }
};