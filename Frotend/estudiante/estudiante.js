// estudiante/estudiante.js
document.addEventListener('DOMContentLoaded', async () => {
  await cargarDatosPerfil();
});

async function cargarDatosPerfil() {
  const usuarioRaw = localStorage.getItem('ucab_usuario');
  if (!usuarioRaw) {
    window.location.href = '../login/login.html';
    return;
  }

  const usuario = JSON.parse(usuarioRaw);

  // Inyectar datos básicos
  document.getElementById('perfil-nombre').textContent = usuario.nombre;
  document.getElementById('perfil-cedula').textContent = `V-${usuario.cedula}`;
  document.getElementById('perfil-correo').textContent = usuario.correo;
  
  const iniciales = usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2);
  document.getElementById('perfil-avatar').textContent = iniciales.toUpperCase();

  // Llamada a la API real
  try {
    const infoAcademica = await API.request(`/estudiantes/${usuario.cedula}`);
    
    // Inyectar datos desde PostgreSQL
    if (infoAcademica.escuela) document.getElementById('perfil-escuela').textContent = infoAcademica.escuela;
    if (infoAcademica.promedio) document.getElementById('resumen-promedio').textContent = parseFloat(infoAcademica.promedio).toFixed(1);
    if (infoAcademica.uc_aprobadas) document.getElementById('resumen-uc').textContent = infoAcademica.uc_aprobadas;
    if (infoAcademica.semestre_actual) document.getElementById('resumen-semestre').textContent = `${infoAcademica.semestre_actual}°`;

  } catch (error) {
    console.error("Error al cargar datos desde PostgreSQL:", error);
    document.getElementById('perfil-escuela').textContent = "Error de conexión";
  }
}