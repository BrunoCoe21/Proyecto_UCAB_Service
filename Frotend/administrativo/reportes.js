// reportes.js
const API_BASE = 'http://localhost:5000/api';

async function cargarReporte(tipo) {
  const contenedor = document.getElementById('contenedor-reporte');
  const tabla = document.getElementById('tabla-reporte');
  
  contenedor.style.display = 'block';
  tabla.innerHTML = '<p class="texto-vacio">Cargando datos...</p>';

  try {
    const token = localStorage.getItem('ucab_token');
    const response = await fetch(`${API_BASE}/reportes/${tipo}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Error al cargar reporte');
    const data = await response.json();

    if (data.length === 0) {
      tabla.innerHTML = '<p class="texto-vacio">No hay datos para este reporte.</p>';
      return;
    }

    const columnas = Object.keys(data[0]);
    let html = '<table>';
    html += '<thead><tr>' + columnas.map(c => `<th>${c.replace(/_/g, ' ').toUpperCase()}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';
    data.forEach(row => {
      html += '<tr>' + columnas.map(c => `<td>${row[c] ?? '—'}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    tabla.innerHTML = html;

  } catch (error) {
    tabla.innerHTML = `<p class="texto-error">Error: ${error.message}</p>`;
  }
}

function cerrarReporte() {
  document.getElementById('contenedor-reporte').style.display = 'none';
}