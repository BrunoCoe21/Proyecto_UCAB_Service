const API_URL = 'http://localhost:5000/api/estudiantes';

const form = document.getElementById('formEstudiante');
const mensaje = document.getElementById('mensaje');
const lista = document.getElementById('listaEstudiantes');

cargarEstudiantes();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const correo = document.getElementById('correo').value.trim();

  if (!nombre || !apellido || !correo) {
    mostrarMensaje('Todos los campos son obligatorios', 'error');
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, correo }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al agregar estudiante');
    }

    const data = await response.json();
    mostrarMensaje(`Estudiante ${data.nombre} ${data.apellido} agregado con éxito`, 'success');
    form.reset();
    cargarEstudiantes();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
});

async function cargarEstudiantes() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al cargar estudiantes');
    const estudiantes = await response.json();
    lista.innerHTML = estudiantes.map(e => {
      const fecha = new Date(e.fecha_registro).toLocaleDateString();
      return `<li>${e.nombre} ${e.apellido} - ${e.correo} (Registrado: ${fecha})</li>`;
    }).join('');
  } catch (error) {
    lista.innerHTML = '<li>Error al cargar estudiantes</li>';
  }
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = tipo;
  setTimeout(() => {
    mensaje.textContent = '';
    mensaje.className = '';
  }, 4000);
}