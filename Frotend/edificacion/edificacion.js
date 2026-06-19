const API_BASE = 'http://localhost:5000/api'; // Ajusta si tu backend corre en otro puerto

// Obtener referencias a elementos
const selectSede = document.getElementById('nombre_sede');
const form = document.getElementById('formEdificacion');
const mensajeDiv = document.getElementById('mensaje');

// 1. Cargar sedes al cargar la página
async function cargarSedes() {
  try {
    const respuesta = await fetch(`${API_BASE}/sedes`);
    if (!respuesta.ok) throw new Error('Error al obtener sedes');
    const sedes = await respuesta.json();
    
    // Limpiar opciones (excepto la primera)
    selectSede.innerHTML = '<option value="">Seleccione una sede...</option>';
    
    // Agregar cada sede como opción
    sedes.forEach(sede => {
      const option = document.createElement('option');
      option.value = sede.nombre_sede;
      option.textContent = sede.nombre_sede;
      selectSede.appendChild(option);
    });
  } catch (error) {
    console.error('Error:', error);
    mensajeDiv.innerHTML = '<span class="text-danger">No se pudieron cargar las sedes. Verifique la conexión al backend.</span>';
  }
}

// 2. Manejar envío del formulario
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const nombre_sede = selectSede.value;
  const nombre_edif = document.getElementById('nombre_edif').value.trim();
  const direccion_interna = document.getElementById('direccion_interna').value.trim();

  // Validación simple
  if (!nombre_sede) {
    mensajeDiv.innerHTML = '<span class="text-danger">Debe seleccionar una sede.</span>';
    return;
  }
  if (!nombre_edif) {
    mensajeDiv.innerHTML = '<span class="text-danger">El nombre de la edificación es obligatorio.</span>';
    return;
  }

  // Deshabilitar botón y mostrar mensaje de carga
  const btnSubmit = form.querySelector('button[type="submit"]');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Guardando...';
  mensajeDiv.innerHTML = '';

  try {
    const respuesta = await fetch(`${API_BASE}/edificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre_sede,
        nombre_edif,
        direccion_interna: direccion_interna || null, // si está vacío, enviar null
      }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.mensaje || 'Error al guardar la edificación');
    }

    // Éxito
    mensajeDiv.innerHTML = `<span class="text-success">✅ Edificación "${nombre_edif}" creada correctamente.</span>`;
    form.reset(); // Limpia el formulario (el select queda en el primer option vacío)
    // Recargar sedes para mantener el select actualizado (opcional)
    cargarSedes();

  } catch (error) {
    mensajeDiv.innerHTML = `<span class="text-danger">❌ ${error.message}</span>`;
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Guardar';
  }
});

// Iniciar: cargar sedes al cargar la página
cargarSedes();