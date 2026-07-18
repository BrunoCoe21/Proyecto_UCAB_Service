

const TASA_BCV = 38.50;

const METODOS = [
  { id: 'tai',          label: 'Billetera TAI (NFC)',  desc: 'Tarjeta Academica Inteligente', badge: 'Recomendado' },
  { id: 'zelle',        label: 'Zelle',                desc: 'Transferencia bancaria USA' },
  { id: 'criptomoneda', label: 'Criptomonedas',        desc: 'USDT · BTC · ETH' },
  { id: 'tarjeta',      label: 'Debito / Credito',     desc: 'Visa · Mastercard · Amex' },
  { id: 'pago_movil',   label: 'Pago Movil',           desc: 'Bancos venezolanos' },
  { id: 'efectivo',     label: 'Taquilla Presencial',  desc: 'Efectivo en caja' },
];

let facturaActual = null;
let metodoActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  const cedula = usuario.cedula || usuario.cedula_identidad;
  await cargarFacturasPendientes(cedula);
});

// ----------------------------------------------------------------------------
//  Lista de facturas que aun tienen saldo.
// ----------------------------------------------------------------------------
async function cargarFacturasPendientes(cedula) {
  const cont = document.getElementById('lista-facturas-pago');
  try {
    const facturas = await API.request(`/facturas/estudiante/${cedula}`);
    const pendientes = facturas.filter(f => f.estatus !== 'pagada' && Number(f.saldo) > 0);

    if (pendientes.length === 0) {
      cont.innerHTML = '<p class="texto-vacio">No tienes facturas pendientes por pagar. ¡Estas al dia!</p>';
      return;
    }

    cont.innerHTML = pendientes.map(f => `
      <div class="item-factura-pago" data-numcontrol="${f.num_control}" data-saldo="${f.saldo}" data-concepto="${f.concepto || 'Aranceles'}">
        <div>
          <span class="item-control">${f.num_control}</span>
          <p class="item-concepto">${f.concepto || 'Aranceles universitarios'}</p>
        </div>
        <span class="item-saldo">$${Number(f.saldo).toFixed(2)}</span>
      </div>
    `).join('');

    document.querySelectorAll('.item-factura-pago').forEach(el => {
      el.addEventListener('click', () => {
        facturaActual = {
          num_control: el.dataset.numcontrol,
          saldo: Number(el.dataset.saldo),
          concepto: el.dataset.concepto
        };
        irAMetodos();
      });
    });

    const preseleccion = localStorage.getItem('ucab_factura_a_pagar');
    if (preseleccion) {
      localStorage.removeItem('ucab_factura_a_pagar');
      const f = pendientes.find(x => x.num_control === preseleccion);
      if (f) {
        facturaActual = { num_control: f.num_control, saldo: Number(f.saldo), concepto: f.concepto || 'Aranceles' };
        irAMetodos();
      }
    }

  } catch (error) {
    cont.innerHTML = `<p class="texto-error">Error: ${error.message}</p>`;
  }
}

function irAMetodos() {
  mostrarPaso('paso-metodo');

  document.getElementById('resumen-factura').innerHTML = `
    <span>Pagando <strong>${facturaActual.num_control}</strong> · ${facturaActual.concepto}</span>
    <span class="resumen-saldo">$${facturaActual.saldo.toFixed(2)}</span>
  `;

  const grid = document.getElementById('grid-metodos');
  grid.innerHTML = METODOS.map(m => `
    <button class="card-metodo ${m.id === 'tai' ? 'card-recomendado' : ''}" data-metodo="${m.id}">
      <div class="card-metodo-info">
        <span class="card-metodo-label">${m.label}</span>
        <span class="card-metodo-desc">${m.desc}</span>
      </div>
      ${m.badge ? `<span class="badge-recomendado">${m.badge}</span>` : ''}
    </button>
  `).join('');

  document.querySelectorAll('.card-metodo').forEach(el => {
    el.addEventListener('click', () => {
      metodoActual = el.dataset.metodo;
      irADatos();
    });
  });
}

function irADatos() {
  mostrarPaso('paso-datos');

  const metodo = METODOS.find(m => m.id === metodoActual);
  document.getElementById('titulo-metodo').textContent = metodo.label;
  document.getElementById('campos-metodo').innerHTML = camposPorMetodo(metodoActual);
  document.getElementById('resumen-monto').innerHTML = `
    <span>Monto a pagar</span>
    <strong>$${facturaActual.saldo.toFixed(2)} <small>· Bs. ${(facturaActual.saldo * TASA_BCV).toLocaleString('es-VE', {minimumFractionDigits:2})}</small></strong>
  `;

  document.getElementById('form-pago').onsubmit = enviarPago;

  if (metodoActual === 'tai') {
    consultarSaldoTai();
  }
}

async function consultarSaldoTai() {
  const caja = document.getElementById('caja-saldo-tai');
  const btn = document.getElementById('btn-confirmar');
  try {
    const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
    const cedula = usuario?.cedula || usuario?.cedula_identidad;
    const billetera = await API.request(`/facturas/billetera/${cedula}`);
    const saldo = Number(billetera.saldo);

    if (saldo >= facturaActual.saldo) {
      caja.className = 'caja-disponible';
      caja.innerHTML = `<strong>💳 Saldo TAI disponible: $${saldo.toFixed(2)}</strong>
                        <p>Quedaran $${(saldo - facturaActual.saldo).toFixed(2)} despues de este pago.</p>`;
      if (btn) btn.disabled = false;
    } else {
      caja.className = 'caja-no-disponible';
      caja.innerHTML = `<strong>Saldo TAI insuficiente</strong>
                        <p>Disponible: $${saldo.toFixed(2)} · Requerido: $${facturaActual.saldo.toFixed(2)}.
                        Recarga tu billetera o elige otro metodo.</p>`;
      if (btn) { btn.disabled = true; btn.title = 'Saldo TAI insuficiente'; }
    }
  } catch (error) {
    caja.className = 'caja-no-disponible';
    caja.innerHTML = `<strong>No posees una billetera TAI registrada.</strong>
                      <p>Elige otro metodo de pago.</p>`;
    if (btn) { btn.disabled = true; btn.title = 'Sin billetera TAI'; }
  }
}

function camposPorMetodo(metodo) {
  const campo = (id, label, placeholder = '', type = 'text') => `
    <div class="campo">
      <label>${label}</label>
      <input type="${type}" id="${id}" placeholder="${placeholder}" required>
    </div>`;

  switch (metodo) {
    case 'tai':
      return `<div class="caja-disponible" id="caja-saldo-tai">
                <strong>Consultando saldo de tu billetera TAI...</strong>
              </div>` +
             `<div class="campo">
                <label>Codigo del terminal POS (autogenerado, opcional)</label>
                <input type="text" id="codigoTerminal"
                       value="POS-MONT-${String(Math.floor(1000+Math.random()*8999))}">
                <small style="color:#6b7280;">Puedes editarlo si tu terminal usa otro codigo.</small>
              </div>`;
    case 'zelle':
      return campo('correoOrigen', 'Correo Zelle de origen', 'pagador@email.com', 'email') +
             `<div class="campo">
                <label>Nombre del titular</label>
                <input type="text" id="titular" placeholder="Jane Doe" required
                       pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+"
                       title="Solo letras y espacios">
              </div>` +
             `<div class="campo">
                <label>N° de confirmacion Zelle</label>
                <input type="text" id="confirmacion" placeholder="Solo numeros" required
                       inputmode="numeric" pattern="[0-9]+"
                       title="Solo numeros enteros">
              </div>`;
    case 'criptomoneda':
      return `<div class="campo"><label>Red</label>
                <select id="red">
                  <option>USDT-TRC20 (Tron)</option>
                  <option>USDT-ERC20 (Ethereum)</option>
                  <option>BTC (Bitcoin)</option>
                  <option>ETH (Ethereum)</option>
                </select></div>` +
             campo('txid', 'Hash de la transaccion (TXID)', '0x...') +
             campo('billeteraOrigen', 'Direccion de billetera origen', 'T... o 0x...') +
             `<div class="campo">
                <label>Tasa de conversion (Bs por USD)</label>
                <input type="number" id="tasaConversion" step="0.01" min="0"
                       value="${TASA_BCV}" required>
                <small style="color:#6b7280;">Predeterminada con la tasa BCV; puedes ajustarla si el operador te indica otra.</small>
              </div>`;
    case 'tarjeta':
      return campo('numero', 'Numero de tarjeta', '0000 0000 0000 0000') +
             campo('expiry', 'Vencimiento (MM/AAAA)', '12/2027') +
             `<div class="campo"><label>Franquicia</label>
                <select id="franquicia"><option>Visa</option><option>Mastercard</option><option>Amex</option></select></div>` +
             `<div class="campo"><label>Tipo de red</label>
                <select id="tipoRed">
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                </select></div>`;
    case 'pago_movil':
      return `<div class="campo"><label>Banco</label>
                <select id="banco">
                  <option>0102 - Banco de Venezuela</option>
                  <option>0105 - Mercantil</option>
                  <option>0108 - Provincial</option>
                  <option>0134 - Banesco</option>
                </select></div>` +
             campo('telefono', 'Telefono', '0412-0000000') +
             campo('referencia', 'N° de referencia', '00000000');
    case 'efectivo':
      return `<div class="campo"><label>Moneda</label>
                <select id="moneda"><option>USD</option><option>Bolivares</option><option>Euros</option></select></div>` +
             `<div class="campo">
                <label>Desglose de billetes (opcional)</label>
                <input type="text" id="desglose" placeholder="Ej: 2 de 50, 1 de 20">
              </div>`;
    default:
      return '';
  }
}

// -----------------------------------------------------------------------------------------------
//  enviarPago - CON MODAL DE CONFIRMACIÓN PARA PAGOS PRESENCIALES
// -------------------------------------------------------------------------------------------------
async function enviarPago(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-confirmar');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  const datos = {};
  document.querySelectorAll('#campos-metodo input, #campos-metodo select').forEach(el => {
    datos[el.id] = el.value;
  });

  const esPresencial = ['tarjeta', 'pago_movil', 'efectivo'].includes(metodoActual);

  try {
    const resp = await API.request(
      `/facturas/${facturaActual.num_control}/pagar`,
      'POST',
      {
        metodo: metodoActual,
        monto: facturaActual.saldo,
        tasa_bcv: TASA_BCV,
        datos
      }
    );

    if (esPresencial) {
      mostrarModalPresencial(resp);
      return;
    }

    mostrarPaso('paso-confirmado');
    const f = resp.factura;
    document.getElementById('mensaje-confirmado').innerHTML =
      `La factura <strong>${f.num_control}</strong> quedo con estatus
       <strong>${f.estatus.toUpperCase()}</strong> y saldo <strong>$${Number(f.saldo).toFixed(2)}</strong>.`;

  } catch (error) {
    showAviso('No se pudo registrar el pago: ' + error.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Confirmar pago';
  }
}

// --------------------------------------------------------------------------------------------------
//  MODAL PARA PAGOS PRESENCIALES
// --------------------------------------------------------------------------------------------------
function mostrarModalPresencial(resp) {
  let modal = document.getElementById('modal-pago-presencial');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-pago-presencial';
    modal.className = 'modal-overlay-presencial';
    modal.innerHTML = `
      <div class="modal-caja-presencial">
        <div class="modal-header-presencial">
          <span class="icono-presencial">🏦</span>
          <h2>Pago registrado</h2>
        </div>
        <div class="modal-body-presencial">
          <p class="modal-mensaje-presencial">
            Tu pago ha sido registrado exitosamente.
          </p>
          <div class="modal-aviso-presencial">
            <span class="aviso-icono">⏳</span>
            <div>
              <strong>Pago en verificacion</strong>
              <p>Por ser un pago presencial, el personal de Caja debe verificar el comprobante.</p>
              <p style="font-size:13px; margin-top:6px; color:#92400e;">
                Una vez verificado, el estado de tu factura se actualizara automaticamente.
              </p>
            </div>
          </div>
          <div class="modal-detalle-presencial">
            <p><strong>Factura:</strong> ${resp.factura.num_control}</p>
            <p><strong>Monto:</strong> $${Number(resp.factura.saldo).toFixed(2)}</p>
            <p><strong>Estado:</strong> <span class="badge-pendiente">Pendiente de verificacion</span></p>
          </div>
        </div>
        <div class="modal-footer-presencial">
          <button onclick="cerrarModalPresencial()" class="btn-modal-presencial">Entendido, volver a Mis Solicitudes</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Estilos del modal
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay-presencial {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: none; align-items: center; justify-content: center;
        z-index: 9999; font-family: 'Plus Jakarta Sans', sans-serif;
      }
      .modal-overlay-presencial.abierto { display: flex; }
      .modal-caja-presencial {
        background: white; border-radius: 16px; max-width: 480px; width: 92%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
      }
      .modal-header-presencial {
        background: #f8f6f2; padding: 20px 24px; display: flex; align-items: center; gap: 12px;
        border-bottom: 1px solid #e6e2da;
      }
      .modal-header-presencial .icono-presencial { font-size: 28px; }
      .modal-header-presencial h2 { font-size: 20px; margin: 0; color: #1a1a2e; }
      .modal-body-presencial { padding: 24px; }
      .modal-mensaje-presencial { font-size: 15px; color: #1a1a2e; margin-bottom: 16px; }
      .modal-aviso-presencial {
        background: #fef3c7; border-radius: 10px; padding: 16px;
        display: flex; gap: 12px; align-items: flex-start;
        border-left: 4px solid #f59e0b; margin-bottom: 16px;
      }
      .modal-aviso-presencial .aviso-icono { font-size: 24px; }
      .modal-aviso-presencial strong { color: #92400e; display: block; }
      .modal-aviso-presencial p { margin: 4px 0 0; color: #78350f; font-size: 14px; }
      .modal-detalle-presencial {
        background: #f8f6f2; border-radius: 8px; padding: 16px;
      }
      .modal-detalle-presencial p { margin: 4px 0; font-size: 14px; }
      .badge-pendiente {
        background: #fef3c7; color: #92400e; padding: 2px 10px;
        border-radius: 12px; font-size: 12px; font-weight: 600;
      }
      .modal-footer-presencial { padding: 16px 24px 24px; border-top: 1px solid #e6e2da; }
      .btn-modal-presencial {
        width: 100%; padding: 12px; background: #4a1d6e; color: white;
        border: none; border-radius: 8px; font-size: 15px; font-weight: 600;
        cursor: pointer; font-family: inherit;
      }
      .btn-modal-presencial:hover { background: #361552; }
    `;
    document.head.appendChild(style);
  }

  modal.classList.add('abierto');
}

function cerrarModalPresencial() {
  const modal = document.getElementById('modal-pago-presencial');
  if (modal) modal.classList.remove('abierto');
  window.location.href = '../estudiante/solicitudes.html';
}

function mostrarPaso(idPaso) {
  ['paso-factura', 'paso-metodo', 'paso-datos', 'paso-confirmado'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = (p === idPaso) ? 'block' : 'none';
  });
}

function volverAFacturas() { mostrarPaso('paso-factura'); }
function volverAMetodos()  { irAMetodos(); }