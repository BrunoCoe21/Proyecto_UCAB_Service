// ============================================================================
//  src/controllers/reservaController.js  ·  UCAB-Services  ·  RESERVA DE ESPACIO
// ----------------------------------------------------------------------------
//  Flujo de 2 pasos, según se acordó:
//    1) GET  /api/reservas/espacios/:nombreSede        -> lista de espacios de la sede
//    2) POST /api/reservas/verificar                   -> aforo/mantenimiento/disponibilidad
//    3) POST /api/reservas/:idSolicitud/confirmar       -> transacción completa
//
//  La transacción completa, en el orden que pide el documento de requisitos
//  (adaptado a las tablas REALES del ER: no existe ACOMPANANTE_RESERVA, se usa
//  la tabla real 'acompanante'):
//    RESERVA (INSERT) -> ACOMPANANTE (INSERT, si aplica) ->
//    PASO_ACTIVIDAD (UPDATE, marca el paso de reserva como completado) ->
//    FOLIO_CONSUMO (INSERT) -> LINEA_CARGO (INSERT)
//
//  No se hace UPDATE a espacio_fisico: el aforo y el mantenimiento son datos
//  fijos del espacio, no cambian por reservarlo. La disponibilidad se calcula
//  consultando las reservas existentes (fn_espacio_disponible), no se guarda
//  como una bandera en espacio_fisico.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sincronizarEstadoSolicitud } = require('./gestionSolicitudController');

// ----------------------------------------------------------------------------
//  Genera el folio + la línea de cargo + la FACTURA (de inmediato, según se
//  acordó) + un paso_actividad nuevo "Pago pendiente" en la oficina 'Caja'.
//  Reutilizada por confirmarReserva y crearSolicitudConReserva para no
//  duplicar esta lógica en los dos flujos.
//
//  Antes, sp_cierre_masivo_folios (procedimiento manual ya existente en el
//  script 03) era la única forma de convertir un folio en factura. Ahora,
//  para reservas individuales, la factura se genera en el momento — el
//  procedimiento manual queda disponible igual para procesos por lotes,
//  pero ya no es necesario para que el estudiante vea su factura.
// ----------------------------------------------------------------------------
async function generarFolioFacturaYPasoPago({ idSolicitud, codigoServicio, precio, concepto, siguienteNumPaso }, t) {
  const numeroFolio = `FOL-${idSolicitud.replace('SOL-', '')}-${Date.now().toString().slice(-4)}`;

  // FOLIO_CONSUMO — se deja 'cerrado' porque su factura se genera ya mismo
  // (no queda "abierto" esperando un cierre masivo posterior).
  await sequelize.query(
    `INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo)
     VALUES (:numeroFolio, :idSolicitud, 'cerrado', CURRENT_DATE, :saldo)`,
    { replacements: { numeroFolio, idSolicitud, saldo: precio }, type: QueryTypes.INSERT, transaction: t }
  );

  // LINEA_CARGO — la FK exige (codigo_servicio, fecha_vigencia_inicio) real.
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

  // FACTURA — generada de inmediato (cambio acordado), a nombre del usuario
  // solicitante (no corporativa). num_control sigue el mismo patrón que ya
  // usa el resto del proyecto: 'FAC-' + folio.
  const numControl = `FAC-${numeroFolio}`;
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

  // PASO_ACTIVIDAD nuevo: "Pago pendiente", asignado a la oficina 'Caja' para
  // que aparezca en "Pasos por Atender" del cajero/administrativo de Caja.
  // Queda 'pendiente' — se completará solo cuando la factura se pague (ver
  // pagoController, que ahora también llama a marcarPagoPendienteCompletado).
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

// ----------------------------------------------------------------------------
//  GET /api/reservas/espacios/:nombreSede
//  Lista simple de espacios de la sede del servicio (sin elegir edificio
//  aparte, como se acordó).
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  POST /api/reservas/verificar
//  Body: { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio,
//          hora_fin, cant_personas }
//  Revisa aforo, mantenimiento y disponibilidad ANTES de mostrar el resto del
//  formulario (acompañante + confirmar), tal como se acordó.
// ----------------------------------------------------------------------------
exports.verificarDisponibilidad = async (req, res) => {
  try {
    const { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas } = req.body;

    if (!nombre_sede || !nombre_edif || !num_identificador || !fecha || !hora_inicio || !hora_fin || !cant_personas) {
      return res.status(400).json({ error: 'Todos los campos de fecha, horario y cantidad de personas son obligatorios.' });
    }
    if (hora_fin <= hora_inicio) {
      return res.status(400).json({ error: 'La hora de fin debe ser posterior a la hora de inicio.' });
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

    // 1) ¿Está en mantenimiento?
    const enMantenimiento = (espacio.estado_mantenimiento || '').toLowerCase().includes('mantenimiento');
    if (enMantenimiento) {
      motivos.push(`El espacio está en mantenimiento (estado: "${espacio.estado_mantenimiento}").`);
    }

    // 2) ¿Supera el aforo?
    if (espacio.cap_maxima_aforo !== null && Number(cant_personas) > espacio.cap_maxima_aforo) {
      motivos.push(`La cantidad solicitada (${cant_personas}) supera el aforo máximo del espacio (${espacio.cap_maxima_aforo}).`);
    }

    // 3) ¿Está disponible en ese horario? (usa la función ya existente en la base)
    const disponibilidad = await sequelize.query(
      `SELECT fn_espacio_disponible(:nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin) AS disponible`,
      { replacements: { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin }, type: QueryTypes.SELECT }
    );
    if (!disponibilidad[0].disponible) {
      motivos.push('El espacio ya tiene una reserva activa que se solapa con ese horario.');
    }

    // Recursos tecnológicos del espacio (para mostrar siempre, OK o no)
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

// ----------------------------------------------------------------------------
//  POST /api/reservas/:idSolicitud/confirmar
//  Body: { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio,
//          hora_fin, cant_personas, acompanante: { documento, nombre } | null }
//  Transacción completa. Si algo falla (incluyendo los triggers de aforo y la
//  restricción de exclusión de solapamiento que YA existen en la base), todo
//  se revierte y no queda nada a medias.
// ----------------------------------------------------------------------------
exports.confirmarReserva = async (req, res) => {
  const { idSolicitud } = req.params;
  const { nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas, acompanantes } = req.body;

  if (!nombre_sede || !nombre_edif || !num_identificador || !fecha || !hora_inicio || !hora_fin || !cant_personas) {
    return res.status(400).json({ error: 'Faltan datos obligatorios de la reserva.' });
  }

  const t = await sequelize.transaction();
  try {
    // Traer la solicitud y su servicio (para el precio y la oficina del paso)
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

    // 1) RESERVA — el trigger de aforo y la restricción de exclusión de
    //    solapamiento (ya existentes en la base) protegen esta inserción
    //    aunque el frontend ya haya verificado antes; es la garantía final.
    await sequelize.query(
      `INSERT INTO reserva
         (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas)
       VALUES (:idSolicitud, :nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin, 'activa', :cant_personas)`,
      { replacements: { idSolicitud, nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas },
        type: QueryTypes.INSERT, transaction: t }
    );

    // 2) ACOMPAÑANTES — lista de 0 a N (entidad fuerte, PK propia por persona).
    //    Sin límite duro en la base de datos; la interfaz controla la
    //    usabilidad con scroll, no un tope artificial aquí.
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

    // 3) PASO_ACTIVIDAD — completa el paso "Reserva de espacio" (num_paso=1,
    //    siempre existe porque crearSolicitud ya lo genera al crear la
    //    solicitud). El trigger fn_paso_actividad_control graba fecha_fin
    //    automáticamente al marcarlo completado.
    await sequelize.query(
      `UPDATE paso_actividad
       SET estado_paso = 'completado'
       WHERE id_solicitud = :idSolicitud AND num_paso = 1 AND estado_paso <> 'completado'`,
      { replacements: { idSolicitud }, type: QueryTypes.UPDATE, transaction: t }
    );

    // Mantiene solicitud.estado_general sincronizado con sus pasos.
    await sincronizarEstadoSolicitud(idSolicitud, t);

    // 4) FOLIO + LINEA_CARGO + FACTURA (inmediata) + paso "Pago pendiente"
    const { numeroFolio } = await generarFolioFacturaYPasoPago({
      idSolicitud, codigoServicio: codigo_servicio, precio,
      concepto: `Reserva de espacio - ${num_identificador}`,
      siguienteNumPaso: 2
    }, t);

    await t.commit();
    res.status(201).json({ mensaje: 'Reserva confirmada correctamente.', numero_folio: numeroFolio });

  } catch (error) {
    await t.rollback();
    // Aquí llegan tal cual los mensajes de los triggers/restricciones de la
    // base (aforo excedido, solapamiento de horario, etc.) si algo se les
    // escapó a las validaciones previas del paso de "verificar".
    console.error('Error al confirmar reserva:', error);
    res.status(400).json({ error: error.message || 'No se pudo confirmar la reserva.' });
  }
};

// ----------------------------------------------------------------------------
//  POST /api/reservas/crear-con-solicitud
//  NUEVO (cambio de flujo acordado): crea la SOLICITUD y la RESERVA juntas en
//  una sola transacción, para el caso en que el modal de reserva se abre
//  desde SERVICIOS (antes de que exista ninguna solicitud), no desde Mis
//  Solicitudes. Reutiliza toda la misma lógica de validación y de inserción
//  de confirmarReserva, solo que primero crea la fila de 'solicitud' y su
//  primer paso_actividad.
//  Body: { cedula_identidad, codigo_servicio, nombre_sede, nombre_edif,
//          num_identificador, fecha, hora_inicio, hora_fin, cant_personas,
//          acompanantes: [{documento, nombre}, ...] }
// ----------------------------------------------------------------------------
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

    // ID de solicitud generado igual que ya lo hacía servicio.js
    const idSolicitud = `SOL-${Date.now().toString().slice(-6)}`;

    // 1) SOLICITUD — el trigger fn_solicitud_vinculacion_vigente puede
    //    rechazar esto si el usuario no tiene vinculación vigente.
    await sequelize.query(
      `INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion)
       VALUES (:idSolicitud, :cedula_identidad, :codigo_servicio, 'abierta', CURRENT_TIMESTAMP)`,
      { replacements: { idSolicitud, cedula_identidad, codigo_servicio }, type: QueryTypes.INSERT, transaction: t }
    );

    // 2) PASO_ACTIVIDAD (num_paso=1) — oficina según la categoría acordada.
    const oficina = OFICINA_POR_CATEGORIA[tipo_categoria] || null;
    await sequelize.query(
      `INSERT INTO paso_actividad (id_solicitud, num_paso, nombre_paso, estado_paso, nombre_oficina)
       VALUES (:idSolicitud, 1, 'Reserva de espacio', 'pendiente', :oficina)`,
      { replacements: { idSolicitud, oficina }, type: QueryTypes.INSERT, transaction: t }
    );

    // 3) RESERVA
    await sequelize.query(
      `INSERT INTO reserva
         (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas)
       VALUES (:idSolicitud, :nombre_sede, :nombre_edif, :num_identificador, :fecha, :hora_inicio, :hora_fin, 'activa', :cant_personas)`,
      { replacements: { idSolicitud, nombre_sede, nombre_edif, num_identificador, fecha, hora_inicio, hora_fin, cant_personas },
        type: QueryTypes.INSERT, transaction: t }
    );

    // 4) ACOMPAÑANTES (0 a N)
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

    // 5) Completa el paso 1 (recién creado, así que siempre puede completarse)
    await sequelize.query(
      `UPDATE paso_actividad SET estado_paso = 'completado' WHERE id_solicitud = :idSolicitud AND num_paso = 1`,
      { replacements: { idSolicitud }, type: QueryTypes.UPDATE, transaction: t }
    );

    // 6) FOLIO + LINEA_CARGO + FACTURA (inmediata) + paso "Pago pendiente" (num_paso=2)
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