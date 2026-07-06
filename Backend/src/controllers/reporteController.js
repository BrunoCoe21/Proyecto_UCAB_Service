// src/controllers/reporteController.js
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

// ============================================================
// 1. REPORTE DE SOLICITUDES
// ============================================================
exports.reporteSolicitudes = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_solicitudes ORDER BY fecha_creacion DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteSolicitudes:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de solicitudes.' });
  }
};

// ============================================================
// 2. REPORTE DE ESTADO DE CUENTA
// ============================================================
exports.reporteEstadoCuenta = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_estado_cuenta ORDER BY fecha_emision DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteEstadoCuenta:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de estado de cuenta.' });
  }
};

// ============================================================
// 3. REPORTE DE INGRESOS POR SERVICIO
// ============================================================
exports.reporteIngresosServicio = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_ingresos_servicio ORDER BY total_recaudado DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteIngresosServicio:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de ingresos por servicio.' });
  }
};

// ============================================================
// 4. REPORTE DE OCUPACIÓN DE ESPACIOS
// ============================================================
exports.reporteOcupacionEspacios = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_ocupacion_espacios ORDER BY fecha_reserva DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteOcupacionEspacios:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de ocupación de espacios.' });
  }
};

// ============================================================
// 5. REPORTE DE POSTULACIONES
// ============================================================
exports.reportePostulaciones = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_postulaciones ORDER BY num_postulantes DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reportePostulaciones:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de postulaciones.' });
  }
};

// ============================================================
// 6. REPORTE DE RECURRENCIA DE MIEMBROS
// ============================================================
exports.reporteRecurrencia = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_recurrencia ORDER BY indice_recurrencia DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteRecurrencia:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de recurrencia.' });
  }
};

// ============================================================
// 7. REPORTE DE BECARIOS
// ============================================================
exports.reporteBecarios = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_becarios ORDER BY situacion, indice_de_mantenimiento DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reporteBecarios:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de becarios.' });
  }
};

// ============================================================
// 8. REPORTE DE PAGOS POR MÉTODO
// ============================================================
exports.reportePagosMetodo = async (req, res) => {
  try {
    const data = await sequelize.query(
      `SELECT * FROM v_reporte_pagos_por_metodo ORDER BY total DESC`,
      { type: QueryTypes.SELECT }
    );
    res.json(data);
  } catch (error) {
    console.error('Error en reportePagosMetodo:', error);
    res.status(500).json({ error: 'No se pudo generar el reporte de pagos por método.' });
  }
};