// /Frotend/servicio/servicio.js
const API_URL = 'http://localhost:5000/api';

let servicioSeleccionado = null;
let perfilUsuario = null; // 'miembro_activo', 'egresado', 'publico_externo'

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

  // ADVERTENCIA
  html += `
    <div class="detalle-advertencia">
      <p>⚠️ Asegúrese de estar solvente en caja antes de iniciar cualquier trámite.</p>
    </div>
    
    <!-- Botón Iniciar Solicitud -->
    <button class="btn-iniciar-solicitud" onclick="iniciarSolicitud('${servicio.codigo_servicio}')">
      Iniciar solicitud ›
    </button>
  </div>
  `;
  
  panel.innerHTML = html;
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
async function iniciarSolicitud(codigoServicio) {
  if (!servicioSeleccionado) {
    alert('Por favor, seleccione un servicio primero.');
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
        codigo_servicio: codigoServicio,
        estado_general: 'EN PROCESO'
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

// ============================================================
// INICIALIZAR
// ============================================================
document.addEventListener('DOMContentLoaded', cargarServiciosEspacios);