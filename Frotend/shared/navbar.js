
document.addEventListener('DOMContentLoaded', () => {
  verificarSeguridadRuta();
  inyectarSidebar();
});

function verificarSeguridadRuta() {
  const rolActivo = localStorage.getItem('ucab_rol');
  const rutaActual = window.location.pathname;

  if (!rolActivo && !rutaActual.includes('login.html')) {
    window.location.href = '../login/login.html';
    return;
  }


  const rolesComunidad = ['ESTUDIANTE', 'EGRESADO', 'DOCENTE', 'ADMINISTRATIVO'];
  if (rutaActual.includes('/estudiante/estudiante.html') && rolActivo !== 'ESTUDIANTE' && rolActivo !== 'EGRESADO') elAccesoEsInvalido();
  else if (rutaActual.includes('/estudiante/') && !rolesComunidad.includes(rolActivo)) elAccesoEsInvalido();
  if (rutaActual.includes('/cajero/') && rolActivo !== 'CAJERO') elAccesoEsInvalido();
  if (rutaActual.includes('/administrativo/') && rolActivo !== 'ADMINISTRATIVO' && rolActivo !== 'DOCENTE') elAccesoEsInvalido();
  if (rutaActual.includes('/admin/') && rolActivo !== 'ADMIN') elAccesoEsInvalido();
}

function elAccesoEsInvalido() {
  alert('Acceso no autorizado por políticas de seguridad lógica del sistema.');
  localStorage.clear();
  window.location.href = '../login/login.html';
}

function inyectarSidebar() {
  const body = document.body;
  const rol = localStorage.getItem('ucab_rol');
  const usuarioRaw = localStorage.getItem('ucab_usuario');
  const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : { nombre: 'Estudiante', apellidos: '' };

  if (!rol || window.location.pathname.includes('login.html')) return;

  const sidebarContainer = document.createElement('aside');
  sidebarContainer.className = 'ucab-sidebar';

 let enlacesHtml = '';

  if (rol === 'ESTUDIANTE') {
    enlacesHtml = `
      <a href="../estudiante/estudiante.html" class="${marcarActivo('estudiante.html')}"> Mi Perfil</a>

      <div class="nav-section">SERVICIOS</div>
      <a href="../servicio/servicio.html" class="${marcarActivo('servicio.html')}">Servicios</a>
      <a href="../estudiante/solicitudes.html" class="${marcarActivo('solicitudes.html')}"> Mis Solicitudes</a>

      <div class="nav-section">FINANZAS</div>
      <a href="../estudiante/facturas.html" class="${marcarActivo('facturas.html')}">Estado de Cuenta</a>
      <a href="../estudiante/pagos.html" class="${marcarActivo('pagos.html')}">Pagos</a>
    `;
  } else if (rol === 'EGRESADO') {
    enlacesHtml = `
      <a href="../estudiante/estudiante.html" class="${marcarActivo('estudiante.html')}">Mi Perfil</a>

      <div class="nav-section">SERVICIOS</div>
      <a href="../servicio/servicio.html" class="${marcarActivo('servicio.html')}">Servicios</a>
      <a href="../estudiante/solicitudes.html" class="${marcarActivo('solicitudes.html')}">Mis Solicitudes</a>

      <div class="nav-section">FINANZAS</div>
      <a href="../estudiante/facturas.html" class="${marcarActivo('facturas.html')}">Estado de Cuenta</a>
      <a href="../estudiante/pagos.html" class="${marcarActivo('pagos.html')}">Pagos</a>

      <div class="nav-section">OPORTUNIDADES</div>
      <a href="../bolsa_trabajo/bolsa_trabajo.html" class="${marcarActivo('bolsa.html')}">Bolsa de Trabajo</a>
    `;
  } else if (rol === 'DOCENTE') {
    enlacesHtml = `
      <a href="../administrativo/empleado.html" class="${marcarActivo('empleado.html')}">Mi Perfil</a>

      <div class="nav-section">SERVICIOS</div>
      <a href="../servicio/servicio.html" class="${marcarActivo('servicio.html')}">Servicios</a>
      <a href="../estudiante/solicitudes.html" class="${marcarActivo('solicitudes.html')}">Mis Solicitudes</a>

      <div class="nav-section">GESTIÓN DE PERSONAL</div>
      <a href="../administrativo/vinculos.html" class="${marcarActivo('vinculos.html')}">Vinculos Familiares</a>
    `;
  } else if (rol === 'ADMINISTRATIVO') {
    enlacesHtml = `
      <a href="../administrativo/empleado.html" class="${marcarActivo('empleado.html')}">Mi Perfil</a>

      <div class="nav-section">SERVICIOS</div>
      <a href="../servicio/servicio.html" class="${marcarActivo('servicio.html')}">Servicios</a>
      <a href="../estudiante/solicitudes.html" class="${marcarActivo('solicitudes.html')}">Mis Solicitudes</a>

      <div class="nav-section">GESTIÓN DE PERSONAL</div>
      <a href="../administrativo/vinculos.html" class="${marcarActivo('vinculos.html')}">Vinculos Familiares</a>

      <div class="nav-section">SOLICITUDES</div>
      <a href="../administrativo/gestion.html" class="${marcarActivo('gestion.html')}">Pasos por Atender</a>

      <div class="nav-section">REPORTES</div>
      <a href="../administrativo/reportes.html" class="${marcarActivo('reportes.html')}">Panel de Reportes</a>
    `;
  }

  sidebarContainer.innerHTML = `
    <div class="sidebar-header">
      <div class="logo-icon">U</div>
      <div class="logo-text">
        <h2>UCAB Services</h2>
        <span>PORTAL DEL MIEMBRO</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${enlacesHtml}
    </nav>

    <div class="sidebar-footer">
      <div class="user-info-box">
        <div class="user-avatar">${usuario.nombre.charAt(0)}</div>
        <div class="user-details">
          <span class="user-name">${usuario.nombre}</span>
          <span class="user-role">${rol}</span>
        </div>
      </div>
      <button onclick="cerrarSesionGlobal()" class="btn-logout">
        Cerrar sesion
      </button>
    </div>
  `;


  body.classList.add('layout-sidebar');
  body.insertBefore(sidebarContainer, body.firstChild);
}

function marcarActivo(nombreArchivo) {
  return window.location.pathname.includes(nombreArchivo) ? 'active-link' : '';
}


window.cerrarSesionGlobal = async function() {
  try {
    const token = localStorage.getItem('ucab_token');
    
    if (token) {
      try {
        const response = await fetch('http://localhost:5000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('Sesion cerrada correctamente');
        } else {
          console.warn('Error al cerrar sesion en el servidor');
        }
      } catch (fetchError) {
        console.warn('Error de red al cerrar sesion:', fetchError);
      }
    }
  } catch (error) {
    console.warn('Error al cerrar sesion:', error);
  } finally {
    localStorage.clear();
    window.location.href = '../login/login.html';
  }
};