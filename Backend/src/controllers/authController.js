// src/controllers/authController.js
const { Usuario, Estudiante } = require('../models');

exports.login = async (req, res) => {
  const { correo_institucional, cedula_identidad } = req.body;

  try {
    // 1. Buscar al usuario
    const usuarioEncontrado = await Usuario.findOne({
      where: {
        correo_institucional,
        cedula_identidad
      }
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({ error: 'Credenciales inválidas o no registradas.' });
    }

    // 2. Verificar que la cuenta no esté suspendida
    if (usuarioEncontrado.estado_cuenta.toUpperCase() !== 'ACTIVA') {
      return res.status(403).json({ error: 'Tu acceso al ecosistema se encuentra restringido.' });
    }

    // 3. Detectar si el usuario es Estudiante
    let rolDetectado = 'EXTERNO';
    const esEstudiante = await Estudiante.findOne({ 
      where: { cedula_identidad: usuarioEncontrado.cedula_identidad } 
    });
    
    if (esEstudiante) {
      rolDetectado = 'ESTUDIANTE';
    }

    // 4. Enviar respuesta exitosa al frontend
    res.json({
      success: true,
      rol: rolDetectado,
      usuario: {
        nombre: `${usuarioEncontrado.primer_nombre} ${usuarioEncontrado.primer_apellido}`,
        cedula: usuarioEncontrado.cedula_identidad,
        correo: usuarioEncontrado.correo_institucional
      },
      token: "jwt-token-real-ucab" // Lo configuraremos más adelante en el middleware
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno en el servidor.', detalle: error.message });
  }
};