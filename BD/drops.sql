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

DROP VIEW IF EXISTS v_reporte_solicitudes          CASCADE;
DROP VIEW IF EXISTS v_reporte_estado_cuenta        CASCADE;
DROP VIEW IF EXISTS v_reporte_ingresos_servicio    CASCADE;
DROP VIEW IF EXISTS v_reporte_ocupacion_espacios   CASCADE;
DROP VIEW IF EXISTS v_reporte_postulaciones        CASCADE;
DROP VIEW IF EXISTS v_reporte_recurrencia          CASCADE;
DROP VIEW IF EXISTS v_reporte_becarios             CASCADE;
DROP VIEW IF EXISTS v_reporte_pagos_por_metodo     CASCADE;
DROP VIEW IF EXISTS v_postulantes_por_organizacion CASCADE;
DROP VIEW IF EXISTS v_mis_vinculos_familiares      CASCADE;

DROP TABLE IF EXISTS tai                      CASCADE;
DROP TABLE IF EXISTS efectivo                 CASCADE;
DROP TABLE IF EXISTS pago_movil               CASCADE;
DROP TABLE IF EXISTS tarjeta                  CASCADE;
DROP TABLE IF EXISTS criptomoneda             CASCADE;
DROP TABLE IF EXISTS zelle                    CASCADE;
DROP TABLE IF EXISTS pago_presencial          CASCADE;
DROP TABLE IF EXISTS pago_virtual             CASCADE;
DROP TABLE IF EXISTS pago                     CASCADE;

DROP TABLE IF EXISTS posee                    CASCADE;

DROP TABLE IF EXISTS factura                  CASCADE;
DROP TABLE IF EXISTS linea_cargo              CASCADE;
DROP TABLE IF EXISTS folio_consumo            CASCADE;

DROP TABLE IF EXISTS acompanante              CASCADE;
DROP TABLE IF EXISTS reserva                  CASCADE;
DROP TABLE IF EXISTS paso_actividad           CASCADE;
DROP TABLE IF EXISTS solicitud                CASCADE;
DROP TABLE IF EXISTS oficina_responsable      CASCADE;

DROP TABLE IF EXISTS postula                  CASCADE;
DROP TABLE IF EXISTS oportunidad_laboral      CASCADE;

DROP TABLE IF EXISTS requiere                 CASCADE;
DROP TABLE IF EXISTS acreditacion_requisito   CASCADE;
DROP TABLE IF EXISTS cargo_adicional          CASCADE;
DROP TABLE IF EXISTS historial_tarifas        CASCADE;
DROP TABLE IF EXISTS servicio                 CASCADE;
DROP TABLE IF EXISTS limite_categoria_sede    CASCADE;
DROP TABLE IF EXISTS categoria                CASCADE;
DROP TABLE IF EXISTS organizacion_externa     CASCADE;
DROP TABLE IF EXISTS propias_ucab             CASCADE;
DROP TABLE IF EXISTS entidad_prestadora       CASCADE;

DROP TABLE IF EXISTS registra                 CASCADE;
DROP TABLE IF EXISTS carga_mayor_estudiante   CASCADE;
DROP TABLE IF EXISTS carga_menor              CASCADE;
DROP TABLE IF EXISTS vinculo_familiar         CASCADE;

DROP TABLE IF EXISTS preparadores             CASCADE;
DROP TABLE IF EXISTS becario                  CASCADE;
DROP TABLE IF EXISTS personal_administrativo  CASCADE;
DROP TABLE IF EXISTS docente                  CASCADE;
DROP TABLE IF EXISTS empleado                 CASCADE;
DROP TABLE IF EXISTS egresado                 CASCADE;
DROP TABLE IF EXISTS estudiante               CASCADE;
DROP TABLE IF EXISTS periodo_vinculacion      CASCADE;
DROP TABLE IF EXISTS sesion                   CASCADE;
DROP TABLE IF EXISTS usuario                  CASCADE;

DROP TABLE IF EXISTS espacio_fisico_recurso   CASCADE;
DROP TABLE IF EXISTS espacio_fisico           CASCADE;
DROP TABLE IF EXISTS edificacion              CASCADE;
DROP TABLE IF EXISTS sede                     CASCADE;

DROP TABLE IF EXISTS parametro_sistema        CASCADE;

DROP FUNCTION IF EXISTS fn_solicitud_vinculacion_vigente() CASCADE;
DROP FUNCTION IF EXISTS fn_paso_actividad_control()        CASCADE;
DROP FUNCTION IF EXISTS fn_reserva_aforo()                 CASCADE;
DROP FUNCTION IF EXISTS fn_valida_precio_servicio()        CASCADE;
DROP FUNCTION IF EXISTS fn_reval_factor_sede()             CASCADE;
DROP FUNCTION IF EXISTS fn_reval_limite()                  CASCADE;
DROP FUNCTION IF EXISTS fn_vinculo_registrador_valido()    CASCADE;
DROP FUNCTION IF EXISTS fn_pago_actualiza_factura()        CASCADE;
DROP FUNCTION IF EXISTS fn_suspender_sin_vinculacion()     CASCADE;
DROP FUNCTION IF EXISTS fn_acomp_solicitud_abierta()       CASCADE;
DROP FUNCTION IF EXISTS fn_entidad_disjunta()              CASCADE;
DROP FUNCTION IF EXISTS fn_vinculo_disjunto()              CASCADE;
DROP FUNCTION IF EXISTS fn_pago_disjunto()                 CASCADE;

DROP FUNCTION IF EXISTS fn_linea_cargo_tarifa_vigente()    CASCADE;
DROP FUNCTION IF EXISTS fn_limpia_acompanantes_reserva()   CASCADE;
DROP FUNCTION IF EXISTS fn_limpia_acompanantes_solicitud() CASCADE;
DROP FUNCTION IF EXISTS fn_tai_debita_billetera()          CASCADE;
DROP FUNCTION IF EXISTS fn_subtipo_ninguno_obligatorio()   CASCADE;
DROP FUNCTION IF EXISTS fn_periodo_egresado_coherente()    CASCADE;
DROP FUNCTION IF EXISTS fn_estudiante_historico()          CASCADE;
DROP FUNCTION IF EXISTS fn_registra_cambio_clave()         CASCADE;
DROP FUNCTION IF EXISTS fn_valida_responsable_empleado()   CASCADE;

DROP FUNCTION IF EXISTS fn_monto_total_acumulado(VARCHAR)  CASCADE;
DROP FUNCTION IF EXISTS fn_espacio_disponible(VARCHAR, VARCHAR, VARCHAR, DATE, TIME, TIME) CASCADE;
DROP FUNCTION IF EXISTS fn_tiempo_resolucion(VARCHAR)      CASCADE;
DROP FUNCTION IF EXISTS fn_indice_recurrencia(INTEGER)     CASCADE;
DROP FUNCTION IF EXISTS fn_costo_final(VARCHAR, INTEGER)   CASCADE;

DROP FUNCTION IF EXISTS postular_egresado(INTEGER, VARCHAR) CASCADE;

DROP PROCEDURE IF EXISTS sp_cierre_masivo_folios()           CASCADE;
DROP PROCEDURE IF EXISTS sp_actualizar_tasa_bcv(NUMERIC)     CASCADE;
DROP PROCEDURE IF EXISTS sp_limpieza_expirados()             CASCADE;
DROP PROCEDURE IF EXISTS sp_reclasificar_familiares()        CASCADE;