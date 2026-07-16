// ============================================================================
//  src/controllers/pagoController.js  ·  UCAB-Services  ·  MÓDULO DE FINANZAS
// ----------------------------------------------------------------------------
//  Maneja todo lo relacionado con el estado de cuenta y los pagos del
//  ESTUDIANTE (incluye becarios, que son estudiantes igual).
//
//  Se apoya en la lógica que ya vive en la base de datos:
//    - El trigger fn_pago_actualiza_factura descuenta el monto del saldo de la
//      factura y la marca 'pagada' cuando llega a 0. Por eso aquí NO se toca el
//      saldo a mano: solo se inserta el pago y la base hace el resto.
//    - La jerarquía de pago tiene 3 niveles que hay que insertar en orden:
//        pago  ->  pago_virtual | pago_presencial  ->  método concreto
//      Todo dentro de UNA transacción: si algo falla, no queda un pago a medias.
// ============================================================================

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sincronizarEstadoSolicitud } = require('./gestionSolicitudController');

// Métodos válidos y a qué nivel pertenecen (debe coincidir con la base).
const METODOS_VIRTUALES   = ['zelle', 'criptomoneda'];
const METODOS_PRESENCIALES = ['tarjeta', 'pago_movil', 'efectivo', 'tai'];

// ----------------------------------------------------------------------------
//  GET /api/facturas/estudiante/:cedula
//  Estado de cuenta: todas las facturas del estudiante con su saldo y estatus.
// ----------------------------------------------------------------------------
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
              se.descripcion_detallada AS concepto
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

// ----------------------------------------------------------------------------
//  GET /api/facturas/:numControl/detalle
//  Detalle de UNA factura: sus líneas de cargo (conceptos, IVA) y los abonos
//  ya realizados. Es lo que llena la vista de "Estado de Cuenta" al elegir una
//  factura y lo que la pasarela usa para saber cuánto se debe.
// ----------------------------------------------------------------------------
exports.obtenerDetalleFactura = async (req, res) => {
  try {
    const { numControl } = req.params;

    const cabecera = await sequelize.query(
      `SELECT f.num_control, f.numero_folio, f.fecha_emision, f.estatus, f.saldo
       FROM factura f
       WHERE f.num_control = :numControl
       LIMIT 1`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    if (cabecera.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }

    // Líneas de cargo (los conceptos que componen el folio de esta factura)
    const cargos = await sequelize.query(
      `SELECT lc.numero_item, lc.concepto, lc.cantidad,
              lc.precio_unitario, lc.impuesto_ley
       FROM linea_cargo lc
       JOIN factura f ON f.numero_folio = lc.numero_folio
       WHERE f.num_control = :numControl
       ORDER BY lc.numero_item`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    // Abonos ya realizados (pagos recibidos para esta factura)
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

// ----------------------------------------------------------------------------
//  POST /api/facturas/:numControl/pagar
//  Registra un pago. Body esperado:
//    { metodo, monto, tasa_bcv, datos: { ...campos propios del método } }
//
//  Inserta la jerarquía completa en una transacción:
//    1) pago (raíz)
//    2) pago_virtual o pago_presencial (según el método)
//    3) el método concreto (zelle, tarjeta, etc.)
//  El trigger de la base actualiza el saldo de la factura automáticamente.
// ----------------------------------------------------------------------------
exports.registrarPago = async (req, res) => {
  const { numControl } = req.params;
  const { metodo, monto, tasa_bcv, datos = {} } = req.body;

  // Validaciones básicas de entrada
  if (!metodo || !monto) {
    return res.status(400).json({ error: 'Método y monto son obligatorios.' });
  }
  const esVirtual    = METODOS_VIRTUALES.includes(metodo);
  const esPresencial = METODOS_PRESENCIALES.includes(metodo);
  if (!esVirtual && !esPresencial) {
    return res.status(400).json({ error: `Método de pago no válido: ${metodo}.` });
  }
  if (Number(monto) <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor que cero.' });
  }

  // Una sola marca de tiempo para toda la jerarquía (es parte de la PK compuesta)
  const fecha = new Date();
  const t = await sequelize.transaction();

  try {
    // Verificar que la factura exista y pertenezca a un estudiante
    const fac = await sequelize.query(
      `SELECT saldo, estatus FROM factura WHERE num_control = :numControl FOR UPDATE`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );
    if (fac.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: 'Factura no encontrada.' });
    }
    if (fac[0].estatus === 'pagada') {
      await t.rollback();
      return res.status(400).json({ error: 'Esta factura ya está pagada.' });
    }

    // 1) PAGO (raíz). Si el monto excede el saldo, el trigger lanzará el error
    //    y la transacción se revierte sola.
    await sequelize.query(
      `INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto)
       VALUES (:numControl, :fecha, :tasa, :monto)`,
      { replacements: { numControl, fecha, tasa: tasa_bcv || null, monto },
        type: QueryTypes.INSERT, transaction: t }
    );

    // 2) Nivel 1: virtual o presencial
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

    // 3) Nivel 2: el método concreto, con sus campos propios
    await insertarMetodoConcreto(metodo, numControl, fecha, datos, t);

    // NUEVO: si la factura quedó 'pagada' (el trigger fn_pago_actualiza_factura
    // ya la actualizó), buscar la solicitud asociada vía el folio y marcar su
    // paso "Pago pendiente" como completado. No requiere que ningún admin
    // confirme nada — es automático en el momento del pago, según se acordó.
    const facturaActualizada = await sequelize.query(
      `SELECT estatus, numero_folio FROM factura WHERE num_control = :numControl LIMIT 1`,
      { replacements: { numControl }, type: QueryTypes.SELECT, transaction: t }
    );
    if (facturaActualizada[0].estatus === 'pagada') {
      const folio = await sequelize.query(
        `SELECT id_solicitud FROM folio_consumo WHERE numero_folio = :numeroFolio LIMIT 1`,
        { replacements: { numeroFolio: facturaActualizada[0].numero_folio }, type: QueryTypes.SELECT, transaction: t }
      );
      if (folio.length > 0) {
        const idSolicitud = folio[0].id_solicitud;
        await sequelize.query(
          `UPDATE paso_actividad
           SET estado_paso = 'completado'
           WHERE id_solicitud = :idSolicitud AND nombre_paso = 'Pago pendiente' AND estado_paso <> 'completado'`,
          { replacements: { idSolicitud }, type: QueryTypes.UPDATE, transaction: t }
        );
        await sincronizarEstadoSolicitud(idSolicitud, t);
      }
    }

    await t.commit();

    // Devolver el nuevo estado de la factura (ya actualizado por el trigger)
    const actualizada = await sequelize.query(
      `SELECT num_control, saldo, estatus FROM factura WHERE num_control = :numControl`,
      { replacements: { numControl }, type: QueryTypes.SELECT }
    );

    res.json({ mensaje: 'Pago registrado correctamente.', factura: actualizada[0] });

  } catch (error) {
    await t.rollback();
    console.error('Error al registrar pago:', error);
    // El mensaje del trigger (saldo excedido, etc.) llega aquí de forma legible
    res.status(400).json({ error: error.message || 'No se pudo registrar el pago.' });
  }
};

// ----------------------------------------------------------------------------
//  Helper: inserta en la tabla del método concreto con sus campos propios.
//  Cada método mapea a las columnas reales de su tabla en la base de datos.
// ----------------------------------------------------------------------------
async function insertarMetodoConcreto(metodo, numControl, fecha, d, t) {
  const base = { numControl, fecha };

  switch (metodo) {
    case 'zelle':
      return sequelize.query(
        `INSERT INTO zelle (num_control, fecha_movimiento, correo_electronico, nombre, cod_confirmacion)
         VALUES (:numControl, :fecha, :correo, :nombre, :confirmacion)`,
        { replacements: { ...base, correo: d.correoOrigen || null, nombre: d.titular || null,
                          confirmacion: d.confirmacion || null },
          type: QueryTypes.INSERT, transaction: t });

    case 'criptomoneda':
      return sequelize.query(
        `INSERT INTO criptomoneda (num_control, fecha_movimiento, cod_hash, red_utilizada, dir_billetera_origen, tasa_conversion)
         VALUES (:numControl, :fecha, :hash, :red, :billetera, :tasaConv)`,
        { replacements: { ...base, hash: d.txid || null, red: d.red || null,
                          billetera: d.billeteraOrigen || null, tasaConv: d.tasaConversion || null },
          type: QueryTypes.INSERT, transaction: t });

    case 'tarjeta':
      return sequelize.query(
        `INSERT INTO tarjeta (num_control, fecha_movimiento, num_tarjeta, fecha_vencimiento, compania_emisora, tipo_red)
         VALUES (:numControl, :fecha, :numTarjeta, :venc, :compania, :tipoRed)`,
        { replacements: { ...base, numTarjeta: d.numero || null, venc: d.expiry || null,
                          compania: d.franquicia || null, tipoRed: d.tipoRed || null },
          type: QueryTypes.INSERT, transaction: t });

    case 'pago_movil':
      return sequelize.query(
        `INSERT INTO pago_movil (num_control, fecha_movimiento, num_telefono, banco_origen, num_referencia)
         VALUES (:numControl, :fecha, :telefono, :banco, :referencia)`,
        { replacements: { ...base, telefono: d.telefono || null, banco: d.banco || null,
                          referencia: d.referencia || null },
          type: QueryTypes.INSERT, transaction: t });

    case 'efectivo':
      return sequelize.query(
        `INSERT INTO efectivo (num_control, fecha_movimiento, moneda_curso, monto_exacto, desglose_denominacion)
         VALUES (:numControl, :fecha, :moneda, :montoExacto, :desglose)`,
        { replacements: { ...base, moneda: d.moneda || null, montoExacto: d.monto || null,
                          desglose: d.desglose || null },
          type: QueryTypes.INSERT, transaction: t });

    case 'tai':
      return sequelize.query(
        `INSERT INTO tai (num_control, fecha_movimiento, uid, cod_pos, saldo)
         VALUES (:numControl, :fecha, :uid, :pos, :saldo)`,
        { replacements: { ...base, uid: d.uid || null, pos: d.codigoTerminal || null,
                          saldo: d.saldo || null },
          type: QueryTypes.INSERT, transaction: t });

    default:
      throw new Error(`Método no soportado: ${metodo}`);
  }
}

// ----------------------------------------------------------------------------
//  GET /api/facturas/billetera/:cedula   (reporte QA: Billetera TAI)
//  Devuelve el saldo actual de la billetera TAI del miembro (tabla posee).
//  El frontend lo muestra antes de pagar y bloquea la transacción si el
//  saldo no alcanza; el trigger de la base es la garantía final.
// ----------------------------------------------------------------------------
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