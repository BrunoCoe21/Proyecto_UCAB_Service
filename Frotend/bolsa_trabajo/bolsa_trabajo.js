
const API_URL = 'http://localhost:5000/api';

let vacantes = [];
let vacantesFiltradas = [];
let postulacionesUsuario = new Set(); // ids de vacantes a las que ya se postuló
let vacanteSeleccionada = null;
let usuario = null;
let token = null;

// --------------------------------------------------------------------------------------------------
//  INICIALIZACIÓN
// --------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  // Obtener sesion
  usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  token = localStorage.getItem('ucab_token');

  if (!usuario || !token) {
    window.location.href = '../login/login.html';
    return;
  }

  // Verificar que sea egresado
  const roles = usuario.roles || [];
  if (!roles.includes('egresado')) {
    alert('Acceso restringido a egresados.');
    window.location.href = '../estudiante/index.html';
    return;
  }

  // Configurar evento del filtro
  const filtroSelect = document.getElementById('filtro-perfil');
  filtroSelect.addEventListener('change', aplicarFiltro);

  // 4. Cargar datos
  await cargarPerfilEgresado();
  await cargarPostulaciones();
  await cargarVacantes();
});

// --------------------------------------------------------------------------------------------------
//  OBTENER PERFIL DEL EGRESADO (índice académico)
// --------------------------------------------------------------------------------------------------
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

// --------------------------------------------------------------------------------------------------
//  OBTENER POSTULACIONES DEL USUARIO
// --------------------------------------------------------------------------------------------------
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

// --------------------------------------------------------------------------------------------------
//  CARGAR VACANTES Y POBLAR FILTRO
// --------------------------------------------------------------------------------------------------
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
          <p> No hay oportunidades laborales disponibles en este momento.</p>
          <p style="font-size: 13px; color: #8a9bb2; margin-top: 8px;">Vuelve más tarde.</p>
        </div>
      `;
      const select = document.getElementById('filtro-perfil');
      select.innerHTML = '<option value="todos">Todos</option>';
      return;
    }

    poblarFiltro(vacantes);

    vacantesFiltradas = [...vacantes];
    renderizarVacantes(vacantesFiltradas, 'todos');

  } catch (error) {
    console.error('Error:', error);
    container.innerHTML = `
      <div class="error-message">
        <p> ERRROR: No se pudieron cargar las vacantes</p>
        <p style="font-size: 13px; color: #666;">${error.message}</p>
        <button onclick="cargarVacantes()">Reintentar</button>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------------------------------
//  POBLAR EL SELECT CON PERFILES ÚNICOS
// --------------------------------------------------------------------------------------------------
function poblarFiltro(vacantes) {
  const select = document.getElementById('filtro-perfil');
  // Limpiar opciones existentes, mantener solo "Todos"
  select.innerHTML = '<option value="todos">Todos</option>';

  const perfiles = new Set();
  vacantes.forEach(v => {
    if (v.perfil_buscado) {
      perfiles.add(v.perfil_buscado);
    }
  });

  // Ordenar alfabeticamente
  const perfilesOrdenados = Array.from(perfiles).sort((a, b) => a.localeCompare(b));
  perfilesOrdenados.forEach(perfil => {
    const option = document.createElement('option');
    option.value = perfil;
    option.textContent = perfil;
    select.appendChild(option);
  });
}

// --------------------------------------------------------------------------------------------------
//  APLICAR FILTRO (al cambiar el select)
// --------------------------------------------------------------------------------------------------
function aplicarFiltro() {
  const select = document.getElementById('filtro-perfil');
  const perfilSeleccionado = select.value;

  let vacantesAMostrar = vacantes;
  let perfilMostrado = 'todos';

  if (perfilSeleccionado !== 'todos') {
    vacantesAMostrar = vacantes.filter(v => v.perfil_buscado === perfilSeleccionado);
    perfilMostrado = perfilSeleccionado;
  }

  vacantesFiltradas = vacantesAMostrar;
  renderizarVacantes(vacantesAMostrar, perfilMostrado);

  // Si la vacante seleccionada previamente no está en el filtro, limpiar el detalle
  if (vacanteSeleccionada) {
    const existe = vacantesAMostrar.some(v => v.id_vacante === vacanteSeleccionada.id_vacante);
    if (!existe) {
      vacanteSeleccionada = null;
      const panel = document.getElementById('panel-detalle');
      if (panel) {
        panel.innerHTML = `
          <div class="detalle-vacio">
            <span class="icono">💼</span>
            <h3>Selecciona una oportunidad</h3>
            <p>Haz clic en una tarjeta para ver los detalles de la vacante.</p>
          </div>
        `;
      }
    }
  } else {
    // Si no hay selección y hay vacantes, seleccionar la primera
    if (vacantesAMostrar.length > 0) {
      // No seleccionamos automáticamente para no forzar, pero si el usuario quiere, puede hacer clic.
      // Opcional: seleccionar la primera
      // mostrarDetalle(vacantesAMostrar[0]);
    }
  }
}

// --------------------------------------------------------------------------------------------------
//  RENDERIZAR TARJETAS DE VACANTES
// --------------------------------------------------------------------------------------------------
function renderizarVacantes(vacantesMostrar, perfilSeleccionado) {
  const container = document.getElementById('lista-vacantes');

  if (vacantesMostrar.length === 0) {
    let mensaje = 'No hay oportunidades disponibles.';
    if (perfilSeleccionado !== 'todos') {
      mensaje = `No hay oportunidades disponibles para el perfil: ${perfilSeleccionado}.`;
    }
    container.innerHTML = `
      <div class="sin-vacantes">
        <p>📌 ${mensaje}</p>
      </div>
    `;
    return;
  }

  let html = '<div class="vacantes-grid">';
  vacantesMostrar.forEach(v => {
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

}

// --------------------------------------------------------------------------------------------------
//  MOSTRAR DETALLE DE UNA VACANTE
// --------------------------------------------------------------------------------------------------
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
          <strong> Contacto:</strong> ${vacante.contactos}
        </div>
      ` : ''}

      <div class="detalle-seccion">
        <h4> Responsabilidades</h4>
        <p>${vacante.responsabilidad || 'No especificadas'}</p>
      </div>

      <div class="detalle-seccion">
        <h4> Perfil buscado</h4>
        <p class="perfil-buscado">${vacante.perfil_buscado || 'No especificado'}</p>
      </div>

      <div class="detalle-seccion">
        <h4> Beneficios</h4>
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

// --------------------------------------------------------------------------------------------------
// POSTULARSE A UNA VACANTE - CON MODAL PERSONALIZADO
// --------------------------------------------------------------------------------------------------
async function postularse(idVacante) {
    // Obtener la vacante seleccionada
    const vacante = vacantesFiltradas.find(v => v.id_vacante === idVacante);
    const nombreVacante = vacante ? vacante.cargo_solicitado : 'Oportunidad laboral';
    const empresa = vacante ? vacante.organizacion : '';

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
            // Manejar diferentes tipos de errores
            if (response.status === 409) {
                mostrarModalPostulacion(
                    'warning',
                    'Ya te has postulado',
                    'Ya tienes una postulación activa para esta vacante.',
                    { 'Vacante': nombreVacante, 'Estado': 'Postulación existente' }
                );
                return;
            }
            if (response.status === 403) {
                mostrarModalPostulacion(
                    'error',
                    'Perfil no compatible',
                    'Tu perfil no coincide con los requisitos de la vacante.',
                    { 'Requisito': data.error || 'Verifica el perfil buscado' }
                );
                return;
            }
            if (response.status === 404) {
                mostrarModalPostulacion(
                    'error',
                    'Vacante no disponible',
                    'La vacante ya no está disponible o fue cerrada.',
                    null
                );
                return;
            }
            throw new Error(data.error || 'Error al postularse');
        }

        // ✅ ÉXITO - Mostrar modal de éxito
        mostrarModalPostulacion(
            'exito',
            '¡Postulación enviada!',
            `Tu postulación para "${nombreVacante}" ha sido registrada correctamente.`,
            {
                'Empresa': empresa || 'No especificada',
                'Vacante': nombreVacante,
                'Estado': 'En revisión'
            }
        );

        // Actualizar el estado local
        postulacionesUsuario.add(idVacante);
        
        // Re-renderizar manteniendo el filtro actual
        const select = document.getElementById('filtro-perfil');
        const perfil = select ? select.value : 'todos';
        aplicarFiltro();

        // Si la vacante seleccionada era la misma, actualizar el detalle
        if (vacanteSeleccionada && vacanteSeleccionada.id_vacante === idVacante) {
            mostrarDetalle(vacanteSeleccionada);
        }

    } catch (error) {
        console.error('Error al postularse:', error);
        mostrarModalPostulacion(
            'error',
            'Error al postular',
            'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
            { 'Detalle': error.message || 'Error desconocido' }
        );
    }
}

// --------------------------------------------------------------------------------------------------
//  UTILIDAD: FORMATEAR FECHA
// --------------------------------------------------------------------------------------------------
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

// --------------------------------------------------------------------------------------------------
//  EVENTO DE CLIC EN TARJETAS (delegación)
// --------------------------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Delegación de eventos para las tarjetas
  document.getElementById('lista-vacantes').addEventListener('click', (e) => {
    const card = e.target.closest('.tarjeta-vacante');
    if (card) {
      const id = card.dataset.id;
      // Buscar en vacantesFiltradas (las que están visibles)
      const vacante = vacantesFiltradas.find(v => v.id_vacante === id);
      if (vacante) mostrarDetalle(vacante);
    }
  });
});

// --------------------------------------------------------------------------------------------------
// MODAL DE POSTULACIÓN - Funciones
// --------------------------------------------------------------------------------------------------

/**
 * Muestra un modal personalizado para el resultado de la postulación
 * @param {string} tipo - 'exito', 'error', 'warning'
 * @param {string} titulo - Título del modal
 * @param {string} mensaje - Mensaje principal
 * @param {Object} detalle - Datos adicionales a mostrar (opcional)
 */
function mostrarModalPostulacion(tipo, titulo, mensaje, detalle = null) {
    const modal = document.getElementById('modal-postulacion');
    const icono = document.getElementById('modal-icono');
    const tituloEl = document.getElementById('modal-titulo');
    const subtituloEl = document.getElementById('modal-subtitulo');
    const mensajeEl = document.getElementById('modal-mensaje');
    const detalleEl = document.getElementById('modal-detalle');
    const btnPrincipal = document.getElementById('modal-btn-principal');

    // Configurar segun el tipo
    const config = {
        exito: {
            clase: 'exito',
            btnClase: 'exito',
            btnTexto: 'Continuar',
            subtitulo: '¡Postulación registrada!'
        },
        error: {
            clase: 'error',
            btnClase: 'error',
            btnTexto: 'Intentar de nuevo',
            subtitulo: 'No se pudo completar la postulación'
        },
        warning: {
            clase: 'warning',
            btnClase: 'warning',
            btnTexto: 'Entendido',
            subtitulo: 'Atención'
        }
    };

    const cfg = config[tipo] || config.warning;

    // Asignar icono y estilos
    icono.textContent = cfg.icono;
    icono.className = `modal-postulacion-icono ${cfg.clase}`;
    
    // Asignar texto
    tituloEl.textContent = titulo;
    subtituloEl.textContent = cfg.subtitulo;
    mensajeEl.textContent = mensaje;

    // Configurar boton
    btnPrincipal.textContent = cfg.btnTexto;
    btnPrincipal.className = `btn-modal-postulacion ${cfg.btnClase}`;
    
    // Configurar evento del boton segun el tipo
    btnPrincipal.onclick = function() {
        cerrarModalPostulacion();
        if (tipo === 'exito') {
            setTimeout(() => {
                const select = document.getElementById('filtro-perfil');
                const perfil = select ? select.value : 'todos';
                aplicarFiltro();
            }, 300);
        }
    };

    // Mostrar detalle si existe
    if (detalle) {
        detalleEl.style.display = 'block';
        detalleEl.innerHTML = Object.entries(detalle)
            .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
            .join('');
    } else {
        detalleEl.style.display = 'none';
    }

    // Mostrar modal
    modal.classList.add('abierto');

    // Cerrar con Escape
    document.addEventListener('keydown', function handler(e) {
        if (e.key === 'Escape') {
            cerrarModalPostulacion();
            document.removeEventListener('keydown', handler);
        }
    });
}

//Cierra el modal de postulacion
function cerrarModalPostulacion() {
    const modal = document.getElementById('modal-postulacion');
    modal.classList.remove('abierto');
}


 // Cierra el modal haciendo clic afuera 
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-postulacion');
    if (modal && modal.classList.contains('abierto')) {
        if (e.target === modal) {
            cerrarModalPostulacion();
        }
    }
});