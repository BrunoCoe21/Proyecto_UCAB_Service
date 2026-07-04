// ============================================================================
//  src/controllers/gestionSolicitudController.js  ·  UCAB-Services
// ----------------------------------------------------------------------------
//  Para DOCENTE y PERSONAL_ADMINISTRATIVO (son EMPLEADOS). Permite ver los
//  pasos de actividad pendientes/en proceso de una OFICINA y avanzarlos.
//
//  DECISIÓN DE DISEÑO (importante): paso_actividad.responsable_asignado es un
//  campo de texto libre, sin clave foránea hacia ningún empleado — en los
//  datos reales del proyecto siempre queda NULL. Por eso NO se usa para
//  filtrar "mis tareas". En su lugar, se filtra por OFICINA (nombre_oficina),
//  que sí es una FK real hacia oficina_responsable. El empleado elige su
//  oficina y ve los pasos de esa oficina; cualquier empleado de la misma
//  oficina puede atender cualquier paso de ella.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ----------------------------------------------------------------------------
//  Sincroniza solicitud.estado_general según el estado real de sus pasos.
//  No existe ningún trigger en la base que haga esto solo, así que se llama
//  explícitamente cada vez que un paso cambia de estado (aquí y también
//  desde reservaController al completar el paso de reserva).
//  Regla acordada:
//    - Si TODOS los pasos están 'completado'      -> solicitud 'cerrada'
//    - Si AL MENOS UNO está 'en proceso'           -> solicitud 'en proceso'
//    - En cualquier otro caso (todos 'pendiente')  -> solicitud 'abierta'
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
exports.sincronizarEstadoSolicitud = sincronizarEstadoSolicitud;   // se reutiliza en reservaController

// ----------------------------------------------------------------------------
//  GET /api/gestion/oficinas
//  Lista las oficinas existentes, para que el empleado elija con cuál trabajar.
// ----------------------------------------------------------------------------
exports.listarOficinas = async (req, res) => {
  try {
    const oficinas = await sequelize.query(
      `SELECT nombre_oficina, responsable_asignado FROM oficina_responsable ORDER BY nombre_oficina`,
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
//  Pasos de actividad de una oficina, con datos de la solicitud y el
//  solicitante, para que el empleado tenga contexto completo.
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
              -- ¿hay un paso anterior sin completar? (mismo cálculo que el trigger)
              EXISTS (
                SELECT 1 FROM paso_actividad ant
                WHERE ant.id_solicitud = p.id_solicitud
                  AND ant.num_paso < p.num_paso
                  AND ant.estado_paso <> 'completado'
              ) AS bloqueado_por_anterior
       FROM paso_actividad p
       JOIN solicitud s ON s.id_solicitud = p.id_solicitud
       JOIN usuario u   ON u.cedula_identidad = s.cedula_identidad
       LEFT JOIN servicio se ON se.codigo_servicio = s.codigo_servicio
       WHERE p.nombre_oficina = :nombreOficina
         AND p.estado_paso <> 'completado'
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
//  CORRECCIÓN: el trigger de la base (fn_paso_actividad_control) solo
//  rechaza COMPLETAR un paso si hay uno anterior sin completar; no impedía
//  poner un paso en 'en proceso' aunque el anterior tampoco estuviera
//  completado, lo que permitía tener dos pasos consecutivos "en proceso" a
//  la vez (caso real visto en SOL-001). Esta validación se agrega aquí, del
//  lado del backend, antes de tocar la base.
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

    // Bloquea tanto "iniciar" como "completar" si hay un paso anterior sin completar.
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
    // El trigger de la base devuelve un mensaje claro si hay un paso anterior
    // sin completar; ese mensaje llega tal cual hasta el frontend.
    console.error('Error al actualizar paso:', error);
    res.status(400).json({ error: error.message || 'No se pudo actualizar el paso.' });
  }
};

// ----------------------------------------------------------------------------
//  GET /api/gestion/solicitud/:idSolicitud
//  Detalle completo de una solicitud con TODOS sus pasos (incluye los ya
//  completados), para ver el avance completo del trámite.
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