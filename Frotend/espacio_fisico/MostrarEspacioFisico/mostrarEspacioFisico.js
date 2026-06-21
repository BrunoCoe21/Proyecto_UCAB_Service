const API_URL = 'http://localhost:5000/api';

// Función para cargar y mostrar los espacios físicos
async function cargarEspacios() {
  const tbody = document.getElementById('tbodyEspacios');
  const mensaje = document.getElementById('mensaje');

  try {
    mensaje.textContent = 'Cargando...';
    mensaje.className = '';

    const res = await fetch(`${API_URL}/espacios`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const espacios = await res.json();

    // Limpiar tabla
    tbody.innerHTML = '';

    if (espacios.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No hay espacios físicos registrados.</td></tr>`;
      mensaje.textContent = '';
      return;
    }

    // Generar filas
    espacios.forEach(esp => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td>${esp.nombre_sede || 'N/A'}</td>
        <td>${esp.tipo_espacio_fisico || 'Sin especificar'}</td>
        <td>${esp.cap_maxima_aforo !== null && esp.cap_maxima_aforo !== undefined ? esp.cap_maxima_aforo : 'Sin límite'}</td>
        <td>
          <button class="btn-ver" data-sede="${esp.nombre_sede}" data-edif="${esp.nombre_edif}" data-id="${esp.num_identificador}">Consultar</button>
          <button class="btn-editar" data-sede="${esp.nombre_sede}" data-edif="${esp.nombre_edif}" data-id="${esp.num_identificador}">Modificar</button>
          <button class="btn-eliminar" data-sede="${esp.nombre_sede}" data-edif="${esp.nombre_edif}" data-id="${esp.num_identificador}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    mensaje.textContent = '✅ Datos cargados correctamente';
    mensaje.className = 'mensaje-exito';

    // Asignar eventos a los botones (por ahora solo alertas)
   document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', () => {
    const sede = btn.dataset.sede;
    const edif = btn.dataset.edif;
    const id = btn.dataset.id;
    // Construir clave: sede|edificación|identificador
    const clave = `${sede}|${edif}|${id}`;
    window.location.href = `../DetalleEspacioFisico/detalleEspacioFisico.html?clave=${encodeURIComponent(clave)}`;
  });
});

    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const sede = btn.dataset.sede;
        const edif = btn.dataset.edif;
        const id = btn.dataset.id;
        alert(`Modificar - Sede: ${sede}, Edificación: ${edif}, Identificador: ${id}`);
        // Aquí luego abriremos el formulario de edición
      });
    });

    document.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', () => {
        const sede = btn.dataset.sede;
        const edif = btn.dataset.edif;
        const id = btn.dataset.id;
        if (confirm(`¿Está seguro de eliminar el espacio "${id}" en ${edif} (${sede})?`)) {
          alert(`Eliminar - Sede: ${sede}, Edificación: ${edif}, Identificador: ${id}`);
          // Aquí luego llamaremos al endpoint DELETE
        }
      });
    });

  } catch (error) {
    console.error('Error al cargar espacios:', error);
    mensaje.textContent = `❌ Error: ${error.message}`;
    mensaje.className = 'mensaje-error';
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">No se pudieron cargar los datos</td></tr>`;
  }
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', cargarEspacios);