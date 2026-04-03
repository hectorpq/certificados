import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
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
    
    return config
  },
  (error) => Promise.reject(error)
)

export default api