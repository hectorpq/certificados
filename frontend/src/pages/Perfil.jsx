// src/pages/Perfil.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { colors, styles } from '../styles'

export default function Perfil() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const userName = localStorage.getItem('user_name') || 'Usuario'
  
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [appPassword, setAppPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    loadPerfil()
  }, [])

  const loadPerfil = async () => {
    try {
      const res = await api.get('/perfil/')
      setPerfil(res.data)
      if (!res.data.email_app_password_configured) {
        setAppPassword('')
      }
    } catch (err) {
      console.error('Error loading perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAppPassword = async () => {
    if (appPassword.length !== 16 && appPassword.replace(/\s/g, '').length !== 16) {
      setError('El App Password debe tener 16 caracteres')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const cleanPassword = appPassword.replace(/\s/g, '')
      await api.post('/perfil/guardar-app-password/', {
        app_password: cleanPassword
      })
      setMessage('✓ App Password guardado correctamente')
      setAppPassword('')
      loadPerfil()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el App Password')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!perfil?.email_app_password_configured) {
      setError('Primero guarda un App Password válido')
      return
    }

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await api.post('/perfil/test-email/')
      setMessage(res.data.message || 'Email de prueba enviado')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar email de prueba')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (!isLoggedIn) return null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          color: colors.textMuted,
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="cp-spin" style={{ 
              width: '40px', 
              height: '40px', 
              border: `3px solid ${colors.border}`, 
              borderTopColor: colors.gold, 
              borderRadius: '50%', 
              margin: '0 auto 1rem'
            }} />
            Cargando...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header con brillo */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem',
        background: `linear-gradient(180deg, ${colors.surface} 0%, rgba(24,24,26,0.95) 100%)`,
        borderBottom: `1px solid ${colors.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Brillo decorativo */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '-50%',
          width: '200%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(212,163,97,0.3), transparent)',
          animation: 'shimmer 3s infinite',
        }} />
        
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            background: colors.goldMuted, 
            border: `1px solid ${colors.goldBorder}`, 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: `0 0 20px ${colors.goldMuted}`,
          }}>
            <span style={{ fontSize: '1.25rem' }}>🎓</span>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: colors.text, margin: 0 }}>
            Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
          </p>
        </Link>

        {/* Usuario en la derecha con diseño mejorado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              {perfil?.full_name || userName}
            </p>
            <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: 0 }}>
              {perfil?.role || 'Usuario'}
            </p>
          </div>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            background: `linear-gradient(135deg, ${colors.goldMuted} 0%, ${colors.gold} 100%)`,
            border: `2px solid ${colors.goldBorder}`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 700,
            color: colors.bg,
            boxShadow: `0 0 15px ${colors.goldMuted}`,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <button 
            onClick={handleLogout} 
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'rgba(255,255,255,0.03)', 
              border: `1px solid ${colors.border}`, 
              borderRadius: '8px', 
              color: colors.textMuted, 
              fontSize: '0.875rem', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => {
              e.target.style.background = 'rgba(255,80,80,0.1)'
              e.target.style.borderColor = colors.red
              e.target.style.color = colors.red
            }}
            onMouseOut={e => {
              e.target.style.background = 'rgba(255,255,255,0.03)'
              e.target.style.borderColor = colors.border
              e.target.style.color = colors.textMuted
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <div style={{ padding: '2.5rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        {/* Título con brillo */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: colors.text, 
            margin: 0,
            fontFamily: "'Playfair Display', serif",
          }}>
            Mi Perfil
          </h1>
          <div style={{
            width: '60px',
            height: '3px',
            background: colors.gold,
            borderRadius: '2px',
            marginTop: '0.5rem',
            boxShadow: `0 0 10px ${colors.goldMuted}`,
          }} />
        </div>

        {message && (
          <div style={{
            ...styles.alertSuccess,
            animation: 'fadeIn 0.3s ease',
          }}>
            <span style={{ fontSize: '1.2rem' }}>✓</span> {message}
          </div>
        )}
        {error && (
          <div style={{
            ...styles.alertError,
            animation: 'fadeIn 0.3s ease',
          }}>
            <span style={{ fontSize: '1.2rem' }}>✕</span> {error}
          </div>
        )}

        {/* Tarjeta de información del usuario */}
        <div style={{ 
          ...styles.card, 
          padding: '1.5rem', 
          marginBottom: '1.5rem',
          background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Brillo en la esquina */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-20%',
            width: '150px',
            height: '150px',
            background: `radial-gradient(circle, ${colors.goldMuted} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: `linear-gradient(135deg, ${colors.gold} 0%, #b8860b 100%)`,
              border: `3px solid ${colors.goldBorder}`,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.75rem', 
              color: colors.bg, 
              fontWeight: 700,
              boxShadow: `0 4px 20px ${colors.goldMuted}`,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.text, margin: '0 0 0.25rem' }}>
                {perfil?.full_name}
              </h2>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: '0 0 0.5rem' }}>
                {perfil?.email}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: perfil?.is_admin ? colors.goldMuted : colors.blueMuted,
                  border: `1px solid ${perfil?.is_admin ? colors.goldBorder : colors.blueBorder}`,
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  color: perfil?.is_admin ? colors.gold : colors.blue,
                  fontWeight: 500,
                }}>
                  {perfil?.is_admin ? 'Administrador' : 'Usuario'}
                </span>
                {perfil?.is_admin_mode && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: colors.mintMuted,
                    border: `1px solid ${colors.mintBorder}`,
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    color: colors.mint,
                    fontWeight: 500,
                  }}>
                    Modo Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de configuración de email */}
        <div style={{ 
          ...styles.card, 
          padding: '1.5rem',
          background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decoración */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle, ${colors.amberMuted} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: '1.5rem' }}>📧</span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, margin: 0 }}>
              Configuración de Email
            </h3>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
            Necesitas un App Password de Gmail para enviar invitaciones y certificados.
          </p>

          <div style={{ 
            padding: '1rem', 
            background: perfil?.email_app_password_configured ? 
              'rgba(34,197,94,0.08)' : 
              'rgba(245,158,11,0.08)', 
            borderRadius: '12px', 
            marginBottom: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            border: `1px solid ${perfil?.email_app_password_configured ? colors.greenBorder : 'rgba(245,158,11,0.25)'}`,
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: perfil?.email_app_password_configured ? colors.greenMuted : colors.amberMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}>
              {perfil?.email_app_password_configured ? '✓' : '⚠'}
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: perfil?.email_app_password_configured ? colors.mint : colors.amber, margin: 0, fontWeight: 500 }}>
                {perfil?.email_app_password_configured ? 'App Password configurado' : 'App Password no configurado'}
              </p>
              <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0' }}>
                {perfil?.email_app_password_configured ? 'Puedes enviar invitaciones' : 'Required para enviar certificados'}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem', position: 'relative', zIndex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: colors.textMuted,
              marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              App Password (16 caracteres)
            </label>
            <input
              type="text"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              maxLength={19}
              style={{ 
                ...styles.input, 
                fontFamily: "'DM Mono', monospace", 
                letterSpacing: '0.15em',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = colors.gold
                e.target.style.boxShadow = `0 0 0 3px ${colors.goldMuted}`
              }}
              onBlur={e => {
                e.target.style.borderColor = colors.border
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
            <button
              onClick={handleSaveAppPassword}
              disabled={saving || !appPassword}
              style={{ 
                ...styles.btnPrimary, 
                flex: 1,
                opacity: saving || !appPassword ? 0.5 : 1,
                transition: 'all 0.2s ease',
                cursor: saving || !appPassword ? 'not-allowed' : 'pointer',
              }}
              onMouseOver={e => {
                if (!saving && appPassword) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 25px rgba(212,163,97,0.35)'
                }
              }}
              onMouseOut={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 20px rgba(212,163,97,0.22)'
              }}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="cp-spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: colors.bg, borderRadius: '50%' }} />
                  Guardando...
                </span>
              ) : 'Guardar App Password'}
            </button>
            <button
              onClick={handleTestEmail}
              disabled={saving || !perfil?.email_app_password_configured}
              style={{ 
                ...styles.btnGhost, 
                padding: '0 1.5rem',
                opacity: saving || !perfil?.email_app_password_configured ? 0.5 : 1,
              }}
            >
              Probar Email
            </button>
          </div>
        </div>

        {/* Información adicional */}
        {perfil?.student_profile && (
          <div style={{ 
            ...styles.card, 
            padding: '1.5rem',
            marginTop: '1.5rem',
            background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, margin: 0 }}>
                Mi Información
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: colors.textDim, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nombre completo
                </p>
                <p style={{ fontSize: '0.9rem', color: colors.text, margin: 0 }}>
                  {perfil.student_profile.first_name} {perfil.student_profile.last_name}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: colors.textDim, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Documento
                </p>
                <p style={{ fontSize: '0.9rem', color: colors.text, margin: 0 }}>
                  {perfil.student_profile.document_id || 'No registrado'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: colors.textDim, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Teléfono
                </p>
                <p style={{ fontSize: '0.9rem', color: colors.text, margin: 0 }}>
                  {perfil.student_profile.phone || 'No registrado'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: colors.textDim, margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificados obtenidos
                </p>
                <p style={{ fontSize: '0.9rem', color: colors.gold, margin: 0, fontWeight: 600 }}>
                  {perfil.certificates?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos de animación globales */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}