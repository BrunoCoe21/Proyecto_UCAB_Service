// ============================================================================
//  src/controllers/gestionSolicitudController.js  ·  UCAB-Services
// ----------------------------------------------------------------------------
//  Para DOCENTE y PERSONAL_ADMINISTRATIVO (son EMPLEADOS). Permite ver los
//  pasos de actividad pendientes/en proceso de una OFICINA y avanzarlos.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ----------------------------------------------------------------------------
//  Sincroniza solicitud.estado_general según el estado real de sus pasos.
// ----------------------------------------------------------------------------
async function sincronizarEstadoSolicitud(idSolicitud, transaction) {
  const pasos = await sequelize.query(
    `SELECT estado_paso FROM paso_actividad WHERE id_solicitud = :idSolicitud`,
    { replacements: { idSolicitud }, type: QueryTypes.SELECT, transaction }
  );
  if (pasos.length === 0) return;

  const todosCompletados = pasos.every(p => p.estado_paso === 'completado');
  const algunoEnProceso = pasos.some(p => p.estado_paso === 'en proceso');

  const nuevoEstado = todosCompletados ? 'cerrada' : (algunoEnProceso ? 'en proceso' : 'abierta');

  await sequelize.query(
    `UPDATE solicitud SET estado_general = :nuevoEstado WHERE id_solicitud = :idSolicitud`,
    { replacements: { nuevoEstado, idSolicitud }, type: QueryTypes.UPDATE, transaction }
  );
}
exports.sincronizarEstadoSolicitud = sincronizarEstadoSolicitud;

// ----------------------------------------------------------------------------
//  GET /api/gestion/oficinas
//  Lista las oficinas existentes.
// ----------------------------------------------------------------------------
exports.listarOficinas = async (req, res) => {
  try {
    const oficinas = await sequelize.query(
      `SELECT o.nombre_oficina, o.responsable_asignado,
              u.primer_nombre || ' ' || u.primer_apellido AS responsable_nombre
       FROM oficina_responsable o
       LEFT JOIN usuario u ON u.cedula_identidad = o.responsable_asignado
       ORDER BY o.nombre_oficina`,
      { type: QueryTypes.SELECT }
    );
    res.json(oficinas);
  } catch (error) {
    console.error('Error al listar oficinas:', error);
    res.status(500).json({ error: 'No se pudieron cargar las oficinas.' });
  }
};

// ----------------------------------------------------------------------------
//  GET /api/gestion/pasos/:nombreOficina
//  Pasos de actividad de una oficina.
//  🔥 MODIFICADO: el paso "Pago pendiente" SOLO aparece si el usuario ya pagó
// ----------------------------------------------------------------------------
exports.listarPasosPorOficina = async (req, res) => {
  try {
    const { nombreOficina } = req.params;

    const pasos = await sequelize.query(
      `SELECT p.id_solicitud, p.num_paso, p.nombre_paso, p.estado_paso,
              p.fecha_inicio, p.fecha_fin, p.paso_predecesor,
              s.estado_general AS estado_solicitud, s.codigo_servicio,
              u.primer_nombre, u.primer_apellido, u.cedula_identidad,
              se.descripcion_detallada AS servicio_nombre,
              EXISTS (
                SELECT 1 FROM paso_actividad ant
                WHERE ant.id_solicitud = p.id_solicitud
                  AND ant.num_paso < p.num_paso
                  AND ant.estado_paso <> 'completado'
              ) AS bloqueado_por_anterior,
              -- 🔥 NUEVO: verificar si existe un pago para esta solicitud
              EXISTS (
                SELECT 1 FROM pago pag
                JOIN factura f ON f.num_control = pag.num_control
                JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
                WHERE fc.id_solicitud = s.id_solicitud
                  AND pag.estatus IN ('pendiente', 'confirmado')
              ) AS tiene_pago
       FROM paso_actividad p
       JOIN solicitud s ON s.id_solicitud = p.id_solicitud
       JOIN usuario u   ON u.cedula_identidad = s.cedula_identidad
       LEFT JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE p.nombre_oficina = :nombreOficina
         AND p.estado_paso <> 'completado'
         -- 🔥 REGLA: el paso "Pago pendiente" SOLO se muestra si el usuario ya pagó
         AND (
           p.nombre_paso <> 'Pago pendiente'
           OR (
             p.nombre_paso = 'Pago pendiente'
             AND EXISTS (
               SELECT 1 FROM pago pag
               JOIN factura f ON f.num_control = pag.num_control
               JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
               WHERE fc.id_solicitud = s.id_solicitud
                 AND pag.estatus IN ('pendiente', 'confirmado')
             )
           )
         )
       ORDER BY p.fecha_inicio ASC`,
      { replacements: { nombreOficina }, type: QueryTypes.SELECT }
    );

    res.json(pasos);
  } catch (error) {
    console.error('Error al listar pasos por oficina:', error);
    res.status(500).json({ error: 'No se pudieron cargar los pasos.' });
  }
};

// ----------------------------------------------------------------------------
//  PUT /api/gestion/pasos/:idSolicitud/:numPaso
//  Cambia el estado de un paso ('en proceso' o 'completado').
//
//  🔥 NUEVO: VALIDAR QUE EL USUARIO HAYA PAGADO ANTES DE PERMITIR MODIFICAR
//  EL PASO "Pago pendiente".
// ----------------------------------------------------------------------------
exports.actualizarEstadoPaso = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { idSolicitud, numPaso } = req.params;
    const { estado_paso } = req.body;

    if (!['en proceso', 'completado'].includes(estado_paso)) {
      await t.rollback();
      return res.status(400).json({ error: 'Estado no válido. Use "en proceso" o "completado".' });
    }

    // 🔥 VALIDACIÓN 1: VERIFICAR QUE EL PASO EXISTA
    const pasoInfo = await sequelize.query(
      `SELECT nombre_paso FROM paso_actividad
       WHERE id_solicitud = :idSolicitud AND num_paso = :numPaso
       LIMIT 1`,
      { replacements: { idSolicitud, numPaso }, type: QueryTypes.SELECT, transaction: t }
    );

    if (pasoInfo.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Paso no encontrado.' });
    }

    // 🔥 VALIDACIÓN 2: Si el paso es "Pago pendiente", verificar que exista un pago
    if (pasoInfo[0].nombre_paso === 'Pago pendiente') {
      const pagoExistente = await sequelize.query(
        `SELECT COUNT(*) as total FROM pago p
         JOIN factura f ON f.num_control = p.num_control
         JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
         WHERE fc.id_solicitud = :idSolicitud
           AND p.estatus IN ('pendiente', 'confirmado')`,
        { replacements: { idSolicitud }, type: QueryTypes.SELECT, transaction: t }
      );

      const tienePago = Number(pagoExistente[0].total) > 0;

      if (!tienePago) {
        await t.rollback();
        return res.status(403).json({
          error: 'No se puede modificar el paso "Pago pendiente" porque el usuario aún no ha realizado el pago. Espera a que el usuario pague primero.'
        });
      }
    }

    // VALIDACIÓN 3: Bloquea si hay un paso anterior sin completar.
    const anteriorSinCompletar = await sequelize.query(
      `SELECT 1 FROM paso_actividad
       WHERE id_solicitud = :idSolicitud AND num_paso < :numPaso AND estado_paso <> 'completado'`,
      { replacements: { idSolicitud, numPaso }, type: QueryTypes.SELECT, transaction: t }
    );
    if (anteriorSinCompletar.length > 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Hay un paso anterior sin completar; no se puede avanzar este paso todavía.' });
    }

    // Si se marca 'en proceso' por primera vez, registrar fecha_inicio si no la tiene.
    await sequelize.query(
      `UPDATE paso_actividad
       SET estado_paso = :estado_paso,
           fecha_inicio = COALESCE(fecha_inicio, CASE WHEN :estado_paso = 'en proceso' THEN CURRENT_TIMESTAMP END)
       WHERE id_solicitud = :idSolicitud AND num_paso = :numPaso`,
      { replacements: { idSolicitud, numPaso, estado_paso }, type: QueryTypes.UPDATE, transaction: t }
    );

    // Mantiene solicitud.estado_general sincronizado con sus pasos.
    await sincronizarEstadoSolicitud(idSolicitud, t);

    await t.commit();
    res.json({ mensaje: `Paso actualizado a "${estado_paso}".` });

  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar paso:', error);
    res.status(400).json({ error: error.message || 'No se pudo actualizar el paso.' });
  }
};

// ----------------------------------------------------------------------------
//  GET /api/gestion/solicitud/:idSolicitud
//  Detalle completo de una solicitud con TODOS sus pasos.
// ----------------------------------------------------------------------------
exports.obtenerSolicitudCompleta = async (req, res) => {
  try {
    const { idSolicitud } = req.params;

    const solicitud = await sequelize.query(
      `SELECT s.id_solicitud, s.estado_general, s.fecha_creacion, s.codigo_servicio,
              u.primer_nombre, u.primer_apellido, u.cedula_identidad,
              se.descripcion_detallada AS servicio_nombre
       FROM solicitud s
       JOIN usuario u ON u.cedula_identidad = s.cedula_identidad
       LEFT JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE s.id_solicitud = :idSolicitud LIMIT 1`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );
    if (solicitud.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const pasos = await sequelize.query(
      `SELECT num_paso, nombre_paso, estado_paso, fecha_inicio, fecha_fin,
              nombre_oficina, paso_predecesor
       FROM paso_actividad
       WHERE id_solicitud = :idSolicitud
       ORDER BY num_paso`,
      { replacements: { idSolicitud }, type: QueryTypes.SELECT }
    );

    res.json({ solicitud: solicitud[0], pasos });

  } catch (error) {
    console.error('Error al obtener solicitud completa:', error);
    res.status(500).json({ error: 'No se pudo obtener la solicitud.' });
  }
};

// ----------------------------------------------------------------------------
//  PUT /api/gestion/oficinas/:nombreOficina/responsable
// ----------------------------------------------------------------------------
exports.asignarResponsable = async (req, res) => {
  try {
    const { nombreOficina } = req.params;
    const cedula = req.usuario.cedula;

    const empleado = await sequelize.query(
      `SELECT 1 FROM empleado WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (empleado.length === 0) return res.status(403).json({ error: 'Tu usuario no está registrado como empleado.' });

    const resultado = await sequelize.query(
      `UPDATE oficina_responsable SET responsable_asignado = :cedula
       WHERE nombre_oficina = :nombreOficina`,
      { replacements: { cedula, nombreOficina }, type: QueryTypes.UPDATE }
    );
    if (resultado[1] === 0) return res.status(404).json({ error: 'Oficina no encontrada.' });

    res.json({ mensaje: `Ahora eres el responsable asignado de "${nombreOficina}".` });
  } catch (error) {
    console.error('Error al asignar responsable:', error);
    res.status(500).json({ error: 'No se pudo asignar el responsable.' });
  }
};

// ----------------------------------------------------------------------------
//  GET /api/gestion/mis-oficinas
// ----------------------------------------------------------------------------
exports.misOficinas = async (req, res) => {
  try {
    const cedula = req.usuario.cedula;
    const oficinas = await sequelize.query(
      `SELECT o.nombre_oficina, o.responsable_asignado
       FROM oficina_responsable o
       WHERE o.responsable_asignado = :cedula
       ORDER BY o.nombre_oficina`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    res.json(oficinas);
  } catch (error) {
    console.error('Error al obtener mis oficinas:', error);
    res.status(500).json({ error: 'No se pudieron consultar tus oficinas.' });
  }
};