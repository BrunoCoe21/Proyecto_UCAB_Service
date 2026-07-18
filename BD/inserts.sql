INSERT INTO sede (nombre_sede, ubicacion, factor_ajuste) VALUES
  ('Montalban', 'Caracas - Montalban', 1.000),
  ('Guayana',   'Ciudad Guayana',      0.850);

INSERT INTO edificacion (nombre_sede, nombre_edif, direccion_interna) VALUES
  ('Montalban', 'Edificio Cincuentenario',  'Av. Teheran, Montalban'),
  ('Montalban', 'Edificio de Laboratorios', 'Sector La Vega'),
  ('Guayana',   'Edificio Principal',       'Av. Atlantico');

INSERT INTO espacio_fisico
  (nombre_sede, nombre_edif, num_identificador, cap_maxima_aforo, tipo_mobiliario, tipo_espacio_fisico, estado_mantenimiento) VALUES
  ('Montalban', 'Edificio Cincuentenario',  'AUD-01',  200, 'Butacas',        'Auditorio',                 'operativo'),
  ('Montalban', 'Edificio Cincuentenario',  'SAL-101',  40, 'Pupitres',       'Salon de clase',            'operativo'),
  ('Montalban', 'Edificio de Laboratorios', 'LAB-201',  30, 'Mesas tecnicas', 'Laboratorio de computacion','en mantenimiento'),
  ('Guayana',   'Edificio Principal',       'CAN-01',  100, 'Gradas',         'Cancha deportiva',          'operativo');

INSERT INTO espacio_fisico_recurso
  (nombre_sede, nombre_edif, num_identificador, recurso_tecnologico) VALUES
  ('Montalban', 'Edificio Cincuentenario',  'AUD-01',  'Proyector 4K'),
  ('Montalban', 'Edificio Cincuentenario',  'AUD-01',  'Sistema de sonido'),
  ('Montalban', 'Edificio de Laboratorios', 'LAB-201', 'Servidores'),
  ('Montalban', 'Edificio de Laboratorios', 'LAB-201', 'Proyector'),
  ('Montalban', 'Edificio Cincuentenario',  'SAL-101', 'Proyector');

INSERT INTO usuario
  (cedula_identidad, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
   fecha_nacimiento, sexo, direccion_habitacion_detallada, numero_telefono, correo_institucional,
   contrasena,
   intentos_fallidos_auth, estado_cuenta, estatus_verificacion_dos_pasos, ult_fecha_cambio_cont, ultima_conexion) VALUES
  (26543210, 'Maria',   'Alejandra', 'Gonzalez', 'Perez',  '2003-04-12', 'F', 'Urb. Montalban, Casa 12', '0414-1112233', 'magonzalez@correo.ucab.edu.ve', '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2026-01-10 08:00:00', '2026-06-14 09:30:00'),
  (27111222, 'Jose',    'Luis',      'Perez',    'Mora',   '2002-08-25', 'M', 'Av. Sucre, Apto 4B',      '0424-3344556', 'jlperez@correo.ucab.edu.ve',   '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 1, 'activa',     FALSE, '2026-02-15 10:00:00', '2026-06-13 18:00:00'),
  (12345678, 'Ana',     'Maria',     'Rodriguez','Diaz',   '1992-01-30', 'F', 'La Castellana, Qta. Sol', '0412-5566778', 'amrodriguez@correo.ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2025-12-01 09:00:00', '2026-06-14 08:00:00'),
  (14998877, 'Carlos',  'Eduardo',   'Martinez', 'Ruiz',   '1985-11-05', 'M', 'El Paraiso, Res. Andes',  '0416-7788990', 'cemartinez@correo.ucab.edu.ve', '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     FALSE, '2026-03-01 11:00:00', '2026-06-12 14:00:00'),
  (15200300, 'Luisa',   'Fernanda',  'Hernandez','Soto',   '1980-06-18', 'F', 'Santa Monica, Casa 8',    '0414-8899001', 'lfhernandez@correo.ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2025-11-20 08:30:00', '2026-06-11 16:00:00'),
  (28333444, 'Pedro',   'Jose',      'Ramirez',  'Lugo',   '2004-02-14', 'M', 'Caricuao, Bloque 5',      '0426-1122334', 'pjramirez@correo.ucab.edu.ve',  '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 2, 'suspendida', FALSE, '2026-04-01 12:00:00', '2026-05-30 10:00:00'),
  (19888777, 'Carmen',  'Rosa',      'Silva',    'Nino',   '1983-09-09', 'F', 'Los Chaguaramos, Apto 7',  '0412-2233445', 'crsilva@correo.ucab.edu.ve',    '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2026-01-05 09:00:00', '2026-06-10 12:00:00'),
  (10222333, 'Roberto', 'Antonio',   'Diaz',     'Perez',  '1995-07-22', 'M', 'Chacao, Torre B, Piso 3', '0424-9988776', 'radiaz@correo.ucab.edu.ve',     '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     FALSE, '2025-10-10 08:00:00', '2026-06-13 20:00:00'),
  (30444555, 'Daniela', 'Valentina', 'Torres',   'Leon',   '2005-12-01', 'F', 'El Cafetal, Res. Lomas',  '0416-5544332', 'dvtorres@correo.ucab.edu.ve',   '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2026-02-20 10:00:00', '2026-06-14 07:45:00'),
  (16777888, 'Miguel',  'Angel',     'Castro',   'Vega',   '1978-03-15', 'M', 'La Florida, Qta. Vega',   '0414-6677889', 'macastro@correo.ucab.edu.ve',   '$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62', 0, 'activa',     TRUE,  '2025-09-15 08:00:00', '2026-06-09 15:00:00');

INSERT INTO sesion (cedula_identidad, fecha_acceso, direccion_ip, identificador_dispositivo, geolocalizacion_aprox) VALUES
  (12345678, '2026-06-14 08:00:00', '190.200.1.10',  'UUID-AAA-001', 'Caracas, VE'),
  (26543210, '2026-06-14 09:30:00', '190.200.1.55',  'UUID-BBB-002', 'Caracas, VE'),
  (10222333, '2026-06-13 20:00:00', '201.111.2.20',  'UUID-CCC-003', 'Ciudad Guayana, VE'),
  (28333444, '2026-05-30 10:00:00', '186.90.30.40',  'UUID-DDD-004', 'Caracas, VE');

INSERT INTO periodo_vinculacion (cedula_identidad, fecha_inicio, fecha_finalizacion, rol_activo) VALUES
  (26543210, '2021-09-01', NULL,         'estudiante'),
  (27111222, '2020-09-01', NULL,         'estudiante'),
  (12345678, '2010-09-01', '2015-07-30', 'estudiante'),
  (12345678, '2016-01-15', NULL,         'docente'),
  (14998877, '2012-03-01', NULL,         'personal_administrativo'),
  (15200300, '2015-09-01', NULL,         'docente'),
  (28333444, '2023-09-01', NULL,         'estudiante'),
  (19888777, '2018-01-10', NULL,         'personal_administrativo'),
  (10222333, '2014-09-01', '2018-07-30', 'estudiante'),
  (10222333, '2018-07-30', NULL,         'egresado'),
  (30444555, '2022-09-01', NULL,         'estudiante'),
  (16777888, '2017-09-01', NULL,         'docente');

INSERT INTO estudiante (cedula_identidad, promedio, uc_aprobadas, semestre_actual, escuela, facultad) VALUES
  (26543210, 18.50, 90,  7, 'Ingenieria Informatica', 'Ingenieria'),
  (27111222, 16.20, 110, 8, 'Ingenieria Informatica', 'Ingenieria'),
  (28333444, 14.80, 50,  4, 'Derecho',                'Derecho'),
  (30444555, 19.10, 70,  6, 'Comunicacion Social',    'Humanidades');

INSERT INTO egresado (cedula_identidad, indice_academico_final, titulo, anio_graduacion) VALUES
  (12345678, 17.80, 'Ingeniero Informatico',          2015),
  (10222333, 15.50, 'Licenciado en Administracion',   2018);

INSERT INTO empleado (cedula_identidad) VALUES
  (12345678), (14998877), (15200300), (19888777), (16777888);

INSERT INTO docente (cedula_identidad, escalafon_docente, carga_horaria_semanal, codigo_invest) VALUES
  (12345678, 'Asistente', 12.0, NULL),
  (15200300, 'Asociado',  16.0, 'INV-0432'),
  (19888777, 'Instructor', 8.0, NULL),
  (16777888, 'Titular',   18.0, 'INV-0911');

INSERT INTO personal_administrativo (cedula_identidad, carga_horaria, cargo, unidad_adscripcion_pre) VALUES
  (14998877, 40.0, 'Coordinador de Caja', 'Direccion de Administracion'),
  (19888777, 20.0, 'Analista de RRHH',    'Direccion de Gente');

INSERT INTO becario (cedula_identidad, indice_de_mantenimiento, estatus, tipo_de_beca) VALUES
  (26543210, 18.00, 'Activo', 'excelencia'),
  (30444555, 17.50, 'Activo', 'economica');

INSERT INTO preparadores (cedula_identidad, horas, asignatura) VALUES
  (27111222, 80, 'Programacion II');

INSERT INTO vinculo_familiar
  (ci, nombre, fecha_nac, parentesco, estado_vinculo, fecha_inicio_vinculo, fecha_fin_vinculo) VALUES
  (35111222, 'Sofia Martinez Gomez',   '2015-03-10', 'Hija',    'activo', '2024-01-01', NULL),
  (22999888, 'Daniel Gonzalez Rojas',  '2004-06-20', 'Hijo',    'activo', '2022-09-01', NULL),
  (9888777,  'Pedro Fernandez Luna',   '1980-02-02', 'Conyuge', 'activo', '2019-05-01', NULL);

INSERT INTO registra (ci, cedula_empleado, fecha_registro) VALUES
  (35111222, 14998877, '2024-01-01'),
  (22999888, 12345678, '2022-09-01'),
  (9888777,  15200300, '2019-05-01');

INSERT INTO carga_menor (ci, esquema_vacunacion, centro_edu_inic) VALUES
  (35111222, 'Completo: Pentavalente, MMR', 'Colegio Los Arcos');

INSERT INTO carga_mayor_estudiante (ci, constancia_estudio_ext, certificado_solteria) VALUES
  (22999888, 'Constancia UCV 2024-II', 'Certificado emitido 2024-01');

INSERT INTO entidad_prestadora (id_entidad, nombre) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Direccion de Cultura UCAB'),
  (2, 'Centro de Salud UCAB'),
  (3, 'Educacion Continua UCAB'),
  (4, 'Concesionaria Deportiva Guayana C.A.'),
  (5, 'TechCorp Soluciones C.A.');

ALTER TABLE entidad_prestadora ALTER COLUMN id_entidad RESTART WITH 6;

INSERT INTO propias_ucab (id_entidad, codigo_presupuestario, directores_de_oficina) VALUES
  (1, 'PRE-CULT-01', 'Lic. Ramon Perez'),
  (2, 'PRE-SAL-02',  'Dra. Marta Lopez'),
  (3, 'PRE-EDU-03',  'Mgr. Juan Rivas');

INSERT INTO organizacion_externa (id_entidad, rif, razon_social, contactos, fecha_de_vencimiento) VALUES
  (4, 'J-30111222-3', 'Concesionaria Deportiva Guayana C.A.', 'contacto@deportivaguayana.com', '2027-12-31'),
  (5, 'J-40555666-7', 'TechCorp Soluciones C.A.',             'rrhh@techcorp.com',            '2026-06-30');

INSERT INTO categoria (tipo_categoria, limite_costo_max) VALUES
  ('Salud',              5000.00),
  ('Educacion Continua', 8000.00),
  ('Cultura',            3000.00),
  ('Deporte',            4000.00);

INSERT INTO limite_categoria_sede (tipo_categoria, nombre_sede, monto_limt_max) VALUES
  ('Salud',              'Montalban', 5000.00), ('Salud',              'Guayana', 4200.00),
  ('Educacion Continua', 'Montalban', 8000.00), ('Educacion Continua', 'Guayana', 6800.00),
  ('Cultura',            'Montalban', 3000.00), ('Cultura',            'Guayana', 2550.00),
  ('Deporte',            'Montalban', 4000.00), ('Deporte',            'Guayana', 3400.00);

INSERT INTO servicio
  (codigo_servicio, id_entidad, tipo_categoria, nombre_sede, precio, descripcion_detallada, requisitos_de_acceso) VALUES
  ('SERV-001', 3, 'Educacion Continua', 'Montalban', 6000.00, 'Diplomado en Gerencia de Proyectos', 'Ser egresado o profesional'),
  ('SERV-002', 1, 'Cultura',            'Montalban', 1500.00, 'Alquiler de auditorio para eventos', 'Reserva con 72h de antelacion'),
  ('SERV-003', 2, 'Salud',              'Montalban',  800.00, 'Consulta medica preventiva',        'Carnet vigente'),
  ('SERV-004', 4, 'Deporte',            'Guayana',   1200.00, 'Alquiler de cancha deportiva',      'Pago por adelantado'),
  ('SERV-005', 3, 'Educacion Continua', 'Montalban',    0.00, 'Solicitud de Titulo de Grado',      'Solvencia y creditos completos');

INSERT INTO historial_tarifas
  (codigo_servicio, fecha_vigencia_inicio, fecha_vigencia_fin, tarifa_miembro_activo, tarifa_egresado, tarifa_publico_externo) VALUES
  ('SERV-001', '2025-01-01', NULL, 6000.00, 5400.00, 7200.00),
  ('SERV-002', '2025-01-01', NULL, 1500.00, 1500.00, 2000.00),
  ('SERV-003', '2025-01-01', NULL,  800.00,  900.00, 1200.00),
  ('SERV-004', '2025-01-01', NULL, 1200.00, 1200.00, 1500.00),
  ('SERV-005', '2025-01-01', NULL,    0.00,    0.00,    0.00);

INSERT INTO cargo_adicional (codigo_servicio, nombre_concepto, monto, tipo_suplemento) VALUES
  ('SERV-002', 'Soporte tecnico de sonido', 300.00, 'soporte'),
  ('SERV-001', 'Material de estudio',       500.00, 'material');

INSERT INTO acreditacion_requisito (id_acreditacion, nombre_requisito, tipo_documento) VALUES
  ('ACR-01', 'Solvencia administrativa',   'PDF'),
  ('ACR-02', 'Record academico',           'PDF'),
  ('ACR-03', 'Carnet estudiantil vigente', 'Imagen');

INSERT INTO requiere (codigo_servicio, id_acreditacion) VALUES
  ('SERV-005', 'ACR-01'),
  ('SERV-005', 'ACR-02'),
  ('SERV-003', 'ACR-03');

INSERT INTO oportunidad_laboral
  (id_vacante, id_entidad, cargo_solicitado, responsabilidad, estatus_vacante, beneficios, perfil_buscado, fecha_oferta) VALUES
  ('VAC-001', 5, 'Desarrollador Junior', 'Desarrollo de software a medida', 'disponible', 'Seguro HCM, bonos', 'Ingeniero informatico', '2026-05-01'),
  ('VAC-002', 4, 'Asistente Deportivo',  'Apoyo logistico en canchas',      'disponible', 'Comisiones',        'Prof edu fisica',                '2026-04-15');

INSERT INTO oficina_responsable (nombre_oficina, responsable_asignado) VALUES
  ('Caja',                 14998877),
  ('Secretaria Academica', 19888777),
  ('Rectorado',            NULL),
  ('Direccion de Cultura', NULL);

INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion) VALUES
  ('SOL-001', 26543210, 'SERV-005', 'en proceso', '2026-06-01 09:00:00'),
  ('SOL-002', 27111222, 'SERV-002', 'abierta',    '2026-06-05 10:30:00'),
  ('SOL-003', 10222333, 'SERV-001', 'cerrada',    '2026-03-10 08:00:00'),
  ('SOL-004', 26543210, 'SERV-003', 'cerrada',    '2026-05-20 11:00:00'),
  ('SOL-005', 10222333, 'SERV-004', 'cerrada',    '2026-04-01 09:00:00'),
  ('SOL-006', 27111222, 'SERV-003', 'cerrada',    '2026-06-08 14:00:00'),
  ('SOL-007', 26543210, 'SERV-001', 'abierta',    '2026-06-12 09:00:00');

INSERT INTO paso_actividad
  (id_solicitud, num_paso, nombre_paso, estado_paso, fecha_inicio, fecha_fin, nombre_oficina, responsable_asignado, paso_predecesor) VALUES
  ('SOL-001', 1, 'Verificacion de Solvencia', 'completado', '2026-06-01 09:00:00', '2026-06-02 10:00:00', 'Caja',                 14998877, NULL),
  ('SOL-001', 2, 'Validacion de creditos',    'en proceso', '2026-06-02 11:00:00', NULL,                  'Secretaria Academica', 19888777, 1),
  ('SOL-001', 3, 'Emision de documento',      'pendiente',  NULL,                  NULL,                  'Rectorado',            NULL,     2),
  ('SOL-002', 1, 'Verificacion de disponibilidad', 'completado', '2026-06-05 10:30:00', '2026-06-05 12:00:00', 'Direccion de Cultura', NULL, NULL);

INSERT INTO reserva
  (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas) VALUES
  ('SOL-002', 'Montalban', 'Edificio Cincuentenario', 'AUD-01', '2026-06-20', '08:00', '12:00', 'activa', 150);

INSERT INTO acompanante (id_solicitud, documento_identidad, nombre) VALUES
  ('SOL-002', 'V-31222333', 'Laura Mendez'),
  ('SOL-002', 'E-84111222', 'John Smith');

INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo) VALUES
  ('FOL-001', 'SOL-003', 'cerrado', '2026-03-15', 5900.00),
  ('FOL-002', 'SOL-002', 'abierto', '2026-06-05', 1800.00),
  ('FOL-003', 'SOL-001', 'abierto', '2026-06-01',    0.00),
  ('FOL-004', 'SOL-004', 'cerrado', '2026-05-20',  800.00),
  ('FOL-005', 'SOL-005', 'cerrado', '2026-04-01', 1200.00),
  ('FOL-006', 'SOL-006', 'cerrado', '2026-06-08',  800.00),
  ('FOL-007', 'SOL-007', 'abierto', '2026-06-12', 6000.00);

INSERT INTO linea_cargo
  (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley) VALUES
  ('FOL-001', 1, 'SERV-001', '2025-01-01', 'Diplomado en Gerencia (tarifa egresado)', 1, 5400.00, 0),
  ('FOL-001', 2, NULL,        NULL,        'Material de estudio',                       1,  500.00, 0),
  ('FOL-002', 1, 'SERV-002', '2025-01-01', 'Alquiler de auditorio',                     1, 1500.00, 0),
  ('FOL-002', 2, NULL,        NULL,        'Soporte tecnico de sonido',                 1,  300.00, 0),
  ('FOL-003', 1, 'SERV-005', '2025-01-01', 'Solicitud de Titulo de Grado',              1,    0.00, 0),
  ('FOL-004', 1, 'SERV-003', '2025-01-01', 'Consulta preventiva (miembro activo)',      1,  800.00, 0),
  ('FOL-005', 1, 'SERV-004', '2025-01-01', 'Alquiler de cancha (egresado)',             1, 1200.00, 0),
  ('FOL-006', 1, 'SERV-003', '2025-01-01', 'Consulta preventiva (miembro activo)',      1,  800.00, 0),
  ('FOL-007', 1, 'SERV-001', '2025-01-01', 'Diplomado en Gerencia (tarifa miembro)',    1, 6000.00, 0);

INSERT INTO factura
  (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad) VALUES
  ('FAC-001', 'FOL-001', '2026-03-20', 'pagada',  0.00, 10222333, NULL),
  ('FAC-002', 'FOL-002', '2026-06-10', 'parcial', 800.00, NULL,    5),
  ('FAC-004', 'FOL-004', '2026-05-21', 'pagada',  0.00, 26543210, NULL),
  ('FAC-005', 'FOL-005', '2026-04-02', 'pagada',  0.00, 10222333, NULL),
  ('FAC-006', 'FOL-006', '2026-06-08', 'pagada',  0.00, 27111222, NULL);

INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto) VALUES
  ('FAC-001', '2026-03-20 10:00:00', 36.50, 5900.00),
  ('FAC-002', '2026-06-10 11:00:00', 38.20,  600.00),
  ('FAC-002', '2026-06-11 09:00:00', 38.30,  400.00),
  ('FAC-004', '2026-05-21 14:00:00', 37.00,  800.00),
  ('FAC-005', '2026-04-02 16:00:00', 36.80, 1200.00),
  ('FAC-006', '2026-06-08 15:00:00', 38.00,  800.00);

INSERT INTO pago_virtual (num_control, fecha_movimiento) VALUES
  ('FAC-001', '2026-03-20 10:00:00'),
  ('FAC-005', '2026-04-02 16:00:00');

INSERT INTO pago_presencial (num_control, fecha_movimiento) VALUES
  ('FAC-002', '2026-06-10 11:00:00'),
  ('FAC-002', '2026-06-11 09:00:00'),
  ('FAC-004', '2026-05-21 14:00:00'),
  ('FAC-006', '2026-06-08 15:00:00');

INSERT INTO zelle (num_control, fecha_movimiento, correo_electronico, nombre, cod_confirmacion) VALUES
  ('FAC-001', '2026-03-20 10:00:00', 'roberto.diaz@gmail.com', 'Roberto Diaz', 'ZL-998877');

INSERT INTO criptomoneda (num_control, fecha_movimiento, cod_hash, red_utilizada, dir_billetera_origen, tasa_conversion) VALUES
  ('FAC-005', '2026-04-02 16:00:00', '0xA1B2C3D4E5', 'TRC20', 'TRX9xZ...kP2', 36.80);

INSERT INTO tarjeta (num_control, fecha_movimiento, num_tarjeta, fecha_vencimiento, compania_emisora, tipo_red) VALUES
  ('FAC-002', '2026-06-10 11:00:00', '4111-XXXX-XXXX-1234', '08/2028', 'Visa', 'Internacional');

INSERT INTO pago_movil (num_control, fecha_movimiento, num_telefono, banco_origen, num_referencia) VALUES
  ('FAC-002', '2026-06-11 09:00:00', '0414-3344556', 'Banesco', 'REF-554433');

INSERT INTO efectivo (num_control, fecha_movimiento, moneda_curso, monto_exacto, desglose_denominacion) VALUES
  ('FAC-004', '2026-05-21 14:00:00', 'Bolivares', 800.00, '8 billetes de 100');

INSERT INTO tai (num_control, fecha_movimiento, uid, cod_pos, saldo) VALUES
  ('FAC-006', '2026-06-08 15:00:00', 'NFC-UID-7788', 'POS-CAJA-01', 1200.00);

INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion) VALUES
  ('SOL-008', 30444555, 'SERV-002', 'cerrada',    '2026-05-01 10:00:00'),
  ('SOL-009', 16777888, 'SERV-003', 'cerrada',    '2026-05-10 09:00:00'),
  ('SOL-010', 28333444, 'SERV-004', 'abierta',    '2026-06-15 08:00:00'),
  ('SOL-011', 19888777, 'SERV-001', 'en proceso', '2026-06-10 11:00:00'),
  ('SOL-012', 14998877, 'SERV-003', 'cerrada',    '2026-04-20 14:00:00'),
  ('SOL-013', 15200300, 'SERV-002', 'en proceso', '2026-06-12 09:00:00'),
  ('SOL-014', 16777888, 'SERV-004', 'cerrada',    '2026-05-25 10:00:00'),
  ('SOL-015', 30444555, 'SERV-003', 'abierta',    '2026-06-16 08:30:00');

INSERT INTO reserva
  (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio, hora_fin, estado_reserva, cant_personas) VALUES
  ('SOL-008', 'Montalban', 'Edificio Cincuentenario',  'AUD-01',  '2026-05-05', '14:00', '18:00', 'finalizada', 80),
  ('SOL-013', 'Montalban', 'Edificio Cincuentenario',  'AUD-01',  '2026-06-25', '09:00', '13:00', 'activa',     120),
  ('SOL-011', 'Montalban', 'Edificio Cincuentenario',  'SAL-101', '2026-06-10', '08:00', '10:00', 'activa',     35),
  ('SOL-009', 'Montalban', 'Edificio Cincuentenario',  'SAL-101', '2026-05-12', '10:00', '12:00', 'finalizada', 20),
  ('SOL-010', 'Guayana',   'Edificio Principal',       'CAN-01',  '2026-06-20', '07:00', '09:00', 'activa',     22),
  ('SOL-014', 'Guayana',   'Edificio Principal',       'CAN-01',  '2026-05-28', '09:00', '11:00', 'finalizada', 18);

INSERT INTO oportunidad_laboral
  (id_vacante, id_entidad, cargo_solicitado, responsabilidad, estatus_vacante, beneficios, perfil_buscado, fecha_oferta) VALUES
  ('VAC-003', 5, 'Analista de Datos',     'Analisis de bases de datos y reportes BI',  'disponible', 'HCM + bono trimestral', 'Ingeniero informatico', '2026-05-15'),
  ('VAC-004', 5, 'Desarrollador Backend', 'APIs REST y microservicios',                'disponible', 'HCM + trabajo remoto',  'Ingeniero informatico', '2026-06-01'),
  ('VAC-005', 4, 'Coordinador Deportivo', 'Coordinacion de eventos y canchas',         'disponible', 'Comisiones + uniforme', 'Prof edu fisica',           '2026-06-05');

INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo) VALUES
  ('FOL-008', 'SOL-008', 'cerrado', '2026-05-02',  1800.00),
  ('FOL-009', 'SOL-009', 'cerrado', '2026-05-11',   800.00),
  ('FOL-010', 'SOL-012', 'cerrado', '2026-04-21',   800.00),
  ('FOL-011', 'SOL-014', 'cerrado', '2026-05-26',  1200.00);

INSERT INTO linea_cargo
  (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley) VALUES
  ('FOL-008', 1, 'SERV-002', '2025-01-01', 'Alquiler de auditorio (miembro activo)', 1, 1500.00, 0),
  ('FOL-008', 2, NULL,        NULL,        'Soporte tecnico de sonido',               1,  300.00, 0),
  ('FOL-009', 1, 'SERV-003', '2025-01-01', 'Consulta preventiva (docente)',           1,  800.00, 0),
  ('FOL-010', 1, 'SERV-003', '2025-01-01', 'Consulta preventiva (administrativo)',    1,  800.00, 0),
  ('FOL-011', 1, 'SERV-004', '2025-01-01', 'Alquiler de cancha (docente)',            1, 1200.00, 0);

INSERT INTO factura
  (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad) VALUES
  ('FAC-008', 'FOL-008', '2026-05-03', 'pendiente', 1800.00, 30444555, NULL),
  ('FAC-009', 'FOL-009', '2026-05-12', 'pendiente',  800.00, 16777888, NULL),
  ('FAC-010', 'FOL-010', '2026-04-22', 'pendiente',  800.00, 14998877, NULL),
  ('FAC-011', 'FOL-011', '2026-05-27', 'pendiente', 1200.00, 16777888, NULL);

INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto) VALUES
  ('FAC-009', '2026-05-12 10:00:00', 37.50,  800.00),
  ('FAC-010', '2026-04-22 11:00:00', 36.90,  800.00),
  ('FAC-011', '2026-05-27 15:00:00', 37.80, 1200.00);

INSERT INTO pago_presencial (num_control, fecha_movimiento) VALUES
  ('FAC-009', '2026-05-12 10:00:00'),
  ('FAC-010', '2026-04-22 11:00:00'),
  ('FAC-011', '2026-05-27 15:00:00');

INSERT INTO pago_movil (num_control, fecha_movimiento, num_telefono, banco_origen, num_referencia) VALUES
  ('FAC-009', '2026-05-12 10:00:00', '0412-5566778', 'Mercantil',  'REF-112233'),
  ('FAC-010', '2026-04-22 11:00:00', '0416-7788990', 'Venezuela',  'REF-445566');

INSERT INTO efectivo (num_control, fecha_movimiento, moneda_curso, monto_exacto, desglose_denominacion) VALUES
  ('FAC-011', '2026-05-27 15:00:00', 'Dolares', 1200.00, '12 billetes de 100');

INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion) VALUES
  ('SOL-017', 28333444, 'SERV-004', 'abierta', '2026-06-20 09:00:00');

INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo) VALUES
  ('FOL-013', 'SOL-017', 'cerrado', '2026-06-20', 1200.00);

INSERT INTO linea_cargo (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley) VALUES
  ('FOL-013', 1, 'SERV-004', '2025-01-01', 'Alquiler de cancha deportiva (2 horas)', 2, 600.00, 0);

INSERT INTO factura (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad) VALUES
  ('FAC-013', 'FOL-013', '2026-06-20', 'pendiente', 1200.00, 28333444, NULL);

INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion) VALUES
  ('SOL-018', 28333444, 'SERV-003', 'cerrada', '2026-06-05 11:00:00');

INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo) VALUES
  ('FOL-014', 'SOL-018', 'cerrado', '2026-06-05', 800.00);

INSERT INTO linea_cargo (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley) VALUES
  ('FOL-014', 1, 'SERV-003', '2025-01-01', 'Consulta medica preventiva', 1, 800.00, 0);

INSERT INTO factura (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad) VALUES
  ('FAC-014', 'FOL-014', '2026-06-05', 'pendiente', 800.00, 28333444, NULL);

INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto) VALUES
  ('FAC-014', '2026-06-06 10:00:00', 38.20, 300.00);

INSERT INTO pago_presencial (num_control, fecha_movimiento) VALUES
  ('FAC-014', '2026-06-06 10:00:00');

INSERT INTO efectivo (num_control, fecha_movimiento, moneda_curso, monto_exacto, desglose_denominacion) VALUES
  ('FAC-014', '2026-06-06 10:00:00', 'Dolares', 300.00, '3 billetes de 100');

INSERT INTO solicitud (id_solicitud, cedula_identidad, codigo_servicio, estado_general, fecha_creacion) VALUES
  ('SOL-019', 26543210, 'SERV-001', 'cerrada', '2026-05-10 08:00:00');

INSERT INTO folio_consumo (numero_folio, id_solicitud, estatus, fecha_emision, saldo) VALUES
  ('FOL-015', 'SOL-019', 'cerrado', '2026-05-10', 6000.00);

INSERT INTO linea_cargo (numero_folio, numero_item, codigo_servicio, fecha_vigencia_inicio, concepto, cantidad, precio_unitario, impuesto_ley) VALUES
  ('FOL-015', 1, 'SERV-001', '2025-01-01', 'Diplomado en Gerencia de Proyectos', 1, 6000.00, 0);

INSERT INTO factura (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad) VALUES
  ('FAC-015', 'FOL-015', '2026-05-10', 'pendiente', 6000.00, 26543210, NULL);

INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto) VALUES
  ('FAC-015', '2026-05-15 09:00:00', 37.90, 3500.00);

INSERT INTO pago_virtual (num_control, fecha_movimiento) VALUES
  ('FAC-015', '2026-05-15 09:00:00');

INSERT INTO zelle (num_control, fecha_movimiento, correo_electronico, nombre, cod_confirmacion) VALUES
  ('FAC-015', '2026-05-15 09:00:00', 'magonzalez@correo.ucab.edu.ve', 'Maria Gonzalez', 'ZL-554433');

INSERT INTO pago (num_control, fecha_movimiento, tasa_bcv, monto) VALUES
  ('FAC-015', '2026-05-22 14:00:00', 38.00, 2500.00);

INSERT INTO pago_presencial (num_control, fecha_movimiento) VALUES
  ('FAC-015', '2026-05-22 14:00:00');

INSERT INTO pago_movil (num_control, fecha_movimiento, num_telefono, banco_origen, num_referencia) VALUES
  ('FAC-015', '2026-05-22 14:00:00', '0414-1112233', 'Mercantil', 'REF-887766');

INSERT INTO parametro_sistema (clave, valor) VALUES
  ('tasa_bcv',    38.50),
  ('tasa_cripto', 38.50);

INSERT INTO entidad_prestadora (nombre) VALUES
  ('Soluciones Tecnológicas C.A.'),
  ('Ingeniería y Construcción del Sur S.A.'),
  ('Consultoría Administrativa Integral C.A.'),
  ('Redes y Comunicaciones del Caribe C.A.');

INSERT INTO organizacion_externa (id_entidad, rif, razon_social, contactos, fecha_de_vencimiento)
SELECT ep.id_entidad, v.rif, v.razon, v.contactos, v.venc::DATE
FROM (VALUES
  ('J-12345678-9', 'Soluciones Tecnológicas C.A.',             'contacto@soltec.com, 0412-1234567',   '2027-12-31'),
  ('J-87654321-0', 'Ingeniería y Construcción del Sur S.A.',   'gerencia@icsur.com, 0424-7654321',    '2028-06-30'),
  ('J-11223344-5', 'Consultoría Administrativa Integral C.A.', 'info@conadmin.com, 0416-9988776',     '2027-09-15'),
  ('J-55667788-1', 'Redes y Comunicaciones del Caribe C.A.',   'soporte@ryccaribe.com, 0412-9876543', '2026-11-01')
) AS v(rif, razon, contactos, venc)
JOIN entidad_prestadora ep ON ep.nombre = v.razon;

INSERT INTO oportunidad_laboral
  (id_vacante, id_entidad, cargo_solicitado, responsabilidad, estatus_vacante, beneficios, perfil_buscado, fecha_oferta)
SELECT v.id_vacante, ep.id_entidad, v.cargo, v.resp, 'disponible', v.benef, v.perfil, v.fecha::DATE
FROM (VALUES
 ('VAC-006','Soluciones Tecnológicas C.A.','Desarrollador Full Stack','Diseño y desarrollo de aplicaciones web con Node.js y React; mantenimiento de bases de datos.','Seguro HCM, bono de productividad, trabajo remoto híbrido','Ingeniero informatico','2026-06-01'),
 ('VAC-007','Redes y Comunicaciones del Caribe C.A.','Ingeniero de Redes y Telecomunicaciones','Diseño, implementación y optimización de redes LAN/WAN; configuración de enlaces de fibra óptica.','Seguro HCM, bonos por desempeño, plan de datos móviles','Ingeniero telecomunicacion','2026-06-05'),
 ('VAC-008','Ingeniería y Construcción del Sur S.A.','Ingeniero de Automatización','Diseño de sistemas de control para líneas de producción; programación de PLC y SCADA.','Seguro HCM, bonos por proyecto, uniforme y herramientas','Ingeniero mecatronica','2026-06-10'),
 ('VAC-009','Ingeniería y Construcción del Sur S.A.','Ingeniero de Proyectos de Infraestructura','Supervisión de obras civiles, control de calidad y cronogramas, elaboración de presupuestos.','Seguro HCM, bonos por cumplimiento, vehículo asignado','Ingeniero civil','2026-06-15'),
 ('VAC-010','Consultoría Administrativa Integral C.A.','Analista de Administración','Gestión de procesos administrativos, elaboración de informes de gestión, apoyo a la gerencia.','Seguro HCM, bonos por eficiencia, flexibilidad horaria','Licenciado administracion','2026-06-20'),
 ('VAC-011','Consultoría Administrativa Integral C.A.','Asesor Editorial / Redactor','Redacción y corrección de documentos institucionales, manuales y material comunicacional.','Seguro HCM, bonos por publicación, ambiente creativo','Licenciado letras','2026-07-01'),
 ('VAC-012','Ingeniería y Construcción del Sur S.A.','Ingeniero de Procesos','Optimización de procesos productivos, análisis de tiempos y movimientos, mejora continua.','Seguro HCM, bonos por productividad, oportunidades de capacitación','Ingeniero Industrial','2026-07-02'),
 ('VAC-013','Soluciones Tecnológicas C.A.','Ingeniero de Software (Backend)','Desarrollo de APIs RESTful, integración con servicios cloud, optimización de rendimiento.','Seguro HCM, bono de desempeño, presupuesto para cursos','Ingeniero informatico','2026-07-03'),
 ('VAC-014','Redes y Comunicaciones del Caribe C.A.','Ingeniero de Producción','Planificación y control de producción, gestión de inventarios y cadena de suministro.','Seguro HCM, bonos por cumplimiento de metas, participación en utilidades','Ingeniero Industrial','2026-07-04'),
 ('VAC-015','Redes y Comunicaciones del Caribe C.A.','Especialista en Comunicaciones Inalámbricas','Diseño y despliegue de redes 5G y Wi-Fi; análisis de espectro y cobertura.','Seguro HCM, bonos de certificación, equipo móvil de alta gama','Ingeniero telecomunicacion','2026-07-05')
) AS v(id_vacante, org, cargo, resp, benef, perfil, fecha)
JOIN entidad_prestadora ep ON ep.nombre = v.org;

INSERT INTO usuario (cedula_identidad, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
                     fecha_nacimiento, sexo, direccion_habitacion_detallada, numero_telefono,
                     correo_institucional, contrasena, intentos_fallidos_auth, estado_cuenta,
                     estatus_verificacion_dos_pasos, ult_fecha_cambio_cont, ultima_conexion)
VALUES
 (30000001,'Carlos','Andrés','González','Pérez','1998-03-15','M','Calle 5 #23-45, Urbanización El Bosque, Caracas','0412-1234567','carlos.gonzalez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000002,'María','Fernanda','López','Rodríguez','1997-07-22','F','Avenida Libertador #100, Edificio Central, Piso 3, Valencia','0424-9876543','maria.lopez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000003,'José','Luis','Martínez','García','1996-11-02','M','Calle 8 #12-30, Barrio Obrero, Maracaibo','0416-5551212','jose.martinez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000004,'Ana','Victoria','Sánchez','Ramírez','1999-09-14','F','Transversal 4 #67-89, Santa Mónica, Barquisimeto','0412-3334444','ana.sanchez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000005,'Luis','Alberto','Fernández','Díaz','1995-12-01','M','Calle 10 #45-67, Las Mercedes, Puerto Ordaz','0426-7778888','luis.fernandez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000006,'Laura','Beatriz','Gómez','Morales','1998-05-20','F','Avenida Los Próceres #88, El Cafetal, Caracas','0414-2223333','laura.gomez@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000007,'Jorge','Enrique','Rojas','Torres','1997-08-30','M','Calle 3 #22-11, Los Palos Grandes, Caracas','0412-1112222','jorge.rojas@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000008,'Patricia','Carolina','Mendoza','Paredes','1999-06-10','F','Calle 12 #34-56, La Trinidad, Baruta','0416-9988776','patricia.mendoza@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000009,'David','Eduardo','Castillo','Suárez','1996-04-25','M','Avenida Rómulo Betancourt #45, Bello Monte, Caracas','0424-5544332','david.castillo@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL),
 (30000010,'Andrea','Gabriela','Romero','Vivas','1998-10-17','F','Calle 7 #15-29, Los Dos Caminos, Caracas','0412-4433221','andrea.romero@ucab.edu.ve','$2b$10$3mhRhrI8eARSSDFR2N5NAu3YT9br5RCRNzjbv/hXyAEhiE21zVU62',0,'activa',FALSE,NULL,NULL);

INSERT INTO egresado (cedula_identidad, indice_academico_final, titulo, anio_graduacion) VALUES
 (30000001,16.75,'Ingeniero informatico',2021),
 (30000002,18.20,'Licenciado administracion',2020),
 (30000003,15.50,'Ingeniero industrial',2019),
 (30000004,17.30,'Ingeniero telecomunicacion',2022),
 (30000005,14.80,'Ingeniero mecatronica',2020),
 (30000006,19.00,'Licenciado letras',2019),
 (30000007,16.10,'Ingeniero civil',2018),
 (30000008,18.90,'Ingeniero informatico',2023),
 (30000009,15.20,'Ingeniero industrial',2021),
 (30000010,17.75,'Ingeniero telecomunicacion',2022);

INSERT INTO periodo_vinculacion (cedula_identidad, fecha_inicio, fecha_finalizacion, rol_activo) VALUES
 (30000001,'2016-09-01','2021-07-30','estudiante'), (30000001,'2021-07-30',NULL,'egresado'),
 (30000002,'2015-09-01','2020-07-30','estudiante'), (30000002,'2020-07-30',NULL,'egresado'),
 (30000003,'2014-09-01','2019-07-30','estudiante'), (30000003,'2019-07-30',NULL,'egresado'),
 (30000004,'2017-09-01','2022-07-30','estudiante'), (30000004,'2022-07-30',NULL,'egresado'),
 (30000005,'2015-09-01','2020-07-30','estudiante'), (30000005,'2020-07-30',NULL,'egresado'),
 (30000006,'2014-09-01','2019-07-30','estudiante'), (30000006,'2019-07-30',NULL,'egresado'),
 (30000007,'2013-09-01','2018-07-30','estudiante'), (30000007,'2018-07-30',NULL,'egresado'),
 (30000008,'2018-09-01','2023-07-30','estudiante'), (30000008,'2023-07-30',NULL,'egresado'),
 (30000009,'2016-09-01','2021-07-30','estudiante'), (30000009,'2021-07-30',NULL,'egresado'),
 (30000010,'2017-09-01','2022-07-30','estudiante'), (30000010,'2022-07-30',NULL,'egresado');

INSERT INTO posee (cedula_identidad, uid_billetera, saldo) VALUES
  (28333444, 'UID-TAI-PEDRO-001',   1500.00),
  (26543210, 'UID-TAI-MARIA-001',   3000.00),
  (30444555, 'UID-TAI-DANIELA-001',  100.00),
  (27111222, 'UID-TAI-JOSE-001',    2000.00),
  (30000001, 'UID-TAI-CARLOS-001',  1000.00);

INSERT INTO postula (cedula_identidad, id_vacante, estado_postulacion, fecha_postulacion) VALUES
  (30000001, 'VAC-001', 'postulado', '2026-06-02'),
  (30000008, 'VAC-006', 'postulado', '2026-06-03'),
  (30000001, 'VAC-013', 'postulado', '2026-07-04'),
  (30000004, 'VAC-007', 'postulado', '2026-06-06'),
  (30000010, 'VAC-015', 'postulado', '2026-07-06'),
  (30000005, 'VAC-008', 'postulado', '2026-06-11'),
  (30000007, 'VAC-009', 'postulado', '2026-06-16'),
  (30000002, 'VAC-010', 'postulado', '2026-06-21'),
  (30000006, 'VAC-011', 'postulado', '2026-07-02'),
  (30000003, 'VAC-012', 'postulado', '2026-07-03'),
  (30000009, 'VAC-014', 'postulado', '2026-07-05');

UPDATE factura f
SET saldo = GREATEST(fc.saldo - COALESCE(
              (SELECT SUM(p.monto) FROM pago p WHERE p.num_control = f.num_control), 0), 0),
    estatus = CASE
                WHEN COALESCE((SELECT SUM(p.monto) FROM pago p
                               WHERE p.num_control = f.num_control), 0) >= fc.saldo THEN 'pagada'
                WHEN COALESCE((SELECT SUM(p.monto) FROM pago p
                               WHERE p.num_control = f.num_control), 0) > 0         THEN 'parcial'
                ELSE 'pendiente'
              END
FROM folio_consumo fc
WHERE fc.numero_folio = f.numero_folio;