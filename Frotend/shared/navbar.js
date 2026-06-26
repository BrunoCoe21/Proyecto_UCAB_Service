// shared/navbar.js - Renderizado de Sidebar Dinámico
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

  if (rutaActual.includes('/estudiante/') && rolActivo !== 'ESTUDIANTE' && rolActivo !== 'EGRESADO') elAccesoEsInvalido();
  if (rutaActual.includes('/cajero/') && rolActivo !== 'CAJERO') elAccesoEsInvalido();
  // CORRECCIÓN: antes solo dejaba pasar a 'ADMINISTRATIVO'; un DOCENTE también
  // usa la carpeta /administrativo/ (comparten el mismo perfil de empleado).
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
      <a href="../servicio/solicitudes.html" class="${marcarActivo('solicitudes.html')}"> Mis Solicitudes</a>

      <div class="nav-section">FINANZAS</div>
      <a href="../estudiante/facturas.html" class="${marcarActivo('facturas.html')}">Estado de Cuenta</a>
      <a href="../estudiante/pagos.html" class="${marcarActivo('pagos.html')}">Pagos</a>
    `;
  } else if (rol === 'EGRESADO') {
    enlacesHtml = `
      <a href="../estudiante/estudiante.html" class="${marcarActivo('estudiante.html')}">Mi Perfil</a>

      <div class="nav-section">OPORTUNIDADES</div>
      <a href="../egresado/bolsa.html" class="${marcarActivo('bolsa.html')}">Bolsa de Trabajo</a>
    `;
  } else if (rol === 'DOCENTE' || rol === 'ADMINISTRATIVO') {
    // Docente y Personal Administrativo comparten el mismo perfil (son EMPLEADOS),
    // por eso usan la misma carpeta /administrativo/ y el mismo menú.
    enlacesHtml = `
      <a href="../empleado/estudiante.html" class="${marcarActivo('estudiante.html')}">Mi Perfil</a>

      <div class="nav-section">GESTIÓN DE PERSONAL</div>
      <a href="../empleado/vinculos.html" class="${marcarActivo('vinculos.html')}">Vínculos Familiares</a>

      <div class="nav-section">SOLICITUDES</div>
      <a href="../empleado/gestion.html" class="${marcarActivo('gestion.html')}">Pasos por Atender</a>
    `;
  } // ... Agregar lógica para CAJERO, ADMIN cuando se construyan esos módulos

  sidebarContainer.innerHTML = `
    <div class="sidebar-header">
      <div class="logo-icon">🎓</div>
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
        <span class="logout-icon"></span> Cerrar sesión
      </button>
    </div>
  `;

  // Asegurar que el body tenga el diseño para Sidebar
  body.classList.add('layout-sidebar');
  body.insertBefore(sidebarContainer, body.firstChild);
}

function marcarActivo(nombreArchivo) {
  return window.location.pathname.includes(nombreArchivo) ? 'active-link' : '';
}

// Retorna directo al login.html
window.cerrarSesionGlobal = function() {
  localStorage.clear();
  window.location.href = '../login/login.html';
};