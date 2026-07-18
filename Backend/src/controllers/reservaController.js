const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sincronizarEstadoSolicitud } = require('./gestionSolicitudController');

async function generarFolioFacturaYPasoPago({ idSolicitud, codigoServicio, precio, concepto, siguienteNumPaso }, t) {
  const sufijoFolio   = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const numeroFolio   = `FOL-${sufijoFolio}`;

  await sequelize.query(
    `INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo)
     VALUES (:numeroFolio, :idSolicitud, 'cerrado', CURRENT_DATE, :saldo)`,
    { replacements: { numeroFolio, idSolicitud, saldo: precio }, type: QueryTypes.INSERT, transaction: t }
  );

  const tarifas = await sequelize.query(
    `SELECT fecha_vigencia_inicio FROM historial_tarifas
     WHERE codigo_servicio = :codigoServicio
       AND fecha_vigencia_inicio <= CURRENT_DATE
       AND (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin >= CURRENT_DATE)
     ORDER BY fecha_vigencia_inicio DESC LIMIT 1`,
    { replacements: { codigoServicio }, type: QueryTypes.SELECT, transaction: t }
  );
  if (tarifas.length === 0) {
    throw new Error(`El servicio ${codigoServicio} no tiene una tarifa vigente registrada.`);
  }
  await sequelize.query(
    `INSERT INTO linea_cargo (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley)
     VALUES (:numeroFolio, 1, :codigoServicio, :fechaVigencia, :concepto, 1, :precio, 0)`,
    { replacements: { numeroFolio, codigoServicio, fechaVigencia: tarifas[0].fecha_vigencia_inicio, concepto, precio },
      type: QueryTypes.INSERT, transaction: t }
  );

  const sufijoControl = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const numControl    = `FAC-${sufijoControl}`;
  const cedula = await sequelize.query(
    `SELECT cedula_identidad FROM solicitud WHERE id_solicitud = :idSolicitud LIMIT 1`,
    { replacements: { idSolicitud }, type: QueryTypes.SELECT, transaction: t }
  );
  await sequelize.query(
    `INSERT INTO factura (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad)
     VALUES (:numControl, :numeroFolio, CURRENT_DATE, 'pendiente', :saldo, :cedula, NULL)`,
    { replacements: { numControl, numeroFolio, saldo: precio, cedula: cedula[0].cedula_identidad },
      type: QueryTypes.INSERT, transaction: t }
  );

  await sequelize.query(
    `INSERT INTO paso_actividad (id_solicitud, num_paso, nombre_paso, estado_paso, nombre_oficina, paso_predecesor)
     VALUES (:idSolicitud, :numPaso, 'Pago pendiente', 'pendiente', 'Caja', :pasoPredecesor)`,
    { replacements: { idSolicitud, numPaso: siguienteNumPaso, pasoPredecesor: siguienteNumPaso - 1 },
      type: QueryTypes.INSERT, transaction: t }
  );

  await sincronizarEstadoSolicitud(idSolicitud, t);

  return { numeroFolio, numControl };
}
exports.generarFolioFacturaYPasoPago = generarFolioFacturaYPasoPago;

exports.listarEspaciosPorSede = async (req, res) => {
  try {
    const { nombreSede } = req.params;
    const espacios = await sequelize.query(
      `SELECT nombre_sede, nombre_edif, num_identificador, cap_maxima_aforo,
              tipo_mobiliario, tipo_espacio_fisico, estado_mantenimiento
       FROM espacio_fisico
       WHERE nombre_sede = :nombreSede
       ORDER BY num_identificador`,
      { replacements: { nombreSede }, type: QueryTypes.SELECT }
    );
    res.json(espacios);
  } catch (error) {
    console.error('Error al listar espacios:', error);
    res.status(500).json({ error: 'No se pudieron cargar los espacios.' });
  }
};

exports.verificarDisponibilidad = async (req, res) => {
  try {
    const { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas } = req.body;

    if (!nombre_sede || !nombre_edif || !num_identificador || !fecha || !hora_inicio || !hora_fin || !cant_personas) {
      return res.status(400).json({ error: 'Todos los campos de fecha, horario y cantidad de personas son obligatorios.' });
    }
    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio.' });
    }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(fecha + 'T00:00:00') < hoy) {
      return res.status(400).json({ error: 'No es posible reservar en una fecha anterior al día de hoy.' });
    }

    const espacios = await sequelize.query(
      `SELECT cap_maxima_aforo, tipo_mobiliario, tipo_espacio_fisico, estado_mantenimiento
       FROM espacio_fisico
       WHERE nombre_sede = :nombre_sede AND nombre_edif = :nombre_edif AND num_identificador = :num_identificador
       LIMIT 1`,
      { replacements: { nombre_sede, nombre_edif, num_identificador }, type: QueryTypes.SELECT }
    );
    if (espacios.length === 0) {
      return res.status(404).json({ error: 'Espacio no encontrado.' });
    }
    const espacio = espacios[0];

    const motivos = [];

    const enMantenimiento = (espacio.estado_mantenimiento || '').toLowerCase().includes('mantenimiento');
    if (enMantenimiento) {
      motivos.push(`El espacio está en mantenimiento (estado: "${espacio.estado_mantenimiento}").`);
    }

    if (espacio.cap_maxima_aforo !== null && Number(cant_personas) > espacio.cap_maxima_aforo) {
      motivos.push(`La cantidad solicitada (${cant_personas}) supera el aforo máximo del espacio (${espacio.cap_maxima_aforo}).`);
    }

    const disponibilidad = await sequelize.query(
      `SELECT fn_espacio_disponible(:nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin) AS disponible`,
      { replacements: { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin }, type: QueryTypes.SELECT }
    );
    if (!disponibilidad[0].disponible) {
      motivos.push('El espacio ya tiene una reserva activa que se solapa con ese horario.');
    }

    const recursos = await sequelize.query(
      `SELECT recurso_tecnologico FROM espacio_fisico_recurso
       WHERE nombre_sede = :nombre_sede AND nombre_edif = :nombre_edif AND num_identificador = :num_identificador`,
      { replacements: { nombre_sede, nombre_edif, num_identificador }, type: QueryTypes.SELECT }
    );

    res.json({
      disponible: motivos.length === 0,
      motivos,
      espacio: {
        cap_maxima_aforo: espacio.cap_maxima_aforo,
        tipo_mobiliario: espacio.tipo_mobiliario,
        tipo_espacio_fisico: espacio.tipo_espacio_fisico,
        estado_mantenimiento: espacio.estado_mantenimiento,
        recursos: recursos.map(r => r.recurso_tecnologico)
      }
    });

  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: 'No se pudo verificar la disponibilidad.' });
  }
};

exports.confirmarReserva = async (req, res) => {
  const { idSolicitud } = req.params;
  const { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas, acompanantes } = req.body;

  if (!nombre_sede || !nombre_edif || !num_identificador || !fecha || !hora_inicio || !hora_fin || !cant_personas) {
    return res.status(400).json({ error: 'Faltan datos obligatorios de la reserva.' });
  }
  {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(fecha + 'T00:00:00') < hoy) {
      return res.status(400).json({ error: 'No es posible reservar en una fecha anterior al día de hoy.' });
    }
  }

  const t = await sequelize.transaction();
  try {
    const solicitudes = await sequelize.query(
      `SELECT s.codigo_servicio, se.precio, se.tipo_categoria
       FROM solicitud s
       JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE s.id_solicitud = :idSolicitud LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT, transaction: t }
    );
    if (solicitudes.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    const { codigo_servicio, precio } = solicitudes[0];

    await sequelize.query(
      `INSERT INTO reserva
         (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas)
       VALUES (:idSolicitud, :nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin, 'activa', :cant_personas)`,
      { replacements: { idSolicitud, nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas },
        type: QueryTypes.INSERT, transaction: t }
    );

    if (Array.isArray(acompanantes)) {
      for (const a of acompanantes) {
        if (a.documento && a.nombre) {
          await sequelize.query(
            `INSERT INTO acompanante (documento_identidad, id_solicitud, nombre)
             VALUES (:documento, :idSolicitud, :nombre)`,
            { replacements: { documento: a.documento, idSolicitud, nombre: a.nombre },
              type: QueryTypes.INSERT, transaction: t }
          );
        }
      }
    }

    await sequelize.query(
      `UPDATE paso_actividad
       SET estado_paso = 'completado'
       WHERE id_solicitud = :idSolicitud AND num_paso = 1 AND estado_paso <> 'completado'`,
      { replacements: { idSolicitud }, type: QueryTypes.UPDATE, transaction: t }
    );

    await sincronizarEstadoSolicitud(idSolicitud, t);

    const { numeroFolio } = await generarFolioFacturaYPasoPago({
      idSolicitud, codigoServicio: codigo_servicio, precio,
      concepto: `Reserva de espacio - ${num_identificador}`,
      siguienteNumPaso: 2
    }, t);

    await t.commit();
    res.status(201).json({ mensaje: 'Reserva confirmada correctamente.', numero_folio: numeroFolio });

  } catch (error) {
    await t.rollback();
    console.error('Error al confirmar reserva:', error);
    res.status(400).json({ error: error.message || 'No se pudo confirmar la reserva.' });
  }
};

const OFICINA_POR_CATEGORIA = {
  'Cultura':            'Direccion de Cultura',
  'Deporte':            'Direccion de Cultura',
  'Educacion Continua': 'Secretaria Academica',
  'Salud':              'Rectorado',
};

exports.crearSolicitudConReserva = async (req, res) => {
  const {
    cedula_identidad, codigo_servicio, nombre_sede, nombre_edif, num_identificador,
    fecha, hora_inicio, hora_fin, cant_personas, acompanantes
  } = req.body;

  if (!cedula_identidad || !codigo_servicio || !nombre_sede || !nombre_edif ||
      !num_identificador || !fecha || !hora_inicio || !hora_fin || !cant_personas) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para crear la solicitud con reserva.' });
  }
  {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(fecha + 'T00:00:00') < hoy) {
      return res.status(400).json({ error: 'No es posible reservar en una fecha anterior al día de hoy.' });
    }
  }

  const t = await sequelize.transaction();
  try {
    const servicios = await sequelize.query(
      `SELECT precio, tipo_categoria FROM servicio WHERE codigo_servicio = :codigo_servicio LIMIT 1`,
      { replacements: { codigo_servicio }, type: QueryTypes.SELECT, transaction: t }
    );
    if (servicios.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Servicio no encontrado.' });
    }
    const { precio, tipo_categoria } = servicios[0];

    const idSolicitud = `SOL-${Date.now().toString().slice(-6)}`;

    await sequelize.query(
      `INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion)
       VALUES (:idSolicitud, :cedula_identidad, :codigo_servicio, 'abierta', CURRENT_TIMESTAMP)`,
      { replacements: { idSolicitud, cedula_identidad, codigo_servicio }, type: QueryTypes.INSERT, transaction: t }
    );

    const oficina = OFICINA_POR_CATEGORIA[tipo_categoria] || null;
    await sequelize.query(
      `INSERT INTO paso_actividad (id_solicitud, num_paso, nombre_paso, estado_paso, nombre_oficina)
       VALUES (:idSolicitud, 1, 'Reserva de espacio', 'pendiente', :oficina)`,
      { replacements: { idSolicitud, oficina }, type: QueryTypes.INSERT, transaction: t }
    );

    await sequelize.query(
      `INSERT INTO reserva
         (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas)
       VALUES (:idSolicitud, :nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin, 'activa', :cant_personas)`,
      { replacements: { idSolicitud, nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas },
        type: QueryTypes.INSERT, transaction: t }
    );

    if (Array.isArray(acompanantes)) {
      for (const a of acompanantes) {
        if (a.documento && a.nombre) {
          await sequelize.query(
            `INSERT INTO acompanante (documento_identidad, id_solicitud, nombre)
             VALUES (:documento, :idSolicitud, :nombre)`,
            { replacements: { documento: a.documento, idSolicitud, nombre: a.nombre },
              type: QueryTypes.INSERT, transaction: t }
          );
        }
      }
    }

    await sequelize.query(
      `UPDATE paso_actividad SET estado_paso = 'completado' WHERE id_solicitud = :idSolicitud AND num_paso = 1`,
      { replacements: { idSolicitud }, type: QueryTypes.UPDATE, transaction: t }
    );

    const { numeroFolio } = await generarFolioFacturaYPasoPago({
      idSolicitud, codigoServicio: codigo_servicio, precio,
      concepto: `Reserva de espacio - ${num_identificador}`,
      siguienteNumPaso: 2
    }, t);

    await t.commit();
    res.status(201).json({ mensaje: 'Solicitud y reserva creadas correctamente.', id_solicitud: idSolicitud, numero_folio: numeroFolio });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear solicitud con reserva:', error);
    res.status(400).json({ error: error.message || 'No se pudo crear la solicitud con la reserva.' });
  }
};