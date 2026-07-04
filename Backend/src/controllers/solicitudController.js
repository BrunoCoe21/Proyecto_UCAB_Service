// ============================================================================
//  src/controllers/solicitudController.js  ·  UCAB-Services  ·  MIS SOLICITUDES
// ----------------------------------------------------------------------------
//  CORRECCIÓN: la función obtenerPorEstudiante() anterior usaba el modelo
//  Servicio con la columna 'nombre_servicio', que no existe en la base real
//  (es 'descripcion_detallada'). Esta versión usa sequelize.query directo
//  para evitar depender de asociaciones de Sequelize que pueden desalinearse
//  con el esquema real, y porque las consultas de detalle cruzan varias
//  tablas (solicitud, paso_actividad, oficina_responsable, requiere,
//  acreditacion_requisito) que se leen más claro en SQL explícito.
//
//  NOTA sobre estado_general: en los datos ya cargados existen valores con
//  distinta capitalización ('abierta', 'en proceso', 'cerrada' desde los
//  scripts SQL, y 'EN PROCESO' desde el frontend de servicios). Por eso las
//  comparaciones de estado en este controller son case-insensitive (LOWER).
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { generarFolioFacturaYPasoPago } = require('./reservaController');

// ----------------------------------------------------------------------------
//  GET /api/solicitudes/estudiante/:cedula
//  Lista de tarjetas: una por cada solicitud del usuario.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  GET /api/solicitudes/:idSolicitud/detalle
//  Resumen completo de una solicitud: datos generales + último paso con su
//  oficina/responsable + la línea de tiempo completa de pasos + las
//  acreditaciones que exige el servicio (informativo, sin registrar
//  cumplimiento porque la base no tiene tabla para eso).
// ----------------------------------------------------------------------------
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

    // Línea de tiempo completa de pasos, ordenada
    const pasos = await sequelize.query(
      `SELECT num_paso, nombre_paso, estado_paso, fecha_inicio, fecha_fin,
              nombre_oficina, responsable_asignado, paso_predecesor
       FROM paso_actividad
       WHERE id_solicitud = :idSolicitud
       ORDER BY num_paso ASC`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    // Oficina/responsable "actual": el primer paso que no esté completado;
    // si todos están completados, se muestra el último paso (el más reciente).
    let pasoActual = pasos.find(p => p.estado_paso !== 'completado');
    if (!pasoActual && pasos.length > 0) pasoActual = pasos[pasos.length - 1];

    // Acreditaciones que exige el servicio (solo informativo: qué se necesita,
    // no si el usuario ya las tiene, porque no existe esa tabla en la base).
    const acreditaciones = await sequelize.query(
      `SELECT ar.id_acreditacion, ar.nombre_requisito, ar.tipo_documento
       FROM requiere r
       JOIN acreditacion_requisito ar ON ar.id_acreditacion = r.id_acreditacion
       WHERE r.codigo_servicio = :codigoServicio`,
      { replacements: { codigoServicio: solicitud.codigo_servicio }, type: QueryTypes.SELECT }
    );

    // Si la solicitud es de un servicio que reserva espacio, traer la reserva
    const reservas = await sequelize.query(
      `SELECT nombre_sede, nombre_edif, num_identificador, fecha_reserva,
              hora_inicio, hora_fin, estado_reserva, cant_personas
       FROM reserva
       WHERE id_solicitud = :idSolicitud
       LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    // Acompañantes registrados para esta solicitud (entidad fuerte, FK a id_solicitud)
    const acompanantes = await sequelize.query(
      `SELECT documento_identidad, nombre
       FROM acompanante
       WHERE id_solicitud = :idSolicitud`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    // NUEVO: factura asociada a esta solicitud (vía folio_consumo), para
    // mostrar en Mis Solicitudes el monto pendiente o el enlace a pagar.
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

// ----------------------------------------------------------------------------
//  Mapeo categoría de servicio -> oficina responsable que atiende el primer
//  paso. Acordado explícitamente: tu base no tiene una regla automática para
//  esto, así que se decide aquí, en un solo lugar fácil de ajustar.
// ----------------------------------------------------------------------------
const OFICINA_POR_CATEGORIA = {
  'Cultura':            'Direccion de Cultura',
  'Deporte':            'Direccion de Cultura',
  'Educacion Continua': 'Secretaria Academica',
  'Salud':              'Rectorado',
};

// ----------------------------------------------------------------------------
//  POST /api/solicitudes
//  Crea una solicitud SIN reserva de espacio (Salud, Educación Continua).
//
//  CAMBIO DE FLUJO (acordado): los servicios de Cultura/Deporte ya NO se
//  crean por aquí. Ahora abren el modal de reserva directamente desde
//  Servicios, que crea la solicitud y la reserva juntas en una transacción
//  (ver reservaController.crearSolicitudConReserva). Este endpoint rechaza
//  explícitamente esos casos para que no quede una solicitud "huérfana" sin
//  reserva si alguien sigue llamando a esta ruta por error.
// ----------------------------------------------------------------------------
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

    // NUEVO: si el servicio tiene costo, generar la factura de inmediato y su
    // paso "Pago pendiente" (num_paso=2), igual que en el flujo de reserva.
    // Si el servicio es gratuito (precio = 0, como el título de grado), no
    // tiene sentido generar una factura ni un paso de pago.
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
    // El trigger fn_solicitud_vinculacion_vigente puede rechazar esto si el
    // usuario no tiene vinculación vigente; ese mensaje llega tal cual aquí.
    console.error('Error al crear solicitud:', error);
    res.status(400).json({ error: error.message || 'No se pudo crear la solicitud.' });
  }
};