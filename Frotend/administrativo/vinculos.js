

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  await cargarVinculos();
  document.getElementById('form-vinculo').addEventListener('submit', guardarVinculo);
});

// ----------------------------------------------------------------------------
//  Lista todos los vinculos familiares en la tabla.
// ----------------------------------------------------------------------------
async function cargarVinculos() {
  const cuerpo = document.getElementById('tabla-body');
  try {
    const vinculos = await API.request('/vinculos');
    window._vinculosCache = vinculos; 

    if (vinculos.length === 0) {
      cuerpo.innerHTML = '<tr><td colspan="7" class="texto-vacio">No hay familiares registrados.</td></tr>';
      return;
    }

    cuerpo.innerHTML = vinculos.map(v => filaVinculo(v)).join('');

  } catch (error) {
    cuerpo.innerHTML = `<tr><td colspan="7" class="texto-error">Error: ${error.message}</td></tr>`;
  }
}

function filaVinculo(v) {
  const subtipoLabel = { menor: 'Menor de edad', mayor_estudiante: 'Mayor — estudiante', sin_subtipo: '—' }[v.subtipo];
  const estadoClase = v.estado_vinculo === 'activo' ? 'estado-activo' : 'estado-inactivo';
  const botonBaja = v.estado_vinculo === 'activo'
    ? `<button class="btn-accion btn-baja" onclick="inactivar(${v.ci})">Dar de baja</button>`
    : '';

  return `
    <tr>
      <td>${v.nombre}</td>
      <td>${v.ci}</td>
      <td>${v.parentesco}</td>
      <td>${Math.floor(v.edad_actual)} años</td>
      <td>${subtipoLabel}</td>
      <td><span class="badge ${estadoClase}">${v.estado_vinculo.toUpperCase()}</span></td>
      <td class="celda-acciones">
        <!-- CORRECCIÓN (bug QA del botón Editar): antes se serializaba el
             objeto completo con JSON.stringify dentro del onclick; cualquier
             comilla o apóstrofe en el nombre rompía el HTML y el botón dejaba
             de responder. Ahora se pasa solo la cédula y se busca en cache. -->
        <button class="btn-accion btn-editar" onclick="editarPorCi('${v.ci}')">Editar</button>
        ${botonBaja}
      </td>
    </tr>
  `;
}

// ----------------------------------------------------------------------------
//  Modal: abrir en modo "nuevo"
// ----------------------------------------------------------------------------
function abrirModalNuevo() {
  document.getElementById('modal-titulo').textContent = 'Registrar familiar';
  document.getElementById('modo-edicion').value = 'nuevo';
  document.getElementById('form-vinculo').reset();
  document.getElementById('f-ci').disabled = false;
  cambiarSubtipo();
  document.getElementById('modal-vinculo').style.display = 'flex';
}

// ----------------------------------------------------------------------------
//  Modal: abrir en modo "editar" con los datos ya cargados
// ----------------------------------------------------------------------------
function editarPorCi(ci) {
  const v = (window._vinculosCache || []).find(x => String(x.ci) === String(ci));
  if (!v) { showAviso('No se encontró el vínculo.', 'error'); return; }
  editar(v);
}

function editar(v) {
  document.getElementById('modal-titulo').textContent = 'Editar familiar';
  document.getElementById('modo-edicion').value = 'editar';
  document.getElementById('f-ci').value = v.ci;
  document.getElementById('f-ci').disabled = true;   // la cédula no se edita, es la PK
  document.getElementById('f-nombre').value = v.nombre;
  document.getElementById('f-fecha-nac').value = v.fecha_nac?.split('T')[0] || '';
  document.getElementById('f-parentesco').value = v.parentesco;
  document.getElementById('f-subtipo').value = v.subtipo;
  cambiarSubtipo();

  if (v.subtipo === 'menor') {
    document.getElementById('f-vacunacion').value = v.esquema_vacunacion || '';
    document.getElementById('f-centro-edu').value = v.centro_edu_inic || '';
  } else if (v.subtipo === 'mayor_estudiante') {
    document.getElementById('f-constancia').value = v.constancia_estudio_ext || '';
    document.getElementById('f-soltería').value = v.certificado_solteria || '';
  }

  document.getElementById('modal-vinculo').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('modal-vinculo').style.display = 'none';
}

// Muestra/oculta los campos propios de cada subtipo segun lo elegido
function cambiarSubtipo() {
  const valor = document.getElementById('f-subtipo').value;
  document.getElementById('campos-menor').style.display = (valor === 'menor') ? 'block' : 'none';
  document.getElementById('campos-mayor').style.display = (valor === 'mayor_estudiante') ? 'block' : 'none';
}

// ----------------------------------------------------------------------------
//  Enviar el formulario: crea o edita según el modo
// ----------------------------------------------------------------------------
async function guardarVinculo(e) {
  e.preventDefault();
  const modo = document.getElementById('modo-edicion').value;
  const subtipo = document.getElementById('f-subtipo').value;

  const datos = {
    ci: document.getElementById('f-ci').value,
    nombre: document.getElementById('f-nombre').value,
    fecha_nac: document.getElementById('f-fecha-nac').value,
    parentesco: document.getElementById('f-parentesco').value,
    subtipo,
    esquema_vacunacion: document.getElementById('f-vacunacion').value,
    centro_edu_inic: document.getElementById('f-centro-edu').value,
    constancia_estudio_ext: document.getElementById('f-constancia').value,
    certificado_solteria: document.getElementById('f-soltería').value,
  };

  try {
    if (modo === 'nuevo') {
      await API.request('/vinculos', 'POST', datos);
    } else {
      await API.request(`/vinculos/${datos.ci}`, 'PUT', datos);
    }
    cerrarModal();
    await cargarVinculos();
  } catch (error) {
    showAviso('No se pudo guardar: ' + error.message, 'error');
  }
}

// ----------------------------------------------------------------------------
//  Dar de baja (inactivar, no se borra el historial).
// ----------------------------------------------------------------------------
async function inactivar(ci) {
  if (!confirm('¿Confirma dar de baja a este familiar? Esto cierra su vínculo, no lo elimina.')) return;
  try {
    await API.request(`/vinculos/${ci}/inactivar`, 'PUT');
    await cargarVinculos();
  } catch (error) {
    showAviso('No se pudo dar de baja: ' + error.message, 'error');
  }
}