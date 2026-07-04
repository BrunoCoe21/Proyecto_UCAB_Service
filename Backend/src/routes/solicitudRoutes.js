// src/routes/solicitudRoutes.js
const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');
const { verificarToken } = require('../middleware/auth');

// Endpoint protegido para el listado de solicitudes del dashboard
router.get('/estudiante/:cedula', verificarToken, solicitudController.obtenerPorEstudiante);

// --- NUEVO: detalle completo (resumen + línea de tiempo + acreditaciones + reserva) ---
router.get('/:idSolicitud/detalle', verificarToken, solicitudController.obtenerDetalle);

// --- NUEVO (formaliza lo que servicio.js ya hacía con fetch directo) ---
router.post('/', verificarToken, solicitudController.crearSolicitud);

module.exports = router;