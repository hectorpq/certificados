// src/pages/Login.jsx
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api/axios'
import { colors, styles } from '../theme'

export default function Login() {
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    try {
      // Enviar token al backend para validar y crear usuario
      const res = await api.post('/auth/google/', {
        credential: credentialResponse.credential
      })
      
      if (res.data.success) {
        const { user, token } = res.data
        
        // Guardar datos del usuario
        localStorage.setItem('token', token)
        localStorage.setItem('user_id', user.id || '')
        localStorage.setItem('user_name', user.full_name || '')
        localStorage.setItem('user_email', user.email || '')
        localStorage.setItem('user_role', user.role || 'student')
        localStorage.setItem('is_admin', user.is_admin ? 'true' : 'false')
        localStorage.setItem('admin_mode', user.is_admin_mode ? 'true' : 'false')
        
        console.log('Login exitoso:', user.email)
        navigate('/')
      }
    } catch (error) {
      console.error('Error al procesar token:', error.message)
      alert('Error al iniciar sesión. Por favor intenta de nuevo.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {/* Glow top */}
      <div style={{
        position: 'fixed', top: '-8rem', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(212,163,97,0.12) 0%, transparent 70%)',
      }} />
      {/* Glow bottom-left */}
      <div style={{
        position: 'fixed', bottom: '-6rem', left: '-4rem',
        width: '320px', height: '320px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(110,231,183,0.05) 0%, transparent 65%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
        <div className="cp-card" style={{ ...styles.card, padding: '2.5rem 2rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '2rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem',
              border: `1px solid ${colors.goldBorder}`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: colors.goldMuted, flexShrink: 0,
            }}>
              <svg width="18" height="18" fill="none" stroke={colors.gold} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '15px', color: colors.text, margin: '0 0 2px' }}>
                Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
              </p>
              <p style={{ fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', color: colors.textDim, margin: 0 }}>
                Sistema de certificación
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: colors.text, margin: '0 0 .3rem' }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: '.82rem', color: colors.textMuted, margin: '0 0 2rem', fontWeight: 300 }}>
            Inicia sesión con tu cuenta Google para continuar
          </p>

          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)', margin: '0 0 1.75rem' }} />

          {/* Google button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log('Error al iniciar sesión')}
              theme="filled_black"
              size="large"
              shape="rectangular"
              text="signin_with"
              locale="es"
            />
          </div>

          {/* Divider label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '11px', color: colors.textDim, letterSpacing: '.06em' }}>acceso seguro</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Status pill */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.45rem',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${colors.border}`,
              borderRadius: '999px', padding: '.3rem .85rem',
              fontSize: '11px', color: colors.textDim, letterSpacing: '.04em',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: colors.mint,
                boxShadow: '0 0 6px rgba(110,231,183,0.7)',
                flexShrink: 0, display: 'inline-block',
              }} />
              Servidor activo en localhost:8000
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}