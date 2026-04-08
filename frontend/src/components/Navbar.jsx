// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { colors, styles } from '../theme'

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
    { to: '/generar',      label: '🎓 Generar'     },
    { to: '/eventos',      label: '📅 Eventos'     },
    { to: '/certificados', label: '📜 Certificados'},
  ]

  return (
    <nav style={{
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>

      {/* Left: brand + links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div style={{
            width: '28px', height: '28px',
            border: `1px solid ${colors.goldBorder}`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: colors.goldMuted,
          }}>
            <svg width="14" height="14" fill="none" stroke={colors.gold} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700, fontSize: '15px',
            color: colors.text, letterSpacing: '-.01em',
          }}>
            Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {links.map(l => {
            const active = location.pathname === l.to
            return (
              <Link key={l.to} to={l.to} style={{
                padding: '.4rem .85rem',
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? 600 : 400,
                color: active ? colors.text : colors.textMuted,
                background: active ? colors.goldMuted : 'transparent',
                border: active ? `1px solid ${colors.goldBorder}` : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all .15s',
              }}>
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right: user info + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>

        {/* Admin Mode Toggle */}
        {isAdmin && (
          <button
            onClick={toggleAdminMode}
            disabled={toggling}
            style={{
              padding: '.3rem .7rem',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              border: `1px solid ${adminMode ? colors.mintBorder : colors.border}`,
              background: adminMode ? colors.mintMuted : 'transparent',
              color: adminMode ? colors.mint : colors.textMuted,
              cursor: isAdmin ? 'pointer' : 'not-allowed',
              opacity: toggling ? 0.6 : 1,
              transition: 'all .2s',
            }}
            title={adminMode ? 'Modo Admin ACTIVADO' : 'Modo Admin desactivado'}
          >
            {adminMode ? '✓ Admin' : 'Admin'}
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
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              fontSize: '14px',
              background: appPasswordConfigured === null ? 'transparent' : appPasswordConfigured ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
              border: `1px solid ${appPasswordConfigured === null ? colors.border : appPasswordConfigured ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
              textDecoration: 'none',
            }}
          >
            {appPasswordConfigured === null ? '⚙️' : appPasswordConfigured ? '✓' : '⚠️'}
          </Link>
        )}

        {/* Avatar */}
        {userPicture ? (
          <img
            src={userPicture}
            alt={userName}
            style={{
              width: '30px', height: '30px',
              borderRadius: '50%', objectFit: 'cover',
              border: `1px solid ${colors.goldBorder}`,
            }}
          />
        ) : (
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: colors.goldMuted, border: `1px solid ${colors.goldBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: colors.gold, fontWeight: 600,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Name */}
        <span style={{ fontSize: '13px', color: colors.textMuted, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName}
        </span>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: colors.border }} />

        {/* Logout */}
        <button onClick={logout} className="cp-btn-ghost" style={styles.btnGhost}>
          Salir
        </button>
      </div>
    </nav>
  )
}