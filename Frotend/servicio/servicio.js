const API_URL = 'http://localhost:5000/api';

async function cargarServiciosEspacios() {
  try {
    const response = await fetch(`${API_URL}/servicios/espacios`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    let servicios = await response.json();

    // 🔥 CLAVE: Asegurar que servicios sea un array
    if (!Array.isArray(servicios)) {
      console.warn('La respuesta no es un array, convirtiendo...');
      servicios = [servicios]; // Convertir a array de un elemento
    }

    const container = document.getElementById('serviciosContainer');
    if (!container) {
      console.error('No se encontró el contenedor #serviciosContainer');
      return;
    }

    container.innerHTML = ''; // Limpiar

    if (servicios.length === 0) {
      container.innerHTML = '<p class="sin-servicios">No hay servicios de espacios disponibles.</p>';
      return;
    }

    servicios.forEach(servicio => {
      const primerEspacio = servicio.espacios && servicio.espacios.length > 0 ? servicio.espacios[0] : null;
      const aforo = primerEspacio ? primerEspacio.cap_maxima_aforo : 'N/A';
      const nombreEspacio = primerEspacio 
        ? `${primerEspacio.nombre_edif} - ${primerEspacio.num_identificador}` 
        : 'Sin espacio asignado';

      const card = document.createElement('div');
      card.className = 'tarjeta-servicio';

      card.innerHTML = `
        <div class="tarjeta-header">
          <div class="tag-grupo bg-dorado">
            <span class="icono-tag">🏢</span>
            <span class="texto-tag">ESPACIOS FÍSICOS</span>
          </div>
          <div class="precio-grupo">
            <span class="precio-actual">$${Number(servicio.precio).toFixed(2)}</span>
            <span class="precio-anterior">$${(Number(servicio.precio) * 1.5).toFixed(2)}</span>
          </div>
        </div>
        <h3 class="servicio-titulo">${servicio.descripcion_detallada || servicio.codigo_servicio}</h3>
        <p class="servicio-desc">
          <strong>Sede:</strong> ${servicio.nombre_sede}<br>
          <strong>Espacio:</strong> ${nombreEspacio}<br>
          <strong>Aforo máximo:</strong> ${aforo} personas
        </p>
        <div class="tarjeta-footer">
          <span class="pasos">${servicio.requisitos_de_acceso || 'Sin requisitos'}</span>
          <span class="limite verde">Límite máx. $${(Number(servicio.precio) * 2).toFixed(2)}</span>
        </div>
        <button class="btn-reservar" data-codigo="${servicio.codigo_servicio}">Reservar</button>
      `;

      container.appendChild(card);
    });

    // Evento para botones
    document.querySelectorAll('.btn-reservar').forEach(btn => {
      btn.addEventListener('click', function() {
        alert(`Iniciar reserva para el servicio ${this.dataset.codigo}`);
        // Aquí puedes redirigir a una página de reserva
      });
    });

  } catch (error) {
    console.error('Error al cargar servicios:', error);
    const container = document.getElementById('serviciosContainer');
    if (container) {
      container.innerHTML = '<p class="error">⚠️ No se pudieron cargar los servicios. Intente más tarde.</p>';
    }
  }
}

document.addEventListener('DOMContentLoaded', cargarServiciosEspacios);