

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sincronizarEstadoSolicitud } = require('./gestionSolicitudController');

const METODOS_VIRTUALES   = ['zelle', 'criptomoneda'];
const METODOS_PRESENCIALES = ['tarjeta', 'pago_movil', 'efectivo', 'tai'];

async function tienePasosPreviosPendientes(idSolicitud, transaction) {
  const pasoPago = await sequelize.query(
    `SELECT num_paso FROM paso_actividad
     WHERE id_solicitud = :idSolicitud
       AND nombre_paso = 'Pago pendiente'
     LIMIT 1`,
    { replacements: { idSolicitud }, type: QueryTypes.SELECT, transaction }
  );

  if (pasoPago.length === 0) return false;

  const numPasoPago = pasoPago[0].num_paso;

  const pendientes = await sequelize.query(
    `SELECT num_paso FROM paso_actividad
     WHERE id_solicitud = :idSolicitud
       AND num_paso < :numPasoPago
       AND estado_paso <> 'completado'`,
    { replacements: { idSolicitud, numPasoPago }, type: QueryTypes.SELECT, transaction }
  );

  return pendientes.length > 0;
}

exports.obtenerFacturasEstudiante = async (req, res) => {
  try {
    const { cedula } = req.params;

    const facturas = await sequelize.query(
      `SELECT f.num_control,
              f.numero_folio,
              f.fecha_emision,
              f.estatus,
              f.saldo,
              fo.id_solicitud,
              s.codigo_servicio,
              se.descripcion_detallada AS concepto,
              EXISTS (
                SELECT 1 FROM pago p
                WHERE p.num_control = f.num_control
                  AND p.estatus = 'pendiente'
              ) AS tiene_pago_pendiente
       FROM factura f
       LEFT JOIN folio_consumo fo ON fo.numero_folio = f.numero_folio
       LEFT JOIN solicitud s      ON s.id_solicitud = fo.id_solicitud
       LEFT JOIN servicio se      ON se.codigo_servicio = s.codigo_servicio
       WHERE f.cedula_identidad = :cedula
       ORDER BY f.fecha_emision DESC`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );

    res.json(facturas);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'No se pudo obtener el estado de cuenta.' });
  }
};

exports.obtenerDetalleFactura = async (req, res) => {
  try {
    const { numControl } = req.params;

    const cabecera = await sequelize.query(
      `SELECT f.num_control, f.numero_folio, f.fecha_emision, f.estatus, f.saldo,
              EXISTS (
                SELECT 1 FROM pago p
                WHERE p.num_control = f.num_control
                  AND p.estatus = 'pendiente'
              ) AS tiene_pago_pendiente
       FROM factura f
       WHERE f.num_control = :numControl
       LIMIT 1`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    if (cabecera.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    const cargos = await sequelize.query(
      `SELECT lc.numero_item, lc.concepto, lc.cantidad,
              lc.precio_unitario, lc.impuesto_ley
       FROM linea_cargo lc
       JOIN factura f ON f.numero_folio = lc.numero_folio
       WHERE f.num_control = :numControl
       ORDER BY lc.numero_item`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    const abonos = await sequelize.query(
      `SELECT fecha_movimiento, monto, tasa_bcv
       FROM pago
       WHERE num_control = :numControl
       ORDER BY fecha_movimiento`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    res.json({ factura: cabecera[0], cargos, abonos });
  } catch (error) {
    console.error('Error al obtener detalle de factura:', error);
    res.status(500).json({ error: 'No se pudo obtener el detalle de la factura.' });
  }
};

// ============================================================================
//  POST /api/facturas/:numControl/pagar - VERSIÓN CORREGIDA
// ============================================================================
exports.registrarPago = async (req, res) => {
  const { numControl } = req.params;
  const { metodo, monto, tasa_bcv, datos = {} } = req.body;

  if (!metodo || !monto) {
    return res.status(400).json({ error: 'Metodo y monto son obligatorios.' });
  }
  const esVirtual    = METODOS_VIRTUALES.includes(metodo);
  const esPresencial = METODOS_PRESENCIALES.includes(metodo);
  if (!esVirtual && !esPresencial) {
    return res.status(400).json({ error: `Metodo de pago no valido: ${metodo}.` });
  }
  if (Number(monto) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor que cero.' });
  }

  const fecha = new Date();
  const t = await sequelize.transaction();

  try {
    const fac = await sequelize.query(
      `SELECT f.saldo, f.estatus, f.numero_folio, fc.id_solicitud
       FROM factura f
       JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
       WHERE f.num_control = :numControl
       FOR UPDATE`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );

    if (fac.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    if (fac[0].estatus === 'pagada') {
      await t.rollback();
      return res.status(400).json({ error: 'Esta factura ya esta pagada.' });
    }

    const idSolicitud = fac[0].id_solicitud;

    const hayPasosPreviosPendientes = await tienePasosPreviosPendientes(idSolicitud, t);
    if (hayPasosPreviosPendientes) {
      await t.rollback();
      return res.status(400).json({
        error: 'No se puede realizar el pago porque hay pasos previos sin completar. Completa los pasos pendientes primero.'
      });
    }

    //  VALIDACION: Verificar si ya existe un pago PENDIENTE
    const pagosPendientes = await sequelize.query(
      `SELECT COUNT(*) as total FROM pago
       WHERE num_control = :numControl
         AND estatus = 'pendiente'`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );

    if (Number(pagosPendientes[0].total) > 0) {
      await t.rollback();
      return res.status(400).json({
        error: 'Ya existe un pago pendiente para esta factura. Espera a que el personal de Caja lo verifique antes de intentar pagar nuevamente.'
      });
    }

    // 1) Insertar PAGO
    await sequelize.query(
      `INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto, estatus)
       VALUES (:numControl, :fecha, :tasa, :monto, :estatus)`,
      {
        replacements: {
          numControl,
          fecha,
          tasa: tasa_bcv || null,
          monto,
          estatus: esVirtual ? 'confirmado' : 'pendiente'
        },
        type: QueryTypes.INSERT,
        transaction: t
      }
    );

  
    if (esVirtual) {
      await sequelize.query(
        `INSERT INTO pago_virtual (num_control, fecha_movimiento) VALUES (:numControl, :fecha)`,
        { replacements: { numControl, fecha }, type: QueryTypes.INSERT, transaction: t }
      );
    } else {
      await sequelize.query(
        `INSERT INTO pago_presencial (num_control, fecha_movimiento) VALUES (:numControl, :fecha)`,
        { replacements: { numControl, fecha }, type: QueryTypes.INSERT, transaction: t }
      );
    }

    
    await insertarMetodoConcreto(metodo, numControl, fecha, datos, t);

    const facturaActualizada = await sequelize.query(
      `SELECT estatus, numero_folio FROM factura WHERE num_control = :numControl LIMIT 1`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );

    const folioLink = await sequelize.query(
      `SELECT id_solicitud FROM folio_consumo
       WHERE numero_folio = :numeroFolio LIMIT 1`,
      {
        replacements: { numeroFolio: facturaActualizada[0].numero_folio },
        type: QueryTypes.SELECT,
        transaction: t
      }
    );
    const idSolicitud2 = folioLink.length > 0 ? folioLink[0].id_solicitud : null;

    if (esVirtual) {
      if (facturaActualizada[0].estatus === 'pagada' && idSolicitud2) {
        await sequelize.query(
          `UPDATE paso_actividad
           SET estado_paso = 'completado'
           WHERE id_solicitud = :idSolicitud
             AND nombre_paso = 'Pago pendiente'
             AND estado_paso <> 'completado'`,
          { replacements: { idSolicitud: idSolicitud2 }, type: QueryTypes.UPDATE, transaction: t }
        );
        await sincronizarEstadoSolicitud(idSolicitud2, t);
      }
    }
  
    await t.commit();

    const actualizada = await sequelize.query(
      `SELECT num_control, saldo, estatus FROM factura WHERE num_control = :numControl`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    const mensaje = esVirtual
      ? 'Pago registrado correctamente.'
      : 'Pago registrado correctamente. El personal de Caja verificara tu pago en breve.';

    res.json({ mensaje, factura: actualizada[0] });

  } catch (error) {
    await t.rollback();
    console.error('Error al registrar pago:', error);
    res.status(400).json({ error: error.message || 'No se pudo registrar el pago.' });
  }
};

async function insertarMetodoConcreto(metodo, numControl, fecha, d, t) {
  const base = { numControl, fecha };

  switch (metodo) {
    case 'zelle':
      return sequelize.query(
        `INSERT INTO zelle (num_control, fecha_movimiento, correo_electronico, nombre, cod_confirmacion)
         VALUES (:numControl, :fecha, :correo, :nombre, :confirmacion)`,
        {
          replacements: {
            ...base,
            correo: d.correoOrigen || null,
            nombre: d.titular || null,
            confirmacion: d.confirmacion || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    case 'criptomoneda':
      return sequelize.query(
        `INSERT INTO criptomoneda (num_control, fecha_movimiento, cod_hash, red_utilizada, dir_billetera_origen, tasa_conversion)
         VALUES (:numControl, :fecha, :hash, :red, :billetera, :tasaConv)`,
        {
          replacements: {
            ...base,
            hash: d.txid || null,
            red: d.red || null,
            billetera: d.billeteraOrigen || null,
            tasaConv: d.tasaConversion || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    case 'tarjeta':
      return sequelize.query(
        `INSERT INTO tarjeta (num_control, fecha_movimiento, num_tarjeta, fecha_vencimiento, compania_emisora, tipo_red)
         VALUES (:numControl, :fecha, :numTarjeta, :venc, :compania, :tipoRed)`,
        {
          replacements: {
            ...base,
            numTarjeta: d.numero || null,
            venc: d.expiry || null,
            compania: d.franquicia || null,
            tipoRed: d.tipoRed || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    case 'pago_movil':
      return sequelize.query(
        `INSERT INTO pago_movil (num_control, fecha_movimiento, num_telefono, banco_origen, num_referencia)
         VALUES (:numControl, :fecha, :telefono, :banco, :referencia)`,
        {
          replacements: {
            ...base,
            telefono: d.telefono || null,
            banco: d.banco || null,
            referencia: d.referencia || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    case 'efectivo':
      return sequelize.query(
        `INSERT INTO efectivo (num_control, fecha_movimiento, moneda_curso, monto_exacto, desglose_denominacion)
         VALUES (:numControl, :fecha, :moneda, :montoExacto, :desglose)`,
        {
          replacements: {
            ...base,
            moneda: d.moneda || null,
            montoExacto: d.monto || null,
            desglose: d.desglose || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    case 'tai':
      return sequelize.query(
        `INSERT INTO tai (num_control, fecha_movimiento, uid, cod_pos, saldo)
         VALUES (:numControl, :fecha, :uid, :pos, :saldo)`,
        {
          replacements: {
            ...base,
            uid: d.uid || null,
            pos: d.codigoTerminal || null,
            saldo: d.saldo || null
          },
          type: QueryTypes.INSERT,
          transaction: t
        }
      );

    default:
      throw new Error(`Metodo no soportado: ${metodo}`);
  }
}

exports.obtenerBilleteraTai = async (req, res) => {
  try {
    const { cedula } = req.params;
    const billetera = await sequelize.query(
      `SELECT uid_billetera, saldo FROM posee WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (billetera.length === 0) {
      return res.status(404).json({ error: 'El miembro no posee una billetera TAI registrada.' });
    }
    res.json(billetera[0]);
  } catch (error) {
    console.error('Error al obtener billetera TAI:', error);
    res.status(500).json({ error: 'No se pudo consultar la billetera.' });
  }
};

exports.listarPagosPendientes = async (req, res) => {
  try {
    const pendientes = await sequelize.query(
      `SELECT p.num_control, p.fecha_movimiento, p.monto, p.estatus,
              f.numero_folio, f.cedula_identidad,
              u.primer_nombre || ' ' || u.primer_apellido AS pagador,
              CASE
                WHEN t.num_control  IS NOT NULL THEN 'tarjeta'
                WHEN pm.num_control IS NOT NULL THEN 'pago_movil'
                WHEN e.num_control  IS NOT NULL THEN 'efectivo'
                ELSE 'otro'
              END AS metodo,
              t.num_tarjeta, t.compania_emisora, t.tipo_red,
              e.desglose_denominacion,
              pm.num_referencia, pm.banco_origen AS banco_pm
         FROM pago p
         JOIN factura f ON f.num_control = p.num_control
         LEFT JOIN usuario  u ON u.cedula_identidad = f.cedula_identidad
         LEFT JOIN tarjeta  t ON t.num_control = p.num_control AND t.fecha_movimiento = p.fecha_movimiento
         LEFT JOIN efectivo e ON e.num_control = p.num_control AND e.fecha_movimiento = p.fecha_movimiento
         LEFT JOIN pago_movil pm ON pm.num_control = p.num_control AND pm.fecha_movimiento = p.fecha_movimiento
        WHERE p.estatus = 'pendiente'
        ORDER BY p.fecha_movimiento DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(pendientes);
  } catch (error) {
    console.error('Error al listar pagos pendientes:', error);
    res.status(500).json({ error: 'No se pudieron obtener los pagos pendientes.' });
  }
};

// ============================================================================
//  PUT /api/facturas/pagos/:numControl/:fecha/confirmar
// ============================================================================
exports.confirmarPago = async (req, res) => {
  const { numControl, fecha } = req.params;
  const { decision } = req.body;
  const cedulaVerificador = req.usuario && req.usuario.cedula;

  if (!['confirmar', 'rechazar'].includes(decision)) {
    return res.status(400).json({ error: 'Decision invalida. Debe ser confirmar o rechazar.' });
  }

  const t = await sequelize.transaction();
  try {
    const nuevoEstatus = decision === 'confirmar' ? 'confirmado' : 'rechazado';
    const upd = await sequelize.query(
      `UPDATE pago SET estatus = :estatus, fecha_confirmacion = NOW(), cedula_verificador = :cv
        WHERE num_control = :numControl AND fecha_movimiento = :fecha AND estatus = 'pendiente'`,
      {
        replacements: { estatus: nuevoEstatus, cv: cedulaVerificador, numControl, fecha },
        type: QueryTypes.UPDATE,
        transaction: t
      }
    );

    if (upd[1] === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Pago no encontrado o ya procesado.' });
    }

    await sequelize.query(
      `UPDATE factura f
          SET saldo   = GREATEST(fc.saldo -
                        COALESCE((SELECT SUM(monto) FROM pago
                                   WHERE num_control = f.num_control AND estatus='confirmado'), 0), 0),
              estatus = CASE
                WHEN COALESCE((SELECT SUM(monto) FROM pago
                               WHERE num_control = f.num_control AND estatus='confirmado'), 0) >= fc.saldo THEN 'pagada'
                WHEN COALESCE((SELECT SUM(monto) FROM pago
                               WHERE num_control = f.num_control AND estatus='confirmado'), 0) > 0        THEN 'parcial'
                ELSE 'pendiente'
              END
         FROM folio_consumo fc
        WHERE fc.numero_folio = f.numero_folio AND f.num_control = :numControl`,
      { replacements: { numControl }, type: QueryTypes.UPDATE, transaction: t }
    );

    const facActualizada = await sequelize.query(
      `SELECT f.estatus, f.numero_folio, fc.id_solicitud
         FROM factura f JOIN folio_consumo fc ON fc.numero_folio = f.numero_folio
        WHERE f.num_control = :numControl LIMIT 1`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );

    if (facActualizada.length > 0 && facActualizada[0].id_solicitud) {
      const idSolicitud = facActualizada[0].id_solicitud;

      await sequelize.query(
        `UPDATE paso_actividad
            SET estado_paso = 'completado', fecha_fin = NOW(),
                responsable_asignado = COALESCE(responsable_asignado, :cv)
          WHERE id_solicitud = :idSolicitud
            AND nombre_paso = 'Pago pendiente'
            AND estado_paso <> 'completado'`,
        {
          replacements: { idSolicitud, cv: cedulaVerificador },
          type: QueryTypes.UPDATE,
          transaction: t
        }
      );

      await sincronizarEstadoSolicitud(idSolicitud, t);
    }

    await t.commit();
    res.json({ mensaje: `Pago ${nuevoEstatus} correctamente.`, estatus: nuevoEstatus });
  } catch (error) {
    await t.rollback();
    console.error('Error al confirmar pago:', error);
    res.status(500).json({ error: error.message || 'No se pudo procesar la decision.' });
  }
};