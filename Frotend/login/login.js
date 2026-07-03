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

    // --- NUEVA VALIDACIÓN ESTRICTA DE SEGURIDAD ---
    if (!data.roles || data.roles.length === 0) {
      throw new Error('Tu cuenta no tiene un rol asignado. Contacta a soporte técnico.');
    }

    const rolPrincipal = data.roles[0].toUpperCase();

    // 1. Guardamos con los nombres nuevos
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
      window.location.href = '../administrativo/index.html';
    } else {
      // Rol reconocido por el backend pero sin pantalla propia todavía.
      window.location.href = '../estudiante/estudiante.html';
    }

  } catch (error) {
    console.error("Detalle del error en Login:", error);
    mostrarError(error.message);
  } finally {
    btnIngresar.disabled = false;
    btnIngresar.textContent = 'Ingresar al Portal';
  }
});

function mostrarError(mensaje) {
  alerta.textContent = `⚠️ ${mensaje}`;
  alerta.className = "alerta-banner error";
  alerta.style.display = 'block';
}