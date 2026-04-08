// src/pages/Perfil.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const colors = {
  bg: '#0e0e0f',
  surface: '#18181a',
  gold: '#d4a361',
  text: '#f0ede8',
  textMuted: 'rgba(240,237,232,0.5)',
  border: 'rgba(255,255,255,0.07)',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
}

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
            <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(212,163,97,0.15)', border: '1px solid rgba(212,163,97,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(212,163,97,0.15)', border: '1px solid rgba(212,163,97,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Info del usuario */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(212,163,97,0.15)', border: `1px solid rgba(212,163,97,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: colors.gold, fontWeight: 600 }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: colors.text, margin: 0 }}>{perfil?.full_name}</h2>
              <p style={{ fontSize: '0.875rem', color: colors.textMuted, margin: 0 }}>{perfil?.email}</p>
            </div>
          </div>
        </div>

        {/* Configuración de Email */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>📧 Configuración de Email</h3>
          <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '1rem' }}>
            Necesitas un App Password para enviar invitaciones desde tu correo.
          </p>

          {/* Estado actual */}
          <div style={{ padding: '0.75rem', background: perfil?.email_app_password_configured ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '10px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{perfil?.email_app_password_configured ? '✓' : '⚠️'}</span>
            <span style={{ fontSize: '0.875rem', color: perfil?.email_app_password_configured ? colors.success : colors.warning }}>
              {perfil?.email_app_password_configured ? 'App Password configurado' : 'App Password no configurado'}
            </span>
          </div>

          {/* Input para App Password */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, color: colors.textMuted, marginBottom: '6px' }}>
              App Password (16 caracteres)
            </label>
            <input
              type="text"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
              maxLength={19}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '11px 14px',
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
              }}
            />
          </div>

          {/* Instrucciones */}
          <details style={{ marginBottom: '1rem', color: colors.textMuted, fontSize: '0.8125rem' }}>
            <summary style={{ cursor: 'pointer', color: colors.gold }}>¿Cómo obtener el App Password?</summary>
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'left' }}>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
                <li>Ve a <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" style={{ color: colors.gold }}>myaccount.google.com/security</a></li>
                <li>Activa "Verificación en 2 pasos" (si no está)</li>
                <li>Busca "Contraseñas de aplicaciones"</li>
                <li>Selecciona "Otro" y escribe "CertifyPro"</li>
                <li>Copia el código de 16 caracteres que Google te da</li>
              </ol>
            </div>
          </details>

          {/* Mensajes */}
          {message && (
            <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '10px', color: colors.success, fontSize: '0.875rem', marginBottom: '1rem' }}>
              {message}
            </div>
          )}
          
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', color: colors.error, fontSize: '0.875rem', marginBottom: '1rem' }}>
              ✕ {error}
            </div>
          )}

          <button
            onClick={handleSaveAppPassword}
            disabled={saving || !appPassword.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: saving ? '#6b7280' : colors.gold,
              color: '#0e0e0f',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: saving || !appPassword.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !appPassword.trim() ? 0.6 : 1,
              marginBottom: '0.5rem',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar App Password'}
          </button>

          {perfil?.email_app_password_configured && (
            <button
              onClick={handleTestEmail}
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(59,130,246,0.1)',
                color: '#60a5fa',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Enviando...' : '📧 Enviar email de prueba'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
