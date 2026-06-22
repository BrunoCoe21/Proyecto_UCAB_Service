const API_URL = 'http://localhost:5000/api/auth';

document.getElementById('formLogin').addEventListener('submit', async function(e) {
  e.preventDefault();

  const correo = document.getElementById('email').value.trim();
  const contrasena = document.getElementById('password').value.trim();
  const mensajeAlerta = document.getElementById('mensaje-alerta');
  const btnIngresar = document.querySelector('.btn-ingresar');

  // Limpiar mensaje anterior
  mensajeAlerta.className = 'alerta-banner';
  mensajeAlerta.textContent = '';
  mensajeAlerta.style.display = 'none';

  // Validación básica
  if (!correo || !contrasena) {
    mostrarError('Por favor, complete todos los campos.');
    return;
  }

  // Deshabilitar botón para evitar múltiples envíos
  btnIngresar.disabled = true;
  btnIngresar.textContent = 'Ingresando...';

  // Capturar datos del dispositivo
  //const dispositivo = navigator.userAgent || 'Desconocido';
  // Geolocalización (por ahora la dejamos como "No disponible" para no pedir permisos)
  
  const userAgent = navigator.userAgent || 'Desconocido';
  const dispositivo = userAgent.substring(0, 60);

  const geolocalizacion = 'No disponible';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        correo,
        contrasena,
        dispositivo,      // <--- NUEVO
        geolocalizacion   // <--- NUEVO
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Credenciales inválidas.');
    }

    // Guardar token y datos en localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify({
      cedula: data.cedula,
      nombre: data.nombre,
      roles: data.roles
    }));

    // Redirigir al dashboard
    window.location.href = '../dashboard.html';

  } catch (error) {
    mostrarError(error.message);
  } finally {
    btnIngresar.disabled = false;
    btnIngresar.textContent = 'Ingresar al Portal';
  }
});

function mostrarError(mensaje) {
  const mensajeAlerta = document.getElementById('mensaje-alerta');
  mensajeAlerta.textContent = mensaje;
  mensajeAlerta.className = 'alerta-banner error';
  mensajeAlerta.style.display = 'block';
}