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

    // ── VERIFICACIÓN EN DOS PASOS (reporte QA) ──────────────────────────────
    // Si el usuario tiene MFA activado, el backend no entrega el token real:
    // pide un código de 6 dígitos. Se muestra el paso 2 y se completa el
    // login con /verificar-2fa. (En esta demo académica el código llega en
    // codigo_demo y en la consola del servidor; en producción iría por correo.)
    if (data.requiere_2fa) {
      const dataFinal = await pedirCodigo2FA(data);
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

// ----------------------------------------------------------------------------
//  Paso 2 del login (2FA): pide el código y lo valida contra el backend.
// ----------------------------------------------------------------------------
async function pedirCodigo2FA(dataLogin) {
  const codigo = prompt(
    'Verificación en dos pasos activada.\n' +
    'Ingresa el código de 6 dígitos enviado a tu correo institucional.\n' +
    `(Demo académica — código: ${dataLogin.codigo_demo})`
  );
  if (!codigo) throw new Error('Verificación en dos pasos cancelada.');

  const resp = await fetch(`${API_URL}/verificar-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_temporal: dataLogin.token_temporal, codigo: codigo.trim() })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Código incorrecto.');
  return data;
}

// ----------------------------------------------------------------------------
//  Cierra el login: guarda sesión, intentos fallidos previos (QA) y redirige.
// ----------------------------------------------------------------------------
function completarLogin(data, correo) {
    // --- NUEVA VALIDACIÓN ESTRICTA DE SEGURIDAD ---
    if (!data.roles || data.roles.length === 0) {
      throw new Error('Tu cuenta no tiene un rol asignado. Contacta a soporte técnico.');
    }

    const rolPrincipal = data.roles[0].toUpperCase();

    // QA: los intentos fallidos ya se registraban en la BD pero no se veían
    // en la interfaz. Se guardan aquí (el backend los reporta ANTES de
    // resetearlos) y el perfil los muestra en la pestaña de Seguridad.
    localStorage.setItem('ucab_intentos_previos', String(data.intentos_fallidos ?? 0));

    // Guardar los datos de auditoría en localStorage
    if (data.sesion_actual) {
      localStorage.setItem('ucab_sesion_actual', JSON.stringify({
        ip: data.sesion_actual.ip,
        dispositivo: data.sesion_actual.dispositivo,
        geolocalizacion: data.sesion_actual.geolocalizacion,
        fecha_conexion: data.sesion_actual.fecha_conexion
      }));
    }

    // 1. Guardar token y datos del usuario en localStorage
    localStorage.setItem('ucab_rol', rolPrincipal);
    localStorage.setItem('ucab_token', data.token);
    localStorage.setItem('ucab_usuario', JSON.stringify({
      cedula: data.cedula,
      nombre: data.nombre,
      correo: correo,
      roles: data.roles
    }));

    // 2. PARCHE: Guardamos también con los nombres viejos
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify({
      cedula: data.cedula,
      nombre: data.nombre,
      correo: correo,
      roles: data.roles
    }));
    // -----------------------------------------

    // --------------------------------------------------------------------
    // CORRECCIÓN: antes esto mandaba a TODOS los roles a estudiante/index.html.
    // Ahora cada rol va a su propia carpeta. Si en el futuro se agregan más
    // roles (cajero, admin), solo hay que sumar un 'else if' aquí.
    // --------------------------------------------------------------------
    if (rolPrincipal === 'ESTUDIANTE' || rolPrincipal === 'EGRESADO') {
      window.location.href = '../estudiante/estudiante.html';
    } else if (rolPrincipal === 'DOCENTE' || rolPrincipal === 'ADMINISTRATIVO') {
      window.location.href = '../administrativo/empleado.html';
    } else {
      // Rol reconocido por el backend pero sin pantalla propia todavía.
      window.location.href = '../estudiante/estudiante.html';
    }

}

function mostrarError(mensaje) {
  alerta.textContent = `⚠️ ${mensaje}`;
  alerta.className = "alerta-banner error";
  alerta.style.display = 'block';
}