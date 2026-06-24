const API_URL = 'http://localhost:5000/api';

document.getElementById('formUsuario').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Obtener token de autenticación (debe estar logueado)
  const token = localStorage.getItem('token');
  /*if (!token) {
    alert('Debe iniciar sesión primero.');
    return;
  }
*/
  // Recolectar datos del formulario
  const data = {
    cedula_identidad: parseInt(document.getElementById('cedula_identidad').value),
    primer_nombre: document.getElementById('primer_nombre').value.trim(),
    segundo_nombre: document.getElementById('segundo_nombre').value.trim() || null,
    primer_apellido: document.getElementById('primer_apellido').value.trim(),
    segundo_apellido: document.getElementById('segundo_apellido').value.trim() || null,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    sexo: document.getElementById('sexo').value,
    direccion_habitacion_detallada: document.getElementById('direccion_habitacion_detallada').value.trim(),
    numero_telefono: document.getElementById('numero_telefono').value.trim(),
    correo_institucional: document.getElementById('correo_institucional').value.trim(),
    contrasena: document.getElementById('contrasena').value,
    estado_cuenta: document.getElementById('estado_cuenta').value,
    estatus_verificacion_dos_pasos: document.getElementById('estatus_verificacion_dos_pasos').value === 'true'
  };

  // Validación básica
  if (data.contrasena.length < 8) {
    mostrarMensaje('La contraseña debe tener al menos 8 caracteres.', 'error');
    return;
  }
  if (!data.cedula_identidad || !data.primer_nombre || !data.primer_apellido || !data.correo_institucional) {
    mostrarMensaje('Los campos obligatorios están incompletos.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.mensaje || 'Error al crear usuario');
    }

    mostrarMensaje('✅ Usuario creado exitosamente.', 'exito');
    document.getElementById('formUsuario').reset();

  } catch (error) {
    console.error(error);
    mostrarMensaje(`❌ ${error.message}`, 'error');
  }
});

function mostrarMensaje(texto, tipo) {
  const mensaje = document.getElementById('mensaje');
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  mensaje.style.display = 'block';
}