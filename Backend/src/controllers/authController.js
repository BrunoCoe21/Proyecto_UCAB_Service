// ============================================================================
// authController.js · UCAB-Services
// VERSIÓN CORREGIDA - GEOLOCALIZACIÓN REAL + IP REAL EN DESARROLLO
// ============================================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_secreta';
const SALT_ROUNDS = 10;

// ----------------------------------------------------------------------------
// Determina los roles de un usuario
// ----------------------------------------------------------------------------
async function obtenerRoles(cedula) {
  const roles = [];
  const checks = [
    { tabla: 'docente', rol: 'docente' },
    { tabla: 'personal_administrativo', rol: 'administrativo' },
    { tabla: 'estudiante', rol: 'estudiante' },
    { tabla: 'egresado', rol: 'egresado' },
  ];

  for (const c of checks) {
    const r = await sequelize.query(
      `SELECT 1 FROM ${c.tabla} WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (r.length > 0) roles.push(c.rol);
  }
  return roles;
}

// ----------------------------------------------------------------------------
// Funcion para obtener la IP real
// ----------------------------------------------------------------------------
async function obtenerIPReal(req) {
  // 1. Intentar obtener IP de la petición
  let ip = req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.ip ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           '0.0.0.0';
  
  ip = ip.split(',')[0].trim();

  // 2. Si es localhost, consultar IP pública real
  const esLocal = ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0';
  if (esLocal) {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      if (data.ip) {
        ip = data.ip;
        return ip;
      }
    } catch (error) {
      console.warn('⚠️ No se pudo obtener IP pública, usando localhost');
    }
  }

  return ip;
}

// ----------------------------------------------------------------------------
// Funcion para generar UUID basado en IP + User-Agent + timestamp
// ----------------------------------------------------------------------------
function generarUUID(ip, userAgent) {
  const hashBase = ip + userAgent + Date.now().toString();
  const hash = crypto.createHash('md5').update(hashBase).digest('hex');
  return hash.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5').toUpperCase();
}

// ----------------------------------------------------------------------------
// Funcion para obtener la geolocalización de una IP
// ----------------------------------------------------------------------------
async function obtenerGeolocalizacion(ip) {
  const esLocal = ip === '::1' || ip === '127.0.0.1' || ip === '0.0.0.0';
  if (esLocal) {
    return 'Localhost (Entorno de desarrollo)';
  }

  const esLAN = ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.');
  if (esLAN) {
    return `Red local (LAN) - ${ip}`;
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,region,isp`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      let ubicacion = `${data.city}, ${data.region}, ${data.country}`;
      if (data.isp) ubicacion += ` · ${data.isp}`;
      return ubicacion;
    } else {
      return `IP pública: ${ip} (ubicación no disponible)`;
    }
  } catch (error) {
    console.warn('⚠️ API de geolocalización no disponible:', error.message);
    return `IP: ${ip} (geolocalización no disponible)`;
  }
}

// ----------------------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

   
    const usuarios = await sequelize.query(
      `SELECT cedula_identidad, primer_nombre, primer_apellido,
              correo_institucional, contrasena, estado_cuenta, intentos_fallidos_auth,
              estatus_verificacion_dos_pasos
       FROM usuario
       WHERE correo_institucional = :correo
       LIMIT 1`,
      { replacements: { correo }, type: QueryTypes.SELECT }
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    const usuario = usuarios[0];

    
    if (usuario.estado_cuenta.toLowerCase() !== 'activa') {
      return res.status(403).json({ error: `La cuenta está ${usuario.estado_cuenta}.` });
    }

    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!coincide) {
      await sequelize.query(
        `UPDATE usuario SET intentos_fallidos_auth = intentos_fallidos_auth + 1
         WHERE cedula_identidad = :cedula`,
        { replacements: { cedula: usuario.cedula_identidad }, type: QueryTypes.UPDATE }
      );
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (usuario.estatus_verificacion_dos_pasos === true) {
      const codigo = String(Math.floor(100000 + Math.random() * 900000));
      const tokenTemporal = jwt.sign(
        { cedula: usuario.cedula_identidad, alcance: '2fa', codigo },
        JWT_SECRET, { expiresIn: '5m' }
      );
      console.log(`🔐 [2FA] Código de verificación para ${usuario.correo_institucional}: ${codigo}`);
      return res.json({
        requiere_2fa: true,
        token_temporal: tokenTemporal,
        codigo_demo: codigo,  
        mensaje: 'Verificación en dos pasos requerida.'
      });
    }

    await sequelize.query(
      `UPDATE usuario
       SET intentos_fallidos_auth = 0,
           ultima_conexion = CURRENT_TIMESTAMP
       WHERE cedula_identidad = :cedula`,
      { replacements: { cedula: usuario.cedula_identidad }, type: QueryTypes.UPDATE }
    );

    const ipReal = await obtenerIPReal(req);
    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const uuid = generarUUID(ipReal, userAgent);
    const geolocalizacion = await obtenerGeolocalizacion(ipReal);

    await sequelize.query(
      `INSERT INTO sesion (cedula_identidad, fecha_acceso, direccion_ip, identificador_dispositivo, geolocalizacion_aprox)
       VALUES (:cedula, CURRENT_TIMESTAMP, :ip, :dispositivo, :geolocalizacion)`,
      { 
        replacements: { 
          cedula: usuario.cedula_identidad,
          ip: ipReal,
          dispositivo: uuid,
          geolocalizacion: geolocalizacion
        },
        type: QueryTypes.INSERT 
      }
    );

    const roles = await obtenerRoles(usuario.cedula_identidad);
    const token = jwt.sign(
      { cedula: usuario.cedula_identidad, roles },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      cedula: usuario.cedula_identidad,
      nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
      roles,
      intentos_fallidos: usuario.intentos_fallidos_auth || 0,
      sesion_actual: {
        ip: ipReal,
        dispositivo: uuid,
        geolocalizacion: geolocalizacion,
        fecha_conexion: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('❌ Error en login:', err);
    return res.status(500).json({ 
      error: 'Error interno del servidor.',
      detalle: err.message 
    });
  }
};

// ----------------------------------------------------------------------------
// POST /api/auth/cambiar-contrasena
// ----------------------------------------------------------------------------
exports.cambiarContrasena = async (req, res) => {
  try {
    const { contrasenaActual, contrasenaNueva } = req.body;
    const cedula = req.usuario.cedula;

    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ error: 'Debe indicar la contraseña actual y la nueva.' });
    }
    if (contrasenaNueva.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    const usuarios = await sequelize.query(
      `SELECT contrasena FROM usuario WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula }, type: QueryTypes.SELECT }
    );
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const coincide = await bcrypt.compare(contrasenaActual, usuarios[0].contrasena);
    if (!coincide) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const nuevoHash = await bcrypt.hash(contrasenaNueva, SALT_ROUNDS);
    await sequelize.query(
      `UPDATE usuario
       SET contrasena = :hash, ult_fecha_cambio_cont = CURRENT_TIMESTAMP
       WHERE cedula_identidad = :cedula`,
      { replacements: { hash: nuevoHash, cedula }, type: QueryTypes.UPDATE }
    );

    return res.json({ mensaje: 'Contraseña actualizada correctamente.' });

  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// ----------------------------------------------------------------------------
// Utilidad para crear/registrar contraseñas
// ----------------------------------------------------------------------------
exports.hashearContrasena = async (textoPlano) => {
  return await bcrypt.hash(textoPlano, SALT_ROUNDS);
};

// ----------------------------------------------------------------------------
// POST /api/auth/logout - Reinicia intentos fallidos
// ----------------------------------------------------------------------------
exports.logout = async (req, res) => {
  try {
    const cedula = req.usuario.cedula;

    await sequelize.query(
      `UPDATE usuario SET intentos_fallidos_auth = 0
       WHERE cedula_identidad = :cedula`,
      { replacements: { cedula }, type: QueryTypes.UPDATE }
    );

    return res.json({ 
      mensaje: 'Sesión cerrada correctamente. Intentos fallidos reiniciados a 0.' 
    });

  } catch (err) {
    console.error('❌ Error en logout:', err);
    return res.status(500).json({ error: 'Error al cerrar sesión.' });
  }
};

// ----------------------------------------------------------------------------
// POST /api/auth/verificar-2fa   
// ----------------------------------------------------------------------------
exports.verificar2FA = async (req, res) => {
  try {
    const { token_temporal, codigo } = req.body;
    if (!token_temporal || !codigo) {
      return res.status(400).json({ error: 'Token temporal y código son obligatorios.' });
    }

    let datos;
    try {
      datos = jwt.verify(token_temporal, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'La verificación expiró. Inicia sesión de nuevo.' });
    }
    if (datos.alcance !== '2fa') {
      return res.status(401).json({ error: 'Token no válido para verificación en dos pasos.' });
    }
    if (String(codigo).trim() !== datos.codigo) {
      return res.status(401).json({ error: 'Código de verificación incorrecto.' });
    }

    const usuarios = await sequelize.query(
      `SELECT cedula_identidad, primer_nombre, primer_apellido, correo_institucional,
              intentos_fallidos_auth
       FROM usuario WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula: datos.cedula }, type: QueryTypes.SELECT }
    );
    if (usuarios.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    const usuario = usuarios[0];

    await sequelize.query(
      `UPDATE usuario SET intentos_fallidos_auth = 0, ultima_conexion = CURRENT_TIMESTAMP
       WHERE cedula_identidad = :cedula`,
      { replacements: { cedula: usuario.cedula_identidad }, type: QueryTypes.UPDATE }
    );

    const ipReal = await obtenerIPReal(req);
    const userAgent = req.headers['user-agent'] || 'Desconocido';
    const uuid = generarUUID(ipReal, userAgent);
    const geolocalizacion = await obtenerGeolocalizacion(ipReal);

    await sequelize.query(
      `INSERT INTO sesion (cedula_identidad, fecha_acceso, direccion_ip, identificador_dispositivo, geolocalizacion_aprox)
       VALUES (:cedula, CURRENT_TIMESTAMP, :ip, :dispositivo, :geolocalizacion)`,
      { replacements: { cedula: usuario.cedula_identidad, ip: ipReal, dispositivo: uuid, geolocalizacion },
        type: QueryTypes.INSERT }
    );

    const roles = await obtenerRoles(usuario.cedula_identidad);
    const token = jwt.sign({ cedula: usuario.cedula_identidad, roles }, JWT_SECRET, { expiresIn: '8h' });

    return res.json({
      token,
      cedula: usuario.cedula_identidad,
      nombre: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
      roles,
      intentos_fallidos: usuario.intentos_fallidos_auth || 0,
      sesion_actual: { ip: ipReal, dispositivo: uuid, geolocalizacion, fecha_conexion: new Date().toISOString() }
    });

  } catch (err) {
    console.error('❌ Error en verificar-2fa:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};
