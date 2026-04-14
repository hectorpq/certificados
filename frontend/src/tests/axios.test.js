import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import axios from 'axios'

// Mock de axios antes de importar nuestro módulo
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {},
  }
  return {
    default: mockAxios,
    __esModule: true,
  }
})

describe('axios interceptor', () => {
  let api
  let mockLocalStorage

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    // Re-import after mock setup
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('crea una instancia de axios con baseURL correcta', async () => {
    const { default: apiModule } = await import('../api/axios')
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api',
    })
  })

  it('agrega el token de autorización cuando existe en localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue('test-token-123')

    const { default: apiModule } = await import('../api/axios')

    // Verificar que el interceptor fue registrado
    expect(axios.interceptors.request.use).toHaveBeenCalled()

    // Obtener la función interceptor
    const interceptorFn = axios.interceptors.request.use.mock.calls[0][0]

    // Crear un config mock
    const config = {
      headers: {},
      url: '/test',
      method: 'GET',
    }

    // Ejecutar el interceptor
    const result = interceptorFn(config)

    // Verificar que se agregó el token
    expect(result.headers.Authorization).toBe('Bearer test-token-123')
  })

  it('no agrega token cuando no existe en localStorage', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)

    const { default: apiModule } = await import('../api/axios')
    const interceptorFn = axios.interceptors.request.use.mock.calls[0][0]

    const config = {
      headers: {},
      url: '/test',
      method: 'GET',
    }

    const result = interceptorFn(config)

    expect(result.headers.Authorization).toBeUndefined()
  })

  it('no establece Content-Type cuando data es FormData', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)

    const { default: apiModule } = await import('../api/axios')
    const interceptorFn = axios.interceptors.request.use.mock.calls[0][0]

    const formData = new FormData()
    formData.append('file', 'test')

    const config = {
      headers: {},
      data: formData,
      url: '/upload',
      method: 'POST',
    }

    const result = interceptorFn(config)

    // FormData debe manejar Content-Type automáticamente
    expect(result.headers['Content-Type']).toBeUndefined()
  })

  it('establece Content-Type como application/json cuando no es FormData', async () => {
    mockLocalStorage.getItem.mockReturnValue(null)

    const { default: apiModule } = await import('../api/axios')
    const interceptorFn = axios.interceptors.request.use.mock.calls[0][0]

    const config = {
      headers: {},
      data: { key: 'value' },
      url: '/api/test',
      method: 'POST',
    }

    const result = interceptorFn(config)

    expect(result.headers['Content-Type']).toBe('application/json')
  })

  it('rechaza la promesa cuando hay error en el interceptor', async () => {
    const { default: apiModule } = await import('../api/axios')
    const errorInterceptor = axios.interceptors.request.use.mock.calls[0][1]

    expect(errorInterceptor).toBeDefined()

    const error = new Error('Test error')
    const result = errorInterceptor(error)

    expect(result).toBeInstanceOf(Promise)
    await expect(result).rejects.toBe(error)
  })
})
