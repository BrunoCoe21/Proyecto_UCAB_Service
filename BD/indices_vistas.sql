DROP INDEX IF EXISTS idx_solicitud_usuario;
DROP INDEX IF EXISTS idx_solicitud_servicio;
DROP INDEX IF EXISTS idx_solicitud_estado;
DROP INDEX IF EXISTS idx_folio_solicitud;
DROP INDEX IF EXISTS idx_linea_tarifa;
DROP INDEX IF EXISTS idx_factura_folio;
DROP INDEX IF EXISTS idx_factura_usuario;
DROP INDEX IF EXISTS idx_factura_entidad;
DROP INDEX IF EXISTS idx_factura_estatus;
DROP INDEX IF EXISTS idx_reserva_espacio;
DROP INDEX IF EXISTS idx_servicio_entidad;
DROP INDEX IF EXISTS idx_servicio_categoria;
DROP INDEX IF EXISTS idx_servicio_sede;
DROP INDEX IF EXISTS idx_postula_vacante;
DROP INDEX IF EXISTS idx_vacante_entidad;
DROP INDEX IF EXISTS idx_vinculo_registrador;
DROP INDEX IF EXISTS idx_usuario_apellido;

CREATE INDEX idx_solicitud_usuario  ON solicitud (cedula_identidad);
CREATE INDEX idx_solicitud_servicio ON solicitud (codigo_servicio);
CREATE INDEX idx_solicitud_estado   ON solicitud (estado_general);

CREATE INDEX idx_folio_solicitud ON folio_consumo (id_solicitud);
CREATE INDEX idx_linea_tarifa    ON linea_cargo (codigo_servicio, fecha_vigencia_inicio);
CREATE INDEX idx_factura_folio   ON factura (numero_folio);
CREATE INDEX idx_factura_usuario ON factura (cedula_identidad);
CREATE INDEX idx_factura_entidad ON factura (id_entidad);
CREATE INDEX idx_factura_estatus ON factura (estatus);

CREATE INDEX idx_reserva_espacio ON reserva (nombre_sede, nombre_edif, num_identificador);

CREATE INDEX idx_servicio_entidad   ON servicio (id_entidad);
CREATE INDEX idx_servicio_categoria ON servicio (tipo_categoria);
CREATE INDEX idx_servicio_sede      ON servicio (nombre_sede);

CREATE INDEX idx_postula_vacante ON postula (id_vacante);
CREATE INDEX idx_vacante_entidad ON oportunidad_laboral (id_entidad);

CREATE INDEX idx_registra_empleado   ON registra (cedula_empleado);
CREATE INDEX idx_usuario_apellido    ON usuario (primer_apellido);

CREATE OR REPLACE VIEW v_reporte_solicitudes AS
SELECT s.id_solicitud,
       s.fecha_creacion,
       s.estado_general,
       u.cedula_identidad,
       u.primer_nombre || ' ' || u.primer_apellido AS solicitante,
       se.codigo_servicio,
       se.descripcion_detallada,
       fn_monto_total_acumulado(s.id_solicitud)      AS monto_total
FROM solicitud s
JOIN usuario  u ON u.cedula_identidad = s.cedula_identidad
JOIN servicio se ON se.codigo_servicio = s.codigo_servicio;

CREATE OR REPLACE VIEW v_reporte_estado_cuenta AS
SELECT f.num_control,
       f.numero_folio,
       f.fecha_emision,
       f.estatus,
       f.saldo,
       CASE WHEN f.cedula_identidad IS NOT NULL THEN 'Usuario'
            ELSE 'Organizacion' END AS tipo_destinatario,
       COALESCE(u.primer_nombre || ' ' || u.primer_apellido, oe.razon_social) AS destinatario
FROM factura f
LEFT JOIN usuario u             ON u.cedula_identidad = f.cedula_identidad
LEFT JOIN organizacion_externa oe ON oe.id_entidad   = f.id_entidad;

CREATE OR REPLACE VIEW v_reporte_ingresos_servicio AS
SELECT se.codigo_servicio,
       se.descripcion_detallada,
       COUNT(DISTINCT p.num_control)     AS num_facturas_pagadas,
       COALESCE(SUM(p.monto), 0)         AS total_recaudado
FROM servicio se
JOIN solicitud  s  ON s.codigo_servicio = se.codigo_servicio
JOIN folio_consumo fc ON fc.id_solicitud = s.id_solicitud
JOIN factura    f  ON f.numero_folio = fc.numero_folio
JOIN pago       p  ON p.num_control = f.num_control
GROUP BY se.codigo_servicio, se.descripcion_detallada;

CREATE OR REPLACE VIEW v_reporte_ocupacion_espacios AS
SELECT r.nombre_sede,
       r.nombre_edif,
       r.num_identificador,
       r.fecha_reserva,
       COUNT(*)                 AS total_reservas,
       SUM(r.cant_personas)     AS total_personas
FROM reserva r
WHERE r.estado_reserva <> 'cancelada'
GROUP BY r.nombre_sede, r.nombre_edif, r.num_identificador, r.fecha_reserva;

CREATE OR REPLACE VIEW v_reporte_postulaciones AS
SELECT op.id_vacante,
       op.cargo_solicitado,
       op.estatus_vacante,
       oe.razon_social         AS organizacion,
       COUNT(p.cedula_identidad) AS num_postulantes
FROM oportunidad_laboral op
JOIN organizacion_externa oe ON oe.id_entidad = op.id_entidad
LEFT JOIN postula p          ON p.id_vacante = op.id_vacante
GROUP BY op.id_vacante, op.cargo_solicitado, op.estatus_vacante, oe.razon_social;

CREATE OR REPLACE VIEW v_reporte_recurrencia AS
SELECT u.cedula_identidad,
       u.primer_nombre || ' ' || u.primer_apellido AS miembro,
       fn_indice_recurrencia(u.cedula_identidad)    AS indice_recurrencia,
       CASE WHEN fn_indice_recurrencia(u.cedula_identidad) >= 5 THEN 'Preferencial'
            WHEN fn_indice_recurrencia(u.cedula_identidad) >= 2 THEN 'Frecuente'
            ELSE 'Regular' END                       AS categoria
FROM usuario u;

CREATE OR REPLACE VIEW v_reporte_becarios AS
SELECT b.cedula_identidad,
       u.primer_nombre || ' ' || u.primer_apellido AS becario,
       b.tipo_de_beca,
       b.estatus,
       b.indice_de_mantenimiento,
       CASE WHEN b.indice_de_mantenimiento < 12.00 THEN 'En riesgo'
            WHEN b.indice_de_mantenimiento < 13.00 THEN 'Alerta'
            ELSE 'Estable' END                       AS situacion
FROM becario b
JOIN usuario u ON u.cedula_identidad = b.cedula_identidad;

CREATE OR REPLACE VIEW v_reporte_pagos_por_metodo AS
SELECT metodo, COUNT(*) AS num_pagos, SUM(monto) AS total
FROM (
    SELECT 'Zelle'        AS metodo, p.monto FROM zelle z        JOIN pago p ON p.num_control=z.num_control AND p.fecha_movimiento=z.fecha_movimiento
    UNION ALL
    SELECT 'Criptomoneda', p.monto FROM criptomoneda c          JOIN pago p ON p.num_control=c.num_control AND p.fecha_movimiento=c.fecha_movimiento
    UNION ALL
    SELECT 'Tarjeta',      p.monto FROM tarjeta t                JOIN pago p ON p.num_control=t.num_control AND p.fecha_movimiento=t.fecha_movimiento
    UNION ALL
    SELECT 'Pago Movil',   p.monto FROM pago_movil pm            JOIN pago p ON p.num_control=pm.num_control AND p.fecha_movimiento=pm.fecha_movimiento
    UNION ALL
    SELECT 'Efectivo',     p.monto FROM efectivo e               JOIN pago p ON p.num_control=e.num_control AND p.fecha_movimiento=e.fecha_movimiento
    UNION ALL
    SELECT 'TAI',          p.monto FROM tai ta                   JOIN pago p ON p.num_control=ta.num_control AND p.fecha_movimiento=ta.fecha_movimiento
) AS pagos_clasificados
GROUP BY metodo;

GRANT SELECT ON
    v_reporte_solicitudes, v_reporte_estado_cuenta, v_reporte_ingresos_servicio,
    v_reporte_ocupacion_espacios, v_reporte_postulaciones, v_reporte_recurrencia,
    v_reporte_becarios, v_reporte_pagos_por_metodo
    TO rol_personal_administrativo;

GRANT SELECT ON v_reporte_estado_cuenta, v_reporte_ingresos_servicio,
                v_reporte_pagos_por_metodo
    TO rol_cajero;

GRANT SELECT ON v_reporte_postulaciones TO rol_aliado_externo;

CREATE OR REPLACE VIEW v_mis_vinculos_familiares AS
SELECT vf.ci,
       vf.nombre,
       vf.fecha_nac,
       vf.parentesco,
       vf.estado_vinculo,
       vf.fecha_inicio_vinculo,
       vf.fecha_fin_vinculo,
       r.cedula_empleado AS cedula_registrador,
       CASE WHEN cm.ci  IS NOT NULL THEN 'Carga menor'
            WHEN cme.ci IS NOT NULL THEN 'Mayor estudiante'
            ELSE 'Ninguno' END AS subtipo
FROM vinculo_familiar vf
JOIN registra r                       ON r.ci = vf.ci
LEFT JOIN carga_menor            cm   ON cm.ci  = vf.ci
LEFT JOIN carga_mayor_estudiante cme  ON cme.ci = vf.ci
WHERE r.cedula_empleado =
      NULLIF(current_setting('app.cedula_empleado', true), '')::INTEGER;

GRANT SELECT ON v_mis_vinculos_familiares
    TO rol_docente, rol_personal_administrativo;