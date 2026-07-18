
(function () {
  const css = `
    .aviso-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
      display: none; align-items: center; justify-content: center;
      z-index: 9999; animation: aviso-in 0.15s ease-out;
    }
    .aviso-backdrop.abierto { display: flex; }
    .aviso-caja {
      background: #fff; border-radius: 12px; padding: 24px 28px;
      min-width: 320px; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .aviso-titulo { font-weight: 700; font-size: 18px; margin-bottom: 10px; color: #0f172a; }
    .aviso-mensaje { color: #334155; line-height: 1.5; margin-bottom: 20px; word-break: break-word; }
    .aviso-botones { display: flex; justify-content: flex-end; gap: 10px; }
    .aviso-boton {
      padding: 8px 18px; border-radius: 8px; border: none; font-weight: 600;
      cursor: pointer; font-size: 14px;
    }
    .aviso-boton.primario { background: #4f46e5; color: #fff; }
    .aviso-boton.primario:hover { background: #4338ca; }
    .aviso-boton.secundario { background: #e2e8f0; color: #334155; }
    .aviso-boton.secundario:hover { background: #cbd5e1; }
    .aviso-caja.ok    .aviso-titulo::before { content: "✓ "; color: #16a34a; }
    .aviso-caja.error .aviso-titulo::before { content: "⚠ "; color: #dc2626; }
    .aviso-caja.confirmar .aviso-titulo::before { content: "❔ "; color: #ca8a04; }
    @keyframes aviso-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);


  const backdrop = document.createElement('div');
  backdrop.className = 'aviso-backdrop';
  backdrop.innerHTML = `
    <div class="aviso-caja" role="dialog" aria-modal="true">
      <div class="aviso-titulo" id="aviso-titulo">Aviso</div>
      <div class="aviso-mensaje" id="aviso-mensaje"></div>
      <div class="aviso-botones" id="aviso-botones"></div>
    </div>
  `;
  document.body.appendChild(backdrop);

  const cajaEl    = backdrop.querySelector('.aviso-caja');
  const tituloEl  = backdrop.querySelector('#aviso-titulo');
  const mensajeEl = backdrop.querySelector('#aviso-mensaje');
  const botonesEl = backdrop.querySelector('#aviso-botones');

  function cerrar() { backdrop.classList.remove('abierto'); }


  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cerrar(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('abierto')) cerrar();
  });


  window.showAviso = function (mensaje, tipo = 'info', onConfirmar = null) {
    return new Promise((resolve) => {
      cajaEl.className = 'aviso-caja ' + tipo;

      const titulos = { ok: 'Éxito', error: 'Error', info: 'Aviso', confirmar: 'Confirmar' };
      tituloEl.textContent = titulos[tipo] || 'Aviso';
      mensajeEl.textContent = mensaje;
      botonesEl.innerHTML = '';

      if (tipo === 'confirmar') {
        const btnNo = document.createElement('button');
        btnNo.className = 'aviso-boton secundario';
        btnNo.textContent = 'Cancelar';
        btnNo.onclick = () => { cerrar(); resolve(false); };

        const btnSi = document.createElement('button');
        btnSi.className = 'aviso-boton primario';
        btnSi.textContent = 'Aceptar';
        btnSi.onclick = () => {
          cerrar();
          if (typeof onConfirmar === 'function') onConfirmar();
          resolve(true);
        };
        botonesEl.appendChild(btnNo);
        botonesEl.appendChild(btnSi);
      } else {
        const btn = document.createElement('button');
        btn.className = 'aviso-boton primario';
        btn.textContent = 'Aceptar';
        btn.onclick = () => { cerrar(); resolve(true); };
        botonesEl.appendChild(btn);
      }

      backdrop.classList.add('abierto');
    });
  };
})();
