// estudiante.js - Versión con depuración
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔍 Iniciando carga del perfil...');

  // --- OBTENER SESIÓN ---
  const usuario = JSON.parse(localStorage.getItem('ucab_usuario'));
  const token = localStorage.getItem('ucab_token');

  console.log('📦 usuario:', usuario);
  console.log('🔑 token:', token ? '✅ presente' : '❌ ausente');

  if (!usuario || !token) {
    console.error('❌ No hay sesión activa. Redirigiendo al login...');
    window.location.href = '../login/login.html';
    return;
  }

  // --- ACTUALIZAR SIDEBAR (avatar y nombre) ---
  const avatar = document.getElementById('perfil-avatar');
  const nombreElem = document.getElementById('perfil-nombre');
  if (usuario.nombre) {
    const iniciales = usuario.nombre.substring(0, 1) + (usuario.apellido ? usuario.apellido.substring(0, 1) : '');
    avatar.textContent = iniciales.toUpperCase() || '--';
    nombreElem.textContent = usuario.nombre + (usuario.apellido ? ' ' + usuario.apellido : '');
  }

  // --- OBTENER DATOS DEL ESTUDIANTE DESDE LA API ---
  try {
    const cedula = usuario.cedula || usuario.cedula_identidad;
    if (!cedula) {
      console.error('❌ No se encontró la cédula en usuario:', usuario);
      return;
    }

    console.log(`🌐 Llamando a API: /api/estudiantes/${cedula}`);

    // Usamos fetch directamente para más control
    const response = await fetch(`http://localhost:5000/api/estudiantes/${cedula}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Respuesta HTTP:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en la respuesta:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Datos recibidos de la API:', data);

    // Llenar todos los campos del perfil
    llenarPerfil(data, usuario);
    llenarTrayectoria(data.trayectoria);

  } catch (error) {
    console.error('💥 Error al cargar el perfil:', error);
    // Los campos ya tienen placeholders, no hacemos nada más
  }

  // --- LÓGICA DE PESTAÑAS ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });
});

// --- FUNCIÓN QUE LLENA TODOS LOS CAMPOS DEL PERFIL ---
function llenarPerfil(data, usuarioSesion) {
  console.log('✏️ Llenando perfil con datos reales de la BD:', data);

  // ----- COLUMNA IZQUIERDA (Identidad) -----
  const nombreCompleto = (data.primer_nombre || '') + ' ' + (data.primer_apellido || '');
  document.getElementById('perfil-nombre').textContent = nombreCompleto.trim() || '---';
  document.getElementById('perfil-escuela-side').textContent = data.escuela || data.facultad || '---';

  // Avatar (iniciales)
  const avatar = document.getElementById('perfil-avatar');
  if (data.primer_nombre && data.primer_apellido) {
    avatar.textContent = (data.primer_nombre.charAt(0) + data.primer_apellido.charAt(0)).toUpperCase();
  } else if (usuarioSesion.nombre) {
    const partes = usuarioSesion.nombre.split(' ');
    avatar.textContent = partes.map(p => p.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  // Estado de la cuenta
  const estadoCuenta = data.estado_cuenta ? data.estado_cuenta.charAt(0).toUpperCase() + data.estado_cuenta.slice(1) : 'Activa';
  const badgeEstado = document.getElementById('perfil-estado-cuenta');
  badgeEstado.textContent = `✓ ${estadoCuenta}`;
  badgeEstado.className = 'badge-estado';
  
  if (estadoCuenta === 'Activa') {
    badgeEstado.style.background = '#d1fae5';
    badgeEstado.style.color = '#065f46';
  } else if (estadoCuenta === 'Suspendida') {
    badgeEstado.style.background = '#fef3c7';
    badgeEstado.style.color = '#92400e';
  } else if (estadoCuenta === 'Bloqueada') {
    badgeEstado.style.background = '#fee2e2';
    badgeEstado.style.color = '#991b1b';
  }

  // ----- DATOS PERSONALES -----
  // Corregimos los nombres para que coincidan con la BD (numero_telefono, direccion_habitacion_detallada)
  document.getElementById('dato-cedula').textContent = data.cedula_identidad ? 'V-' + data.cedula_identidad : '---';
  
  // Formatear la fecha de nacimiento si existe
  if (data.fecha_nacimiento) {
    const fecha = new Date(data.fecha_nacimiento);
    document.getElementById('dato-fecha-nac').textContent = fecha.toLocaleDateString('es-ES', { timeZone: 'UTC' });
  } else {
    document.getElementById('dato-fecha-nac').textContent = '--/--/----';
  }

  document.getElementById('dato-nombres').textContent = data.primer_nombre || '---';
  document.getElementById('dato-apellidos').textContent = data.primer_apellido || '---';
  
  // Formatear sexo
  let sexoDisplay = '---';
  if (data.sexo === 'F') sexoDisplay = 'Femenino';
  if (data.sexo === 'M') sexoDisplay = 'Masculino';
  document.getElementById('dato-sexo').textContent = sexoDisplay;
  
  document.getElementById('dato-telefono').textContent = data.numero_telefono || '---';
  document.getElementById('dato-correo').textContent = data.correo_institucional || '---';
  document.getElementById('dato-sede').textContent = 'Montalbán'; // Dato estático por ahora según tu diseño
  document.getElementById('dato-direccion').textContent = data.direccion_habitacion_detallada || '---';

  // ----- ATRIBUTOS DEL ROL ACTIVO -----
  document.getElementById('resumen-promedio').textContent = data.promedio || '--';
  
  // Nivel del promedio
  const promedio = parseFloat(data.promedio);
  let nivel = '---';
  if (!isNaN(promedio)) {
    if (promedio >= 16) nivel = 'Excelente';
    else if (promedio >= 14) nivel = 'Bueno';
    else if (promedio >= 12) nivel = 'Regular';
    else nivel = 'Bajo';
  }
  document.getElementById('resumen-promedio-nivel').textContent = nivel;

  document.getElementById('resumen-uc').textContent = data.uc_aprobadas || '--';
  document.getElementById('resumen-uc-total').textContent = 'de requeridos'; 

  document.getElementById('resumen-semestre').textContent = data.semestre_actual ? data.semestre_actual + '°' : '--';
  document.getElementById('resumen-semestre-anio').textContent = 'Período Activo';
}



function llenarTrayectoria(trayectoria) {
  const tbody = document.getElementById('tbody-trayectoria');
  tbody.innerHTML = ''; 

  if (!trayectoria || trayectoria.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay historial registrado.</td></tr>';
    return;
  }

  trayectoria.forEach(p => {
    const tr = document.createElement('tr');
    
    const anioInicio = p.fecha_inicio ? new Date(p.fecha_inicio).getFullYear() : '---';
    const finTexto = p.fecha_finalizacion ? new Date(p.fecha_finalizacion).toLocaleDateString() : 'Vigente';
    
    // Lógica de Beca: Si es 'Regular', mostrar "No posee"[cite: 49]
    const esBecado = p.condicion_beca !== 'Regular';
    const textoBeca = esBecado ? p.condicion_beca : 'No posee';
    const badgeBecaClass = esBecado ? 'badge-azul' : 'badge-cerrado'; 
    
    const badgeEstado = p.fecha_finalizacion 
      ? '<span class="badge-cerrado">Cerrado</span>' 
      : '<span class="badge-activo">Activo</span>';

    tr.innerHTML = `
      <td class="fw-bold">${anioInicio}</td>
      <td>${p.rol_activo.toUpperCase()}</td>
      <td>${p.fecha_inicio}</td>
      <td>${finTexto}</td>
      <td class="fw-bold">${p.indice_nota || '--'}</td>
      <td><span class="${badgeBecaClass}">${textoBeca}</span></td>
      <td>${badgeEstado}</td>
    `;
    tbody.appendChild(tr);
  });
}

