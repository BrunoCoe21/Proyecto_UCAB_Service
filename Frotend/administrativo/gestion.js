
document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  await cargarOficinas();
});

async function cargarOficinas() {
  const select = document.getElementById('select-oficina');
  try {
    // QA: si el empleado es responsable asignado de alguna oficina, SOLO ve
    // esas oficinas (y sus pasos). Si no tiene ninguna asignada todavía, ve
    // todas y puede asignarse una con el botón "Asignarme esta oficina".
    const misOficinas = await API.request('/gestion/mis-oficinas');
    const oficinas = misOficinas.length > 0 ? misOficinas : await API.request('/gestion/oficinas');
    window._tieneOficinaAsignada = misOficinas.length > 0;

    select.innerHTML = '<option value="">Selecciona una oficina...</option>' +
      oficinas.map(o => `<option value="${o.nombre_oficina}">${o.nombre_oficina}${o.responsable_asignado ? ' — Resp: ' + o.responsable_asignado : ''}</option>`).join('');

    // Si ya había una oficina elegida en una visita anterior, la recuerda.
    const ultimaOficina = localStorage.getItem('ucab_oficina_seleccionada');
    if (ultimaOficina) {
      select.value = ultimaOficina;
      cargarPasos(ultimaOficina);
    }
  } catch (error) {
    select.innerHTML = '<option value="">Error al cargar oficinas</option>';
  }
}

function cambiarOficina() {
  const oficina = document.getElementById('select-oficina').value;
  localStorage.setItem('ucab_oficina_seleccionada', oficina);
  if (oficina) cargarPasos(oficina);
}

// ----------------------------------------------------------------------------
//  Lista los pasos pendientes/en proceso de la oficina elegida.
// ----------------------------------------------------------------------------
async function cargarPasos(nombreOficina) {
  const cont = document.getElementById('lista-pasos');
  cont.innerHTML = '<p class="texto-vacio">Cargando pasos...</p>';

  try {
    const pasos = await API.request(`/gestion/pasos/${encodeURIComponent(nombreOficina)}`);

    if (pasos.length === 0) {
      cont.innerHTML = '<p class="texto-vacio">No hay pasos pendientes en esta oficina. ¡Todo al día!</p>';
      return;
    }

    const botonAsignarse = window._tieneOficinaAsignada
      ? ''
      : `<div style="margin-bottom:12px;">
           <button class="btn-accion btn-iniciar" onclick="asignarmeOficina('${nombreOficina.replace(/'/g, "\\'")}')">
             📌 Asignarme como responsable de esta oficina
           </button>
         </div>`;

    cont.innerHTML = botonAsignarse + pasos.map(p => tarjetaPaso(p)).join('');

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error: ${error.message}</p>`;
  }
}

// asignacion de responsables por oficina.
async function asignarmeOficina(nombreOficina) {
  if (!confirm(`¿Asignarte como responsable de "${nombreOficina}"? A partir de ahora solo veras los pasos de tus oficinas.`)) return;
  try {
    await API.request(`/gestion/oficinas/${encodeURIComponent(nombreOficina)}/responsable`, 'PUT', {});
    showAviso('Asignación registrada.', 'ok');
    localStorage.setItem('ucab_oficina_seleccionada', nombreOficina);
    await cargarOficinas();
    cargarPasos(nombreOficina);
  } catch (error) {
    showAviso('No se pudo asignar: ' + error.message, 'error');
  }
}

function tarjetaPaso(p) {
  const bloqueado = p.bloqueado_por_anterior;
  const estadoClase = { pendiente: 'estado-pendiente', 'en proceso': 'estado-proceso' }[p.estado_paso];

  return `
    <div class="tarjeta-paso ${bloqueado ? 'paso-bloqueado' : ''}">
      <div class="paso-info" onclick="verSolicitud('${p.id_solicitud}')">
        <div class="paso-top">
          <span class="paso-solicitud">${p.id_solicitud}</span>
          <span class="badge ${estadoClase}">${p.estado_paso.toUpperCase()}</span>
          ${bloqueado ? '<span class="badge-bloqueado">⏳ Esperando paso anterior</span>' : ''}
        </div>
        <p class="paso-nombre">Paso ${p.num_paso}: ${p.nombre_paso || 'Sin nombre'}</p>
        <p class="paso-servicio">${p.servicio_nombre || p.codigo_servicio}</p>
        <p class="paso-solicitante">Solicitante: ${p.primer_nombre} ${p.primer_apellido} (${p.cedula_identidad})</p>
      </div>
      <div class="paso-acciones">
        ${p.estado_paso === 'pendiente'
          ? `<button class="btn-accion btn-iniciar" ${bloqueado ? 'disabled title="Hay un paso anterior sin completar"' : ''}
                     onclick="cambiarEstado('${p.id_solicitud}', ${p.num_paso}, 'en proceso')">Iniciar</button>`
          : ''}
        ${p.estado_paso === 'en proceso'
          ? `<button class="btn-accion btn-completar" ${bloqueado ? 'disabled title="Hay un paso anterior sin completar"' : ''}
                     onclick="cambiarEstado('${p.id_solicitud}', ${p.num_paso}, 'completado')">Completar</button>`
          : `<button class="btn-accion btn-completar" disabled
                     title="El paso debe estar 'en proceso' para poder completarse">Completar</button>`}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
//  Cambia el estado de un paso. Si la base rechaza (paso anterior pendiente)
// ----------------------------------------------------------------------------
async function cambiarEstado(idSolicitud, numPaso, nuevoEstado) {
  try {
    await API.request(`/gestion/pasos/${idSolicitud}/${numPaso}`, 'PUT', { estado_paso: nuevoEstado });
    const oficina = document.getElementById('select-oficina').value;
    await cargarPasos(oficina);
  } catch (error) {
    showAviso('No se pudo actualizar el paso: ' + error.message, 'error');
  }
}

// ----------------------------------------------------------------------------
//  Modal: ver el detalle completo de una solicitud (todos sus pasos).
// ----------------------------------------------------------------------------
async function verSolicitud(idSolicitud) {
  document.getElementById('modal-solicitud').style.display = 'flex';
  document.getElementById('modal-contenido').innerHTML = '<p class="texto-vacio">Cargando...</p>';

  try {
    const { solicitud, pasos } = await API.request(`/gestion/solicitud/${idSolicitud}`);

    document.getElementById('modal-titulo').textContent = `Solicitud ${solicitud.id_solicitud}`;

    const filasPasos = pasos.map(p => `
      <div class="fila-paso-modal">
        <span class="num-paso">${p.num_paso}</span>
        <div class="info-paso-modal">
          <strong>${p.nombre_paso || 'Sin nombre'}</strong>
          <span class="oficina-paso">${p.nombre_oficina || 'Sin oficina'}</span>
        </div>
        <span class="badge ${p.estado_paso === 'completado' ? 'estado-completado' : (p.estado_paso === 'en proceso' ? 'estado-proceso' : 'estado-pendiente')}">
          ${p.estado_paso.toUpperCase()}
        </span>
      </div>
    `).join('');

    document.getElementById('modal-contenido').innerHTML = `
      <div class="resumen-modal">
        <p><strong>Solicitante:</strong> ${solicitud.primer_nombre} ${solicitud.primer_apellido} (${solicitud.cedula_identidad})</p>
        <p><strong>Servicio:</strong> ${solicitud.servicio_nombre || solicitud.codigo_servicio}</p>
        <p><strong>Estado general:</strong> ${solicitud.estado_general}</p>
        <p><strong>Creada:</strong> ${new Date(solicitud.fecha_creacion).toLocaleDateString('es-VE')}</p>
      </div>
      <h3 class="titulo-pasos-modal">Pasos del trámite</h3>
      ${filasPasos}
    `;
  } catch (error) {
    document.getElementById('modal-contenido').innerHTML = `<p class="texto-error">Error: ${error.message}</p>`;
  }
}

function cerrarModal() {
  document.getElementById('modal-solicitud').style.display = 'none';
}