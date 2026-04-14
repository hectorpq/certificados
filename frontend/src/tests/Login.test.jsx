import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import Login from '../pages/Login'

// Mock de GoogleLogin
vi.mock('@react-oauth/google', () => ({
  GoogleLogin: vi.fn(({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: 'test-credential' })}>
      Google Sign In
    </button>
  )),
}))

// Mock de axios
const mockPost = vi.fn()
vi.mock('../api/axios', () => ({
  default: {
    post: (...args) => mockPost(...args),
  },
}))

// Mock de styles
vi.mock('../styles', () => ({
  colors: {
    bg: '#0e0e0f',
    surface: '#18181a',
    gold: '#d4a361',
    goldMuted: 'rgba(212,163,97,0.15)',
    goldBorder: 'rgba(212,163,97,0.25)',
    mint: '#6ee7b7',
    text: '#f0ede8',
    textMuted: 'rgba(240,237,232,0.4)',
    textDim: 'rgba(240,237,232,0.2)',
    border: 'rgba(255,255,255,0.07)',
    red: '#ff5050',
    redMuted: 'rgba(255,80,80,0.08)',
  },
  backgrounds: {
    grid: { backgroundImage: 'grid' },
    glowGold: (size) => ({ background: 'gold', width: size, height: '300px' }),
    glowMint: (size) => ({ background: 'mint', width: size, height: size }),
    glowPurple: (size) => ({ background: 'purple', width: size, height: size }),
  },
  buttons: { primary: {}, ghost: {} },
  cards: { container: { background: 'card' } },
  typography: { h2: {}, body: {}, label: {}, small: {} },
  radius: { md: '12px', full: '9999px' },
}))

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renderiza el componente de login correctamente', () => {
    renderLogin()
    expect(screen.getByText('Bienvenido')).toBeInTheDocument()
    expect(screen.getByText('Inicia sesión para continuar')).toBeInTheDocument()
    expect(screen.getByText('CertifyPro')).toBeInTheDocument()
    expect(screen.getByText('Sistema de certificación')).toBeInTheDocument()
  })

  it('muestra el botón de Google Login', () => {
    renderLogin()
    expect(screen.getByText('Google Sign In')).toBeInTheDocument()
  })

  it('muestra las características de seguridad', () => {
    renderLogin()
    expect(screen.getByText('Seguro')).toBeInTheDocument()
    expect(screen.getByText('Rápido')).toBeInTheDocument()
    expect(screen.getByText('Profesional')).toBeInTheDocument()
  })

  it('muestra el estado del servidor activo', () => {
    renderLogin()
    expect(screen.getByText('Servidor activo')).toBeInTheDocument()
  })

  it('procesa el login exitosamente con Google', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        user: {
          id: '123',
          full_name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          is_admin: true,
          is_admin_mode: true,
        },
        token: 'test-token',
      },
    })

    renderLogin()

    const googleButton = screen.getByText('Google Sign In')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/google/', {
        credential: 'test-credential',
      })
    })

    // Verificar que se guardaron los datos en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
    expect(localStorage.setItem).toHaveBeenCalledWith('user_id', '123')
    expect(localStorage.setItem).toHaveBeenCalledWith('user_name', 'Test User')
    expect(localStorage.setItem).toHaveBeenCalledWith('user_email', 'test@example.com')
    expect(localStorage.setItem).toHaveBeenCalledWith('user_role', 'admin')
    expect(localStorage.setItem).toHaveBeenCalledWith('is_admin', 'true')
    expect(localStorage.setItem).toHaveBeenCalledWith('admin_mode', 'true')
  })

  it('muestra error cuando el login falla', async () => {
    mockPost.mockRejectedValueOnce(new Error('Error de autenticación'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderLogin()

    const googleButton = screen.getByText('Google Sign In')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error al iniciar sesión. Por favor intenta de nuevo.')
    })

    consoleSpy.mockRestore()
    alertSpy.mockRestore()
  })

  it('maneja respuesta sin success: true', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Credenciales inválidas',
      },
    })

    renderLogin()

    const googleButton = screen.getByText('Google Sign In')
    fireEvent.click(googleButton)

    await waitFor(() => {
      // No debería guardar nada si success es false
      expect(localStorage.setItem).not.toHaveBeenCalledWith('token', expect.any(String))
    })
  })

  it('maneja usuario sin datos completos', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        user: {},
        token: 'test-token',
      },
    })

    renderLogin()

    const googleButton = screen.getByText('Google Sign In')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('user_id', '')
      expect(localStorage.setItem).toHaveBeenCalledWith('user_name', '')
      expect(localStorage.setItem).toHaveBeenCalledWith('user_email', '')
      expect(localStorage.setItem).toHaveBeenCalledWith('user_role', 'student')
    })
  })
})
