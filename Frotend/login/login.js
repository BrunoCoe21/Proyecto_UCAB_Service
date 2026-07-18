const API_URL = 'http://localhost:5000/api/auth';

const form = document.getElementById('formLogin');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const alerta = document.getElementById('mensaje-alerta');
const btnIngresar = document.querySelector('.btn-ingresar');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const correo = emailInput.value.trim();
  const contrasena = passwordInput.value.trim();

  alerta.style.display = 'none';

  if (!correo || !contrasena) {
    mostrarError('Por favor, complete todos los campos.');
    return;
  }

  btnIngresar.disabled = true;
  btnIngresar.textContent = 'Ingresando...';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo, contrasena })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Credenciales inválidas.');
    }

    if (data.requiere_2fa) {
      const dataFinal = await mostrarModal2FA(data);
      completarLogin(dataFinal, correo);
      return;
    }

    completarLogin(data, correo);

  } catch (error) {
    console.error("Detalle del error en Login:", error);
    mostrarError(error.message);
  } finally {
    btnIngresar.disabled = false;
    btnIngresar.textContent = 'Ingresar al Portal';
  }
});

function mostrarModal2FA(dataLogin) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('modal-2fa');
    const input = document.getElementById('modal-2fa-input');
    const codigoDemo = document.getElementById('modal-2fa-codigo-demo');
    const errorDiv = document.getElementById('modal-2fa-error');
    const loading = document.getElementById('modal-2fa-loading');
    const btnVerificar = document.getElementById('modal-2fa-verificar');
    const btnCancelar = document.getElementById('modal-2fa-cancelar');

    codigoDemo.textContent = dataLogin.codigo_demo || '------';
    input.value = '';
    errorDiv.classList.remove('visible');
    loading.classList.remove('activo');
    btnVerificar.disabled = false;
    btnVerificar.textContent = 'Verificar';

    async function verificarCodigo() {
      const codigo = input.value.trim();

      if (codigo.length !== 6) {
        errorDiv.textContent = 'El código debe tener 6 dígitos.';
        errorDiv.classList.add('visible');
        input.focus();
        return;
      }

      btnVerificar.disabled = true;
      btnVerificar.textContent = 'Verificando...';
      loading.classList.add('activo');
      errorDiv.classList.remove('visible');

      try {
        const resp = await fetch(`${API_URL}/verificar-2fa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_temporal: dataLogin.token_temporal,
            codigo: codigo
          })
        });

        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || 'Código incorrecto.');
        }

        modal.classList.remove('abierto');
        resolve(data);

      } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.add('visible');
        btnVerificar.disabled = false;
        btnVerificar.textContent = 'Verificar';
        loading.classList.remove('activo');
        input.value = '';
        input.focus();
      }
    }

    input.onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        verificarCodigo();
      }
    };

    btnVerificar.onclick = verificarCodigo;

    btnCancelar.onclick = function() {
      modal.classList.remove('abierto');
      reject(new Error('Verificación cancelada.'));
    };

    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.classList.remove('abierto');
        reject(new Error('Verificación cancelada.'));
      }
    };

    setTimeout(() => {
      input.focus();
      input.select();
    }, 300);

    modal.classList.add('abierto');
  });
}

function completarLogin(data, correo) {
  if (!data.roles || data.roles.length === 0) {
    throw new Error('Tu cuenta no tiene un rol asignado.');
  }

  const rolPrincipal = data.roles[0].toUpperCase();

  localStorage.setItem('ucab_intentos_previos', String(data.intentos_fallidos ?? 0));

  if (data.sesion_actual) {
    localStorage.setItem('ucab_sesion_actual', JSON.stringify({
      ip: data.sesion_actual.ip,
      dispositivo: data.sesion_actual.dispositivo,
      geolocalizacion: data.sesion_actual.geolocalizacion,
      fecha_conexion: data.sesion_actual.fecha_conexion
    }));
  }

  localStorage.setItem('ucab_rol', rolPrincipal);
  localStorage.setItem('ucab_token', data.token);
  localStorage.setItem('ucab_usuario', JSON.stringify({
    cedula: data.cedula,
    nombre: data.nombre,
    correo: correo,
    roles: data.roles
  }));

  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify({
    cedula: data.cedula,
    nombre: data.nombre,
    correo: correo,
    roles: data.roles
  }));

  if (rolPrincipal === 'ESTUDIANTE' || rolPrincipal === 'EGRESADO') {
    window.location.href = '../estudiante/estudiante.html';
  } else if (rolPrincipal === 'DOCENTE' || rolPrincipal === 'ADMINISTRATIVO') {
    window.location.href = '../administrativo/empleado.html';
  } else {
    window.location.href = '../estudiante/estudiante.html';
  }
}

function mostrarError(mensaje) {
  alerta.textContent = ` ${mensaje}`;
  alerta.className = "alerta-banner error";
  alerta.style.display = 'block';
}