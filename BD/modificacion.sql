ALTER TABLE postula DROP CONSTRAINT chk_estado_post;

UPDATE postula
SET estado_postulacion = CASE estado_postulacion
    WHEN 'Recibida'     THEN 'postularse'
    WHEN 'En Revision'  THEN 'postularse'
    WHEN 'Aceptada'     THEN 'postularse'
    WHEN 'Rechazada'    THEN 'postularse'
    ELSE estado_postulacion
END
WHERE estado_postulacion IN ('Recibida','En Revision','Aceptada','Rechazada');

ALTER TABLE postula
ADD CONSTRAINT chk_estado_post
CHECK (estado_postulacion IN ('postulado', 'postularse'));

UPDATE oportunidad_laboral
SET perfil_buscado = 'Ingeniero informatico'
WHERE id_vacante = 'VAC-001';

UPDATE oportunidad_laboral
SET perfil_buscado = 'Prof edu fisica'
WHERE id_vacante = 'VAC-002';

UPDATE oportunidad_laboral
SET perfil_buscado = 'Ingeniero informatico'
WHERE id_vacante = 'VAC-003';

UPDATE oportunidad_laboral
SET perfil_buscado = 'Ingeniero informatico'
WHERE id_vacante = 'VAC-004';

UPDATE oportunidad_laboral
SET perfil_buscado = 'Prof edu fisica'
WHERE id_vacante = 'VAC-005';

INSERT INTO entidad_prestadora (nombre) VALUES
('Soluciones Tecnológicas C.A.'),
('Ingeniería y Construcción del Sur S.A.'),
('Consultoría Administrativa Integral C.A.'),
('Redes y Comunicaciones del Caribe C.A.');

INSERT INTO organizacion_externa (id_entidad, rif, razon_social, contactos, fecha_de_vencimiento)
VALUES
(
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Soluciones Tecnológicas C.A.'),
    'J-12345678-9',
    'Soluciones Tecnológicas C.A.',
    'contacto@soltec.com, 0412-1234567',
    '2027-12-31'
),
(
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Ingeniería y Construcción del Sur S.A.'),
    'J-87654321-0',
    'Ingeniería y Construcción del Sur S.A.',
    'gerencia@icsur.com, 0424-7654321',
    '2028-06-30'
),
(
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Consultoría Administrativa Integral C.A.'),
    'J-11223344-5',
    'Consultoría Administrativa Integral C.A.',
    'info@conadmin.com, 0416-9988776',
    '2027-09-15'
),
(
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Redes y Comunicaciones del Caribe C.A.'),
    'J-55667788-1',
    'Redes y Comunicaciones del Caribe C.A.',
    'soporte@ryccaribe.com, 0412-9876543',
    '2026-11-01'
);

INSERT INTO oportunidad_laboral
  (id_vacante, id_entidad, cargo_solicitado, responsabilidad, estatus_vacante, beneficios, perfil_buscado, fecha_oferta)
VALUES
(
    'VAC-006',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Soluciones Tecnológicas C.A.'),
    'Desarrollador Full Stack',
    'Diseño y desarrollo de aplicaciones web con Node.js y React; mantenimiento de bases de datos.',
    'disponible',
    'Seguro HCM, bono de productividad, trabajo remoto híbrido',
    'Ingeniero informatico',
    '2026-06-01'
),
(
    'VAC-007',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Redes y Comunicaciones del Caribe C.A.'),
    'Ingeniero de Redes y Telecomunicaciones',
    'Diseño, implementación y optimización de redes LAN/WAN; configuración de enlaces de fibra óptica.',
    'disponible',
    'Seguro HCM, bonos por desempeño, plan de datos móviles',
    'Ingeniero telecomunicacion',
    '2026-06-05'
),
(
    'VAC-008',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Ingeniería y Construcción del Sur S.A.'),
    'Ingeniero de Automatización',
    'Diseño de sistemas de control para líneas de producción; programación de PLC y SCADA.',
    'disponible',
    'Seguro HCM, bonos por proyecto, uniforme y herramientas',
    'Ingeniero mecatronica',
    '2026-06-10'
),
(
    'VAC-009',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Ingeniería y Construcción del Sur S.A.'),
    'Ingeniero de Proyectos de Infraestructura',
    'Supervisión de obras civiles, control de calidad y cronogramas, elaboración de presupuestos.',
    'disponible',
    'Seguro HCM, bonos por cumplimiento, vehículo asignado',
    'Ingeniero civil',
    '2026-06-15'
),
(
    'VAC-010',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Consultoría Administrativa Integral C.A.'),
    'Analista de Administración',
    'Gestión de procesos administrativos, elaboración de informes de gestión, apoyo a la gerencia.',
    'disponible',
    'Seguro HCM, bonos por eficiencia, flexibilidad horaria',
    'Licenciado administracion',
    '2026-06-20'
),
(
    'VAC-011',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Consultoría Administrativa Integral C.A.'),
    'Asesor Editorial / Redactor',
    'Redacción y corrección de documentos institucionales, manuales y material comunicacional.',
    'disponible',
    'Seguro HCM, bonos por publicación, ambiente creativo',
    'Licenciado letras',
    '2026-07-01'
),
(
    'VAC-012',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Ingeniería y Construcción del Sur S.A.'),
    'Ingeniero de Procesos',
    'Optimización de procesos productivos, análisis de tiempos y movimientos, mejora continua.',
    'disponible',
    'Seguro HCM, bonos por productividad, oportunidades de capacitación',
    'Ingeniero Industrial',
    '2026-07-02'
),
(
    'VAC-013',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Soluciones Tecnológicas C.A.'),
    'Ingeniero de Software (Backend)',
    'Desarrollo de APIs RESTful, integración con servicios cloud, optimización de rendimiento.',
    'disponible',
    'Seguro HCM, bono de desempeño, presupuesto para cursos',
    'Ingeniero informatico',
    '2026-07-03'
),
(
    'VAC-014',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Redes y Comunicaciones del Caribe C.A.'),
    'Ingeniero de Producción',
    'Planificación y control de producción, gestión de inventarios y cadena de suministro.',
    'disponible',
    'Seguro HCM, bonos por cumplimiento de metas, participación en utilidades',
    'Ingeniero Industrial',
    '2026-07-04'
),
(
    'VAC-015',
    (SELECT id_entidad FROM entidad_prestadora WHERE nombre = 'Redes y Comunicaciones del Caribe C.A.'),
    'Especialista en Comunicaciones Inalámbricas',
    'Diseño y despliegue de redes 5G y Wi-Fi; análisis de espectro y cobertura.',
    'disponible',
    'Seguro HCM, bonos de certificación, equipo móvil de alta gama',
    'Ingeniero telecomunicacion',
    '2026-07-05'
);

DELETE FROM postula;

INSERT INTO usuario (
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
    intentos_fallidos_auth,
    estado_cuenta,
    estatus_verificacion_dos_pasos,
    ult_fecha_cambio_cont,
    ultima_conexion
) VALUES
(
    30000001,
    'Carlos',
    'Andrés',
    'González',
    'Pérez',
    '1998-03-15',
    'M',
    'Calle 5 #23-45, Urbanización El Bosque, Caracas',
    '0412-1234567',
    'carlos.gonzalez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000002,
    'María',
    'Fernanda',
    'López',
    'Rodríguez',
    '1997-07-22',
    'F',
    'Avenida Libertador #100, Edificio Central, Piso 3, Valencia',
    '0424-9876543',
    'maria.lopez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000003,
    'José',
    'Luis',
    'Martínez',
    'García',
    '1996-11-02',
    'M',
    'Calle 8 #12-30, Barrio Obrero, Maracaibo',
    '0416-5551212',
    'jose.martinez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000004,
    'Ana',
    'Victoria',
    'Sánchez',
    'Ramírez',
    '1999-09-14',
    'F',
    'Transversal 4 #67-89, Santa Mónica, Barquisimeto',
    '0412-3334444',
    'ana.sanchez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000005,
    'Luis',
    'Alberto',
    'Fernández',
    'Díaz',
    '1995-12-01',
    'M',
    'Calle 10 #45-67, Las Mercedes, Puerto Ordaz',
    '0426-7778888',
    'luis.fernandez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000006,
    'Laura',
    'Beatriz',
    'Gómez',
    'Morales',
    '1998-05-20',
    'F',
    'Avenida Los Próceres #88, El Cafetal, Caracas',
    '0414-2223333',
    'laura.gomez@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000007,
    'Jorge',
    'Enrique',
    'Rojas',
    'Torres',
    '1997-08-30',
    'M',
    'Calle 3 #22-11, Los Palos Grandes, Caracas',
    '0412-1112222',
    'jorge.rojas@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000008,
    'Patricia',
    'Carolina',
    'Mendoza',
    'Paredes',
    '1999-06-10',
    'F',
    'Calle 12 #34-56, La Trinidad, Baruta',
    '0416-9988776',
    'patricia.mendoza@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000009,
    'David',
    'Eduardo',
    'Castillo',
    'Suárez',
    '1996-04-25',
    'M',
    'Avenida Rómulo Betancourt #45, Bello Monte, Caracas',
    '0424-5544332',
    'david.castillo@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
),
(
    30000010,
    'Andrea',
    'Gabriela',
    'Romero',
    'Vivas',
    '1998-10-17',
    'F',
    'Calle 7 #15-29, Los Dos Caminos, Caracas',
    '0412-4433221',
    'andrea.romero@ucab.edu.ve',
    '$2b$10$e0MYzXytpOmG5JmJjV0TMOkz4JNwq9iL5L5L5L5L5L5L5L5L5L5',
    0,
    'activa',
    false,
    NULL,
    NULL
);

INSERT INTO egresado (
    cedula_identidad,
    indice_academico_final,
    titulo,
    anio_graduacion
) VALUES
(30000001, 16.75, 'Ingeniero informatico', 2021),
(30000002, 18.20, 'Licenciado administracion', 2020),
(30000003, 15.50, 'Ingeniero industrial', 2019),
(30000004, 17.30, 'Ingeniero telecomunicacion', 2022),
(30000005, 14.80, 'Ingeniero mecatronica', 2020),
(30000006, 19.00, 'Licenciado letras', 2019),
(30000007, 16.10, 'Ingeniero civil', 2018),
(30000008, 18.90, 'Ingeniero informatico', 2023),
(30000009, 15.20, 'Ingeniero industrial', 2021),
(30000010, 17.75, 'Ingeniero telecomunicacion', 2022);

CREATE OR REPLACE FUNCTION postular_egresado(
    p_cedula INTEGER,
    p_id_vacante VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_titulo_egresado VARCHAR;
    v_perfil_buscado VARCHAR;
    v_estatus_vacante VARCHAR;
BEGIN
    SELECT titulo INTO v_titulo_egresado
    FROM egresado
    WHERE cedula_identidad = p_cedula;

    IF v_titulo_egresado IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Egresado no encontrado.');
    END IF;

    SELECT perfil_buscado, estatus_vacante
    INTO v_perfil_buscado, v_estatus_vacante
    FROM oportunidad_laboral
    WHERE id_vacante = p_id_vacante;

    IF v_perfil_buscado IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Vacante no encontrada.');
    END IF;

    IF v_estatus_vacante != 'disponible' THEN
        RETURN json_build_object('success', false, 'message', 'Esta vacante ya no está disponible.');
    END IF;

    IF v_titulo_egresado != v_perfil_buscado THEN
        RETURN json_build_object('success', false, 'message', 'Usted no cumple con el perfil que se busca.');
    END IF;

    INSERT INTO postula (cedula_identidad, id_vacante, estado_postulacion, fecha_postulacion)
    VALUES (p_cedula, p_id_vacante, 'postulado', CURRENT_DATE);

    RETURN json_build_object('success', true, 'message', 'Postulación enviada correctamente.');

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object('success', false, 'message', 'Ya te has postulado a esta vacante.');
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;