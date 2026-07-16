// /Frotend/servicio/servicio.js
const API_URL = 'http://localhost:5000/api';

let servicioSeleccionado = null;
let perfilUsuario = null; // 'miembro_activo', 'egresado', 'publico_externo'
// QA: registro en memoria de los documentos de acreditación "cargados"
// (simulación de carga de archivos). Clave: codigo_servicio -> Set de ids.
const documentosCargados = {};

// ============================================================
// OBTENER PERFIL DEL USUARIO
// ============================================================
function obtenerPerfilUsuario() {
  const rol = localStorage.getItem('ucab_rol');
  
  // Determinar el perfil según el rol
  if (rol === 'ESTUDIANTE' || rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    return 'miembro_activo';
  } else if (rol === 'EGRESADO') {
    return 'egresado';
  } else {
    return 'publico_externo';
  }
}

// ============================================================
// OBTENER PRECIO SEGÚN PERFIL
// ============================================================
function obtenerPrecioPorPerfil(tarifas, perfil) {
  if (!tarifas) return null;
  
  switch(perfil) {
    case 'miembro_activo':
      return tarifas.miembro_activo;
    case 'egresado':
      return tarifas.egresado;
    case 'publico_externo':
      return tarifas.publico_externo;
    default:
      return tarifas.miembro_activo;
  }
}

// ============================================================
// CARGAR SERVICIOS
// ============================================================
async function cargarServiciosEspacios() {
  try {
    console.log('🔍 Cargando servicios...');
    
    const token = localStorage.getItem('ucab_token');
    
    // OBTENER PERFIL DEL USUARIO
    perfilUsuario = obtenerPerfilUsuario();
    console.log('📍 Perfil del usuario:', perfilUsuario);
    
    const response = await fetch(`${API_URL}/service/espacios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    
    let servicios = await response.json();
    console.log('✅ Servicios cargados:', servicios.length);
    
    if (!Array.isArray(servicios)) {
      servicios = [servicios];
    }

    const container = document.getElementById('catalogo-dinamico');
    if (!container) {
      console.error('❌ No se encontró #catalogo-dinamico');
      return;
    }

    if (servicios.length === 0) {
      container.innerHTML = `
        <div class="sin-servicios">
          <p>📌 No hay servicios disponibles.</p>
          <p style="font-size: 13px; color: #8a9bb2; margin-top: 8px;">Los servicios se muestran según tu perfil.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="servicios-grid">';
    
    servicios.forEach(servicio => {
      // OBTENER PRECIO SEGÚN PERFIL DEL USUARIO
      const tarifas = servicio.tarifas;
      const precio = obtenerPrecioPorPerfil(tarifas, perfilUsuario);
      const precioFormateado = precio ? Number(precio).toFixed(2) : Number(servicio.precio).toFixed(2);
      
      // Precio de referencia (miembro activo) para mostrar el tachado
      const precioReferencia = tarifas?.miembro_activo ? Number(tarifas.miembro_activo).toFixed(2) : null;
      
      const limiteMax = servicio.limite_maximo;
      const limiteMaxFormateado = limiteMax ? Number(limiteMax).toFixed(2) : 'Sin límite';
      
      // Etiqueta de perfil
      let etiquetaPerfil = '';
      if (perfilUsuario === 'miembro_activo') etiquetaPerfil = '👤 Miembro Activo';
      else if (perfilUsuario === 'egresado') etiquetaPerfil = '🎓 Egresado';
      else etiquetaPerfil = '🌐 Público Externo';
      
      let color = 'bg-azul';
      let icono = '📋';
      const categoria = servicio.tipo_categoria || '';
      
      if (categoria === 'Espacios') {
        color = 'bg-dorado';
        icono = '🏢';
      } else if (categoria === 'Educación Continua') {
        color = 'bg-verde';
        icono = '🎓';
      } else if (categoria === 'Salud') {
        color = 'bg-rojo';
        icono = '🏥';
      } else if (categoria === 'Cultura') {
        color = 'bg-morado';
        icono = '🎭';
      } else if (categoria === 'Deporte') {
        color = 'bg-naranja';
        icono = '⚽';
      } else if (categoria === 'Documentos') {
        color = 'bg-azul';
        icono = '📄';
      }

      // Mostrar entidad prestadora
      const entidadNombre = servicio.entidad_nombre || 'Entidad no especificada';

      html += `
        <div class="tarjeta-servicio" data-codigo="${servicio.codigo_servicio}">
          <div class="tarjeta-header">
            <div class="tag-grupo ${color}">
              <span class="icono-tag">${icono}</span>
              <span class="texto-tag">${categoria || 'Servicio'}</span>
            </div>
            <div class="precio-grupo">
              <span class="etiqueta-perfil">${etiquetaPerfil}</span>
              <span class="precio-actual">$${precioFormateado}</span>
              ${precioReferencia && perfilUsuario !== 'miembro_activo' ? 
                `<span class="precio-anterior">$${precioReferencia}</span>` : ''}
            </div>
          </div>
          <h3 class="servicio-titulo">${servicio.descripcion_detallada || servicio.codigo_servicio}</h3>
          <p class="servicio-desc">
            <strong>Sede:</strong> ${servicio.nombre_sede || 'No especificada'}<br>
            <strong>Entidad:</strong> ${entidadNombre}
          </p>
          <div class="tarjeta-footer">
            <span class="limite">💰 Límite máx. $${limiteMaxFormateado}</span>
          </div>
          <button class="btn-reservar" data-codigo="${servicio.codigo_servicio}">Solicitar Trámite</button>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

    // Eventos para botones "Solicitar Trámite"
    document.querySelectorAll('.btn-reservar').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const codigo = this.dataset.codigo;
        const servicio = servicios.find(s => s.codigo_servicio === codigo);
        if (servicio) {
          mostrarDetalleServicio(servicio);
        }
      });
    });

    // Evento para clic en toda la tarjeta
    document.querySelectorAll('.tarjeta-servicio').forEach(card => {
      card.addEventListener('click', function() {
        const codigo = this.dataset.codigo;
        const servicio = servicios.find(s => s.codigo_servicio === codigo);
        if (servicio) {
          mostrarDetalleServicio(servicio);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    const container = document.getElementById('catalogo-dinamico');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>⚠️ No se pudieron cargar los servicios</p>
          <p style="font-size: 12px; color: #666;">${error.message}</p>
          <button onclick="cargarServiciosEspacios()">Reintentar</button>
        </div>
      `;
    }
  }
}

// ============================================================
// MOSTRAR DETALLE DEL SERVICIO
// ============================================================
function mostrarDetalleServicio(servicio) {
  console.log('📋 Mostrando detalle de:', servicio.descripcion_detallada);
  
  servicioSeleccionado = servicio;
  
  const panel = document.getElementById('panel-detalle');
  if (!panel) {
    console.error('❌ No se encontró el panel de detalle');
    return;
  }
  
  // OBTENER PRECIO SEGÚN PERFIL
  const tarifas = servicio.tarifas;
  const precio = obtenerPrecioPorPerfil(tarifas, perfilUsuario);
  const precioFormateado = precio ? Number(precio).toFixed(2) : Number(servicio.precio).toFixed(2);
  
  const cargos = servicio.cargos_adicionales || [];
  const totalCargos = cargos.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
  const precioTotal = (Number(precioFormateado) + totalCargos).toFixed(2);
  
  const entidadNombre = servicio.entidad_nombre || 'Entidad no especificada';
  
  // Mostrar todas las tarifas en el detalle
  let tarifasHtml = '';
  if (tarifas) {
    tarifasHtml = `
      <div class="detalle-tarifas">
        <h4>TARIFAS SEGÚN PERFIL</h4>
        <div class="tarifa-fila">
          <span>👤 Miembro Activo</span>
          <span>$${Number(tarifas.miembro_activo).toFixed(2)}</span>
        </div>
        <div class="tarifa-fila ${perfilUsuario === 'egresado' ? 'destacada' : ''}">
          <span>🎓 Egresado</span>
          <span>$${Number(tarifas.egresado).toFixed(2)}</span>
        </div>
        <div class="tarifa-fila ${perfilUsuario === 'publico_externo' ? 'destacada' : ''}">
          <span>🌐 Público Externo</span>
          <span>$${Number(tarifas.publico_externo).toFixed(2)}</span>
        </div>
        <div class="tarifa-fila tu-precio">
          <span><strong>💰 Tu precio (${perfilUsuario === 'miembro_activo' ? 'Miembro Activo' : perfilUsuario === 'egresado' ? 'Egresado' : 'Público Externo'})</strong></span>
          <span><strong>$${precioFormateado}</strong></span>
        </div>
      </div>
    `;
  }
  
  let html = `
    <div class="detalle-servicio">
      <!-- Categoría -->
      <div class="detalle-categoria-tag">
        <span class="tag-categoria ${getColorCategoria(servicio.tipo_categoria)}">
          ${servicio.tipo_categoria || 'Servicio'}
        </span>
      </div>
      
      <!-- Título -->
      <h2 class="detalle-servicio-titulo">${servicio.descripcion_detallada || servicio.codigo_servicio}</h2>
      
      <!-- Entidad Prestadora -->
      <div class="detalle-entidad">
        <span class="entidad-label">🏢 Entidad Prestadora</span>
        <span class="entidad-nombre">${entidadNombre}</span>
      </div>
      
      <!-- Precios -->
      <div class="detalle-precios">
        <div class="detalle-precio-actual">$${precioFormateado}</div>
      </div>
      
      ${tarifasHtml}
  `;

  // CARGOS ADICIONALES
  if (cargos.length > 0) {
    html += `
      <div class="detalle-cargos">
        <h4>CARGOS ADICIONALES</h4>
    `;
    cargos.forEach(cargo => {
      html += `
        <div class="cargo-fila">
          <span>${cargo.nombre_concepto}</span>
          <span>+$${Number(cargo.monto).toFixed(2)}</span>
        </div>
      `;
    });
    html += `
        <div class="cargo-fila total">
          <span><strong>Total con cargos</strong></span>
          <span><strong>$${precioTotal}</strong></span>
        </div>
      </div>
    `;
  }

  // REQUISITOS
  if (servicio.requisitos_de_acceso) {
    html += `
      <div class="detalle-requisitos">
        <h4>Requisitos de acceso</h4>
        <p>${servicio.requisitos_de_acceso}</p>
      </div>
    `;
  }

  // QA — ACREDITACIONES: si el servicio exige documentos (tablas requiere y
  // acreditacion_requisito), se muestra un botón que SIMULA la carga de cada
  // archivo y el botón "Iniciar solicitud" queda INHABILITADO hasta que
  // todos los documentos estén cargados.
  const acreditaciones = servicio.acreditaciones || [];
  const cargados = documentosCargados[servicio.codigo_servicio] || new Set();
  const faltanDocumentos = acreditaciones.some(a => !cargados.has(a.id_acreditacion));

  if (acreditaciones.length > 0) {
    html += `
      <div class="detalle-requisitos">
        <h4>Documentos de acreditación requeridos</h4>
        ${acreditaciones.map(a => {
          const listo = cargados.has(a.id_acreditacion);
          return `
            <div class="cargo-fila" id="fila-acred-${a.id_acreditacion}">
              <span>${listo ? '✅' : '📎'} ${a.nombre_requisito} <small>(${a.tipo_documento})</small></span>
              ${listo
                ? '<span style="color:#065f46; font-weight:600;">Cargado</span>'
                : `<button type="button" class="btn-agregar-acompanante"
                           onclick="simularCargaDocumento('${servicio.codigo_servicio}','${a.id_acreditacion}')">
                     Cargar archivo
                   </button>`}
            </div>`;
        }).join('')}
      </div>
    `;
  }

  // ADVERTENCIA
  html += `
    <div class="detalle-advertencia">
      <p>⚠️ Asegúrese de estar solvente en caja antes de iniciar cualquier trámite.</p>
    </div>
    
    <!-- Botón Iniciar Solicitud (QA: inhabilitado si faltan acreditaciones) -->
    <button class="btn-iniciar-solicitud" id="btn-iniciar-solicitud"
            ${faltanDocumentos ? 'disabled style="opacity:0.5; cursor:not-allowed;" title="Debes cargar los documentos de acreditación requeridos"' : ''}
            onclick="iniciarSolicitud('${servicio.codigo_servicio}')">
      ${faltanDocumentos ? '🔒 Carga los documentos para continuar' : 'Iniciar solicitud ›'}
    </button>
  </div>
  `;
  
  panel.innerHTML = html;
}

// QA: simulación de carga de archivos de acreditación. Marca el documento
// como cargado y repinta el panel; cuando todos están cargados, el botón
// "Iniciar solicitud" se habilita.
function simularCargaDocumento(codigoServicio, idAcreditacion) {
  if (!documentosCargados[codigoServicio]) documentosCargados[codigoServicio] = new Set();
  documentosCargados[codigoServicio].add(idAcreditacion);
  alert('📄 Documento cargado correctamente (simulación).');
  if (servicioSeleccionado && servicioSeleccionado.codigo_servicio === codigoServicio) {
    mostrarDetalleServicio(servicioSeleccionado);
  }
}

// ============================================================
// RESTAURAR ESTADO VACÍO DEL PANEL
// ============================================================
function restaurarPanelVacio() {
  const panel = document.getElementById('panel-detalle');
  if (!panel) return;
  
  panel.innerHTML = `
    <div class="detalle-vacio">
      <div class="icono-fondo">
        <span>📋</span>
      </div>
      <h3>Selecciona un servicio</h3>
      <p>Haz clic en "Solicitar Trámite" en cualquier servicio para ver los detalles aquí.</p>
    </div>
  `;
}

// ============================================================
// OBTENER COLOR DE CATEGORÍA
// ============================================================
function getColorCategoria(categoria) {
  const colores = {
    'Cultura': 'morado',
    'Deporte': 'naranja',
    'Salud': 'rojo',
    'Educación Continua': 'verde',
    'Documentos': 'azul',
    'Espacios': 'dorado'
  };
  return colores[categoria] || 'azul';
}

// ============================================================
// INICIAR SOLICITUD
// ============================================================
// CAMBIO DE FLUJO (acordado): si el servicio es de categoría Cultura o
// Deporte, requiere reservar un espacio, así que en vez de crear la
// solicitud directo se abre el modal de reserva (definido más abajo). Ese
// modal crea la solicitud Y la reserva juntas al confirmar.
//
// CORRECCIÓN: se quitó 'estado_general: EN PROCESO' del body — ese valor en
// mayúsculas no coincidía con los que usa el resto de la base ('abierta',
// 'en proceso', 'cerrada'). Ahora el backend siempre decide el estado
// inicial ('abierta'), en minúsculas, de forma consistente.
async function iniciarSolicitud(codigoServicio) {
  if (!servicioSeleccionado) {
    alert('Por favor, seleccione un servicio primero.');
    return;
  }

  const categoriasConReserva = ['Cultura', 'Deporte'];
  if (categoriasConReserva.includes(servicioSeleccionado.tipo_categoria)) {
    abrirModalReservaServicio(servicioSeleccionado);
    return;
  }

  try {
    const token = localStorage.getItem('ucab_token');
    const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
    const cedula = usuario?.cedula || usuario?.cedula_identidad;

    if (!cedula) {
      alert('No se pudo identificar al usuario.');
      return;
    }

    const timestamp = Date.now().toString().slice(-6);
    const idSolicitud = `SOL-${timestamp}`;

    const response = await fetch(`${API_URL}/solicitudes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_solicitud: idSolicitud,
        cedula_identidad: cedula,
        codigo_servicio: codigoServicio
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear la solicitud');
    }

    console.log('✅ Solicitud creada');

    restaurarPanelVacio();
    window.location.href = '../estudiante/solicitudes.html';

  } catch (error) {
    console.error('❌ Error:', error);
    alert('No se pudo iniciar la solicitud: ' + error.message);
  }
}

// ============================================================================
//  MODAL DE RESERVA DE ESPACIO (movido aquí desde Mis Solicitudes, acordado)
//  Paso A: elegir espacio de la sede del servicio
//  Paso B: fecha/hora/personas + botón "Verificar disponibilidad"
//  Paso C: si está disponible, lista dinámica de acompañantes (0 a N, con
//          scroll si crece mucho) + botón "Confirmar"
// ============================================================================

let reservaEnCurso = null;
let contadorAcompanantes = 0;

async function abrirModalReservaServicio(servicio) {
  reservaEnCurso = { codigoServicio: servicio.codigo_servicio, nombreSede: servicio.nombre_sede };
  contadorAcompanantes = 0;

  let modal = document.getElementById('modal-reserva');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-reserva';
    modal.className = 'modal-overlay-reserva';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-caja-reserva">
      <div class="modal-reserva-header">
        <h2>Reservar espacio · ${servicio.nombre_sede}</h2>
        <button class="btn-cerrar-reserva" onclick="cerrarModalReservaServicio()">✕</button>
      </div>
      <div id="modal-reserva-contenido">
        <p class="texto-vacio">Cargando espacios disponibles...</p>
      </div>
    </div>
  `;
  modal.style.display = 'flex';

  try {
    const token = localStorage.getItem('ucab_token');
    const resp = await fetch(`${API_URL}/reservas/espacios/${encodeURIComponent(servicio.nombre_sede)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const espacios = await resp.json();
    if (!resp.ok) throw new Error(espacios.error || 'Error al cargar espacios');

    document.getElementById('modal-reserva-contenido').innerHTML = `
      <p class="label-paso">Selecciona el espacio</p>
      <div class="lista-espacios-modal">
        ${espacios.map(e => `
          <button class="item-espacio-modal" onclick='seleccionarEspacioReserva(${JSON.stringify(e)})'>
            <strong>${e.num_identificador}</strong>
            <span>${e.nombre_edif} · Aforo ${e.cap_maxima_aforo ?? '—'}</span>
          </button>
        `).join('')}
      </div>
    `;
  } catch (error) {
    document.getElementById('modal-reserva-contenido').innerHTML =
      `<p class="texto-error">Error al cargar espacios: ${error.message}</p>`;
  }
}

function cerrarModalReservaServicio() {
  const modal = document.getElementById('modal-reserva');
  if (modal) modal.style.display = 'none';
  reservaEnCurso = null;
}

function seleccionarEspacioReserva(espacio) {
  reservaEnCurso.espacio = espacio;

  document.getElementById('modal-reserva-contenido').innerHTML = `
    <p class="label-paso">Espacio: <strong>${espacio.num_identificador}</strong> (${espacio.nombre_edif})</p>

    <div class="campo-reserva">
      <label>Fecha del evento</label>
      <!-- QA: el calendario no permite fechas anteriores a hoy (min=hoy);
           el backend valida lo mismo por si alguien manipula el HTML. -->
      <input type="date" id="r-fecha" required min="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="campo-reserva-fila">
      <div class="campo-reserva">
        <label>Hora de inicio</label>
        <input type="time" id="r-hora-inicio" required>
      </div>
      <div class="campo-reserva">
        <label>Hora de fin</label>
        <input type="time" id="r-hora-fin" required>
      </div>
    </div>
    <div class="campo-reserva">
      <label>Cantidad de personas</label>
      <input type="number" id="r-personas" min="1" required>
    </div>

    <button class="btn-verificar" onclick="verificarDisponibilidadReserva()">Verificar disponibilidad</button>

    <div id="resultado-verificacion"></div>
  `;
}

async function verificarDisponibilidadReserva() {
  const fecha = document.getElementById('r-fecha').value;
  const horaInicio = document.getElementById('r-hora-inicio').value;
  const horaFin = document.getElementById('r-hora-fin').value;
  const personas = document.getElementById('r-personas').value;
  const resultadoDiv = document.getElementById('resultado-verificacion');

  if (!fecha || !horaInicio || !horaFin || !personas) {
    resultadoDiv.innerHTML = '<p class="texto-error">Completa fecha, horario y cantidad de personas.</p>';
    return;
  }

  resultadoDiv.innerHTML = '<p class="texto-vacio-sm">Verificando...</p>';

  try {
    const token = localStorage.getItem('ucab_token');
    const { espacio } = reservaEnCurso;
    const resp = await fetch(`${API_URL}/reservas/verificar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_sede: reservaEnCurso.nombreSede,
        nombre_edif: espacio.nombre_edif,
        num_identificador: espacio.num_identificador,
        fecha, hora_inicio: horaInicio, hora_fin: horaFin, cant_personas: personas
      })
    });
    const resultado = await resp.json();
    if (!resp.ok) throw new Error(resultado.error || 'Error al verificar');

    reservaEnCurso.datosReserva = { fecha, hora_inicio: horaInicio, hora_fin: horaFin, cant_personas: personas };

    if (!resultado.disponible) {
      resultadoDiv.innerHTML = `
        <div class="caja-no-disponible">
          <strong>No se puede reservar:</strong>
          <ul>${resultado.motivos.map(m => `<li>${m}</li>`).join('')}</ul>
        </div>
      `;
      return;
    }

    resultadoDiv.innerHTML = `
      <div class="caja-disponible">
        <strong>✓ Espacio disponible</strong>
        <p>Mobiliario: ${resultado.espacio.tipo_mobiliario || 'No especificado'}</p>
        <p>Tipo: ${resultado.espacio.tipo_espacio_fisico || 'No especificado'}</p>
        ${resultado.espacio.recursos.length > 0
          ? `<p>Recursos: ${resultado.espacio.recursos.join(', ')}</p>`
          : '<p>Sin recursos tecnológicos registrados.</p>'}
      </div>

      <p class="label-paso">Acompañantes (opcional, personas que no son miembros de la comunidad)</p>
      <div id="lista-acompanantes" class="lista-acompanantes-scroll"></div>
      <button type="button" class="btn-agregar-acompanante" onclick="agregarFilaAcompanante()">+ Agregar acompañante</button>

      <button class="btn-confirmar-reserva" onclick="confirmarReservaServicio()">Confirmar reserva</button>
    `;

  } catch (error) {
    resultadoDiv.innerHTML = `<p class="texto-error">Error al verificar: ${error.message}</p>`;
  }
}

// Lista dinámica de acompañantes: cada clic agrega una fila (cédula + nombre).
// Sin límite duro (no existe en la base de datos); la lista tiene scroll
// propio (max-height en el CSS) para que no crezca indefinidamente en
// pantalla aunque se agreguen varios.
function agregarFilaAcompanante() {
  contadorAcompanantes++;
  const id = contadorAcompanantes;
  const cont = document.getElementById('lista-acompanantes');
  const fila = document.createElement('div');
  fila.className = 'fila-acompanante';
  fila.id = `acomp-fila-${id}`;
  fila.innerHTML = `
    <input type="text" placeholder="Cédula" class="acomp-doc" data-id="${id}">
    <input type="text" placeholder="Nombre completo" class="acomp-nombre" data-id="${id}">
    <button type="button" class="btn-quitar-acomp" onclick="quitarFilaAcompanante(${id})">✕</button>
  `;
  cont.appendChild(fila);
}

function quitarFilaAcompanante(id) {
  const fila = document.getElementById(`acomp-fila-${id}`);
  if (fila) fila.remove();
}

function recolectarAcompanantes() {
  const acompanantes = [];
  document.querySelectorAll('.acomp-doc').forEach(input => {
    const id = input.dataset.id;
    const documento = input.value.trim();
    const nombreInput = document.querySelector(`.acomp-nombre[data-id="${id}"]`);
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    if (documento && nombre) acompanantes.push({ documento, nombre });
  });
  return acompanantes;
}

async function confirmarReservaServicio() {
  const { codigoServicio, nombreSede, espacio, datosReserva } = reservaEnCurso;
  const acompanantes = recolectarAcompanantes();

  try {
    const token = localStorage.getItem('ucab_token');
    const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
    const cedula = usuario?.cedula || usuario?.cedula_identidad;

    const resp = await fetch(`${API_URL}/reservas/crear-con-solicitud`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula_identidad: cedula,
        codigo_servicio: codigoServicio,
        nombre_sede: nombreSede,
        nombre_edif: espacio.nombre_edif,
        num_identificador: espacio.num_identificador,
        ...datosReserva,
        acompanantes
      })
    });
    const resultado = await resp.json();
    if (!resp.ok) throw new Error(resultado.error || 'Error al confirmar la reserva');

    cerrarModalReservaServicio();
    restaurarPanelVacio();
    window.location.href = '../estudiante/solicitudes.html';

  } catch (error) {
    alert('No se pudo confirmar la reserva: ' + error.message);
  }
}

// ============================================================
// INICIALIZAR
// ============================================================
document.addEventListener('DOMContentLoaded', cargarServiciosEspacios);