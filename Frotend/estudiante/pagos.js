// ============================================================================
//  pagos.js  ·  Pasarela de pago del estudiante
//  Flujo en pasos: elegir factura -> elegir método -> llenar datos -> confirmar.
//  Los 6 métodos coinciden con la base de datos: tai, zelle, criptomoneda,
//  tarjeta, pago_movil, efectivo.
// ============================================================================

const TASA_BCV = 38.50;

// Definición de los 6 métodos (id que entiende el backend + etiqueta visible)
const METODOS = [
  { id: 'tai',          label: 'Billetera TAI (NFC)',  desc: 'Tarjeta Académica Inteligente', badge: 'Recomendado' },
  { id: 'zelle',        label: 'Zelle',                desc: 'Transferencia bancaria USA' },
  { id: 'criptomoneda', label: 'Criptomonedas',        desc: 'USDT · BTC · ETH' },
  { id: 'tarjeta',      label: 'Débito / Crédito',     desc: 'Visa · Mastercard · Amex' },
  { id: 'pago_movil',   label: 'Pago Móvil',           desc: 'Bancos venezolanos' },
  { id: 'efectivo',     label: 'Taquilla Presencial',  desc: 'Efectivo en caja' },
];

let facturaActual = null;   // { num_control, saldo, ... }
let metodoActual = null;

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');
  if (!usuario || !token) { window.location.href = '../login/login.html'; return; }

  const cedula = usuario.cedula || usuario.cedula_identidad;
  await cargarFacturasPendientes(cedula);
});

// ----------------------------------------------------------------------------
//  PASO 0 — Lista de facturas que aún tienen saldo.
// ----------------------------------------------------------------------------
async function cargarFacturasPendientes(cedula) {
  const cont = document.getElementById('lista-facturas-pago');
  try {
    const facturas = await API.request(`/facturas/estudiante/${cedula}`);
    const pendientes = facturas.filter(f => f.estatus !== 'pagada' && Number(f.saldo) > 0);

    if (pendientes.length === 0) {
      cont.innerHTML = '<p class="texto-vacio">No tienes facturas pendientes por pagar. ¡Estás al día!</p>';
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

    // Si venimos de "Pagar esta factura" en el estado de cuenta, saltar directo
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

// ----------------------------------------------------------------------------
//  PASO 1 — Elegir método de pago.
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
//  PASO 2 — Formulario de datos según el método elegido.
// ----------------------------------------------------------------------------
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

  // QA — Billetera TAI: consultar el saldo real (tabla posee) y bloquear la
  // transacción si no es suficiente.
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
                        <p>Quedarán $${(saldo - facturaActual.saldo).toFixed(2)} después de este pago.</p>`;
      if (btn) btn.disabled = false;
    } else {
      caja.className = 'caja-no-disponible';
      caja.innerHTML = `<strong>Saldo TAI insuficiente</strong>
                        <p>Disponible: $${saldo.toFixed(2)} · Requerido: $${facturaActual.saldo.toFixed(2)}.
                        Recarga tu billetera o elige otro método.</p>`;
      if (btn) { btn.disabled = true; btn.title = 'Saldo TAI insuficiente'; }
    }
  } catch (error) {
    caja.className = 'caja-no-disponible';
    caja.innerHTML = `<strong>No posees una billetera TAI registrada.</strong>
                      <p>Elige otro método de pago.</p>`;
    if (btn) { btn.disabled = true; btn.title = 'Sin billetera TAI'; }
  }
}

// Campos propios de cada método (coinciden con las columnas de la base)
function camposPorMetodo(metodo) {
  const campo = (id, label, placeholder = '', type = 'text') => `
    <div class="campo">
      <label>${label}</label>
      <input type="${type}" id="${id}" placeholder="${placeholder}" required>
    </div>`;

  switch (metodo) {
    case 'tai':
      // QA: se muestra el SALDO ACTUAL de la billetera (tabla posee). El UID
      // lo resuelve la base a partir del titular de la factura; el usuario
      // solo indica el terminal. Si el saldo no alcanza, el botón se bloquea
      // (y el trigger de la base es la garantía final).
      return `<div class="caja-disponible" id="caja-saldo-tai">
                <strong>Consultando saldo de tu billetera TAI...</strong>
              </div>` +
             campo('codigoTerminal', 'Código del terminal POS', 'POS-MONT-04');
    case 'zelle':
      // QA: validaciones estrictas — correo con formato válido, nombre solo
      // letras y espacios, confirmación solo números.
      return campo('correoOrigen', 'Correo Zelle de origen', 'pagador@email.com', 'email') +
             `<div class="campo">
                <label>Nombre del titular</label>
                <input type="text" id="titular" placeholder="Jane Doe" required
                       pattern="[A-Za-zÁÉÍÓÚáéíóúÑñ ]+"
                       title="Solo letras y espacios">
              </div>` +
             `<div class="campo">
                <label>N° de confirmación Zelle</label>
                <input type="text" id="confirmacion" placeholder="Solo números" required
                       inputmode="numeric" pattern="[0-9]+"
                       title="Solo números enteros">
              </div>`;
    case 'criptomoneda':
      // La tasa de conversión viene PREDETERMINADA con la tasa BCV del sistema
      // pero el usuario puede editarla (por si el operador tiene una tasa distinta
      // pactada al momento del pago). El backend la registra tal cual llega.
      return `<div class="campo"><label>Red</label>
                <select id="red">
                  <option>USDT-TRC20 (Tron)</option>
                  <option>USDT-ERC20 (Ethereum)</option>
                  <option>BTC (Bitcoin)</option>
                  <option>ETH (Ethereum)</option>
                </select></div>` +
             campo('txid', 'Hash de la transacción (TXID)', '0x...') +
             campo('billeteraOrigen', 'Dirección de billetera origen', 'T... o 0x...') +
             `<div class="campo">
                <label>Tasa de conversión (Bs por USD)</label>
                <input type="number" id="tasaConversion" step="0.01" min="0"
                       value="${TASA_BCV}" required>
                <small style="color:#6b7280;">Predeterminada con la tasa BCV; puedes ajustarla si el operador te indica otra.</small>
              </div>`;
    case 'tarjeta':
      // QA: se eliminaron los campos "Titular de tarjeta" y "Tipo".
      return campo('numero', 'Número de tarjeta', '0000 0000 0000 0000') +
             campo('expiry', 'Vencimiento (MM/AAAA)', '12/2027') +
             `<div class="campo"><label>Franquicia</label>
                <select id="franquicia"><option>Visa</option><option>Mastercard</option><option>Amex</option></select></div>`;
    case 'pago_movil':
      return `<div class="campo"><label>Banco</label>
                <select id="banco">
                  <option>0102 - Banco de Venezuela</option>
                  <option>0105 - Mercantil</option>
                  <option>0108 - Provincial</option>
                  <option>0134 - Banesco</option>
                </select></div>` +
             campo('telefono', 'Teléfono', '0412-0000000') +
             campo('referencia', 'N° de referencia', '00000000');
    case 'efectivo':
      // QA: se eliminó "Monto entregado" (el monto es el saldo de la factura)
      // y el desglose por denominación quedó OPCIONAL.
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

// ----------------------------------------------------------------------------
//  Enviar el pago al backend (registra la jerarquía completa vía API).
// ----------------------------------------------------------------------------
async function enviarPago(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-confirmar');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  // Recolectar los campos del formulario en un objeto 'datos'
  const datos = {};
  document.querySelectorAll('#campos-metodo input, #campos-metodo select').forEach(el => {
    datos[el.id] = el.value;
  });

  try {
    const resp = await API.request(
      `/facturas/${facturaActual.num_control}/pagar`,
      'POST',
      {
        metodo: metodoActual,
        monto: facturaActual.saldo,   // se paga el saldo completo
        tasa_bcv: TASA_BCV,
        datos
      }
    );

    mostrarPaso('paso-confirmado');
    const f = resp.factura;
    document.getElementById('mensaje-confirmado').innerHTML =
      `La factura <strong>${f.num_control}</strong> quedó con estatus
       <strong>${f.estatus.toUpperCase()}</strong> y saldo <strong>$${Number(f.saldo).toFixed(2)}</strong>.`;

  } catch (error) {
    alert('No se pudo registrar el pago: ' + error.message);
    btn.disabled = false;
    btn.textContent = 'Confirmar pago';
  }
}

// ----------------------------------------------------------------------------
//  Navegación entre pasos
// ----------------------------------------------------------------------------
function mostrarPaso(idPaso) {
  ['paso-factura', 'paso-metodo', 'paso-datos', 'paso-confirmado'].forEach(p => {
    document.getElementById(p).style.display = (p === idPaso) ? 'block' : 'none';
  });
}
function volverAFacturas() { mostrarPaso('paso-factura'); }
function volverAMetodos()  { irAMetodos(); }