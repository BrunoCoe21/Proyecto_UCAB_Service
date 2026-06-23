// ============================================================================
// authController.js · UCAB-Services
// Lógica de autenticación: login, verificación de rol y cambio de contraseña.
//
// Dependencias: npm install bcrypt jsonwebtoken
//
// CONCEPTO IMPORTANTE sobre la "encriptación":
// Una contraseña NUNCA se guarda en texto plano ni se "desencripta". Se guarda
// su HASH (bcrypt). El hash es de UNA SOLA VÍA: no se puede revertir. Para
// verificar el login NO se desencripta nada; se vuelve a hashear lo que el
// usuario escribió y bcrypt.compare() comprueba si coincide con el hash guardado.
// ============================================================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esta_clave_secreta';
const SALT_ROUNDS = 10; // costo del hash bcrypt

// ----------------------------------------------------------------------------
// Determina el/los rol(es) de un usuario consultando en qué tablas de subtipo
// aparece su cédula. Un usuario puede tener varios roles (especialización
// solapada), por eso devolvemos un arreglo.
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
// POST /api/auth/login { correo, contrasena }
// ----------------------------------------------------------------------------
exports.login = async (req, res) => {
try {
const { correo, contrasena } = req.body;

if (!correo || !contrasena) {
return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
}

// 1. Buscar el usuario por correo
const usuarios = await sequelize.query(
`SELECT cedula_identidad, primer_nombre, primer_apellido,
correo_institucional, contrasena, estado_cuenta
FROM usuario
WHERE correo_institucional = :correo
LIMIT 1`,
{ replacements: { correo }, type: QueryTypes.SELECT }
);

if (usuarios.length === 0) {
return res.status(401).json({ error: 'Credenciales inválidas.' });
}
const usuario = usuarios[0];

// 2. Validar que la cuenta no esté bloqueada/suspendida
if (usuario.estado_cuenta.toLowerCase() !== 'activa') {
return res.status(403).json({ error: `La cuenta está ${usuario.estado_cuenta}.` });
}

/* // 3. Comparar la contraseña con el hash (NO se desencripta nada)
const coincide = await bcrypt.compare(contrasena, usuario.contrasena);*/

// 3. Comparar la contraseña con el hash 
// BYPASS TEMPORAL PARA DESARROLLO FRONTEND: 
// Ignoramos el hash de la BD y forzamos el acceso si escribes Clave123
const coincide = (contrasena === 'Clave123');

if (!coincide) {
// Incrementar intentos fallidos (control de seguridad del enunciado)
await sequelize.query(
`UPDATE usuario SET intentos_fallidos_auth = intentos_fallidos_auth + 1
WHERE cedula_identidad = :cedula`,
{ replacements: { cedula: usuario.cedula_identidad }, type: QueryTypes.UPDATE }
);
return res.status(401).json({ error: 'Credenciales inválidas.' });
}

// 4. Login correcto: resetear intentos y registrar la conexión
await sequelize.query(
`UPDATE usuario
SET intentos_fallidos_auth = 0, ultima_conexion = CURRENT_TIMESTAMP
WHERE cedula_identidad = :cedula`,
{ replacements: { cedula: usuario.cedula_identidad }, type: QueryTypes.UPDATE }
);

// 5. Registrar la sesión (entidad débil sesion)
await sequelize.query(
`INSERT INTO sesion (cedula_identidad, fecha_acceso, direccion_ip)
VALUES (:cedula, CURRENT_TIMESTAMP, :ip)`,
{ replacements: { cedula: usuario.cedula_identidad, ip: req.ip || null },
type: QueryTypes.INSERT }
);

// 6. Obtener roles y generar el token
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
roles
});

} catch (err) {
console.error('Error en login:', err);
return res.status(500).json({ error: 'Error interno del servidor.' });
}
};

// ----------------------------------------------------------------------------
// POST /api/auth/cambiar-contrasena { contrasenaActual, contrasenaNueva }
// Requiere estar autenticado (req.usuario lo pone el middleware auth.js).
// ----------------------------------------------------------------------------
exports.cambiarContrasena = async (req, res) => {
try {
const { contrasenaActual, contrasenaNueva } = req.body;
const cedula = req.usuario.cedula; // viene del token (middleware)

if (!contrasenaActual || !contrasenaNueva) {
return res.status(400).json({ error: 'Debe indicar la contraseña actual y la nueva.' });
}
if (contrasenaNueva.length < 8) {
return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
}

// 1. Traer el hash actual
const usuarios = await sequelize.query(
`SELECT contrasena FROM usuario WHERE cedula_identidad = :cedula LIMIT 1`,
{ replacements: { cedula }, type: QueryTypes.SELECT }
);
if (usuarios.length === 0) {
return res.status(404).json({ error: 'Usuario no encontrado.' });
}

// 2. Verificar la contraseña actual
const coincide = await bcrypt.compare(contrasenaActual, usuarios[0].contrasena);
if (!coincide) {
return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
}

// 3. Hashear la nueva y guardarla
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
// Utilidad para crear/registrar contraseñas (usar al cargar usuarios de prueba).
// Ejemplo de uso desde un script: const hash = await hashearContrasena('Clave123');
// ----------------------------------------------------------------------------
exports.hashearContrasena = async (textoPlano) => {
return await bcrypt.hash(textoPlano, SALT_ROUNDS);
};