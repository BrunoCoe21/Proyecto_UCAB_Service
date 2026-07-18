// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_secreta';

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere un token de seguridad.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded; 
    next(); 
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
  }
};

// Nueva función añadida para proteger rutas según el rol
const exigirRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolesUsuario = req.usuario?.roles || [];
    const tienePermiso = rolesUsuario.some(r => rolesPermitidos.includes(r));
    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos para esta accion.' });
    }
    next();
  };
};

module.exports = { verificarToken, exigirRol };