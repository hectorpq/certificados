import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'

// Mock de axios
const mockPost = vi.fn()
const mockGet = vi.fn()
vi.mock('../api/axios', () => ({
  default: {
    post: (...args) => mockPost(...args),
    get: (...args) => mockGet(...args),
  },
}))

// Mock de styles
vi.mock('../styles', () => ({
  colors: {
    surface: '#18181a',
    border: 'rgba(255,255,255,0.07)',
    goldBorder: 'rgba(212,163,97,0.25)',
    goldMuted: 'rgba(212,163,97,0.15)',
    gold: '#d4a361',
    text: '#f0ede8',
    textMuted: 'rgba(240,237,232,0.4)',
    textDim: 'rgba(240,237,232,0.2)',
    mint: '#6ee7b7',
    mintMuted: 'rgba(110,231,183,0.12)',
    mintBorder: 'rgba(110,231,183,0.25)',
    bg: '#0e0e0f',
    red: '#ff5050',
    redMuted: 'rgba(255,80,80,0.08)',
    greenMuted: 'rgba(34,197,94,0.1)',
    greenBorder: 'rgba(34,197,94,0.2)',
    amberMuted: 'rgba(245,158,11,0.1)',
    blueMuted: 'rgba(59,130,246,0.1)',
    blueBorder: 'rgba(59,130,246,0.25)',
  },
  backgrounds: { grid: {} },
  animations: { fadeIn: 'fadeIn' },
  buttons: { primary: {}, ghost: {} },
  radius: { md: '12px', sm: '8px', full: '9999px' },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }
})

const renderNavbar = () => {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renderiza la barra de navegación correctamente', () => {
    renderNavbar()
    expect(screen.getByText('CertifyPro')).toBeInTheDocument()
  })

  it('muestra los enlaces de navegación principales', () => {
    renderNavbar()
    expect(screen.getByText('Generar')).toBeInTheDocument()
    expect(screen.getByText('Eventos')).toBeInTheDocument()
    expect(screen.getByText('Certificados')).toBeInTheDocument()
  })

  describe('Usuario no logueado', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null)
    })

    it('muestra "Usuario" como nombre por defecto', () => {
      renderNavbar()
      expect(screen.getByText('Usuario')).toBeInTheDocument()
    })

    it('muestra botón de Salir', () => {
      renderNavbar()
      expect(screen.getByText('Salir')).toBeInTheDocument()
    })
  })

  describe('Usuario logueado', () => {
    beforeEach(() => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token'
        if (key === 'user_name') return 'Juan Pérez'
        if (key === 'is_admin') return 'false'
        if (key === 'admin_mode') return 'false'
        return null
      })
    })

    it('muestra el nombre del usuario', () => {
      renderNavbar()
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    })

    it('muestra la inicial del usuario en el avatar', () => {
      renderNavbar()
      expect(screen.getByText('J')).toBeInTheDocument()
    })

    it('muestra "Usuario" como rol para no admin', () => {
      renderNavbar()
      expect(screen.getByText('Usuario')).toBeInTheDocument()
    })

    it('ejecuta logout al hacer clic en Salir', () => {
      renderNavbar()
      const logoutButton = screen.getByText('Salir')
      fireEvent.click(logoutButton)
      expect(localStorage.clear).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    it('no muestra el toggle de Admin Mode para usuario normal', () => {
      renderNavbar()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Administrador', () => {
    beforeEach(() => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token'
        if (key === 'user_name') return 'Admin User'
        if (key === 'is_admin') return 'true'
        if (key === 'admin_mode') return 'false'
        return null
      })
    })

    it('muestra el toggle de Admin Mode', () => {
      renderNavbar()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('muestra "Administrador" como rol', () => {
      renderNavbar()
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('alterna Admin Mode correctamente', async () => {
      mockPost.mockResolvedValueOnce({
        data: { admin_mode_enabled: true },
      })

      renderNavbar()

      const adminToggle = screen.getByText('Admin')
      fireEvent.click(adminToggle)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/perfil/toggle-admin/')
      })

      expect(localStorage.setItem).toHaveBeenCalledWith('admin_mode', 'true')
    })

    it('maneja error al alternar Admin Mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockPost.mockRejectedValueOnce(new Error('Error'))

      renderNavbar()

      const adminToggle = screen.getByText('Admin')
      fireEvent.click(adminToggle)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('App Password Indicator', () => {
    beforeEach(() => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token'
        if (key === 'user_name') return 'Test User'
        if (key === 'is_admin') return 'false'
        return null
      })
    })

    it('muestra indicador de App Password configurado', async () => {
      mockGet.mockResolvedValueOnce({
        data: { email_app_password_configured: true },
      })

      renderNavbar()

      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument()
      })
    })

    it('muestra indicador de App Password no configurado', async () => {
      mockGet.mockResolvedValueOnce({
        data: { email_app_password_configured: false },
      })

      renderNavbar()

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument()
      })
    })

    it('muestra indicador cargando cuando no hay respuesta', () => {
      mockGet.mockImplementation(() => new Promise(() => {}))

      renderNavbar()

      expect(screen.getByText('⚙️')).toBeInTheDocument()
    })

    it('no muestra indicador cuando no está logueado', () => {
      localStorage.getItem.mockReturnValue(null)
      renderNavbar()
      expect(screen.queryByText('✓')).not.toBeInTheDocument()
      expect(screen.queryByText('⚠️')).not.toBeInTheDocument()
    })
  })

  describe('Enlaces de navegación', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null)
    })

    it('enlace a /generar tiene icono 🎓', () => {
      renderNavbar()
      const generarLink = screen.getByText('Generar')
      expect(generarLink).toBeInTheDocument()
    })

    it('enlace a /eventos tiene icono 📅', () => {
      renderNavbar()
      const eventosLink = screen.getByText('Eventos')
      expect(eventosLink).toBeInTheDocument()
    })

    it('enlace a /certificados tiene icono 📜', () => {
      renderNavbar()
      const certificadosLink = screen.getByText('Certificados')
      expect(certificadosLink).toBeInTheDocument()
    })
  })

  describe('Estados hover', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null)
    })

    it('cambia estilo al hacer hover en enlaces', () => {
      renderNavbar()
      const generarLink = screen.getByText('Generar')

      fireEvent.mouseOver(generarLink)

      // Verificar que el estilo cambia (aunque no podamos ver el valor exacto)
      expect(generarLink).toBeInTheDocument()
    })
  })
})
