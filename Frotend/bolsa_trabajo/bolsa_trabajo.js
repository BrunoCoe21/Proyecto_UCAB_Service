// ============================================================================
//  bolsa_trabajo.js  ·  UCAB-Services  ·  Bolsa de Trabajo (Egresados)
//  Consume los endpoints de /api/vacantes definidos en vacanteController.
// ============================================================================

const API_URL = 'http://localhost:5000/api';

let vacantes = [];
let postulacionesUsuario = new Set(); // ids de vacantes a las que ya se postuló
let vacanteSeleccionada = null;
let usuario = null;
let token = null;

// ============================================================
//  INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Obtener sesión
  usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  token = localStorage.getItem('ucab_token');

  if (!usuario || !token) {
    window.location.href = '../login/login.html';
    return;
  }

  // 2. Verificar que sea egresado (por si acaso)
  const roles = usuario.roles || [];
  if (!roles.includes('egresado')) {
    alert('Acceso restringido a egresados.');
    window.location.href = '../estudiante/index.html';
    return;
  }

  // 3. Cargar datos
  await cargarPerfilEgresado();
  await cargarPostulaciones();
  await cargarVacantes();

  // 4. Configurar evento para clics en tarjetas (delegación)
  document.getElementById('lista-vacantes').addEventListener('click', (e) => {
    const card = e.target.closest('.tarjeta-vacante');
    if (card) {
      const id = card.dataset.id;
      const vacante = vacantes.find(v => v.id_vacante === id);
      if (vacante) mostrarDetalle(vacante);
    }
  });
});

// ============================================================
//  OBTENER PERFIL DEL EGRESADO (índice académico)
// ============================================================
async function cargarPerfilEgresado() {
  try {
    const cedula = usuario.cedula || usuario.cedula_identidad;
    const response = await fetch(`${API_URL}/vacantes/perfil/${cedula}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudo obtener el perfil');
    const data = await response.json();
    const indice = data.indice_academico_final || '--';
    document.getElementById('indice-academico').textContent = `Tu índice académico: ${indice}`;
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    document.getElementById('indice-academico').textContent = 'Índice no disponible';
  }
}

// ============================================================
//  OBTENER POSTULACIONES DEL USUARIO
// ============================================================
async function cargarPostulaciones() {
  try {
    const cedula = usuario.cedula || usuario.cedula_identidad;
    const response = await fetch(`${API_URL}/vacantes/mias/${cedula}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudieron cargar tus postulaciones');
    const data = await response.json();
    postulacionesUsuario = new Set(data.map(p => p.id_vacante));
  } catch (error) {
    console.warn('No se pudieron cargar postulaciones:', error);
    postulacionesUsuario = new Set();
  }
}

// ============================================================
//  LISTAR VACANTES
// ============================================================
async function cargarVacantes() {
  const container = document.getElementById('lista-vacantes');
  try {
    const response = await fetch(`${API_URL}/vacantes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al cargar vacantes');
    vacantes = await response.json();

    if (!Array.isArray(vacantes) || vacantes.length === 0) {
      container.innerHTML = `
        <div class="sin-vacantes">
          <p>📌 No hay oportunidades laborales disponibles en este momento.</p>
          <p style="font-size: 13px; color: #8a9bb2; margin-top: 8px;">Vuelve más tarde.</p>
        </div>
      `;
      return;
    }

    // Renderizar tarjetas
    let html = '<div class="vacantes-grid">';
    vacantes.forEach(v => {
      const yaPostulado = postulacionesUsuario.has(v.id_vacante);
      const estadoClase = v.estatus_vacante === 'disponible' ? 'disponible' : 'finalizada';
      const estadoTexto = yaPostulado ? 'Postulado' : (v.estatus_vacante === 'disponible' ? 'Disponible' : 'Finalizada');
      const badgeClase = yaPostulado ? 'postulado' : estadoClase;

      html += `
        <div class="tarjeta-vacante" data-id="${v.id_vacante}">
          <div class="cargo">${v.cargo_solicitado || 'Sin título'}</div>
          <div class="organizacion">${v.organizacion || 'Empresa no especificada'}</div>
          <div class="meta-info">
            <span class="fecha">📅 ${formatearFecha(v.fecha_oferta)}</span>
            <span class="estado-badge ${badgeClase}">${estadoTexto}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;

    // Si hay vacantes, seleccionar la primera automáticamente (opcional)
    if (vacantes.length > 0) {
      mostrarDetalle(vacantes[0]);
    }

  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>⚠️ No se pudieron cargar las vacantes</p>
        <p style="font-size: 13px; color: #666;">${error.message}</p>
        <button onclick="cargarVacantes()">Reintentar</button>
      </div>
    `;
  }
}

// ============================================================
//  MOSTRAR DETALLE DE UNA VACANTE
// ============================================================
function mostrarDetalle(vacante) {
  vacanteSeleccionada = vacante;
  const panel = document.getElementById('panel-detalle');

  const yaPostulado = postulacionesUsuario.has(vacante.id_vacante);
  const estaDisponible = vacante.estatus_vacante === 'disponible';

  let html = `
    <div class="detalle-vacante">
      <div class="detalle-cargo">${vacante.cargo_solicitado || 'Sin título'}</div>
      <div class="detalle-organizacion">🏢 ${vacante.organizacion || 'Empresa no especificada'}</div>

      ${vacante.contactos ? `
        <div class="detalle-contacto">
          <strong>📞 Contacto:</strong> ${vacante.contactos}
        </div>
      ` : ''}

      <div class="detalle-seccion">
        <h4>📋 Responsabilidades</h4>
        <p>${vacante.responsabilidad || 'No especificadas'}</p>
      </div>

      <div class="detalle-seccion">
        <h4>🎯 Perfil buscado</h4>
        <p class="perfil-buscado">${vacante.perfil_buscado || 'No especificado'}</p>
      </div>

      <div class="detalle-seccion">
        <h4>✨ Beneficios</h4>
        <p>${vacante.beneficios || 'No especificados'}</p>
      </div>

      <div class="detalle-boton">
  `;

  if (yaPostulado) {
    html += `
      <button class="btn-postular postulado" disabled>
        Ya te has postulado
      </button>
    `;
  } else if (estaDisponible) {
    html += `
      <button class="btn-postular" onclick="postularse('${vacante.id_vacante}')">
        Postularme
      </button>
    `;
  } else {
    html += `
      <button class="btn-postular" disabled style="background:#b0a8b8;">
        Vacante finalizada
      </button>
    `;
  }

  html += `
      </div>
    </div>
  `;

  panel.innerHTML = html;
}

// ============================================================
//  POSTULARSE A UNA VACANTE
// ============================================================
async function postularse(idVacante) {
  try {
    const response = await fetch(`${API_URL}/vacantes/${idVacante}/postular`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        alert('⚠️ Ya te has postulado a esta vacante anteriormente.');
        // Actualizar la lista de postulaciones para reflejar el cambio
        await cargarPostulaciones();
        // Re-renderizar tarjetas y detalle
        await cargarVacantes();
        return;
      }
      throw new Error(data.error || 'Error al postularse');
    }

    alert('✅ Postulación enviada correctamente.');

    // Actualizar el estado local
    postulacionesUsuario.add(idVacante);
    // Re-renderizar tarjetas y detalle
    await cargarVacantes();
    // Si la vacante seleccionada era la misma, actualizar el detalle
    if (vacanteSeleccionada && vacanteSeleccionada.id_vacante === idVacante) {
      mostrarDetalle(vacanteSeleccionada);
    }

  } catch (error) {
    console.error('Error al postularse:', error);
    alert('❌ No se pudo completar la postulación: ' + error.message);
  }
}

// ============================================================
//  UTILIDAD: FORMATEAR FECHA
// ============================================================
function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Fecha no disponible';
  const fecha = new Date(fechaStr);
  if (isNaN(fecha)) return fechaStr;
  const ahora = new Date();
  const diff = Math.floor((ahora - fecha) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}