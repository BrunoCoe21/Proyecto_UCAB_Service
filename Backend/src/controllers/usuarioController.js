const { usuario, estudiante } = require('../models');

exports.loginReal = async (req, res) => {
  const { correo_institucional, cedula_identidad } = req.body;

  console.log('=== INICIO DE LOGIN ===');
  console.log('Datos recibidos:', { correo_institucional, cedula_identidad });

  try {
    console.log('Buscando usuario...');
    const usuarioEncontrado = await usuario.findOne({
      where: {
        correo_institucional: correo_institucional,
        cedula_identidad: parseInt(cedula_identidad)
      }
    });

    console.log('Usuario encontrado:', usuarioEncontrado ? 'SÍ' : 'NO');
    
    if (!usuarioEncontrado) {
      console.log('Usuario no encontrado');
      return res.status(401).json({ 
        error: 'La combinacion de correo institucional y cedula no coincide.' 
      });
    }

    console.log('Estado de cuenta:', usuarioEncontrado.estado_cuenta);
    
    if (usuarioEncontrado.estado_cuenta && 
        usuarioEncontrado.estado_cuenta.toLowerCase() !== 'activa') {
      console.log('Cuenta no activa');
      return res.status(403).json({ 
        error: 'Tu acceso al ecosistema institucional se encuentra restringido.' 
      });
    }

    let rolDetectado = 'EXTERNO';
    console.log('Buscando en estudiante...');
    
    try {
      const esEstudiante = await estudiante.findOne({ 
        where: { cedula_identidad: usuarioEncontrado.cedula_identidad } 
      });
      
      console.log('Es estudiante:', esEstudiante ? 'SÍ' : 'NO');
      
      if (esEstudiante) {
        rolDetectado = 'ESTUDIANTE';
        console.log('Rol detectado: ESTUDIANTE');
      }
    } catch (errorEstudiante) {
      console.error('Error al buscar en estudiante:', errorEstudiante.message);
    }

    console.log('Login exitoso para:', correo_institucional);
    console.log('=== FIN DE LOGIN ===');

    return res.status(200).json({
      success: true,
      rol: rolDetectado,
      usuario: {
        nombre: `${usuarioEncontrado.primer_nombre} ${usuarioEncontrado.primer_apellido}`,
        cedula: usuarioEncontrado.cedula_identidad,
        correo: usuarioEncontrado.correo_institucional
      },
      token: "jwt-autenticado-real-ucab"
    });

  } catch (error) {
    console.error('ERROR EN LOGIN:');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.error('SQL:', error.sql || 'No SQL disponible');
    console.error('=== FIN DE LOGIN (ERROR) ===');
    
    return res.status(500).json({ 
      error: 'Error interno en el servidor.',
      detalle: error.message
    });
  }
};