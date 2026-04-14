/**
 * Utilidades de seguridad para el frontend
 * Prevención de XSS, validación de inputs y manejo seguro de datos
 */

/**
 * Sanitiza un string para prevenir XSS
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
export const sanitizeInput = (str) => {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Valida que un email sea válido
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que un token JWT sea válido (formato)
 * @param {string} token - Token a validar
 * @returns {boolean} - True si tiene formato válido
 */
export const isValidToken = (token) => {
  if (!token) return false
  const tokenParts = token.split('.')
  return tokenParts.length === 3 && tokenParts.every(part => part.length > 0)
}

/**
 * Decodifica un token JWT (sin validar firma)
 * @param {string} token - Token JWT
 * @returns {object|null} - Payload del token o null
 */
export const decodeJWT = (token) => {
  if (!isValidToken(token)) return null
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error('Error decoding JWT:', e)
    return null
  }
}

/**
 * Verifica si un token JWT está expirado
 * @param {string} token - Token JWT
 * @returns {boolean} - True si está expirado
 */
export const isTokenExpired = (token) => {
  const payload = decodeJWT(token)
  if (!payload) return true
  if (!payload.exp) return false // Sin expiry, no está expirado
  const now = Date.now() / 1000
  return payload.exp < now
}

/**
 * Almacena datos de forma segura en localStorage
 * @param {string} key - Clave
 * @param {any} value - Valor a almacenar
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Error storing data:', e)
    }
  },
  get: (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.error('Error reading data:', e)
      return null
    }
  },
  remove: (key) => {
    localStorage.removeItem(key)
  },
  clear: () => {
    localStorage.clear()
  },
}

/**
 * Manejo seguro de tokens de autenticación
 */
export const authStorage = {
  setToken: (token) => {
    secureStorage.set('auth_token', token)
  },
  getToken: () => {
    const token = secureStorage.get('auth_token')
    if (token && isTokenExpired(token)) {
      authStorage.clear()
      return null
    }
    return token
  },
  clear: () => {
    secureStorage.remove('auth_token')
    secureStorage.remove('user_id')
    secureStorage.remove('user_name')
    secureStorage.remove('user_email')
    secureStorage.remove('user_role')
    secureStorage.remove('is_admin')
    secureStorage.remove('admin_mode')
  },
}

/**
 * Previene inyección de HTML en textos
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Valida una URL para prevenir javascript: URLs
 * @param {string} url - URL a validar
 * @returns {boolean} - True si es segura
 */
export const isSafeUrl = (url) => {
  if (!url) return false
  const lowerUrl = url.toLowerCase().trim()
  return !lowerUrl.startsWith('javascript:') &&
         !lowerUrl.startsWith('data:') &&
         !lowerUrl.startsWith('vbscript:')
}

/**
 * Crea un elemento de enlace seguro
 * @param {string} href - URL de destino
 * @param {string} text - Texto del enlace
 * @returns {HTMLAnchorElement} - Elemento de enlace seguro
 */
export const createSafeLink = (href, text) => {
  const a = document.createElement('a')
  if (!isSafeUrl(href)) {
    console.warn('Unsafe URL detected:', href)
    a.href = '#'
    a.textContent = 'Enlace no seguro'
    return a
  }
  a.href = href
  a.textContent = text
  a.rel = 'noopener noreferrer'
  a.target = '_blank'
  return a
}

export default {
  sanitizeInput,
  isValidEmail,
  isValidToken,
  decodeJWT,
  isTokenExpired,
  secureStorage,
  authStorage,
  escapeHtml,
  isSafeUrl,
  createSafeLink,
}
