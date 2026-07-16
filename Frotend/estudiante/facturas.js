// ============================================================================
//  facturas.js  ·  Estado de Cuenta del estudiante
//  Carga las facturas reales desde la API, calcula el saldo pendiente total,
//  y al hacer clic en una factura muestra su detalle (cargos y abonos).
// ============================================================================

const IVA = 0.16;
let facturasCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');

  if (!usuario || !token) {
    window.location.href = '../login/login.html';
    return;
  }

  const cedula = usuario.cedula || usuario.cedula_identidad;
  await cargarFacturas(cedula);
});

// ----------------------------------------------------------------------------
//  Trae las facturas del estudiante y arma la lista + el banner de saldo total.
// ----------------------------------------------------------------------------
async function cargarFacturas(cedula) {
  const lista = document.getElementById('lista-facturas');
  try {
    const facturas = await API.request(`/facturas/estudiante/${cedula}`);
    facturasCache = facturas;

    if (facturas.length === 0) {
      lista.innerHTML = '<p class="texto-vacio">No tienes facturas registradas.</p>';
      return;
    }

    // Saldo pendiente total (solo facturas que no están pagadas)
    const saldoTotal = facturas
      .filter(f => f.estatus !== 'pagada')
      .reduce((sum, f) => sum + Number(f.saldo), 0);

    pintarBanner(saldoTotal);

    // Lista de tarjetas de factura
    lista.innerHTML = facturas.map(f => tarjetaFactura(f)).join('');

    // Listeners para seleccionar una factura
    document.querySelectorAll('.item-factura').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.item-factura').forEach(x => x.classList.remove('seleccionada'));
        el.classList.add('seleccionada');
        cargarDetalle(el.dataset.numcontrol);
      });
    });

    // Abrir la primera automáticamente
    const primera = document.querySelector('.item-factura');
    if (primera) {
      primera.classList.add('seleccionada');
      cargarDetalle(primera.dataset.numcontrol);
    }

  } catch (error) {
    lista.innerHTML = `<p class="texto-error">Error al cargar facturas: ${error.message}</p>`;
  }
}

// ----------------------------------------------------------------------------
//  Banner superior con el saldo total en USD y su equivalente en Bs.
// ----------------------------------------------------------------------------
function pintarBanner(saldoTotal) {
  const tasaBCV = 38.50; // tasa de referencia para mostrar el equivalente en Bs
  document.getElementById('saldo-total').innerHTML =
    `$${saldoTotal.toFixed(2)} <span>USD</span>`;
  document.getElementById('saldo-bs').textContent =
    `Bs. ${(saldoTotal * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })} · Tasa BCV ${tasaBCV}`;

  // El botón "Pagar ahora" solo aparece si hay algo que pagar
  const btn = document.getElementById('btn-ir-pagar');
  if (saldoTotal > 0) {
    btn.style.display = 'inline-flex';
    btn.onclick = () => { window.location.href = 'pagos.html'; };
  }
}

// ----------------------------------------------------------------------------
//  Tarjeta de una factura en la lista de la izquierda.
// ----------------------------------------------------------------------------
function tarjetaFactura(f) {
  const estadoClase = {
    pagada: 'estado-pagada',
    parcial: 'estado-parcial',
    pendiente: 'estado-pendiente',
    anulada: 'estado-anulada'
  }[f.estatus] || 'estado-pendiente';

  // QA: mientras el folio no esté pagado se muestra el NÚMERO DE FOLIO;
  // el número de control de la factura solo se revela cuando está pagada.
  const identificadorVisible = f.estatus === 'pagada'
    ? f.num_control
    : (f.numero_folio || f.num_control);

  return `
    <div class="item-factura" data-numcontrol="${f.num_control}">
      <div class="item-factura-top">
        <span class="item-control">${identificadorVisible}</span>
        <span class="badge-estado ${estadoClase}">${f.estatus.toUpperCase()}</span>
      </div>
      <p class="item-concepto">${f.concepto || 'Aranceles universitarios'}</p>
      <div class="item-factura-bottom">
        <span class="item-fecha">${formatearFecha(f.fecha_emision)}</span>
        <span class="item-saldo">$${Number(f.saldo).toFixed(2)}</span>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------------
//  Carga el detalle de una factura: líneas de cargo + abonos + totales.
// ----------------------------------------------------------------------------
async function cargarDetalle(numControl) {
  const cont = document.getElementById('detalle-factura');
  cont.innerHTML = '<p class="texto-vacio">Cargando detalle...</p>';

  try {
    const { factura, cargos, abonos } = await API.request(`/facturas/${numControl}/detalle`);

    // Totales calculados a partir de las líneas de cargo
    const subtotal = cargos.reduce((s, c) => s + Number(c.cantidad) * Number(c.precio_unitario), 0);
    const impuesto = cargos.reduce((s, c) => s + Number(c.impuesto_ley), 0);
    const total = subtotal + impuesto;
    const totalAbonado = abonos.reduce((s, a) => s + Number(a.monto), 0);

    const filasCargos = cargos.map(c => `
      <tr>
        <td>${c.concepto}</td>
        <td class="num">${c.cantidad}</td>
        <td class="num">$${Number(c.precio_unitario).toFixed(2)}</td>
        <td class="num">$${(Number(c.cantidad) * Number(c.precio_unitario)).toFixed(2)}</td>
      </tr>
    `).join('');

    const filasAbonos = abonos.length === 0
      ? '<p class="texto-vacio-sm">Sin abonos registrados.</p>'
      : abonos.map(a => `
          <div class="fila-abono">
            <span>${formatearFecha(a.fecha_movimiento)}</span>
            <span class="abono-monto">$${Number(a.monto).toFixed(2)}</span>
          </div>
        `).join('');

    const botonPagar = factura.estatus !== 'pagada'
      ? `<button class="btn-pagar" onclick="irAPagar('${factura.num_control}')">Pagar esta factura</button>`
      : '<div class="sello-pagada">✓ Factura pagada</div>';

    cont.innerHTML = `
      <div class="detalle-header">
        <div>
          <!-- QA: el número de control solo se muestra si la factura está
               pagada; mientras tanto se muestra el número de folio. -->
          <span class="detalle-control">${factura.estatus === 'pagada' ? factura.num_control : factura.numero_folio}</span>
          ${factura.estatus !== 'pagada' ? '<p class="detalle-fecha">N° de control disponible al completar el pago</p>' : ''}
          <p class="detalle-fecha">Emitida el ${formatearFecha(factura.fecha_emision)}</p>
        </div>
        <span class="badge-estado ${'estado-' + factura.estatus}">${factura.estatus.toUpperCase()}</span>
      </div>

      <table class="tabla-cargos">
        <thead>
          <tr><th>Concepto</th><th class="num">Cant.</th><th class="num">P. Unit.</th><th class="num">Subtotal</th></tr>
        </thead>
        <tbody>${filasCargos}</tbody>
      </table>

      <div class="totales">
        <div class="fila-total"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
        <div class="fila-total"><span>IVA (16%)</span><span>$${impuesto.toFixed(2)}</span></div>
        <div class="fila-total fila-total-grande"><span>Total</span><span>$${total.toFixed(2)}</span></div>
        <div class="fila-total"><span>Abonado</span><span>-$${totalAbonado.toFixed(2)}</span></div>
        <div class="fila-total fila-saldo"><span>Saldo pendiente</span><span>$${Number(factura.saldo).toFixed(2)}</span></div>
      </div>

      <div class="seccion-abonos">
        <h4>Abonos realizados</h4>
        ${filasAbonos}
      </div>

      ${botonPagar}
    `;

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error al cargar el detalle: ${error.message}</p>`;
  }
}

// Guarda la factura elegida y va a la pasarela de pago
function irAPagar(numControl) {
  localStorage.setItem('ucab_factura_a_pagar', numControl);
  window.location.href = 'pagos.html';
}

// Formatea una fecha ISO a algo legible en español
function formatearFecha(fecha) {
  if (!fecha) return '--';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}