// login/login.js - Control de Acceso Transaccional Real
const form = document.getElementById('formLogin');
const emailInput = document.getElementById('email');
const cedulaInput = document.getElementById('cedula');
const alerta = document.getElementById('mensaje-alerta');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    correo_institucional: emailInput.value.trim(),
    cedula_identidad: parseInt(cedulaInput.value)
  };

  try {
    // Petición POST real al controlador de la BD
    const data = await API.request('/usuarios/login', 'POST', payload);
    
    // Almacena los datos reales retornados por PostgreSQL
    API.guardarSesion(data.usuario, data.rol, data.token);
    
    // Redirección por roles a las carpetas físicas correspondientes
    redirigirPorRol(data.rol);

  } catch (error) {
    // Si la Cédula/Correo no coinciden en Postgres, se muestra el error en rojo
    alerta.textContent = `⚠️ Error de Autenticación: ${error.message}`;
    alerta.className = "alerta-banner error";
  }
});

function redirigirPorRol(rol) {
  switch(rol) {
    case 'ESTUDIANTE': window.location.href = '../estudiante/index.html'; break;
    case 'CAJERO': window.location.href = '../cajero/facturas.html'; break;
    case 'ADMINISTRATIVO': window.location.href = '../administrativo/solicitudes.html'; break;
    case 'ADMIN': window.location.href = '../admin/usuarios.html'; break;
    default: window.location.href = '../estudiante/index.html';
  }
}