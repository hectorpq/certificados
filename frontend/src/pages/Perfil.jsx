// src/pages/Perfil.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { colors, styles } from '../theme'

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
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', background: colors.goldMuted, border: `1px solid ${colors.goldBorder}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.25rem' }}>🎓</span>
            </div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: colors.text, margin: 0 }}>
              Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
            </p>
          </Link>
        </header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', color: colors.textMuted }}>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', background: colors.goldMuted, border: `1px solid ${colors.goldBorder}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.25rem' }}>🎓</span>
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: colors.text, margin: 0 }}>
            Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
          </p>
        </Link>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.textMuted, fontSize: '0.875rem', cursor: 'pointer' }}>
          Cerrar Sesión
        </button>
      </header>

      <div style={{ padding: '2rem 1.5rem', maxWidth: '600px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: colors.textMuted, textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          ← Volver
        </Link>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, marginBottom: '2rem' }}>Mi Perfil</h1>

        {message && <div style={styles.alertSuccess}>✓ {message}</div>}
        {error && <div style={styles.alertError}>✕ {error}</div>}

        <div style={{ ...styles.card, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: colors.goldMuted, border: `1px solid ${colors.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: colors.gold, fontWeight: 600 }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, margin: 0 }}>{perfil?.full_name}</h2>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0 }}>{perfil?.email}</p>
            </div>
          </div>
        </div>

        <div style={{ ...styles.card, padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>📧 Configuración de Email</h3>
          <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '1rem' }}>
            Necesitas un App Password para enviar invitaciones desde tu correo.
          </p>

          <div style={{ padding: '0.75rem', background: perfil?.email_app_password_configured ? colors.greenMuted : colors.amberMuted, borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{perfil?.email_app_password_configured ? '✓' : '⚠️'}</span>
            <span style={{ fontSize: '0.875rem', color: perfil?.email_app_password_configured ? colors.mint : colors.amber }}>
              {perfil?.email_app_password_configured ? 'App Password configurado' : 'App Password no configurado'}
            </span>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>
              App Password (16 caracteres)
            </label>
            <input
              type="text"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              maxLength={19}
              style={{ ...styles.input, fontFamily: 'monospace', letterSpacing: '0.1em' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSaveAppPassword}
              disabled={saving || !appPassword}
              style={{ ...styles.btnPrimary, flex: 1 }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleTestEmail}
              disabled={saving || !perfil?.email_app_password_configured}
              style={{ ...styles.btnGhost, padding: '0 1.25rem' }}
            >
              Probar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}