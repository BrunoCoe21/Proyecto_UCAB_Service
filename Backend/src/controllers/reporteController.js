// src/controllers/reporteController.js
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');


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