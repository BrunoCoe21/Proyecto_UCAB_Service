const API_URL = 'http://localhost:5000/api';

// Obtener la clave de la URL
function obtenerClave() {
  const params = new URLSearchParams(window.location.search);
  const clave = params.get('clave');
  if (!clave) {
    mostrarError('No se especificó el espacio a consultar.');
    return null;
  }
  // Decodificar y separar en partes
  const partes = decodeURIComponent(clave).split('|');
  if (partes.length !== 3) {
    mostrarError('Formato de clave inválido.');
    return null;
  }
  return {
    nombre_sede: partes[0],
    nombre_edif: partes[1],
    num_identificador: partes[2]
  };
}

// Mostrar error en el contenedor
function mostrarError(mensaje) {
  const container = document.getElementById('detalleContainer');
  container.innerHTML = `<p class="error">❌ ${mensaje}</p>`;
}

// Cargar y mostrar los detalles
async function cargarDetalle() {
  const clave = obtenerClave();
  if (!clave) return;

  const container = document.getElementById('detalleContainer');
  container.innerHTML = '<p>⏳ Cargando datos...</p>';

  try {
    const { nombre_sede, nombre_edif, num_identificador } = clave;
    const url = `${API_URL}/espacios/${encodeURIComponent(nombre_sede)}/${encodeURIComponent(nombre_edif)}/${encodeURIComponent(num_identificador)}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Espacio no encontrado');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    
    // Construir el detalle
    const campos = [
      { label: 'Sede', valor: data.nombre_sede },
      { label: 'Edificación', valor: data.nombre_edif },
      { label: 'Número identificador', valor: data.num_identificador },
      { label: 'Capacidad máxima de aforo', valor: data.cap_maxima_aforo || 'Sin especificar' },
      { label: 'Tipo de mobiliario', valor: data.tipo_mobiliario || 'Sin especificar' },
      { label: 'Tipo de espacio físico', valor: data.tipo_espacio_fisico || 'Sin especificar' },
      { label: 'Estado de mantenimiento', valor: data.estado_mantenimiento || 'Sin especificar' }
    ];

    let html = '';
    campos.forEach(campo => {
      html += `
        <div class="campo">
          <div class="campo-label">${campo.label}:</div>
          <div class="campo-valor">${campo.valor}</div>
        </div>
      `;
    });

    container.innerHTML = html;

  } catch (error) {
    console.error(error);
    container.innerHTML = `<p class="error">❌ Error al cargar los datos: ${error.message}</p>`;
  }
}

// Botón para volver al listado
document.getElementById('btnVolver').addEventListener('click', () => {
  window.location.href = '../MostrarEspacioFisico/mostrarEspacioFisico.html';
});

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', cargarDetalle);