Sistema de gestion de servicios, solicitudes, facturacion y recursos para la Universidad Catolica Andres Bello.
---------------------------------------------------------------------
TECNOLOGIAS USADAS 
Backend: Node.js, Express.js, PostgreSQL, Sequelize, JWT, bcrypt

Frontend: HTML5, CSS3, JavaScript (ES6+), Fetch API

Base de Datos: PostgreSQL 18, pgcrypto, btree_gist, Triggers PL/pgSQL

--------------------------------------------------------------------
CLONAR REPOSITORIO:
git clone <url>
cd PROYECTO_UCAB_SERVICE

INSTALAR DEPENDENCIAS
cd Backend
npm install

CAMBIAR ARCHIVO .env
PORT=5000
DB_NAME=Proyecto
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=tu_clave_secreta

CONFIGURAR BASE DE DATOS : 
psql -U postgres
CREATE DATABASE Proyecto;
\c Proyecto;

Ejecutar scripts en orden
drops.sql
creates.sql
inserts.sql
triggers_funciones.sql
seguridad.sql
indices_vistas.sql
inserts_personal_admin.sql


Instalacion de Live Server

1. Abrir Visual Studio Code
2. Ir a la seccion de Extensiones 
3. Buscar "Live Server" 
4. Hacer clic en Instalar

### Ejecutar el Frontend

1. Abrir la carpeta del proyecto en VS Code
2. Navegar a la carpeta `Frontend/login/`
3. Hacer clic derecho sobre `login.html`
4. Seleccionar "Open with Live Server"

El frontend se abrira en: `http://127.0.0.1:5500/login/login.html`

REPORTES:
1. Solicitudes - v_reporte_solicitudes
   Detalle de todas las solicitudes registradas en el sistema.

2. Estado de Cuenta - v_reporte_estado_cuenta
   Informacion de facturas y saldos pendientes por usuario.

3. Ingresos por Servicio - v_reporte_ingresos_servicio
   Recaudacion total agrupada por tipo de servicio.

4. Ocupacion de Espacios - v_reporte_ocupacion_espacios
   Uso y reserva de instalaciones y espacios fisicos.

5. Postulaciones - v_reporte_postulaciones
   Vacantes publicadas y cantidad de candidatos postulados.

6. Recurrencia - v_reporte_recurrencia
   Indice de fidelidad de los miembros de la comunidad.

7. Becarios - v_reporte_becarios
   Situacion academica de los estudiantes becarios.

8. Pagos por Metodo - v_reporte_pagos_por_metodo
   Recaudacion segmentada por canal de pago utilizado.


Conexion a Power BI
-Abrir Power BI Desktop
-Seleccionar "Obtener datos" > "PostgreSQL"
-Configurar la conexion:
   - Servidor: `localhost:5432`
   - Base de datos: `Proyecto`
   - Usuario: `postgres`
   - Contraseña: `tu_contraseña`
-Seleccionar las vistas de reporte
-Cargar los datos y crear los dashboards
