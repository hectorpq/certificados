import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock para react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
  }
})

// Mock para localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock para window.location
Object.defineProperty(window, 'location', {
  configurable: true,
  value: { reload: vi.fn(), assign: vi.fn() },
})

// Mock para window.alert
window.alert = vi.fn()

// Mock para console.error (silenciar errores en tests)
vi.spyOn(console, 'error').mockImplementation(() => {})
