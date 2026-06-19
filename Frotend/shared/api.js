// shared/api.js - Cliente API Real de Comunicación con el Servidor Express
const API_BASE_URL = 'http://localhost:5000/api';

const API = {
  guardarSesion(usuario, rol, token = "jwt-token-real") {
    localStorage.setItem('ucab_usuario', JSON.stringify(usuario));
    localStorage.setItem('ucab_rol', rol);
    localStorage.setItem('ucab_token', token);
  },

  obtenerRol() {
    return localStorage.getItem('ucab_rol');
  },

  obtenerUsuario() {
    const user = localStorage.getItem('ucab_usuario');
    return user ? JSON.parse(user) : null;
  },

  cerrarSesion() {
    localStorage.clear();
    window.location.href = '../login/login.html';
  },

  // Petición HTTP Fetch Estricta conectada a PostgreSQL
  async request(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('ucab_token');
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    // El fetch va directo al servidor, sin bloques de datos falsos
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error en el Servidor (Código ${response.status})`);
    }
    
    return await response.json();
  }
};