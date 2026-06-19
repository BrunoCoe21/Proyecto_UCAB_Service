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

  if (rutaActual.includes('/estudiante/') && rolActivo !== 'ESTUDIANTE') elAccesoEsInvalido();
  if (rutaActual.includes('/cajero/') && rolActivo !== 'CAJERO') elAccesoEsInvalido();
  if (rutaActual.includes('/administrativo/') && rolActivo !== 'ADMINISTRATIVO') elAccesoEsInvalido();
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
    // Se eliminó "Inicio" y ahora index.html es "Mi Perfil"
    enlacesHtml = `
      <a href="index.html" class="${marcarActivo('index.html')}"> Mi Perfil</a>

      <div class="nav-section">SERVICIOS</div>
      <a href="servicios.html" class="${marcarActivo('servicios.html')}">Servicios</a>
      <a href="solicitudes.html" class="${marcarActivo('solicitudes.html')}"> Mis Solicitudes</a>

      <div class="nav-section">FINANZAS</div>
      <a href="facturas.html" class="${marcarActivo('facturas.html')}">Estado de Cuenta</a>
      <a href="pagos.html" class="${marcarActivo('pagos.html')}">Pagos</a>
    `;
  } else if (rol === 'EGRESADO') { // Ejemplo de lógica para egresados en el futuro
    enlacesHtml = `
      <div class="nav-section">OPORTUNIDADES</div>
      <a href="vacantes.html" class="${marcarActivo('vacantes.html')}">💼 Bolsa de Trabajo</a>
    `;
  } // ... Agregar lógica para CAJERO, ADMINISTRATIVO, ADMIN

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