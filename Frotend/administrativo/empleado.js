
document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  const cedula = usuario.cedula || usuario.cedula_identidad;

  if (usuario.nombre) {
    document.getElementById('perfil-avatar').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('perfil-nombre').textContent = usuario.nombre;
  }

  await cargarPerfil(cedula);


  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.target).classList.add('active');
    });
  });
});

async function cargarPerfil(cedula) {
  try {
    const { usuario, docente, administrativo, vinculacion } = await API.request(`/empleados/${cedula}`);

    document.getElementById('perfil-nombre').textContent =
      `${usuario.primer_nombre} ${usuario.primer_apellido}`;
    document.getElementById('perfil-avatar').textContent =
      usuario.primer_nombre.charAt(0).toUpperCase();
    document.getElementById('perfil-correo').textContent = usuario.correo_institucional;
    document.getElementById('perfil-telefono').textContent = usuario.numero_telefono || '--';

    const estadoBadge = document.getElementById('perfil-estado-cuenta');
    if (usuario.estado_cuenta === 'activa') {
      estadoBadge.textContent = 'Cuenta Activa';
      estadoBadge.className = 'badge-estado badge-activa';
    } else {
      estadoBadge.textContent = usuario.estado_cuenta.toUpperCase();
      estadoBadge.className = 'badge-estado badge-inactiva';
    }

    pintarInfoLaboral(docente, administrativo);

    await cargarTrayectoria(usuario.cedula_identidad);
    pintarSeguridad(usuario);

    const contVinc = document.getElementById('info-vinculacion');
    if (vinculacion) {
      contVinc.className = '';
      contVinc.innerHTML = `
        Vinculacion activa desde <strong>${formatearFecha(vinculacion.fecha_inicio)}</strong>
        como <strong>${vinculacion.rol_activo}</strong>.
      `;
    } else {
      contVinc.textContent = 'No se encontro un periodo de vinculacion vigente.';
    }

  } catch (error) {
    document.getElementById('info-laboral').innerHTML =
      `<p class="texto-error">Error al cargar el perfil: ${error.message}</p>`;
  }
}

function pintarInfoLaboral(docente, administrativo) {
  const rolEl = document.getElementById('perfil-rol');
  const cont = document.getElementById('info-laboral');

  if (docente) {
    rolEl.textContent = 'Docente';
  
    let cargaHoraria = docente.carga_horaria_semanal;
    if (cargaHoraria !== null && cargaHoraria !== undefined) {
      cargaHoraria = Number(cargaHoraria).toFixed(0);
    } else {
      cargaHoraria = 'Sin carga este semestre';
    }

    cont.innerHTML = `
      <p class="dato-fila"><span>Escalafon</span><strong>${docente.escalafon_docente}</strong></p>
      <p class="dato-fila"><span>Carga horaria semanal</span><strong>${cargaHoraria}</strong></p>
      ${docente.codigo_invest ? `<p class="dato-fila"><span>Codigo de investigador</span><strong>${docente.codigo_invest}</strong></p>` : ''}
    `;
  } else if (administrativo) {
    rolEl.textContent = 'Personal Administrativo';
    
    let cargaHoraria = administrativo.carga_horaria;
    if (cargaHoraria !== null && cargaHoraria !== undefined) {
      cargaHoraria = Number(cargaHoraria).toFixed(0);
    } else {
      cargaHoraria = 'Sin carga registrada';
    }

    cont.innerHTML = `
      <p class="dato-fila"><span>Cargo</span><strong>${administrativo.cargo}</strong></p>
      <p class="dato-fila"><span>Unidad de adscripcion</span><strong>${administrativo.unidad_adscripcion_pre}</strong></p>
      <p class="dato-fila"><span>Carga horaria semanal</span><strong>${cargaHoraria}</strong></p>
    `;
  } else {
    rolEl.textContent = 'Empleado';
    cont.innerHTML = '<p class="texto-vacio">Sin datos laborales registrados.</p>';
  }
}

function formatearFecha(fecha) {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --------------------------------------------------------------------------------------------------
// TRAYECTORIA - Historial de periodos de vinculacion
// --------------------------------------------------------------------------------------------------
async function cargarTrayectoria(cedula) {
  const tbody = document.getElementById('tbody-trayectoria-emp');
  try {
    const { trayectoria = [] } = await API.request(`/empleados/${cedula}/trayectoria`);
    if (trayectoria.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">Sin historial de vinculacion.</td></tr>';
      return;
    }
    tbody.innerHTML = trayectoria.map((p, i) => `
      <tr>
        <td>${trayectoria.length - i}</td>
        <td><strong>${(p.rol_activo || '').toUpperCase()}</strong></td>
        <td>${formatearFecha(p.fecha_inicio)}</td>
        <td>${p.fecha_finalizacion ? formatearFecha(p.fecha_finalizacion) : '<span class="vigente">Vigente</span>'}</td>
        <td style="color:#64748b;">${p.detalle || '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#dc2626; padding:20px;">Error: ${error.message}</td></tr>`;
  }
}

// --------------------------------------------------------------------------------------------------
// SEGURIDAD
// --------------------------------------------------------------------------------------------------
function pintarSeguridad(usuario) {
  // Estado de la cuenta
  const estadoElem = document.getElementById('seg-estado-cuenta');
  if (estadoElem) {
    estadoElem.textContent = usuario.estado_cuenta.charAt(0).toUpperCase() + usuario.estado_cuenta.slice(1);
    estadoElem.className = 'badge-activo';
  }

  // MFA
  const mfaElem = document.getElementById('seg-mfa');
  if (mfaElem) {
    mfaElem.textContent = usuario.estatus_verificacion_dos_pasos ? 'Activado' : 'Desactivado';
    mfaElem.className = usuario.estatus_verificacion_dos_pasos ? 'badge-azul' : 'badge-cerrado';
  }

  // Ultima fecha de cambio de contrasena
  const passElem = document.getElementById('seg-ultima-pass');
  if (passElem) {
    passElem.textContent = usuario.ult_fecha_cambio_cont
      ? new Date(usuario.ult_fecha_cambio_cont).toLocaleString('es-VE')
      : 'Nunca cambiada';
  }

  // Intentos fallidos
  const intentosElem = document.getElementById('seg-intentos');
  if (intentosElem) {
    const actuales = parseInt(usuario.intentos_fallidos_auth) || 0;
    const previos = parseInt(localStorage.getItem('ucab_intentos_previos')) || 0;
    intentosElem.textContent = actuales > 0
      ? actuales
      : (previos > 0 ? `0 (hubo ${previos} antes de este inicio de sesion)` : '0');
  }

  // --------------------------------------------------------------------------------------------------
  // Auditoria de Sesion Actual
  // --------------------------------------------------------------------------------------------------
  let sesionData = null;
  try {
    const sesionGuardada = localStorage.getItem('ucab_sesion_actual');
    if (sesionGuardada) {
      sesionData = JSON.parse(sesionGuardada);
    }
  } catch (e) {
    console.warn('No se pudo leer la sesion guardada:', e);
  }

  if (sesionData) {
    const ipElem = document.getElementById('audit-ip');
    if (ipElem) ipElem.textContent = sesionData.ip || 'No disponible';

    const geoElem = document.getElementById('audit-geo');
    if (geoElem) geoElem.textContent = sesionData.geolocalizacion || 'No disponible';

    const uuidElem = document.getElementById('audit-uuid');
    if (uuidElem) uuidElem.textContent = sesionData.dispositivo || 'No disponible';

    const conexionElem = document.getElementById('audit-ultima-conexion');
    if (conexionElem) {
      conexionElem.textContent = sesionData.fecha_conexion
        ? new Date(sesionData.fecha_conexion).toLocaleString('es-VE')
        : 'No registrada';
    }
  }
}

// --------------------------------------------------------------------------------------------------
// CAMBIO DE CONTRASENA (modal)
// --------------------------------------------------------------------------------------------------
function abrirCambioContrasena() {
  document.getElementById('clave-actual').value = '';
  document.getElementById('clave-nueva').value = '';
  document.getElementById('modal-cambio-clave').classList.add('abierto');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('abierto');
}

async function guardarCambioContrasena(evt) {
  evt.preventDefault();
  const actual = document.getElementById('clave-actual').value;
  const nueva  = document.getElementById('clave-nueva').value;

  if (nueva.length < 6) {
    showAviso('Error', 'La nueva contrasena debe tener al menos 6 caracteres.');
    return;
  }

  try {
    await API.request('/auth/cambiar-contrasena', 'POST', {
      contrasenaActual: actual,
      contrasenaNueva: nueva
    });
    cerrarModal('modal-cambio-clave');
    showAviso('Listo', 'Contrasena actualizada correctamente. La fecha del cambio quedo registrada.');
  } catch (error) {
    showAviso('Error', error.message);
  }
}