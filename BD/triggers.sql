CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS parametro_sistema (
    clave VARCHAR(40)  PRIMARY KEY,
    valor NUMERIC(18,6) NOT NULL
);
INSERT INTO parametro_sistema (clave, valor) VALUES ('tasa_bcv', 38.50)
    ON CONFLICT (clave) DO NOTHING;

DROP TRIGGER IF EXISTS trg_solicitud_vinculacion ON solicitud;
DROP TRIGGER IF EXISTS trg_paso_control          ON paso_actividad;
DROP TRIGGER IF EXISTS trg_reserva_aforo          ON reserva;
DROP TRIGGER IF EXISTS trg_servicio_precio        ON servicio;
DROP TRIGGER IF EXISTS trg_sede_reval             ON sede;
DROP TRIGGER IF EXISTS trg_limite_reval           ON limite_categoria_sede;
DROP TRIGGER IF EXISTS trg_vinculo_registrador    ON vinculo_familiar;
DROP TRIGGER IF EXISTS trg_pago_factura           ON pago;
DROP TRIGGER IF EXISTS trg_suspender_cuenta       ON periodo_vinculacion;
DROP TRIGGER IF EXISTS trg_acomp_solicitud_abierta ON acompanante;
DROP TRIGGER IF EXISTS trg_entidad_disj_propia    ON propias_ucab;
DROP TRIGGER IF EXISTS trg_entidad_disj_externa   ON organizacion_externa;
DROP TRIGGER IF EXISTS trg_vinculo_disj_menor     ON carga_menor;
DROP TRIGGER IF EXISTS trg_vinculo_disj_mayor     ON carga_mayor_estudiante;
DROP TRIGGER IF EXISTS trg_pago_disj_virtual      ON pago_virtual;
DROP TRIGGER IF EXISTS trg_pago_disj_presencial   ON pago_presencial;

ALTER TABLE periodo_vinculacion DROP CONSTRAINT IF EXISTS excl_periodos_solapados;
ALTER TABLE reserva             DROP CONSTRAINT IF EXISTS excl_reservas_solapadas;

ALTER TABLE periodo_vinculacion
    ADD CONSTRAINT excl_periodos_solapados
    EXCLUDE USING gist (
        cedula_identidad WITH =,
        daterange(fecha_inicio, fecha_finalizacion) WITH &&
    );

ALTER TABLE reserva
    ADD CONSTRAINT excl_reservas_solapadas
    EXCLUDE USING gist (
        nombre_sede       WITH =,
        nombre_edif       WITH =,
        num_identificador WITH =,
        tsrange(fecha_reserva + hora_inicio, fecha_reserva + hora_fin) WITH &&
    ) WHERE (estado_reserva <> 'cancelada');

CREATE OR REPLACE FUNCTION fn_solicitud_vinculacion_vigente()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM periodo_vinculacion p
        WHERE p.cedula_identidad = NEW.cedula_identidad
          AND (p.fecha_finalizacion IS NULL OR p.fecha_finalizacion >= CURRENT_DATE)
    ) THEN
        RAISE EXCEPTION 'R6: el usuario % no tiene vinculacion vigente; no puede crear solicitudes.', NEW.cedula_identidad;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_solicitud_vinculacion
    BEFORE INSERT ON solicitud
    FOR EACH ROW EXECUTE FUNCTION fn_solicitud_vinculacion_vigente();

CREATE OR REPLACE FUNCTION fn_paso_actividad_control()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.estado_paso = 'completado' THEN
        IF EXISTS (
            SELECT 1 FROM paso_actividad a
            WHERE a.id_solicitud = NEW.id_solicitud
              AND a.num_paso < NEW.num_paso
              AND a.estado_paso <> 'completado'
        ) THEN
            RAISE EXCEPTION 'R7: no se puede completar el paso % de % ; hay pasos anteriores sin completar.',
                NEW.num_paso, NEW.id_solicitud;
        END IF;
        IF NEW.fecha_fin IS NULL THEN
            NEW.fecha_fin := CURRENT_TIMESTAMP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_paso_control
    BEFORE INSERT OR UPDATE ON paso_actividad
    FOR EACH ROW EXECUTE FUNCTION fn_paso_actividad_control();

CREATE OR REPLACE FUNCTION fn_reserva_aforo()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE v_aforo INTEGER;
BEGIN
    SELECT cap_maxima_aforo INTO v_aforo
    FROM espacio_fisico
    WHERE nombre_sede = NEW.nombre_sede
      AND nombre_edif = NEW.nombre_edif
      AND num_identificador = NEW.num_identificador;

    IF NEW.cant_personas IS NOT NULL AND v_aforo IS NOT NULL AND NEW.cant_personas > v_aforo THEN
        RAISE EXCEPTION 'R13: la reserva (% personas) supera el aforo del espacio (% personas).',
            NEW.cant_personas, v_aforo;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reserva_aforo
    BEFORE INSERT OR UPDATE ON reserva
    FOR EACH ROW EXECUTE FUNCTION fn_reserva_aforo();

CREATE OR REPLACE FUNCTION fn_valida_precio_servicio()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE v_factor NUMERIC; v_limite NUMERIC; v_final NUMERIC;
BEGIN
    SELECT factor_ajuste INTO v_factor FROM sede WHERE nombre_sede = NEW.nombre_sede;
    SELECT monto_limt_max INTO v_limite FROM limite_categoria_sede
        WHERE tipo_categoria = NEW.tipo_categoria AND nombre_sede = NEW.nombre_sede;

    IF v_limite IS NOT NULL THEN
        v_final := NEW.precio * COALESCE(v_factor, 1);
        IF v_final > v_limite THEN
            RAISE EXCEPTION 'R10: el precio final % (precio % x factor %) supera el limite % de la categoria % en la sede %.',
                v_final, NEW.precio, COALESCE(v_factor,1), v_limite, NEW.tipo_categoria, NEW.nombre_sede;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servicio_precio
    BEFORE INSERT OR UPDATE ON servicio
    FOR EACH ROW EXECUTE FUNCTION fn_valida_precio_servicio();

CREATE OR REPLACE FUNCTION fn_reval_factor_sede()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE r RECORD; v_limite NUMERIC;
BEGIN
    FOR r IN SELECT * FROM servicio WHERE nombre_sede = NEW.nombre_sede LOOP
        SELECT monto_limt_max INTO v_limite FROM limite_categoria_sede
            WHERE tipo_categoria = r.tipo_categoria AND nombre_sede = r.nombre_sede;
        IF v_limite IS NOT NULL AND (r.precio * NEW.factor_ajuste) > v_limite THEN
            RAISE EXCEPTION 'R10: cambiar el factor de % rompe el limite del servicio %.',
                NEW.nombre_sede, r.codigo_servicio;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sede_reval
    BEFORE UPDATE OF factor_ajuste ON sede
    FOR EACH ROW EXECUTE FUNCTION fn_reval_factor_sede();

CREATE OR REPLACE FUNCTION fn_reval_limite()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE r RECORD; v_factor NUMERIC;
BEGIN
    SELECT factor_ajuste INTO v_factor FROM sede WHERE nombre_sede = NEW.nombre_sede;
    FOR r IN SELECT * FROM servicio
             WHERE tipo_categoria = NEW.tipo_categoria AND nombre_sede = NEW.nombre_sede LOOP
        IF (r.precio * COALESCE(v_factor,1)) > NEW.monto_limt_max THEN
            RAISE EXCEPTION 'R10: el nuevo limite % deja fuera de rango al servicio %.',
                NEW.monto_limt_max, r.codigo_servicio;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limite_reval
    BEFORE INSERT OR UPDATE ON limite_categoria_sede
    FOR EACH ROW EXECUTE FUNCTION fn_reval_limite();

CREATE OR REPLACE FUNCTION fn_vinculo_registrador_valido()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM docente WHERE cedula_identidad = NEW.cedula_empleado)
       AND NOT EXISTS (SELECT 1 FROM personal_administrativo WHERE cedula_identidad = NEW.cedula_empleado)
    THEN
        RAISE EXCEPTION 'R11: el registrador % debe ser docente o personal administrativo.', NEW.cedula_empleado;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM periodo_vinculacion p
        WHERE p.cedula_identidad = NEW.cedula_empleado
          AND (p.fecha_finalizacion IS NULL OR p.fecha_finalizacion >= CURRENT_DATE)
    ) THEN
        RAISE EXCEPTION 'R11: el registrador % no tiene vinculacion vigente.', NEW.cedula_empleado;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vinculo_registrador
    BEFORE INSERT OR UPDATE ON registra
    FOR EACH ROW EXECUTE FUNCTION fn_vinculo_registrador_valido();

CREATE OR REPLACE FUNCTION fn_pago_actualiza_factura()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE v_saldo NUMERIC;
BEGIN
    SELECT saldo INTO v_saldo FROM factura WHERE num_control = NEW.num_control FOR UPDATE;

    IF NEW.monto > v_saldo THEN
        RAISE EXCEPTION 'El abono % excede el saldo pendiente % de la factura %.',
            NEW.monto, v_saldo, NEW.num_control;
    END IF;

    UPDATE factura
       SET saldo   = v_saldo - NEW.monto,
           estatus = CASE WHEN (v_saldo - NEW.monto) = 0 THEN 'pagada' ELSE 'parcial' END
     WHERE num_control = NEW.num_control;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pago_factura
    AFTER INSERT ON pago
    FOR EACH ROW EXECUTE FUNCTION fn_pago_actualiza_factura();

CREATE OR REPLACE FUNCTION fn_suspender_sin_vinculacion()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM periodo_vinculacion p
        WHERE p.cedula_identidad = NEW.cedula_identidad
          AND (p.fecha_finalizacion IS NULL OR p.fecha_finalizacion >= CURRENT_DATE)
    ) THEN
        UPDATE usuario SET estado_cuenta = 'suspendida'
        WHERE cedula_identidad = NEW.cedula_identidad AND estado_cuenta = 'activa';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_suspender_cuenta
    AFTER INSERT OR UPDATE ON periodo_vinculacion
    FOR EACH ROW EXECUTE FUNCTION fn_suspender_sin_vinculacion();

CREATE OR REPLACE FUNCTION fn_acomp_solicitud_abierta()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE v_estado VARCHAR;
BEGIN
    SELECT estado_general INTO v_estado FROM solicitud WHERE id_solicitud = NEW.id_solicitud;
    IF v_estado = 'cerrada' THEN
        RAISE EXCEPTION 'R4: no se pueden agregar acompanantes a la solicitud % porque ya esta cerrada.', NEW.id_solicitud;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_acomp_solicitud_abierta
    BEFORE INSERT ON acompanante
    FOR EACH ROW EXECUTE FUNCTION fn_acomp_solicitud_abierta();

CREATE OR REPLACE FUNCTION fn_entidad_disjunta()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF TG_TABLE_NAME = 'propias_ucab' THEN
        IF EXISTS (SELECT 1 FROM organizacion_externa WHERE id_entidad = NEW.id_entidad) THEN
            RAISE EXCEPTION 'Especializacion: la entidad % ya es organizacion_externa.', NEW.id_entidad;
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM propias_ucab WHERE id_entidad = NEW.id_entidad) THEN
            RAISE EXCEPTION 'Especializacion: la entidad % ya es propia UCAB.', NEW.id_entidad;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entidad_disj_propia
    BEFORE INSERT ON propias_ucab
    FOR EACH ROW EXECUTE FUNCTION fn_entidad_disjunta();
CREATE TRIGGER trg_entidad_disj_externa
    BEFORE INSERT ON organizacion_externa
    FOR EACH ROW EXECUTE FUNCTION fn_entidad_disjunta();

CREATE OR REPLACE FUNCTION fn_vinculo_disjunto()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF TG_TABLE_NAME = 'carga_menor' THEN
        IF EXISTS (SELECT 1 FROM carga_mayor_estudiante WHERE ci = NEW.ci) THEN
            RAISE EXCEPTION 'Especializacion: el familiar % ya es carga_mayor_estudiante.', NEW.ci;
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM carga_menor WHERE ci = NEW.ci) THEN
            RAISE EXCEPTION 'Especializacion: el familiar % ya es carga_menor.', NEW.ci;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vinculo_disj_menor
    BEFORE INSERT ON carga_menor
    FOR EACH ROW EXECUTE FUNCTION fn_vinculo_disjunto();
CREATE TRIGGER trg_vinculo_disj_mayor
    BEFORE INSERT ON carga_mayor_estudiante
    FOR EACH ROW EXECUTE FUNCTION fn_vinculo_disjunto();

CREATE OR REPLACE FUNCTION fn_pago_disjunto()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
    IF TG_TABLE_NAME = 'pago_virtual' THEN
        IF EXISTS (SELECT 1 FROM pago_presencial
                   WHERE num_control = NEW.num_control AND fecha_movimiento = NEW.fecha_movimiento) THEN
            RAISE EXCEPTION 'Especializacion: el pago (% , %) ya es presencial.', NEW.num_control, NEW.fecha_movimiento;
        END IF;
    ELSE
        IF EXISTS (SELECT 1 FROM pago_virtual
                   WHERE num_control = NEW.num_control AND fecha_movimiento = NEW.fecha_movimiento) THEN
            RAISE EXCEPTION 'Especializacion: el pago (% , %) ya es virtual.', NEW.num_control, NEW.fecha_movimiento;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pago_disj_virtual
    BEFORE INSERT ON pago_virtual
    FOR EACH ROW EXECUTE FUNCTION fn_pago_disjunto();
CREATE TRIGGER trg_pago_disj_presencial
    BEFORE INSERT ON pago_presencial
    FOR EACH ROW EXECUTE FUNCTION fn_pago_disjunto();

CREATE OR REPLACE FUNCTION fn_monto_total_acumulado(p_id_solicitud VARCHAR)
RETURNS NUMERIC AS $$
    SELECT COALESCE(SUM(lc.cantidad * lc.precio_unitario + lc.impuesto_ley), 0)
    FROM folio_consumo fc
    JOIN linea_cargo lc ON lc.numero_folio = fc.numero_folio
    WHERE fc.id_solicitud = p_id_solicitud;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_espacio_disponible(
    p_sede VARCHAR, p_edif VARCHAR, p_num VARCHAR,
    p_fecha DATE, p_ini TIME, p_fin TIME)
RETURNS BOOLEAN AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM reserva r
        WHERE r.nombre_sede = p_sede AND r.nombre_edif = p_edif AND r.num_identificador = p_num
          AND r.fecha_reserva = p_fecha
          AND r.estado_reserva <> 'cancelada'
          AND r.hora_inicio < p_fin AND p_ini < r.hora_fin
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION fn_tiempo_resolucion(p_id_solicitud VARCHAR)
RETURNS INTEGER AS $$
DECLARE v_ini DATE; v_fin DATE; v_estado VARCHAR; v_dias INT := 0; d DATE;
BEGIN
    SELECT fecha_creacion::date, estado_general INTO v_ini, v_estado
    FROM solicitud WHERE id_solicitud = p_id_solicitud;

    IF v_estado <> 'cerrada' THEN
        RETURN NULL;
    END IF;

    SELECT MAX(fecha_fin)::date INTO v_fin
    FROM paso_actividad WHERE id_solicitud = p_id_solicitud;
    IF v_fin IS NULL THEN v_fin := CURRENT_DATE; END IF;

    d := v_ini;
    WHILE d <= v_fin LOOP
        IF EXTRACT(ISODOW FROM d) < 6 THEN
            v_dias := v_dias + 1;
        END IF;
        d := d + 1;
    END LOOP;
    RETURN v_dias;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_indice_recurrencia(p_cedula INTEGER)
RETURNS NUMERIC AS $$
DECLARE v_solic INT; v_res INT; v_pag INT;
BEGIN
    SELECT COUNT(*) INTO v_solic FROM solicitud
        WHERE cedula_identidad = p_cedula AND estado_general = 'cerrada';
    SELECT COUNT(*) INTO v_res FROM reserva r
        JOIN solicitud s ON s.id_solicitud = r.id_solicitud
        WHERE s.cedula_identidad = p_cedula;
    SELECT COUNT(*) INTO v_pag FROM factura
        WHERE cedula_identidad = p_cedula AND estatus = 'pagada';
    RETURN (v_solic * 1.0) + (v_res * 0.5) + (v_pag * 1.5);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_costo_final(p_codigo_servicio VARCHAR, p_cedula INTEGER)
RETURNS NUMERIC AS $$
DECLARE v_precio NUMERIC; v_factor NUMERIC; v_idx NUMERIC; v_desc NUMERIC;
BEGIN
    SELECT s.precio, sd.factor_ajuste INTO v_precio, v_factor
    FROM servicio s JOIN sede sd ON sd.nombre_sede = s.nombre_sede
    WHERE s.codigo_servicio = p_codigo_servicio;

    v_idx := fn_indice_recurrencia(p_cedula);
    v_desc := CASE WHEN v_idx >= 5 THEN 0.10
                   WHEN v_idx >= 2 THEN 0.05
                   ELSE 0 END;

    RETURN ROUND(v_precio * COALESCE(v_factor,1) * (1 - v_desc), 2);
END;
$$ LANGUAGE plpgsql STABLE;

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
JOIN oportunidad_laboral op ON op.id_vacante = p.id_vacante
JOIN usuario u              ON u.cedula_identidad = p.cedula_identidad
LEFT JOIN egresado e        ON e.cedula_identidad = p.cedula_identidad;

CREATE OR REPLACE PROCEDURE sp_cierre_masivo_folios()
LANGUAGE plpgsql AS $$
DECLARE r RECORD; v_cedula INTEGER;
BEGIN
    FOR r IN
        SELECT fc.* FROM folio_consumo fc
        WHERE fc.estatus = 'abierto' AND fc.saldo > 0
          AND NOT EXISTS (SELECT 1 FROM factura f WHERE f.numero_folio = fc.numero_folio)
    LOOP
        SELECT s.cedula_identidad INTO v_cedula
        FROM solicitud s WHERE s.id_solicitud = r.id_solicitud;

        INSERT INTO factura (num_control, numero_folio, fecha_emision, estatus, saldo, cedula_identidad, id_entidad)
        VALUES ('FAC-' || r.numero_folio, r.numero_folio, CURRENT_DATE, 'pendiente', r.saldo, v_cedula, NULL);

        UPDATE folio_consumo SET estatus = 'cerrado' WHERE numero_folio = r.numero_folio;
    END LOOP;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_actualizar_tasa_bcv(p_nueva_tasa NUMERIC)
LANGUAGE plpgsql AS $$
BEGIN
    IF p_nueva_tasa <= 0 THEN
        RAISE EXCEPTION 'La tasa BCV debe ser positiva.';
    END IF;
    UPDATE parametro_sistema SET valor = p_nueva_tasa WHERE clave = 'tasa_bcv';
END;
$$;

CREATE OR REPLACE PROCEDURE sp_limpieza_expirados()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM acompanante a
    USING solicitud s
    WHERE a.id_solicitud = s.id_solicitud
      AND s.estado_general = 'cerrada'
      AND s.fecha_creacion < CURRENT_DATE - INTERVAL '1 year';

    UPDATE vinculo_familiar
    SET estado_vinculo = 'inactivo'
    WHERE fecha_fin_vinculo IS NOT NULL
      AND fecha_fin_vinculo < CURRENT_DATE - INTERVAL '1 year'
      AND estado_vinculo = 'activo';
END;
$$;

CREATE OR REPLACE PROCEDURE sp_reclasificar_familiares()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM carga_menor cm
    USING vinculo_familiar v
    WHERE cm.ci = v.ci
      AND date_part('year', age(v.fecha_nac)) >= 18;

    UPDATE vinculo_familiar v
    SET estado_vinculo = 'inactivo'
    WHERE date_part('year', age(v.fecha_nac)) > 25
      AND v.parentesco <> 'Conyuge'
      AND v.estado_vinculo = 'activo'
      AND NOT EXISTS (SELECT 1 FROM carga_mayor_estudiante cme WHERE cme.ci = v.ci);
END;
$$;

DROP TRIGGER IF EXISTS trg_linea_cargo_tarifa      ON linea_cargo;
DROP TRIGGER IF EXISTS trg_reserva_limpia_acomp    ON reserva;
DROP TRIGGER IF EXISTS trg_solicitud_limpia_acomp  ON solicitud;
DROP TRIGGER IF EXISTS trg_tai_debita_billetera    ON tai;
DROP TRIGGER IF EXISTS trg_subtipo_menor           ON carga_menor;
DROP TRIGGER IF EXISTS trg_subtipo_mayor           ON carga_mayor_estudiante;
DROP TRIGGER IF EXISTS trg_periodo_egresado        ON periodo_vinculacion;
DROP TRIGGER IF EXISTS trg_estudiante_no_borrar    ON estudiante;
DROP TRIGGER IF EXISTS trg_usuario_cambio_clave    ON usuario;

CREATE OR REPLACE FUNCTION postular_egresado(
    p_cedula INTEGER,
    p_id_vacante VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_titulo_egresado VARCHAR;
    v_perfil_buscado  VARCHAR;
    v_estatus_vacante VARCHAR;
BEGIN
    SELECT titulo INTO v_titulo_egresado
    FROM egresado WHERE cedula_identidad = p_cedula;

    IF v_titulo_egresado IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Egresado no encontrado.');
    END IF;

    SELECT perfil_buscado, estatus_vacante
    INTO v_perfil_buscado, v_estatus_vacante
    FROM oportunidad_laboral WHERE id_vacante = p_id_vacante;

    IF v_perfil_buscado IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Vacante no encontrada.');
    END IF;

    IF v_estatus_vacante <> 'disponible' THEN
        RETURN json_build_object('success', false, 'message', 'Esta vacante ya no está disponible.');
    END IF;

    IF v_titulo_egresado <> v_perfil_buscado THEN
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

CREATE OR REPLACE FUNCTION fn_linea_cargo_tarifa_vigente()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
    v_fecha_vigente DATE;
    v_tarifa        NUMERIC(12,2);
BEGIN
    IF NEW.codigo_servicio IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT ht.fecha_vigencia_inicio, ht.tarifa_miembro_activo
    INTO v_fecha_vigente, v_tarifa
    FROM historial_tarifas ht
    WHERE ht.codigo_servicio = NEW.codigo_servicio
      AND ht.fecha_vigencia_inicio <= CURRENT_DATE
      AND (ht.fecha_vigencia_fin IS NULL OR ht.fecha_vigencia_fin >= CURRENT_DATE)
    ORDER BY ht.fecha_vigencia_inicio DESC
    LIMIT 1;

    IF v_fecha_vigente IS NULL THEN
        RAISE EXCEPTION 'El servicio % no tiene ninguna tarifa vigente en el historial.',
            NEW.codigo_servicio;
    END IF;

    IF NEW.fecha_vigencia_inicio IS NULL THEN
        NEW.fecha_vigencia_inicio := v_fecha_vigente;
    ELSIF NEW.fecha_vigencia_inicio <> v_fecha_vigente THEN
        RAISE EXCEPTION
            'La línea de cargo debe usar la tarifa vigente del servicio % (vigente desde %), no la de %.',
            NEW.codigo_servicio, v_fecha_vigente, NEW.fecha_vigencia_inicio;
    END IF;

    IF NEW.precio_unitario = 0 AND v_tarifa IS NOT NULL AND v_tarifa > 0 THEN
        NEW.precio_unitario := v_tarifa;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_linea_cargo_tarifa
BEFORE INSERT ON linea_cargo
FOR EACH ROW EXECUTE FUNCTION fn_linea_cargo_tarifa_vigente();

CREATE OR REPLACE FUNCTION fn_limpia_acompanantes_reserva()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.estado_reserva = 'finalizada' AND OLD.estado_reserva <> 'finalizada' THEN
        IF NOT EXISTS (SELECT 1 FROM reserva r
                       WHERE r.id_solicitud = NEW.id_solicitud
                         AND r.estado_reserva = 'activa') THEN
            DELETE FROM acompanante WHERE id_solicitud = NEW.id_solicitud;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reserva_limpia_acomp
AFTER UPDATE OF estado_reserva ON reserva
FOR EACH ROW EXECUTE FUNCTION fn_limpia_acompanantes_reserva();

CREATE OR REPLACE FUNCTION fn_limpia_acompanantes_solicitud()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.estado_general = 'cerrada' AND OLD.estado_general <> 'cerrada' THEN
        DELETE FROM acompanante WHERE id_solicitud = NEW.id_solicitud;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_solicitud_limpia_acomp
AFTER UPDATE OF estado_general ON solicitud
FOR EACH ROW EXECUTE FUNCTION fn_limpia_acompanantes_solicitud();

CREATE OR REPLACE FUNCTION fn_tai_debita_billetera()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
    v_cedula INTEGER;
    v_monto  NUMERIC(12,2);
    v_saldo  NUMERIC(12,2);
BEGIN
    SELECT f.cedula_identidad INTO v_cedula
    FROM factura f WHERE f.num_control = NEW.num_control;

    IF v_cedula IS NULL THEN
        RAISE EXCEPTION 'La factura % no está asociada a un miembro; el pago TAI requiere un titular.',
            NEW.num_control;
    END IF;

    SELECT p.monto INTO v_monto
    FROM pago p
    WHERE p.num_control = NEW.num_control
      AND p.fecha_movimiento = NEW.fecha_movimiento;

    SELECT saldo INTO v_saldo FROM posee
    WHERE cedula_identidad = v_cedula
    FOR UPDATE;

    IF v_saldo IS NULL THEN
        RAISE EXCEPTION 'El miembro % no posee una billetera TAI registrada.', v_cedula;
    END IF;

    IF v_saldo < v_monto THEN
        RAISE EXCEPTION 'Saldo TAI insuficiente: disponible %, requerido %.', v_saldo, v_monto;
    END IF;

    UPDATE posee SET saldo = saldo - v_monto
    WHERE cedula_identidad = v_cedula;

    NEW.saldo := v_saldo - v_monto;
    IF NEW.uid IS NULL THEN
        SELECT uid_billetera INTO NEW.uid FROM posee WHERE cedula_identidad = v_cedula;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tai_debita_billetera
BEFORE INSERT ON tai
FOR EACH ROW EXECUTE FUNCTION fn_tai_debita_billetera();

CREATE OR REPLACE FUNCTION fn_subtipo_ninguno_obligatorio()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
    v_parentesco VARCHAR(40);
BEGIN
    SELECT parentesco INTO v_parentesco
    FROM vinculo_familiar WHERE ci = NEW.ci;

    IF lower(v_parentesco) IN ('conyuge','cónyuge','padre','madre','padre/madre') THEN
        RAISE EXCEPTION
            'El vínculo % tiene parentesco "%": su subtipo debe ser "Ninguno" (no puede ser carga menor ni mayor estudiante).',
            NEW.ci, v_parentesco;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subtipo_menor
BEFORE INSERT OR UPDATE ON carga_menor
FOR EACH ROW EXECUTE FUNCTION fn_subtipo_ninguno_obligatorio();

CREATE TRIGGER trg_subtipo_mayor
BEFORE INSERT OR UPDATE ON carga_mayor_estudiante
FOR EACH ROW EXECUTE FUNCTION fn_subtipo_ninguno_obligatorio();

CREATE OR REPLACE FUNCTION fn_periodo_egresado_coherente()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
    IF lower(NEW.rol_activo) = 'egresado' THEN
        IF NOT EXISTS (
            SELECT 1 FROM periodo_vinculacion pv
            WHERE pv.cedula_identidad = NEW.cedula_identidad
              AND lower(pv.rol_activo) = 'estudiante'
              AND pv.fecha_finalizacion = NEW.fecha_inicio
        ) THEN
            RAISE EXCEPTION
                'Para abrir el periodo de egresado de %, debe existir un periodo de estudiante cuya fecha de finalización sea exactamente % (fecha de inicio del egresado).',
                NEW.cedula_identidad, NEW.fecha_inicio;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_periodo_egresado
BEFORE INSERT ON periodo_vinculacion
FOR EACH ROW EXECUTE FUNCTION fn_periodo_egresado_coherente();

CREATE OR REPLACE FUNCTION fn_estudiante_historico()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM egresado e WHERE e.cedula_identidad = OLD.cedula_identidad) THEN
        RAISE EXCEPTION
            'El registro de estudiante de % es histórico y no puede eliminarse: el usuario ya figura como egresado.',
            OLD.cedula_identidad;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_estudiante_no_borrar
BEFORE DELETE ON estudiante
FOR EACH ROW EXECUTE FUNCTION fn_estudiante_historico();

CREATE OR REPLACE FUNCTION fn_registra_cambio_clave()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.contrasena IS DISTINCT FROM OLD.contrasena THEN
        NEW.ult_fecha_cambio_cont := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_usuario_cambio_clave
BEFORE UPDATE OF contrasena ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_registra_cambio_clave();

DROP TRIGGER IF EXISTS trg_paso_valida_responsable    ON paso_actividad;
DROP TRIGGER IF EXISTS trg_oficina_valida_responsable ON oficina_responsable;

CREATE OR REPLACE FUNCTION fn_valida_responsable_empleado()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.responsable_asignado IS NULL THEN
        RETURN NEW;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM empleado WHERE cedula_identidad = NEW.responsable_asignado
    ) THEN
        RAISE EXCEPTION
            'La cédula % no corresponde a un empleado registrado; no puede ser responsable.',
            NEW.responsable_asignado;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_oficina_valida_responsable
BEFORE INSERT OR UPDATE OF responsable_asignado ON oficina_responsable
FOR EACH ROW EXECUTE FUNCTION fn_valida_responsable_empleado();

CREATE TRIGGER trg_paso_valida_responsable
BEFORE INSERT OR UPDATE OF responsable_asignado ON paso_actividad
FOR EACH ROW EXECUTE FUNCTION fn_valida_responsable_empleado();