CREATE TABLE sede (
    nombre_sede   VARCHAR(60)   PRIMARY KEY,
    ubicacion     VARCHAR(150),
    factor_ajuste NUMERIC(5,3)  NOT NULL DEFAULT 1.000,
    CONSTRAINT chk_factor_ajuste CHECK (factor_ajuste > 0)
);

CREATE TABLE edificacion (
    nombre_sede       VARCHAR(60)  NOT NULL,
    nombre_edif       VARCHAR(80)  NOT NULL,
    direccion_interna VARCHAR(150) NOT NULL,
    CONSTRAINT pk_edificacion PRIMARY KEY (nombre_sede, nombre_edif),
    CONSTRAINT fk_edif_sede   FOREIGN KEY (nombre_sede) REFERENCES sede (nombre_sede)
);

CREATE TABLE espacio_fisico (
    nombre_sede         VARCHAR(60)  NOT NULL,
    nombre_edif         VARCHAR(80)  NOT NULL,
    num_identificador   VARCHAR(20)  NOT NULL,
    cap_maxima_aforo    INTEGER,
    tipo_mobiliario     VARCHAR(80),
    tipo_espacio_fisico VARCHAR(60),
    estado_mantenimiento VARCHAR(40),
    CONSTRAINT pk_espacio PRIMARY KEY (nombre_sede, nombre_edif, num_identificador),
    CONSTRAINT fk_espacio_edif FOREIGN KEY (nombre_sede, nombre_edif)
        REFERENCES edificacion (nombre_sede, nombre_edif),
    CONSTRAINT chk_aforo CHECK (cap_maxima_aforo IS NULL OR cap_maxima_aforo > 0)
);

CREATE TABLE espacio_fisico_recurso (
    nombre_sede          VARCHAR(60) NOT NULL,
    nombre_edif          VARCHAR(80) NOT NULL,
    num_identificador    VARCHAR(20) NOT NULL,
    recurso_tecnologico  VARCHAR(120) NOT NULL,
    CONSTRAINT pk_espacio_recurso PRIMARY KEY (nombre_sede, nombre_edif, num_identificador, recurso_tecnologico),
    CONSTRAINT fk_recurso_espacio FOREIGN KEY (nombre_sede, nombre_edif, num_identificador)
        REFERENCES espacio_fisico (nombre_sede, nombre_edif, num_identificador)
);

CREATE TABLE usuario (
    cedula_identidad               INTEGER       PRIMARY KEY,
    primer_nombre                  VARCHAR(50)   NOT NULL,
    segundo_nombre                 VARCHAR(50),
    primer_apellido                VARCHAR(50)   NOT NULL,
    segundo_apellido               VARCHAR(50),
    fecha_nacimiento               DATE          NOT NULL,
    sexo                           CHAR(1)       NOT NULL,
    direccion_habitacion_detallada VARCHAR(200)  NOT NULL,
    numero_telefono                VARCHAR(20)   NOT NULL,
    correo_institucional           VARCHAR(120)  NOT NULL UNIQUE,
    contrasena                     VARCHAR(255)  NOT NULL,
    intentos_fallidos_auth         INTEGER       NOT NULL DEFAULT 0,
    estado_cuenta                  VARCHAR(12)   NOT NULL DEFAULT 'activa',
    estatus_verificacion_dos_pasos BOOLEAN       NOT NULL DEFAULT FALSE,
    ult_fecha_cambio_cont          TIMESTAMP,
    ultima_conexion                TIMESTAMP,
    CONSTRAINT chk_sexo          CHECK (sexo IN ('M','F')),
    CONSTRAINT chk_estado_cuenta CHECK (estado_cuenta IN ('activa','suspendida','bloqueada')),
    CONSTRAINT chk_intentos      CHECK (intentos_fallidos_auth >= 0)
);

CREATE TABLE sesion (
    cedula_identidad          INTEGER     NOT NULL,
    fecha_acceso              TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    direccion_ip              VARCHAR(45),
    identificador_dispositivo VARCHAR(60),
    geolocalizacion_aprox     VARCHAR(120),
    CONSTRAINT pk_sesion PRIMARY KEY (cedula_identidad, fecha_acceso),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad)
);

CREATE TABLE periodo_vinculacion (
    cedula_identidad    INTEGER     NOT NULL,
    fecha_inicio        DATE        NOT NULL,
    fecha_finalizacion  DATE,
    rol_activo          VARCHAR(30),
    CONSTRAINT pk_periodo PRIMARY KEY (cedula_identidad, fecha_inicio),
    CONSTRAINT fk_periodo_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad),
    CONSTRAINT chk_periodo_fechas
        CHECK (fecha_finalizacion IS NULL OR fecha_finalizacion >= fecha_inicio)
);

CREATE TABLE estudiante (
    cedula_identidad INTEGER PRIMARY KEY,
    promedio         NUMERIC(5,2),
    uc_aprobadas     INTEGER,
    semestre_actual  INTEGER,
    escuela          VARCHAR(80),
    facultad         VARCHAR(80),
    CONSTRAINT fk_estudiante_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad),
    CONSTRAINT chk_promedio CHECK (promedio IS NULL OR promedio BETWEEN 0 AND 20)
);

CREATE TABLE egresado (
    cedula_identidad       INTEGER PRIMARY KEY,
    indice_academico_final NUMERIC(5,2),
    titulo                 VARCHAR(120),
    anio_graduacion        INTEGER,
    CONSTRAINT fk_egresado_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad),
    CONSTRAINT chk_indice_egr CHECK (indice_academico_final IS NULL OR indice_academico_final BETWEEN 0 AND 20)
);

CREATE TABLE empleado (
    cedula_identidad INTEGER PRIMARY KEY,
    CONSTRAINT fk_empleado_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad)
);

CREATE TABLE docente (
    cedula_identidad      INTEGER PRIMARY KEY,
    escalafon_docente     VARCHAR(60) NOT NULL,
    carga_horaria_semanal NUMERIC(5,2),
    codigo_invest         VARCHAR(40),
    CONSTRAINT fk_docente_empleado FOREIGN KEY (cedula_identidad)
        REFERENCES empleado (cedula_identidad),
    CONSTRAINT chk_carga_doc CHECK (carga_horaria_semanal IS NULL OR carga_horaria_semanal >= 0)
);

CREATE TABLE personal_administrativo (
    cedula_identidad       INTEGER PRIMARY KEY,
    carga_horaria          NUMERIC(5,2) NOT NULL,
    cargo                  VARCHAR(80)  NOT NULL,
    unidad_adscripcion_pre VARCHAR(80)  NOT NULL,
    CONSTRAINT fk_admin_empleado FOREIGN KEY (cedula_identidad)
        REFERENCES empleado (cedula_identidad),
    CONSTRAINT chk_carga_admin CHECK (carga_horaria >= 0)
);

CREATE TABLE becario (
    cedula_identidad        INTEGER PRIMARY KEY,
    indice_de_mantenimiento NUMERIC(5,2) NOT NULL,
    estatus                 VARCHAR(20)  NOT NULL,
    tipo_de_beca            VARCHAR(20)  NOT NULL,
    CONSTRAINT fk_becario_estudiante FOREIGN KEY (cedula_identidad)
        REFERENCES estudiante (cedula_identidad),
    CONSTRAINT chk_tipo_beca       CHECK (tipo_de_beca IN ('economica','excelencia','comedor')),
    CONSTRAINT chk_estatus_becario CHECK (estatus IN ('Activo','Suspendido','Finalizado')),
    CONSTRAINT chk_indice_beca     CHECK (estatus <> 'Activo' OR indice_de_mantenimiento >= 12.00)
);

CREATE TABLE preparadores (
    cedula_identidad INTEGER PRIMARY KEY,
    horas            INTEGER,
    asignatura       VARCHAR(80),
    CONSTRAINT fk_preparador_estudiante FOREIGN KEY (cedula_identidad)
        REFERENCES estudiante (cedula_identidad),
    CONSTRAINT chk_horas_prep CHECK (horas IS NULL OR horas >= 0)
);

CREATE TABLE vinculo_familiar (
    ci                  INTEGER      PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL,
    fecha_nac           DATE         NOT NULL,
    parentesco          VARCHAR(40)  NOT NULL,
    estado_vinculo      VARCHAR(20)  NOT NULL DEFAULT 'activo',
    fecha_inicio_vinculo DATE,
    fecha_fin_vinculo   DATE,
    CONSTRAINT chk_estado_vinculo CHECK (estado_vinculo IN ('activo','inactivo')),
    CONSTRAINT chk_vinculo_fechas
        CHECK (fecha_fin_vinculo IS NULL OR fecha_fin_vinculo >= fecha_inicio_vinculo)
);

CREATE TABLE carga_menor (
    ci                 INTEGER PRIMARY KEY,
    esquema_vacunacion VARCHAR(150),
    centro_edu_inic    VARCHAR(120),
    CONSTRAINT fk_cargamenor_vinculo FOREIGN KEY (ci)
        REFERENCES vinculo_familiar (ci)
);

CREATE TABLE carga_mayor_estudiante (
    ci                   INTEGER PRIMARY KEY,
    constancia_estudio_ext VARCHAR(150) NOT NULL,
    certificado_solteria   VARCHAR(150) NOT NULL,
    CONSTRAINT fk_cargamayor_vinculo FOREIGN KEY (ci)
        REFERENCES vinculo_familiar (ci)
);

CREATE TABLE registra (
    ci                INTEGER NOT NULL,
    cedula_empleado   INTEGER NOT NULL,
    fecha_registro    DATE    NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_registra           PRIMARY KEY (ci),
    CONSTRAINT fk_registra_vinculo   FOREIGN KEY (ci)
        REFERENCES vinculo_familiar (ci),
    CONSTRAINT fk_registra_empleado  FOREIGN KEY (cedula_empleado)
        REFERENCES empleado (cedula_identidad)
);

CREATE TABLE entidad_prestadora (
    id_entidad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre     VARCHAR(120) NOT NULL
);

CREATE TABLE propias_ucab (
    id_entidad            INTEGER     NOT NULL,
    codigo_presupuestario VARCHAR(40) NOT NULL,
    directores_de_oficina VARCHAR(120),
    CONSTRAINT pk_propias_ucab PRIMARY KEY (id_entidad, codigo_presupuestario),
    CONSTRAINT uq_propias_entidad UNIQUE (id_entidad),
    CONSTRAINT fk_propia_entidad FOREIGN KEY (id_entidad)
        REFERENCES entidad_prestadora (id_entidad)
);

CREATE TABLE organizacion_externa (
    id_entidad          INTEGER     NOT NULL,
    rif                 VARCHAR(15) NOT NULL,
    razon_social        VARCHAR(150) NOT NULL,
    contactos           VARCHAR(200),
    fecha_de_vencimiento DATE,
    CONSTRAINT pk_organizacion_externa PRIMARY KEY (id_entidad, rif),
    CONSTRAINT uq_externa_entidad UNIQUE (id_entidad),
    CONSTRAINT fk_externa_entidad FOREIGN KEY (id_entidad)
        REFERENCES entidad_prestadora (id_entidad)
);

CREATE TABLE categoria (
    tipo_categoria   VARCHAR(60)  PRIMARY KEY,
    limite_costo_max NUMERIC(12,2),
    CONSTRAINT chk_limite_cat CHECK (limite_costo_max IS NULL OR limite_costo_max >= 0)
);

CREATE TABLE limite_categoria_sede (
    tipo_categoria   VARCHAR(60)  NOT NULL,
    nombre_sede      VARCHAR(60)  NOT NULL,
    monto_limt_max   NUMERIC(12,2) NOT NULL,
    CONSTRAINT pk_limite_cat_sede PRIMARY KEY (tipo_categoria, nombre_sede),
    CONSTRAINT fk_limite_cat  FOREIGN KEY (tipo_categoria) REFERENCES categoria (tipo_categoria),
    CONSTRAINT fk_limite_sede FOREIGN KEY (nombre_sede)    REFERENCES sede (nombre_sede),
    CONSTRAINT chk_monto_limite CHECK (monto_limt_max >= 0)
);

CREATE TABLE servicio (
    codigo_servicio       VARCHAR(20)  PRIMARY KEY,
    id_entidad            INTEGER      NOT NULL,
    tipo_categoria        VARCHAR(60)  NOT NULL,
    nombre_sede           VARCHAR(60)  NOT NULL,
    precio                NUMERIC(12,2) NOT NULL,
    descripcion_detallada TEXT,
    requisitos_de_acceso  TEXT,
    CONSTRAINT fk_servicio_entidad   FOREIGN KEY (id_entidad)     REFERENCES entidad_prestadora (id_entidad),
    CONSTRAINT fk_servicio_categoria FOREIGN KEY (tipo_categoria) REFERENCES categoria (tipo_categoria),
    CONSTRAINT fk_servicio_sede      FOREIGN KEY (nombre_sede)    REFERENCES sede (nombre_sede),
    CONSTRAINT chk_precio CHECK (precio >= 0)
);

CREATE TABLE historial_tarifas (
    codigo_servicio        VARCHAR(20) NOT NULL,
    fecha_vigencia_inicio  DATE        NOT NULL,
    fecha_vigencia_fin     DATE,
    tarifa_miembro_activo  NUMERIC(12,2),
    tarifa_egresado        NUMERIC(12,2),
    tarifa_publico_externo NUMERIC(12,2),
    CONSTRAINT pk_historial PRIMARY KEY (codigo_servicio, fecha_vigencia_inicio),
    CONSTRAINT fk_tarifa_servicio FOREIGN KEY (codigo_servicio)
        REFERENCES servicio (codigo_servicio),
    CONSTRAINT chk_tarifa_fechas
        CHECK (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin >= fecha_vigencia_inicio)
);

CREATE TABLE cargo_adicional (
    codigo_servicio VARCHAR(20)  NOT NULL,
    nombre_concepto VARCHAR(100) NOT NULL,
    monto           NUMERIC(12,2) NOT NULL,
    tipo_suplemento VARCHAR(60),
    CONSTRAINT pk_cargo_adic PRIMARY KEY (codigo_servicio, nombre_concepto),
    CONSTRAINT fk_cargoadic_servicio FOREIGN KEY (codigo_servicio)
        REFERENCES servicio (codigo_servicio),
    CONSTRAINT chk_monto_cargo CHECK (monto >= 0)
);

CREATE TABLE acreditacion_requisito (
    id_acreditacion  VARCHAR(20)  PRIMARY KEY,
    nombre_requisito VARCHAR(120) NOT NULL,
    tipo_documento   VARCHAR(60)
);

CREATE TABLE requiere (
    codigo_servicio VARCHAR(20) NOT NULL,
    id_acreditacion VARCHAR(20) NOT NULL,
    CONSTRAINT pk_requiere PRIMARY KEY (codigo_servicio, id_acreditacion),
    CONSTRAINT fk_req_servicio    FOREIGN KEY (codigo_servicio) REFERENCES servicio (codigo_servicio),
    CONSTRAINT fk_req_acreditacion FOREIGN KEY (id_acreditacion) REFERENCES acreditacion_requisito (id_acreditacion)
);

CREATE TABLE oportunidad_laboral (
    id_vacante       VARCHAR(20)  PRIMARY KEY,
    id_entidad       INTEGER      NOT NULL,
    cargo_solicitado VARCHAR(120) NOT NULL,
    responsabilidad  TEXT,
    estatus_vacante  VARCHAR(20)  NOT NULL DEFAULT 'disponible',
    beneficios       TEXT,
    perfil_buscado   TEXT,
    fecha_oferta     DATE         NOT NULL,
    CONSTRAINT fk_vacante_externa FOREIGN KEY (id_entidad)
        REFERENCES organizacion_externa (id_entidad),
    CONSTRAINT chk_estatus_vacante CHECK (estatus_vacante IN ('disponible','finalizada'))
);

CREATE TABLE postula (
    cedula_identidad   INTEGER     NOT NULL,
    id_vacante         VARCHAR(20) NOT NULL,
    estado_postulacion VARCHAR(20) NOT NULL DEFAULT 'postulado',
    fecha_postulacion  DATE        NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT pk_postula PRIMARY KEY (cedula_identidad, id_vacante),
    CONSTRAINT fk_post_usuario FOREIGN KEY (cedula_identidad) REFERENCES usuario (cedula_identidad),
    CONSTRAINT fk_post_vacante FOREIGN KEY (id_vacante)       REFERENCES oportunidad_laboral (id_vacante),
    CONSTRAINT chk_estado_post CHECK (estado_postulacion IN ('postulado','postularse'))
);

CREATE TABLE oficina_responsable (
    nombre_oficina      VARCHAR(80) PRIMARY KEY,
    responsable_asignado INTEGER,
    CONSTRAINT fk_oficina_responsable FOREIGN KEY (responsable_asignado)
        REFERENCES empleado (cedula_identidad)
);

CREATE TABLE solicitud (
    id_solicitud    VARCHAR(20)  PRIMARY KEY,
    cedula_identidad INTEGER     NOT NULL,
    codigo_servicio VARCHAR(20)  NOT NULL,
    estado_general  VARCHAR(30)  NOT NULL DEFAULT 'abierta',
    fecha_creacion  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicitud_usuario  FOREIGN KEY (cedula_identidad) REFERENCES usuario (cedula_identidad),
    CONSTRAINT fk_solicitud_servicio FOREIGN KEY (codigo_servicio)  REFERENCES servicio (codigo_servicio)
);

CREATE TABLE paso_actividad (
    id_solicitud        VARCHAR(20) NOT NULL,
    num_paso            INTEGER     NOT NULL,
    nombre_paso         VARCHAR(120),
    estado_paso         VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    fecha_inicio        TIMESTAMP,
    fecha_fin           TIMESTAMP,
    nombre_oficina      VARCHAR(80),
    responsable_asignado INTEGER,
    paso_predecesor     INTEGER,
    CONSTRAINT pk_paso PRIMARY KEY (id_solicitud, num_paso),
    CONSTRAINT fk_paso_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud),
    CONSTRAINT fk_paso_oficina   FOREIGN KEY (nombre_oficina) REFERENCES oficina_responsable (nombre_oficina),
    CONSTRAINT fk_paso_predecesor FOREIGN KEY (id_solicitud, paso_predecesor)
        REFERENCES paso_actividad (id_solicitud, num_paso),
    CONSTRAINT fk_paso_responsable FOREIGN KEY (responsable_asignado)
        REFERENCES empleado (cedula_identidad),
    CONSTRAINT chk_estado_paso CHECK (estado_paso IN ('pendiente','en proceso','completado')),
    CONSTRAINT chk_paso_no_autorref CHECK (paso_predecesor IS NULL OR paso_predecesor <> num_paso)
);

CREATE TABLE reserva (
    id_solicitud      VARCHAR(20) NOT NULL,
    nombre_sede       VARCHAR(60) NOT NULL,
    nombre_edif       VARCHAR(80) NOT NULL,
    num_identificador VARCHAR(20) NOT NULL,
    fecha_reserva     DATE        NOT NULL,
    hora_inicio       TIME        NOT NULL,
    hora_fin          TIME        NOT NULL,
    estado_reserva    VARCHAR(20) NOT NULL DEFAULT 'activa',
    cant_personas     INTEGER,
    CONSTRAINT pk_reserva PRIMARY KEY (id_solicitud, nombre_sede, nombre_edif, num_identificador, fecha_reserva, hora_inicio),
    CONSTRAINT fk_reserva_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud),
    CONSTRAINT fk_reserva_espacio   FOREIGN KEY (nombre_sede, nombre_edif, num_identificador)
        REFERENCES espacio_fisico (nombre_sede, nombre_edif, num_identificador),
    CONSTRAINT chk_estado_reserva CHECK (estado_reserva IN ('activa','cancelada','finalizada')),
    CONSTRAINT chk_cant_personas  CHECK (cant_personas IS NULL OR cant_personas > 0),
    CONSTRAINT chk_bloque_horario CHECK (hora_fin > hora_inicio)
);

CREATE TABLE acompanante (
    documento_identidad VARCHAR(20)  NOT NULL,
    id_solicitud        VARCHAR(20)  NOT NULL,
    nombre              VARCHAR(120) NOT NULL,
    CONSTRAINT pk_acompanante PRIMARY KEY (documento_identidad, id_solicitud),
    CONSTRAINT fk_acomp_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud)
);

CREATE TABLE folio_consumo (
    numero_folio  VARCHAR(20) PRIMARY KEY,
    id_solicitud  VARCHAR(20) NOT NULL,
    estatus       VARCHAR(20) NOT NULL DEFAULT 'abierto',
    fecha_emision DATE        NOT NULL DEFAULT CURRENT_DATE,
    saldo         NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_folio_solicitud FOREIGN KEY (id_solicitud) REFERENCES solicitud (id_solicitud),
    CONSTRAINT chk_saldo_folio CHECK (saldo >= 0)
);

CREATE TABLE linea_cargo (
    numero_folio          VARCHAR(20) NOT NULL,
    numero_item           INTEGER     NOT NULL,
    codigo_servicio       VARCHAR(20),
    fecha_vigencia_inicio DATE,
    concepto              VARCHAR(120),
    cantidad              NUMERIC(12,2) NOT NULL DEFAULT 1,
    precio_unitario       NUMERIC(12,2) NOT NULL,
    impuesto_ley          NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT pk_linea PRIMARY KEY (numero_folio, numero_item),
    CONSTRAINT fk_linea_folio FOREIGN KEY (numero_folio) REFERENCES folio_consumo (numero_folio),
    CONSTRAINT fk_linea_tarifa FOREIGN KEY (codigo_servicio, fecha_vigencia_inicio)
        REFERENCES historial_tarifas (codigo_servicio, fecha_vigencia_inicio) MATCH FULL,
    CONSTRAINT chk_cantidad         CHECK (cantidad > 0),
    CONSTRAINT chk_precio_positivo  CHECK (precio_unitario >= 0),
    CONSTRAINT chk_impuesto_ley     CHECK (impuesto_ley >= 0)
);

CREATE TABLE factura (
    num_control      VARCHAR(20)  PRIMARY KEY,
    numero_folio     VARCHAR(20)  NOT NULL,
    fecha_emision    DATE         NOT NULL DEFAULT CURRENT_DATE,
    estatus          VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    saldo            NUMERIC(12,2) NOT NULL DEFAULT 0,
    cedula_identidad INTEGER,
    id_entidad       INTEGER,
    CONSTRAINT fk_factura_folio   FOREIGN KEY (numero_folio)     REFERENCES folio_consumo (numero_folio),
    CONSTRAINT fk_factura_usuario FOREIGN KEY (cedula_identidad) REFERENCES usuario (cedula_identidad),
    CONSTRAINT fk_factura_org     FOREIGN KEY (id_entidad)       REFERENCES organizacion_externa (id_entidad),
    CONSTRAINT chk_factura_estatus CHECK (estatus IN ('pendiente','parcial','pagada','anulada')),
    CONSTRAINT chk_saldo_factura   CHECK (saldo >= 0),
    CONSTRAINT chk_pagada_saldo    CHECK (estatus != 'pagada' OR saldo = 0),
    CONSTRAINT chk_factura_emitida CHECK (
        (cedula_identidad IS NOT NULL AND id_entidad IS NULL) OR
        (cedula_identidad IS NULL     AND id_entidad IS NOT NULL)
    )
);

CREATE TABLE pago (
    num_control     VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP  NOT NULL,
    tasa_bcv        NUMERIC(18,6),
    monto           NUMERIC(12,2) NOT NULL,
    CONSTRAINT pk_pago PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_pago_factura FOREIGN KEY (num_control) REFERENCES factura (num_control),
    CONSTRAINT chk_monto_pago CHECK (monto > 0)
);

CREATE TABLE pago_virtual (
    num_control     VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP  NOT NULL,
    CONSTRAINT pk_pago_virtual PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_pvirtual_pago FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago (num_control, fecha_movimiento)
);

CREATE TABLE pago_presencial (
    num_control     VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP  NOT NULL,
    CONSTRAINT pk_pago_presencial PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_ppresencial_pago FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago (num_control, fecha_movimiento)
);

CREATE TABLE zelle (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    correo_electronico VARCHAR(120),
    nombre           VARCHAR(120),
    cod_confirmacion VARCHAR(60),
    CONSTRAINT pk_zelle PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_zelle_virtual FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_virtual (num_control, fecha_movimiento)
);

CREATE TABLE criptomoneda (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    cod_hash         VARCHAR(120),
    red_utilizada    VARCHAR(20),
    dir_billetera_origen VARCHAR(120),
    tasa_conversion  NUMERIC(18,6),
    CONSTRAINT pk_cripto PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_cripto_virtual FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_virtual (num_control, fecha_movimiento)
);

CREATE TABLE tarjeta (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    num_tarjeta      VARCHAR(25),
    fecha_vencimiento VARCHAR(7),
    compania_emisora VARCHAR(40),
    tipo_red         VARCHAR(15),
    CONSTRAINT pk_tarjeta PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_tarjeta_presencial FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_presencial (num_control, fecha_movimiento),
    CONSTRAINT chk_tipo_red CHECK (tipo_red IN ('Nacional','Internacional'))
);

CREATE TABLE pago_movil (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    num_telefono     VARCHAR(20),
    banco_origen     VARCHAR(60),
    num_referencia   VARCHAR(40),
    CONSTRAINT pk_pagomovil PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_pagomovil_presencial FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_presencial (num_control, fecha_movimiento)
);

CREATE TABLE efectivo (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    moneda_curso     VARCHAR(20),
    monto_exacto     NUMERIC(12,2),
    desglose_denominacion TEXT,
    CONSTRAINT pk_efectivo PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_efectivo_presencial FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_presencial (num_control, fecha_movimiento)
);

CREATE TABLE tai (
    num_control      VARCHAR(20) NOT NULL,
    fecha_movimiento TIMESTAMP   NOT NULL,
    uid              VARCHAR(60),
    cod_pos          VARCHAR(40),
    saldo            NUMERIC(12,2),
    CONSTRAINT pk_tai PRIMARY KEY (num_control, fecha_movimiento),
    CONSTRAINT fk_tai_presencial FOREIGN KEY (num_control, fecha_movimiento)
        REFERENCES pago_presencial (num_control, fecha_movimiento)
);

CREATE TABLE parametro_sistema (
    clave VARCHAR(40)   PRIMARY KEY,
    valor NUMERIC(18,6) NOT NULL
);

CREATE TABLE posee (
    cedula_identidad INTEGER       PRIMARY KEY,
    uid_billetera    VARCHAR(60)   NOT NULL UNIQUE,
    saldo            NUMERIC(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_posee_usuario FOREIGN KEY (cedula_identidad)
        REFERENCES usuario (cedula_identidad),
    CONSTRAINT chk_posee_saldo CHECK (saldo >= 0)
);