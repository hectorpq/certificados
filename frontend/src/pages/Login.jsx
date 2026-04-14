// src/pages/Login.jsx
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api/axios'
import { colors, backgrounds, buttons, cards, typography, radius } from '../styles'

export default function Login() {
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google/', {
        credential: credentialResponse.credential
      })
      
      if (res.data.success) {
        const { user, token } = res.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user_id', user.id || '')
        localStorage.setItem('user_name', user.full_name || '')
        localStorage.setItem('user_email', user.email || '')
        localStorage.setItem('user_role', user.role || 'student')
        localStorage.setItem('is_admin', user.is_admin ? 'true' : 'false')
        localStorage.setItem('admin_mode', user.is_admin_mode ? 'true' : 'false')
        
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
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        ...backgrounds.grid,
      }} />
      
      {/* Gold Glow Top */}
      <div style={{
        position: 'fixed',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        ...backgrounds.glowGold('800px'),
        animation: 'float 8s ease-in-out infinite',
      }} />
      
      {/* Mint Glow Bottom Left */}
      <div style={{
        position: 'fixed',
        bottom: '-100px',
        left: '-80px',
        ...backgrounds.glowMint('400px'),
        animation: 'float 10s ease-in-out infinite reverse',
      }} />
      
      {/* Purple Glow Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '-50px',
        right: '-50px',
        ...backgrounds.glowPurple('300px'),
        animation: 'float 12s ease-in-out infinite',
      }} />

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%', 
        maxWidth: '440px',
        padding: '1rem',
        animation: 'slideUp 0.6s ease',
      }}>
        <div style={{
          ...cards.container,
          padding: '3rem 2.5rem',
          position: 'relative',
          overflow: 'visible',
        }}>
          {/* Decorative corner glow */}
          <div style={{
            position: 'absolute',
            top: '-1px',
            right: '-1px',
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle, ${colors.goldMuted} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '2.5rem',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${colors.gold} 0%, #b8860b 100%)`,
              border: `2px solid ${colors.goldBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 32px ${colors.goldMuted}`,
              animation: 'glow 3s ease-in-out infinite',
            }}>
              <svg width="32" height="32" fill="none" stroke={colors.bg} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontWeight: 900, 
                fontSize: '1.75rem', 
                color: colors.text, 
                margin: '0 0 0.25rem' 
              }}>
                Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
              </p>
              <p style={{ 
                fontSize: '11px', 
                letterSpacing: '.15em', 
                textTransform: 'uppercase', 
                color: colors.textDim, 
                margin: 0 
              }}>
                Sistema de certificación
              </p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ 
              ...typography.h2,
              fontSize: '1.75rem',
              marginBottom: '0.5rem',
            }}>
              Bienvenido
            </h1>
            <p style={{ 
              fontSize: '0.9rem', 
              color: colors.textMuted, 
              margin: 0 
            }}>
              Inicia sesión para continuar
            </p>
          </div>

          {/* Divider */}
          <div style={{ 
            height: '1px', 
            background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`, 
            marginBottom: '2rem' 
          }} />

          {/* Google Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '2rem',
          }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log('Error al iniciar sesión')}
              theme="filled_black"
              size="large"
              shape="rectangular"
              text="signin_with"
              locale="es"
              width="280px"
            />
          </div>

          {/* Features */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '0.5rem',
            marginBottom: '2rem',
          }}>
            {[
              { icon: '🔒', text: 'Seguro' },
              { icon: '⚡', text: 'Rápido' },
              { icon: '🎓', text: 'Profesional' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '0.75rem 0.5rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: radius.md,
                border: `1px solid ${colors.border}`,
              }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.icon}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted, letterSpacing: '0.05em' }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          {/* Divider label */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
            <span style={{ fontSize: '10px', color: colors.textDim, letterSpacing: '.1em' }}>
              ACCESO SEGURO
            </span>
            <div style={{ flex: 1, height: '1px', background: colors.border }} />
          </div>

          {/* Status */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${colors.border}`,
              borderRadius: radius.full,
              padding: '0.4rem 1rem',
              fontSize: '11px',
              color: colors.textDim,
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: colors.mint,
                boxShadow: `0 0 8px ${colors.mint}`,
                animation: 'pulse 2s infinite',
              }} />
              Servidor activo
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: colors.textDim,
          marginTop: '1.5rem',
        }}>
          © 2026 CertifyPro. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}