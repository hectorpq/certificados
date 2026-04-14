import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Eventos from '../pages/Eventos'

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
    border: 'rgba(255,255,255,0.07)',
    gold: '#d4a361',
    goldMuted: 'rgba(212,163,97,0.15)',
    goldBorder: 'rgba(212,163,97,0.25)',
    text: '#f0ede8',
    textMuted: 'rgba(240,237,232,0.4)',
    textDim: 'rgba(240,237,232,0.2)',
    blue: '#60a5fa',
    blueMuted: 'rgba(59,130,246,0.1)',
    blueBorder: 'rgba(59,130,246,0.25)',
    green: '#22c55e',
    greenMuted: 'rgba(34,197,94,0.1)',
    greenBorder: 'rgba(34,197,94,0.2)',
    mint: '#6ee7b7',
    red: '#ff5050',
    redMuted: 'rgba(255,80,80,0.08)',
    amber: '#f59e0b',
    amberMuted: 'rgba(245,158,11,0.1)',
  },
  backgrounds: { grid: {} },
  buttons: { primary: {}, ghost: {} },
  cards: { container: { background: 'card' } },
  inputs: { text: { background: 'input' } },
  alerts: { success: {}, error: {} },
  radius: { md: '12px', full: '9999px' },
  layout: { container: {}, section: {} },
  typography: { h1: {}, h2: {}, h3: {}, body: {}, small: {}, label: {} },
  badges: { pill: { padding: '0.35rem 0.85rem' } },
  statusConfig: {},
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>,
  }
})

const renderEventos = () => {
  return render(
    <MemoryRouter>
      <Eventos />
    </MemoryRouter>
  )
}

describe('Eventos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Usuario no logueado', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(null)
    })

    it('renderiza correctamente sin estar logueado', () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()
      expect(screen.getByText('Mis Eventos')).toBeInTheDocument()
    })

    it('muestra botón de Iniciar Sesión', () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    })

    it('muestra contadores de eventos y certificados desde localStorage', () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'generar_simple_count') return '5'
        if (key === 'eventos_creados') return '0'
        return null
      })

      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      expect(screen.getByText('0/1 eventos')).toBeInTheDocument()
      expect(screen.getByText('25 certs')).toBeInTheDocument()
    })

    it('muestra modal de login al intentar crear evento sin estar logueado', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Inicia sesión')).toBeInTheDocument()
      })
    })

    it('muestra modal de límite alcanzado para eventos', async () => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'generar_simple_count') return '5'
        if (key === 'eventos_creados') return '1'
        return null
      })

      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      expect(createButton).toBeDisabled()
    })

    it('navega a /login al hacer clic en Iniciar Sesión', () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      const loginButton = screen.getByText('Iniciar Sesión')
      fireEvent.click(loginButton)

      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  describe('Usuario logueado', () => {
    beforeEach(() => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return 'test-token'
        if (key === 'user_name') return 'Test User'
        return null
      })
    })

    it('carga y muestra la lista de eventos', async () => {
      mockGet.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            name: 'Evento 1',
            event_date: '2026-05-01',
            location: 'Lima, Perú',
            instructor_name: 'Instructor 1',
            status: 'active',
            invitations_count: 10,
            accepted_count: 5,
          },
        ],
      })

      renderEventos()

      await waitFor(() => {
        expect(screen.getByText('Evento 1')).toBeInTheDocument()
      })

      expect(screen.getByText('Lima, Perú')).toBeInTheDocument()
      expect(screen.getByText('Instructor 1')).toBeInTheDocument()
    })

    it('muestra estado de carga mientras carga eventos', () => {
      mockGet.mockImplementation(() => new Promise(() => {}))
      renderEventos()

      expect(screen.getByText('Cargando eventos...')).toBeInTheDocument()
    })

    it('muestra mensaje cuando no hay eventos', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      await waitFor(() => {
        expect(screen.getByText('No tienes eventos creados')).toBeInTheDocument()
      })
    })

    it('muestra formulario de creación de eventos', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
      })

      expect(screen.getByPlaceholderText('Ej: Python Avanzado')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Nombre del expositor')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Lima, Perú')).toBeInTheDocument()
    })

    it('crea un evento exitosamente', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      mockPost.mockResolvedValueOnce({ data: { success: true } })

      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
      })

      const nombreInput = screen.getByPlaceholderText('Ej: Python Avanzado')
      fireEvent.change(nombreInput, { target: { value: 'Nuevo Evento' } })

      const fechaInput = screen.getByLabelText(/Fecha y hora/i)
      fireEvent.change(fechaInput, { target: { value: '2026-05-01T10:00' } })

      const submitButton = screen.getByText('Crear Evento')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/events/', expect.any(FormData), {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      })
    })

    it('muestra mensaje de éxito al crear evento', async () => {
      mockGet.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [] })
      mockPost.mockResolvedValueOnce({ data: { success: true } })

      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
      })

      const nombreInput = screen.getByPlaceholderText('Ej: Python Avanzado')
      fireEvent.change(nombreInput, { target: { value: 'Nuevo Evento' } })

      const fechaInput = screen.getByLabelText(/Fecha y hora/i)
      fireEvent.change(fechaInput, { target: { value: '2026-05-01T10:00' } })

      const submitButton = screen.getByText('Crear Evento')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Evento creado correctamente')).toBeInTheDocument()
      })
    })

    it('maneja error al crear evento', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      mockPost.mockRejectedValueOnce({
        response: { data: { error: 'Nombre requerido' } },
      })

      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
      })

      const nombreInput = screen.getByPlaceholderText('Ej: Python Avanzado')
      fireEvent.change(nombreInput, { target: { value: '' } })

      const fechaInput = screen.getByLabelText(/Fecha y hora/i)
      fireEvent.change(fechaInput, { target: { value: '2026-05-01T10:00' } })

      const submitButton = screen.getByText('Crear Evento')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/No se pudo crear/)).toBeInTheDocument()
      })
    })

    it('ejecuta logout correctamente', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      const logoutButton = screen.getByText('Salir')
      fireEvent.click(logoutButton)

      expect(localStorage.clear).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('formatea fechas correctamente', () => {
      mockGet.mockResolvedValueOnce({
        data: [{ id: 1, name: 'Evento', event_date: '2026-05-15T10:00:00Z' }],
      })
      renderEventos()

      // La fecha debería formatearse en español
      expect(screen.getByText(/15.*mayo.*2026/i)).toBeInTheDocument()
    })

    it('maneja checkbox is_public correctamente', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      mockPost.mockResolvedValueOnce({ data: { success: true } })

      renderEventos()

      const createButton = screen.getByText('+ Crear Evento')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Nuevo Evento')).toBeInTheDocument()
      })

      const publicCheckbox = screen.getByLabelText(/Permitir inscripción pública/i)
      fireEvent.click(publicCheckbox)

      const nombreInput = screen.getByPlaceholderText('Ej: Python Avanzado')
      fireEvent.change(nombreInput, { target: { value: 'Evento Público' } })

      const fechaInput = screen.getByLabelText(/Fecha y hora/i)
      fireEvent.change(fechaInput, { target: { value: '2026-05-01T10:00' } })

      const submitButton = screen.getByText('Crear Evento')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalled()
      })
    })
  })

  describe('Modal de límite de certificados', () => {
    beforeEach(() => {
      localStorage.getItem.mockImplementation((key) => {
        if (key === 'token') return null
        if (key === 'generar_simple_count') return '30'
        if (key === 'eventos_creados') return '0'
        return null
      })
    })

    it('muestra modal de límite de certificados', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })
      renderEventos()

      // El botón debería estar deshabilitado por límite de eventos
      const createButton = screen.getByText('+ Crear Evento')
      expect(createButton).toBeDisabled()
    })
  })
})
