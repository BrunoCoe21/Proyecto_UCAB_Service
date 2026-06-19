// src/middleware/auth.js

const verificarToken = (req, res, next) => {
  // Extraemos el token que envía tu archivo api.js en las cabeceras HTTP
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer jwt-token-..."

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere un token de seguridad.' });
  }

  // Validamos que coincida con el token generado por tu authController al hacer login
  if (
    token !== 'jwt-token-real-ucab' && 
    token !== 'jwt-token-generado-para-el-front' && 
    token !== 'jwt-autenticado-real-ucab'
  ) {
    return res.status(401).json({ error: 'Token inválido o expirado. Inicie sesión nuevamente.' });
  }

  // Si el token es correcto, permitimos que la petición continúe hacia el controlador definitivo
  next();
};

module.exports = verificarToken;
