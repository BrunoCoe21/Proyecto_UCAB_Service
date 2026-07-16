// ============================================================================
//  empleado.js  ·  Perfil del empleado (docente o administrativo)
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  const cedula = usuario.cedula || usuario.cedula_identidad;

  // Avatar e identidad básica (mientras carga la API)
  if (usuario.nombre) {
    document.getElementById('perfil-avatar').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('perfil-nombre').textContent = usuario.nombre;
  }

  await cargarPerfil(cedula);
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
      estadoBadge.textContent = '✓ Cuenta Activa';
      estadoBadge.className = 'badge-estado badge-activa';
    } else {
      estadoBadge.textContent = '⚠ ' + usuario.estado_cuenta.toUpperCase();
      estadoBadge.className = 'badge-estado badge-inactiva';
    }

    // Rol + datos laborales
    pintarInfoLaboral(docente, administrativo);

    // Vinculación
    const contVinc = document.getElementById('info-vinculacion');
    if (vinculacion) {
      contVinc.className = '';
      contVinc.innerHTML = `
        Vinculación activa desde <strong>${formatearFecha(vinculacion.fecha_inicio)}</strong>
        como <strong>${vinculacion.rol_activo}</strong>.
      `;
    } else {
      contVinc.textContent = 'No se encontró un periodo de vinculación vigente.';
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
    cont.innerHTML = `
      <p class="dato-fila"><span>Escalafón</span><strong>${docente.escalafon_docente}</strong></p>
      <p class="dato-fila"><span>Carga horaria semanal</span><strong>${docente.carga_horaria_semanal ?? 'Sin carga este semestre'}</strong></p>
      ${docente.codigo_invest ? `<p class="dato-fila"><span>Código de investigador</span><strong>${docente.codigo_invest}</strong></p>` : ''}
    `;
  } else if (administrativo) {
    rolEl.textContent = 'Personal Administrativo';
    cont.innerHTML = `
      <p class="dato-fila"><span>Cargo</span><strong>${administrativo.cargo}</strong></p>
      <p class="dato-fila"><span>Unidad de adscripción</span><strong>${administrativo.unidad_adscripcion_pre}</strong></p>
      <p class="dato-fila"><span>Carga horaria</span><strong>${administrativo.carga_horaria}</strong></p>
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

// ============================================================
// QA: CAMBIO DE CONTRASEÑA del empleado (usa /api/auth/cambiar-contrasena;
// la fecha del cambio queda registrada automáticamente en usuario).
// ============================================================
async function abrirCambioContrasena() {
  const actual = prompt('Contraseña actual:');
  if (!actual) return;
  const nueva = prompt('Nueva contraseña (mínimo 8 caracteres):');
  if (!nueva) return;
  if (nueva.length < 8) { alert('La nueva contraseña debe tener al menos 8 caracteres.'); return; }

  try {
    const token = localStorage.getItem('ucab_token');
    const resp = await fetch('http://localhost:5000/api/auth/cambiar-contrasena', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasenaActual: actual, contrasenaNueva: nueva })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'No se pudo cambiar la contraseña.');
    alert('✅ Contraseña actualizada. La fecha del cambio quedó registrada.');
  } catch (error) {
    alert('❌ ' + error.message);
  }
}