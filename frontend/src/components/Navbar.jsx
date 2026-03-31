import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const links = [
    { to: '/eventos', label: '🎓 Eventos' },
    { to: '/estudiantes', label: '👨‍🎓 Estudiantes' },
    { to: '/certificados', label: '📜 Certificados' },
  ]

  return (
    <nav style={{ background: '#13131a', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}
      className="px-8 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: '#3b5bdb' }}>🎓</div>
          <span className="font-bold text-white text-sm tracking-wide">CertifyPro</span>
        </div>
        {/* Links */}
        <div className="flex gap-1">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                color: location.pathname === l.to ? '#fff' : '#666',
                background: location.pathname === l.to ? 'rgba(59,91,219,0.2)' : 'transparent',
                textDecoration: 'none'
              }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <button onClick={logout}
        className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-80"
        style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', color: '#888' }}>
        Salir
      </button>
    </nav>
  )
}