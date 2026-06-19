const API_URL = 'http://localhost:5000/api';

// Cargar edificaciones en el combo box
async function cargarEdificaciones() {
  try {
    const res = await fetch(`${API_URL}/edificaciones`);
    if (!res.ok) throw new Error('Error al cargar edificaciones');
    const edificaciones = await res.json();
    const select = document.getElementById('edificacion');

    edificaciones.forEach(edif => {
      const option = document.createElement('option');
      // Guardamos la clave compuesta en data attributes
      option.value = edif.nombre_edif; // solo el nombre, pero usaremos data para la sede
      option.dataset.sede = edif.nombre_sede;
      option.dataset.edif = edif.nombre_edif;
      option.textContent = `${edif.nombre_edif} (${edif.nombre_sede})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    const mensaje = document.getElementById('mensaje');
    mensaje.textContent = 'Error al cargar edificaciones';
    mensaje.className = 'error';
  }
}

// Enviar formulario
document.getElementById('formEspacioFisico').addEventListener('submit', async (e) => {
  e.preventDefault();

  const select = document.getElementById('edificacion');
  const selectedOption = select.options[select.selectedIndex];

  // Validar que haya seleccionado una opción válida
  if (!selectedOption || !selectedOption.dataset.sede) {
    alert('Debe seleccionar una edificación');
    return;
  }

  const nombre_sede = selectedOption.dataset.sede;
  const nombre_edif = selectedOption.dataset.edif;
  const num_identificador = document.getElementById('num_identificador').value.trim();
  const cap_maxima_aforo = parseInt(document.getElementById('cap_maxima_aforo').value) || null;
  const tipo_mobiliario = document.getElementById('tipo_mobiliario').value.trim() || null;
  const tipo_espacio_fisico = document.getElementById('tipo_espacio_fisico').value.trim() || null;
  const estado_mantenimiento = document.getElementById('estado_mantenimiento').value;

  // Validaciones básicas
  if (!num_identificador) {
    alert('El número identificador es obligatorio');
    return;
  }

  const data = {
    nombre_sede,
    nombre_edif,
    num_identificador,
    cap_maxima_aforo,
    tipo_mobiliario,
    tipo_espacio_fisico,
    estado_mantenimiento,
  };

  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = 'Guardando...';
  mensaje.className = '';

  try {
    const res = await fetch(`${API_URL}/espacios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.mensaje || 'Error al guardar');
    }

    mensaje.textContent = '✅ Espacio físico creado con éxito';
    mensaje.className = '';
    document.getElementById('formEspacioFisico').reset();
    // Opcional: limpiar el combo para que no quede seleccionado
    document.getElementById('edificacion').selectedIndex = 0;
  } catch (error) {
    mensaje.textContent = '❌ ' + error.message;
    mensaje.className = 'error';
  }
});

// Inicializar: cargar edificaciones al cargar la página
cargarEdificaciones();