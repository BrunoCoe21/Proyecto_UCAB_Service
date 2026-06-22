const bcrypt = require('bcrypt');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const SALT_ROUNDS = 10;

// Crear un nuevo usuario (registro)
exports.crearUsuario = async (req, res) => {
  try {
    const {
      cedula_identidad,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      fecha_nacimiento,
      sexo,
      direccion_habitacion_detallada,
      numero_telefono,
      correo_institucional,
      contrasena,
      estado_cuenta = 'activa',
      estatus_verificacion_dos_pasos = false
    } = req.body;

    // Validaciones básicas
    if (!cedula_identidad || !primer_nombre || !primer_apellido || !correo_institucional || !contrasena) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes.' });
    }

    // Verificar si el correo ya existe
    const existe = await sequelize.query(
      `SELECT cedula_identidad FROM usuario WHERE correo_institucional = :correo LIMIT 1`,
      { replacements: { correo: correo_institucional }, type: QueryTypes.SELECT }
    );
    if (existe.length > 0) {
      return res.status(400).json({ error: 'El correo institucional ya está registrado.' });
    }

    // Verificar si la cédula ya existe
    const existeCedula = await sequelize.query(
      `SELECT cedula_identidad FROM usuario WHERE cedula_identidad = :cedula LIMIT 1`,
      { replacements: { cedula: cedula_identidad }, type: QueryTypes.SELECT }
    );
    if (existeCedula.length > 0) {
      return res.status(400).json({ error: 'La cédula de identidad ya está registrada.' });
    }

    // Hash de la contraseña
    const contrasenaHash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    // Insertar usuario
    await sequelize.query(
      `INSERT INTO usuario (
        cedula_identidad, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        fecha_nacimiento, sexo, direccion_habitacion_detallada, numero_telefono,
        correo_institucional, contrasena, intentos_fallidos_auth, estado_cuenta,
        estatus_verificacion_dos_pasos, ult_fecha_cambio_cont, ultima_conexion
      ) VALUES (
        :cedula, :pn, :sn, :pa, :sa,
        :fn, :sexo, :dir, :tel,
        :correo, :hash, 0, :estado,
        :mfa, NULL, NULL
      )`,
      {
        replacements: {
          cedula: cedula_identidad,
          pn: primer_nombre,
          sn: segundo_nombre || null,
          pa: primer_apellido,
          sa: segundo_apellido || null,
          fn: fecha_nacimiento,
          sexo: sexo,
          dir: direccion_habitacion_detallada,
          tel: numero_telefono,
          correo: correo_institucional,
          hash: contrasenaHash,
          estado: estado_cuenta,
          mfa: estatus_verificacion_dos_pasos
        },
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};