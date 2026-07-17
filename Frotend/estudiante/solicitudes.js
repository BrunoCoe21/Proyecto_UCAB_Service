// ============================================================================
//  solicitudes.js  ·  Mis Solicitudes (estudiante)
// ============================================================================

let solicitudesCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  const cedula = usuario.cedula || usuario.cedula_identidad;
  await cargarSolicitudes(cedula);
});

async function cargarSolicitudes(cedula) {
  const cont = document.getElementById('lista-solicitudes');
  try {
    solicitudesCache = await API.request(`/solicitudes/estudiante/${cedula}`);

    if (solicitudesCache.length === 0) {
      cont.innerHTML = '<p class="texto-vacio">Todavia no tienes solicitudes registradas.</p>';
      return;
    }

    cont.innerHTML = solicitudesCache.map(s => tarjetaSolicitud(s)).join('');

    document.querySelectorAll('.tarjeta-solicitud').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.tarjeta-solicitud').forEach(x => x.classList.remove('seleccionada'));
        el.classList.add('seleccionada');
        cargarDetalle(el.dataset.idsolicitud);
      });
    });

    const primera = document.querySelector('.tarjeta-solicitud');
    if (primera) {
      primera.classList.add('seleccionada');
      cargarDetalle(primera.dataset.idsolicitud);
    }

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error al cargar solicitudes: ${error.message}</p>`;
  }
}

function tarjetaSolicitud(s) {
  const estadoInfo = claseEstado(s.estado_general);
  return `
    <div class="tarjeta-solicitud" data-idsolicitud="${s.id_solicitud}">
      <div class="tarjeta-top">
        <span class="solicitud-id">${s.id_solicitud}</span>
        <span class="badge-estado ${estadoInfo.clase}">${estadoInfo.texto}</span>
      </div>
      <p class="solicitud-servicio">${s.nombre_servicio || s.codigo_servicio}</p>
      <p class="solicitud-fecha">${formatearFecha(s.fecha_creacion)}</p>
    </div>
  `;
}

function claseEstado(estado) {
  const e = (estado || '').toLowerCase();
  if (e.includes('cerrada')) return { clase: 'estado-cerrada', texto: 'CERRADA' };
  if (e.includes('proceso')) return { clase: 'estado-proceso', texto: 'EN PROCESO' };
  return { clase: 'estado-abierta', texto: 'ABIERTA' };
}

// ============================================================================
//  cargarDetalle - CON BLOQUEO DEL BOTÓN DE PAGO
// ============================================================================
async function cargarDetalle(idSolicitud) {
  const cont = document.getElementById('detalle-solicitud');
  cont.innerHTML = '<p class="texto-vacio">Cargando detalle...</p>';

  try {
    const { solicitud, pasos, oficinaActual, acreditaciones, reserva, acompanantes, factura } =
      await API.request(`/solicitudes/${idSolicitud}/detalle`);

    const estadoInfo = claseEstado(solicitud.estado_general);

    // ================================================================
    // 🔥 VALIDACIÓN PARA BLOQUEAR EL BOTÓN DE PAGO
    // ================================================================
    
    // Buscar el paso "Pago pendiente"
    const pasoPago = pasos.find(p => p.nombre_paso === 'Pago pendiente');
    const existePasoPago = pasoPago !== undefined;
    const pasoPagoCompletado = pasoPago ? pasoPago.estado_paso === 'completado' : false;
    
    let hayPasosPreviosPendientes = false;
    let puedePagar = false;
    
    if (existePasoPago && !pasoPagoCompletado) {
      const pasosPreviosPendientes = pasos.filter(p => 
        p.num_paso < pasoPago.num_paso && p.estado_paso !== 'completado'
      );
      hayPasosPreviosPendientes = pasosPreviosPendientes.length > 0;
      puedePagar = !hayPasosPreviosPendientes;
    } else if (pasoPagoCompletado) {
      puedePagar = false;
    }

    // 🔥 OBTENER si la factura tiene un pago pendiente (BLOQUEA EL BOTÓN)
    const tienePagoPendiente = factura ? factura.tiene_pago_pendiente || false : false;

    // 🔥 SI hay pago pendiente, el botón NO debe mostrarse
    const botonPagoHabilitado = puedePagar && !tienePagoPendiente && !hayPasosPreviosPendientes;

    console.log('=== DEBUG ===');
    console.log('Pasos:', pasos.map(p => ({ num: p.num_paso, nombre: p.nombre_paso, estado: p.estado_paso })));
    console.log('Puede pagar:', puedePagar);
    console.log('Tiene pago pendiente:', tienePagoPendiente);
    console.log('Boton habilitado:', botonPagoHabilitado);

    cont.innerHTML = `
      <div class="detalle-header">
        <div>
          <span class="detalle-id">${solicitud.id_solicitud}</span>
          <h2 class="detalle-nombre">${solicitud.nombre_servicio || solicitud.codigo_servicio}</h2>
        </div>
        <span class="badge-estado ${estadoInfo.clase}">${estadoInfo.texto}</span>
      </div>

      ${oficinaActual ? `
        <div class="caja-oficina">
          <p class="caja-oficina-label">Oficina responsable</p>
          <p class="caja-oficina-valor">${oficinaActual.nombre_oficina || 'Sin asignar'}</p>
          ${oficinaActual.responsable_asignado
            ? `<p class="caja-oficina-resp">Responsable: ${oficinaActual.responsable_asignado}</p>`
            : ''}
        </div>
      ` : ''}

      ${factura ? cajaFactura(factura, botonPagoHabilitado, hayPasosPreviosPendientes, tienePagoPendiente) : ''}

      ${acreditaciones.length > 0 ? `
        <div class="seccion-acreditaciones">
          <h3 class="titulo-seccion-sm">Documentos requeridos</h3>
          ${acreditaciones.map(a => `
            <div class="fila-acreditacion">
              <span>${a.nombre_requisito}</span>
              <span class="tipo-doc">${a.tipo_documento || 'Documento'}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${reserva ? `
        <div class="seccion-reserva">
          <h3 class="titulo-seccion-sm">Reserva de espacio</h3>
          <p class="reserva-linea">${reserva.num_identificador} · ${reserva.nombre_edif}, ${reserva.nombre_sede}</p>
          <p class="reserva-linea">${formatearFecha(reserva.fecha_reserva)} · ${reserva.hora_inicio} - ${reserva.hora_fin}</p>
          <p class="reserva-linea">${reserva.cant_personas} persona(s) · Estado: ${reserva.estado_reserva}</p>
        </div>
      ` : ''}

      ${acompanantes.length > 0 ? `
        <div class="seccion-acompanantes">
          <h3 class="titulo-seccion-sm">Acompanantes</h3>
          ${acompanantes.map(a => `<p class="reserva-linea">${a.nombre} (${a.documento_identidad})</p>`).join('')}
        </div>
      ` : ''}

      <h3 class="titulo-seccion-sm">Linea de tiempo</h3>
      <div class="linea-tiempo">
        ${pasos.length === 0
          ? '<p class="texto-vacio-sm">Esta solicitud todavia no tiene pasos registrados.</p>'
          : pasos.map(p => filaPaso(p)).join('')}
      </div>
    `;

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error al cargar el detalle: ${error.message}</p>`;
  }
}

function filaPaso(p) {
  const estadoClase = { pendiente: 'punto-pendiente', 'en proceso': 'punto-proceso', completado: 'punto-completado' }[p.estado_paso];
  return `
    <div class="paso-tiempo">
      <div class="punto-tiempo ${estadoClase}"></div>
      <div class="paso-tiempo-info">
        <div class="paso-tiempo-top">
          <strong>${p.num_paso}. ${p.nombre_paso || 'Sin nombre'}</strong>
          <span class="badge-mini ${estadoClase}">${p.estado_paso.toUpperCase()}</span>
        </div>
        ${p.nombre_oficina ? `<p class="paso-tiempo-oficina">${p.nombre_oficina}${p.responsable_asignado ? ' · ' + p.responsable_asignado : ''}</p>` : ''}
        <p class="paso-tiempo-fechas">
          ${p.fecha_inicio ? 'Inicio: ' + formatearFechaHora(p.fecha_inicio) : 'Sin iniciar'}
          ${p.fecha_fin ? ' · Fin: ' + formatearFechaHora(p.fecha_fin) : ''}
        </p>
      </div>
    </div>
  `;
}

function formatearFecha(fecha) {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearFechaHora(fecha) {
  if (!fecha) return '--';
  return new Date(fecha).toLocaleString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ============================================================================
//  CAJA DE FACTURA - CON BLOQUEO DEL BOTÓN
// ============================================================================
function cajaFactura(factura, botonPagoHabilitado, hayPasosPreviosPendientes, tienePagoPendiente) {
  
  // 📌 ESTADO 1: Factura pagada
  if (factura.estatus === 'pagada') {
    return `
      <div class="caja-factura caja-factura-pagada">
        <span>Pagado</span>
        <span class="caja-factura-num">${factura.num_control}</span>
      </div>
    `;
  }

  // 📌 ESTADO 2: Pago en proceso de verificación (presencial pendiente)
  if (tienePagoPendiente) {
    return `
      <div class="caja-factura caja-factura-en-proceso">
        <div>
          <p class="caja-factura-label">Pago en proceso de verificacion</p>
          <p class="caja-factura-monto">$${Number(factura.saldo).toFixed(2)}</p>
          <p class="caja-factura-sub">El personal de Caja esta verificando tu pago</p>
        </div>
        <div class="caja-factura-verificando">
          <span class="badge-verificando">En verificacion</span>
        </div>
      </div>
    `;
  }

  // 📌 ESTADO 3: Pasos previos pendientes → bloqueado
  if (hayPasosPreviosPendientes) {
    return `
      <div class="caja-factura caja-factura-bloqueada">
        <div>
          <p class="caja-factura-label">Pendiente por pagar</p>
          <p class="caja-factura-monto">$${Number(factura.saldo).toFixed(2)}</p>
        </div>
        <div class="caja-factura-bloqueo">
          <span class="badge-bloqueado">Completa los pasos previos para pagar</span>
        </div>
      </div>
    `;
  }

  // 📌 ESTADO 4: Todo correcto → mostrar botón de pago (SOLO si está habilitado)
  if (botonPagoHabilitado) {
    return `
      <div class="caja-factura caja-factura-pendiente">
        <div>
          <p class="caja-factura-label">Pendiente por pagar</p>
          <p class="caja-factura-monto">$${Number(factura.saldo).toFixed(2)}</p>
        </div>
        <button class="btn-ver-factura" onclick="irAPagarFactura('${factura.num_control}')">Pagar ahora</button>
      </div>
    `;
  }

  // 📌 ESTADO 5: Bloqueado por otro motivo (no debería pasar)
  return `
    <div class="caja-factura caja-factura-bloqueada">
      <div>
        <p class="caja-factura-label">Pendiente por pagar</p>
        <p class="caja-factura-monto">$${Number(factura.saldo).toFixed(2)}</p>
      </div>
      <div class="caja-factura-bloqueo">
        <span class="badge-bloqueado">Pago no disponible</span>
      </div>
    </div>
  `;
}

function irAPagarFactura(numControl) {
  localStorage.setItem('ucab_factura_a_pagar', numControl);
  window.location.href = '../estudiante/pagos.html';
}