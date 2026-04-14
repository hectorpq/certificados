import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000, // 30 segundos timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      // Siempre enviar como Bearer (funciona con JWT y Django Tokens)
      config.headers.Authorization = `Bearer ${token}`
    }

    // No establecer Content-Type si es FormData (axios lo maneja automáticamente)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    // Prevenir cacheo de requests sensibles
    if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
      config.headers['Cache-Control'] = 'no-cache'
      config.headers['Pragma'] = 'no-cache'
    }

    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación (401)
    if (error.response?.status === 401) {
      // Limpiar sesión y redirigir a login
      localStorage.clear()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // Manejar errores de servidor (500)
    if (error.response?.status === 500) {
      console.error('Error del servidor:', error.response.data)
    }

    // Manejar errores de red
    if (!error.response) {
      console.error('Error de red:', error.message)
    }

    return Promise.reject(error)
  }
)

export default api