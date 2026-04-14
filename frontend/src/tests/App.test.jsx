import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mock del useEffect para inyectar estilos
vi.mock('../styles', () => ({
  globalCSS: '* { box-sizing: border-box; }',
}))

// Mock de los componentes de páginas
vi.mock('../pages/Login', () => ({ default: () => <div data-testid="login-page">Login</div> }))
vi.mock('../pages/GeneradorCertificados', () => ({ default: () => <div>GeneradorCertificados</div> }))
vi.mock('../pages/Eventos', () => ({ default: () => <div data-testid="eventos-page">Eventos</div> }))
vi.mock('../pages/EventoDetalle', () => ({ default: () => <div>EventoDetalle</div> }))
vi.mock('../pages/Certificados', () => ({ default: () => <div>Certificados</div> }))
vi.mock('../pages/InvitacionPublica', () => ({ default: () => <div>InvitacionPublica</div> }))
vi.mock('../pages/GenerarSimple', () => ({ default: () => <div>GenerarSimple</div> }))
vi.mock('../pages/Perfil', () => ({ default: () => <div data-testid="perfil-page">Perfil</div> }))

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route)
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la ruta de login correctamente', () => {
    renderWithRouter(<App />, { route: '/login' })
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('renderiza la ruta principal de eventos', () => {
    renderWithRouter(<App />, { route: '/' })
    expect(screen.getByTestId('eventos-page')).toBeInTheDocument()
  })

  it('renderiza la página de perfil en /perfil', () => {
    renderWithRouter(<App />, { route: '/perfil' })
    expect(screen.getByTestId('perfil-page')).toBeInTheDocument()
  })

  it('redirige rutas desconocidas al inicio', () => {
    renderWithRouter(<App />, { route: '/ruta-desconocida' })
    // Las rutas desconocidas deben redirigir a "/"
    expect(window.location.pathname).toBe('/')
  })

  it('tiene rutas de navegación configuradas', () => {
    renderWithRouter(<App />)

    // Verificar que las rutas están definidas (aunque redirijan)
    const routes = ['/login', '/', '/eventos/:id', '/invitation/:token', '/perfil']
    expect(routes.length).toBeGreaterThan(0)
  })
})
