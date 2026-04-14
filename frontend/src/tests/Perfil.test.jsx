import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Perfil from '../pages/Perfil'

// Mock de axios
const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('../api/axios', () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}))

// Mock de styles
vi.mock('../styles', () => ({
  colors: {
    bg: '#0e0e0f',
    surface: '#18181a',
    surfaceAlt: '#1e1e28',
    gold: '#d4a361',
    goldMuted: 'rgba(212,163,97,0.15)',
    goldBorder: 'rgba(212,163,97,0.25)',
    mint: '#6ee7b7',
    mintMuted: 'rgba(110,231,183,0.12)',
    mintBorder: 'rgba(110,231,183,0.25)',
    text: '#f0ede8',
    textMuted: 'rgba(240,237,232,0.4)',
    textDim: 'rgba(240,237,232,0.2)',
    border: 'rgba(255,255,255,0.07)',
    red: '#ff5050',
    redMuted: 'rgba(255,80,80,0.08)',
    green: '#22c55e',
    greenMuted: 'rgba(34,197,94,0.1)',
    greenBorder: 'rgba(34,197,94,0.2)',
    amber: '#f59e0b',
    amberMuted: 'rgba(245,158,11,0.1)',
    blue: '#60a5fa',
    blueMuted: 'rgba(59,130,246,0.1)',
    blueBorder: 'rgba(59,130,246,0.25)',
  },
  styles: {
    card: { background: 'card', padding: '1.5rem' },
    input: { background: 'input' },
    label: { fontSize: '11px' },
    btnPrimary: { background: 'primary' },
    btnGhost: { background: 'ghost' },
    alertSuccess: { background: 'success', color: 'mint' },
    alertError: { background: 'error', color: 'red' },
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderPerfil = () => {
  return render(
    <MemoryRouter>
      <Perfil />
    </MemoryRouter>
  )
}

describe('Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('redirige a login si no hay token', () => {
    localStorage.getItem.mockReturnValue(null)
    renderPerfil()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('muestra estado de carga inicialmente', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockImplementation(() => new Promise(() => {})) // Pendiente

    renderPerfil()

    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('carga y muestra la información del perfil', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        is_admin: true,
        is_admin_mode: false,
        email_app_password_configured: true,
        student_profile: {
          first_name: 'Test',
          last_name: 'User',
          document_id: '12345678',
          phone: '+51 999 999 999',
        },
        certificates: [{ id: 1 }, { id: 2 }],
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('App Password configurado')).toBeInTheDocument()
  })

  it('muestra App Password no configurado cuando corresponde', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        is_admin_mode: false,
        email_app_password_configured: false,
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('App Password no configurado')).toBeInTheDocument()
    })
  })

  it('guarda App Password correctamente', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: false,
      },
    })

    mockPost.mockResolvedValueOnce({ data: { success: true } })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('xxxx xxxx xxxx xxxx')
    fireEvent.change(input, { target: { value: 'abcd efgh ijkl mnop' } })

    const saveButton = screen.getByText('Guardar App Password')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/perfil/guardar-app-password/', {
        app_password: 'abcdefghijklmnop',
      })
    })
  })

  it('valida longitud del App Password (debe ser 16 caracteres)', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: false,
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('xxxx xxxx xxxx xxxx')
    fireEvent.change(input, { target: { value: 'short' } })

    const saveButton = screen.getByText('Guardar App Password')
    fireEvent.click(saveButton)

    expect(mockPost).not.toHaveBeenCalled()
  })

  it('prueba envío de email correctamente', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: true,
      },
    })

    mockPost.mockResolvedValueOnce({
      data: { message: 'Email de prueba enviado correctamente' },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    const testButton = screen.getByText('Probar Email')
    fireEvent.click(testButton)

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/perfil/test-email/')
    })
  })

  it('muestra error al probar email sin App Password configurado', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: false,
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    const testButton = screen.getByText('Probar Email')
    expect(testButton).toBeDisabled()
  })

  it('maneja logout correctamente', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: true,
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    })

    const logoutButton = screen.getByText('Salir')
    fireEvent.click(logoutButton)

    expect(localStorage.clear).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('muestra certificados obtenidos', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user_name') return 'Test User'
      return null
    })

    mockGet.mockResolvedValueOnce({
      data: {
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        is_admin: false,
        email_app_password_configured: true,
        student_profile: {
          first_name: 'Test',
          last_name: 'User',
          document_id: '12345678',
          phone: '+51 999 999 999',
        },
        certificates: [{ id: 1 }, { id: 2 }, { id: 3 }],
      },
    })

    renderPerfil()

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})
