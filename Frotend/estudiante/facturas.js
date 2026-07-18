

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
//  Trae las facturas del estudiante y arma la lista 
// ----------------------------------------------------------------------------
async function cargarFacturas(cedula) {
  const lista = document.getElementById('lista-facturas');
  try {
    const facturas = await API.request(`/facturas/estudiante/${cedula}`);
    facturasCache = facturas;

    if (facturas.length === 0) {
      lista.innerHTML = '<p class="texto-vacio">No tienes facturas registradas.</p>';
      document.getElementById('saldo-total').innerHTML = '$0.00 <span>USD</span>';
      document.getElementById('saldo-bs').textContent = 'Bs. 0,00';
      return;
    }

   
    const saldoTotal = facturas
      .filter(f => f.estatus !== 'pagada')
      .reduce((sum, f) => sum + Number(f.saldo), 0);

    pintarBanner(saldoTotal);


    lista.innerHTML = facturas.map(f => tarjetaFactura(f)).join('');


    document.querySelectorAll('.item-factura').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.item-factura').forEach(x => x.classList.remove('seleccionada'));
        el.classList.add('seleccionada');
        cargarDetalle(el.dataset.numcontrol);
      });
    });


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
//  Banner superior con el saldo total.
// ----------------------------------------------------------------------------
function pintarBanner(saldoTotal) {
  const tasaBCV = 38.50;
  document.getElementById('saldo-total').innerHTML =
    `$${saldoTotal.toFixed(2)} <span>USD</span>`;
  document.getElementById('saldo-bs').textContent =
    `Bs. ${(saldoTotal * tasaBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 })} · Tasa BCV ${tasaBCV}`;
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

  const identificador = f.num_control;

  const tienePagoPendiente = f.tiene_pago_pendiente || false;

  let badgePagoPendiente = '';
  if (tienePagoPendiente && f.estatus !== 'pagada') {
    badgePagoPendiente = `<span class="badge-pago-pendiente">⏳ En verificacion</span>`;
  }

  // Badge de estado
  let estadoTexto = f.estatus.toUpperCase();
  if (f.estatus === 'pagada') estadoTexto = '✓ PAGADA';
  else if (f.estatus === 'parcial') estadoTexto = '⏳ PARCIAL';
  else if (f.estatus === 'pendiente') estadoTexto = '⏳ PENDIENTE';

  return `
    <div class="item-factura" data-numcontrol="${f.num_control}">
      <div class="item-factura-top">
        <span class="item-control">${identificador}</span>
        <span class="badge-estado ${estadoClase}">${estadoTexto}</span>
        ${badgePagoPendiente}
      </div>
      <p class="item-concepto">${f.concepto || 'Aranceles universitarios'}</p>
      <div class="item-factura-bottom">
        <span class="item-fecha">${formatearFecha(f.fecha_emision)}</span>
        <span class="item-saldo">$${Number(f.saldo).toFixed(2)}</span>
      </div>
    </div>
  `;
}


async function cargarDetalle(numControl) {
  const cont = document.getElementById('detalle-factura');
  cont.innerHTML = '<p class="texto-vacio">Cargando detalle...</p>';

  try {
    const { factura, cargos, abonos } = await API.request(`/facturas/${numControl}/detalle`);

    // Totales calculados
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

    // 🔥 NUEVO: verificar si hay un pago pendiente
    const tienePagoPendiente = factura.tiene_pago_pendiente || false;

    // 🔥 Estado de la factura con mensaje explicativo (SIN BOTÓN DE PAGO)
    let estadoFacturaHtml = '';
    if (factura.estatus === 'pagada') {
      estadoFacturaHtml = `
        <div class="sello-pagada">
          <span class="icono-pagada">✓</span>
          <div>
            <strong>Factura pagada</strong>
            <p>Esta factura ha sido cancelada completamente.</p>
          </div>
        </div>
      `;
    } else if (tienePagoPendiente) {
      estadoFacturaHtml = `
        <div class="sello-verificacion">
          <span class="icono-verificacion">⏳</span>
          <div>
            <strong>Pago en verificacion</strong>
            <p>El personal de Caja esta verificando tu pago. Esto puede tomar hasta 24 horas.</p>
            <p style="font-size:12px; color:#78350f; margin-top:4px;">Una vez verificado, el estado de la factura se actualizara automaticamente.</p>
          </div>
        </div>
      `;
    } else if (factura.estatus === 'pendiente' || factura.estatus === 'parcial') {
      estadoFacturaHtml = `
        <div class="sello-pendiente">
          <span class="icono-pendiente">⏳</span>
          <div>
            <strong>Pendiente de pago</strong>
            <p>Esta factura aun no ha sido cancelada.</p>
            <p style="font-size:12px; color:#6b7280; margin-top:4px;">Para pagar esta factura, ve a la seccion "Mis Solicitudes" y selecciona la solicitud correspondiente.</p>
          </div>
        </div>
      `;
    }

    // Número de control visible
    const numControlVisible = factura.num_control;

    cont.innerHTML = `
      <div class="detalle-header">
        <div>
          <span class="detalle-control">${numControlVisible}</span>
          <p class="detalle-fecha">Emitida el ${formatearFecha(factura.fecha_emision)}</p>
          <p class="detalle-folio">Folio de consumo: ${factura.numero_folio}</p>
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

      ${estadoFacturaHtml}
    `;

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error al cargar el detalle: ${error.message}</p>`;
  }
}

function formatearFecha(fecha) {
  if (!fecha) return '--';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}