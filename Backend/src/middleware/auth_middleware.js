const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_secreta';

function verificarToken(req, res, next) {
  const cabecera = req.headers['authorization'];
  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }
  const token = cabecera.split(' ')[1];
  try {
    const datos = jwt.verify(token, JWT_SECRET);
    req.usuario = datos;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function exigirRol(...rolesPermitidos) {
  return (req, res, next) => {
    const rolesUsuario = req.usuario?.roles || [];
    const tienePermiso = rolesUsuario.some(r => rolesPermitidos.includes(r));
    if (!tienePermiso) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción.' });
    }
    next();
  };
}

module.exports = { verificarToken, exigirRol };