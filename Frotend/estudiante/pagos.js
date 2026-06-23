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
      return campo('uid', 'UID del chip NFC', '04:A3:F2:1B:C8:9E:22') +
             campo('codigoTerminal', 'Código del terminal POS', 'POS-MONT-04');
    case 'zelle':
      return campo('correoOrigen', 'Correo Zelle de origen', 'pagador@email.com', 'email') +
             campo('titular', 'Nombre del titular', 'Jane Doe') +
             campo('confirmacion', 'N° de confirmación Zelle', '10 dígitos');
    case 'criptomoneda':
      return `<div class="campo"><label>Red</label>
                <select id="red">
                  <option>USDT-TRC20 (Tron)</option>
                  <option>USDT-ERC20 (Ethereum)</option>
                  <option>BTC (Bitcoin)</option>
                  <option>ETH (Ethereum)</option>
                </select></div>` +
             campo('txid', 'Hash de la transacción (TXID)', '0x...') +
             campo('billeteraOrigen', 'Dirección de billetera origen', 'T... o 0x...') +
             campo('tasaConversion', 'Tasa de conversión', '1 USDT = 1.00 USD');
    case 'tarjeta':
      return campo('numero', 'Número de tarjeta', '0000 0000 0000 0000') +
             campo('titular', 'Titular de la tarjeta', 'Como aparece en la tarjeta') +
             campo('expiry', 'Vencimiento (MM/AAAA)', '12/2027') +
             `<div class="campo"><label>Franquicia</label>
                <select id="franquicia"><option>Visa</option><option>Mastercard</option><option>Amex</option></select></div>` +
             `<div class="campo"><label>Tipo</label>
                <select id="tipoRed"><option>Débito</option><option>Crédito</option></select></div>`;
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
      return `<div class="campo"><label>Moneda</label>
                <select id="moneda"><option>USD</option><option>Bolivares</option><option>Euros</option></select></div>` +
             campo('monto', 'Monto entregado', '0.00', 'number') +
             campo('desglose', 'Desglose de billetes', 'Ej: 2 de 50, 1 de 20');
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