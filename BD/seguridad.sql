DO $$
DECLARE r TEXT;
BEGIN
    FOREACH r IN ARRAY ARRAY[
        'rol_estudiante','rol_docente','rol_personal_administrativo',
        'rol_egresado','rol_cajero','rol_aliado_externo','rol_admin_sistema'
    ] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format('DROP OWNED BY %I CASCADE', r);
            BEGIN
                EXECUTE format('DROP ROLE %I', r);
            EXCEPTION WHEN dependent_objects_still_exist THEN
                RAISE NOTICE 'Rol % conserva privilegios en otra base; se omite su DROP.', r;
            END;
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('rol_estudiante',              'est_2026'),
        ('rol_docente',                 'doc_2026'),
        ('rol_personal_administrativo', 'adm_2026'),
        ('rol_egresado',                'egr_2026'),
        ('rol_cajero',                  'caj_2026'),
        ('rol_aliado_externo',          'ali_2026'),
        ('rol_admin_sistema',           'sys_2026')
    ) AS v(nombre, clave) LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r.nombre) THEN
            EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', r.nombre, r.clave);
        ELSE
            EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', r.nombre, r.clave);
        END IF;
    END LOOP;
    EXECUTE 'ALTER ROLE rol_admin_sistema CREATEDB CREATEROLE';
END $$;

DO $$
BEGIN
    EXECUTE format(
        'GRANT CONNECT ON DATABASE %I TO
            rol_estudiante, rol_docente, rol_personal_administrativo,
            rol_egresado, rol_cajero, rol_aliado_externo, rol_admin_sistema',
        current_database()
    );
END $$;

GRANT USAGE ON SCHEMA public TO
    rol_estudiante, rol_docente, rol_personal_administrativo,
    rol_egresado, rol_cajero, rol_aliado_externo, rol_admin_sistema;

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO rol_admin_sistema;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin_sistema;

GRANT SELECT ON
    servicio, historial_tarifas, cargo_adicional, categoria, sede,
    edificacion, espacio_fisico, espacio_fisico_recurso,
    acreditacion_requisito, requiere, oportunidad_laboral
    TO rol_estudiante;

GRANT SELECT, INSERT ON solicitud, acompanante, reserva, postula
    TO rol_estudiante;

GRANT SELECT ON folio_consumo, linea_cargo, factura
    TO rol_estudiante;

GRANT INSERT ON sesion TO rol_estudiante;

GRANT SELECT ON
    servicio, historial_tarifas, cargo_adicional, categoria, sede,
    edificacion, espacio_fisico, espacio_fisico_recurso,
    acreditacion_requisito, requiere, oportunidad_laboral
    TO rol_docente;

GRANT SELECT, INSERT ON solicitud, acompanante, reserva, postula
    TO rol_docente;

GRANT SELECT ON folio_consumo, linea_cargo, factura TO rol_docente;
GRANT INSERT ON sesion TO rol_docente;

GRANT SELECT, INSERT, UPDATE ON
    vinculo_familiar, carga_menor, carga_mayor_estudiante
    TO rol_docente;

GRANT SELECT ON
    sede, edificacion, espacio_fisico, espacio_fisico_recurso,
    categoria, entidad_prestadora, propias_ucab, organizacion_externa
    TO rol_personal_administrativo;

GRANT SELECT, INSERT, UPDATE ON
    solicitud, paso_actividad, oficina_responsable, reserva,
    servicio, historial_tarifas, cargo_adicional,
    acreditacion_requisito, requiere, limite_categoria_sede
    TO rol_personal_administrativo;

GRANT SELECT, INSERT, UPDATE ON
    vinculo_familiar, carga_menor, carga_mayor_estudiante
    TO rol_personal_administrativo;

GRANT SELECT ON folio_consumo, linea_cargo, factura, pago
    TO rol_personal_administrativo;

GRANT INSERT ON sesion TO rol_personal_administrativo;

GRANT SELECT ON
    oportunidad_laboral, servicio, historial_tarifas, categoria, sede
    TO rol_egresado;

GRANT SELECT, INSERT ON postula, solicitud, reserva TO rol_egresado;
GRANT SELECT ON folio_consumo, linea_cargo, factura TO rol_egresado;
GRANT INSERT ON sesion TO rol_egresado;

GRANT SELECT ON factura, folio_consumo, linea_cargo, solicitud, usuario
    TO rol_cajero;

GRANT INSERT ON
    pago, pago_virtual, pago_presencial,
    zelle, criptomoneda, tarjeta, pago_movil, efectivo, tai
    TO rol_cajero;

GRANT UPDATE (saldo, estatus) ON factura TO rol_cajero;

GRANT SELECT ON oportunidad_laboral TO rol_aliado_externo;
GRANT SELECT ON v_postulantes_por_organizacion TO rol_aliado_externo;

REVOKE ALL ON usuario  FROM rol_aliado_externo;
REVOKE ALL ON egresado FROM rol_aliado_externo;
REVOKE ALL ON postula  FROM rol_aliado_externo;

ALTER TABLE oportunidad_laboral ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pol_aliado_sus_vacantes ON oportunidad_laboral;
CREATE POLICY pol_aliado_sus_vacantes ON oportunidad_laboral
    FOR SELECT
    TO rol_aliado_externo
    USING (
        id_entidad = NULLIF(current_setting('app.id_entidad', true), '')::INTEGER
    );

CREATE OR REPLACE VIEW v_postulantes_por_organizacion AS
SELECT op.id_entidad,
       op.id_vacante,
       op.cargo_solicitado,
       u.cedula_identidad,
       u.primer_nombre,
       u.primer_apellido,
       e.indice_academico_final,
       e.titulo,
       p.estado_postulacion,
       p.fecha_postulacion
FROM postula p
JOIN oportunidad_laboral op ON op.id_vacante    = p.id_vacante
JOIN usuario             u  ON u.cedula_identidad = p.cedula_identidad
LEFT JOIN egresado       e  ON e.cedula_identidad = p.cedula_identidad
WHERE op.id_entidad = NULLIF(current_setting('app.id_entidad', true), '')::INTEGER;

GRANT SELECT ON posee TO rol_estudiante, rol_docente, rol_egresado, rol_cajero,
                          rol_personal_administrativo;
GRANT SELECT ON parametro_sistema TO rol_cajero, rol_personal_administrativo;

GRANT SELECT, INSERT, UPDATE, DELETE ON registra
    TO rol_docente, rol_personal_administrativo;