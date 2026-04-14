// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { colors, backgrounds, animations, buttons, radius } from '../styles'

export default function Navbar() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const userName     = localStorage.getItem('user_name')    || 'Usuario'
  const isAdmin      = localStorage.getItem('is_admin') === 'true'
  const isLoggedIn   = !!localStorage.getItem('token')
  const [adminMode, setAdminMode] = useState(localStorage.getItem('admin_mode') === 'true')
  const [toggling, setToggling] = useState(false)
  const [appPasswordConfigured, setAppPasswordConfigured] = useState(null)

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const toggleAdminMode = async () => {
    if (!isAdmin) return
    setToggling(true)
    try {
      const res = await api.post('/perfil/toggle-admin/')
      const newMode = res.data.admin_mode_enabled
      setAdminMode(newMode)
      localStorage.setItem('admin_mode', newMode ? 'true' : 'false')
    } catch (err) {
      console.error('Error al toggle admin mode:', err)
    } finally {
      setToggling(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      api.get('/perfil/').then(res => {
        setAppPasswordConfigured(res.data.email_app_password_configured)
      }).catch(() => {})
    }
  }, [isLoggedIn])

  const links = [
    { to: '/generar',      label: 'Generar',     icon: '🎓' },
    { to: '/eventos',      label: 'Eventos',     icon: '📅' },
    { to: '/certificados', label: 'Certificados', icon: '📜' },
  ]

  return (
    <nav style={{
      background: `linear-gradient(180deg, ${colors.surface} 0%, rgba(24,24,26,0.95) 100%)`,
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Left: brand + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {/* Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px',
            border: `1px solid ${colors.goldBorder}`,
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${colors.goldMuted} 0%, ${colors.gold} 100%)`,
            boxShadow: `0 2px 12px ${colors.goldMuted}`,
          }}>
            <svg width="18" height="18" fill="none" stroke={colors.bg} strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" 
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800, fontSize: '1.1rem',
            color: colors.text, letterSpacing: '-0.02em',
          }}>
            Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {links.map(l => {
            const active = location.pathname === l.to
            return (
              <Link key={l.to} to={l.to} style={{
                padding: '0.5rem 1rem',
                borderRadius: radius.md,
                fontSize: '13px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? 600 : 500,
                color: active ? colors.gold : colors.textMuted,
                background: active ? colors.goldMuted : 'transparent',
                border: active ? `1px solid ${colors.goldBorder}` : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              onMouseOver={e => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = colors.text
                }
              }}
              onMouseOut={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.textMuted
                }
              }}
              >
                <span style={{ fontSize: '14px' }}>{l.icon}</span>
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right: user info + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Admin Mode Toggle */}
        {isAdmin && (
          <button
            onClick={toggleAdminMode}
            disabled={toggling}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: radius.md,
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${adminMode ? colors.mintBorder : colors.border}`,
              background: adminMode ? colors.mintMuted : 'rgba(255,255,255,0.03)',
              color: adminMode ? colors.mint : colors.textMuted,
              cursor: isAdmin ? 'pointer' : 'not-allowed',
              opacity: toggling ? 0.6 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
            title={adminMode ? 'Modo Admin ACTIVADO' : 'Activar modo admin'}
          >
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: adminMode ? colors.mint : colors.textDim 
            }} />
            {adminMode ? 'Admin' : 'Admin'}
          </button>
        )}

        {/* App Password Indicator */}
        {isLoggedIn && (
          <Link
            to="/perfil"
            title={appPasswordConfigured ? 'App Password configurado' : 'Configurar App Password'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: radius.md,
              fontSize: '14px',
              background: appPasswordConfigured === null ? 'rgba(255,255,255,0.03)' : 
                appPasswordConfigured ? colors.greenMuted : colors.amberMuted,
              border: `1px solid ${appPasswordConfigured === null ? colors.border : 
                appPasswordConfigured ? colors.greenBorder : 'rgba(245,158,11,0.3)'}`,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {appPasswordConfigured === null ? '⚙️' : appPasswordConfigured ? '✓' : '⚠️'}
          </Link>
        )}

        {/* User section */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
        }}>
          {/* Avatar */}
          <div style={{
            width: '32px', height: '32px', 
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.gold} 0%, #b8860b 100%)`,
            border: `2px solid ${colors.goldBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', 
            fontWeight: 700,
            color: colors.bg,
            boxShadow: `0 2px 8px ${colors.goldMuted}`,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '13px', 
              color: colors.text, 
              fontWeight: 600,
              maxWidth: '120px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
            }}>
              {userName}
            </span>
            <span style={{ 
              fontSize: '10px', 
              color: colors.textDim, 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {isAdmin ? 'Admin' : 'Usuario'}
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: colors.border, margin: '0 0.25rem' }} />

          {/* Logout */}
          <button 
            onClick={logout} 
            style={{
              padding: '0.4rem 0.75rem',
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              fontSize: '12px',
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              borderRadius: radius.sm,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => {
              e.currentTarget.style.color = colors.red
              e.currentTarget.style.background = colors.redMuted
            }}
            onMouseOut={e => {
              e.currentTarget.style.color = colors.textMuted
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  )
}