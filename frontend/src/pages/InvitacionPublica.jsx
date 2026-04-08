// src/pages/InvitacionPublica.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'

const inp = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '12px',
  padding: '11px 14px',
  color: '#f0ede8',
  fontSize: '14px',
  outline: 'none',
  colorScheme: 'dark',
  boxSizing: 'border-box',
}

function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      background: '#18181a',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem',
          background: 'rgba(212,163,97,0.15)',
          border: '1px solid rgba(212,163,97,0.3)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🎓</span>
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: '#f0ede8', margin: 0 }}>
          Certify<em style={{ fontStyle: 'italic', color: '#d4a361' }}>Pro</em>
        </p>
      </div>
    </header>
  )
}

export default function InvitacionPublica() {
  const { token } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      const res = await api.get(`/invitation/${token}/`)
      setInvitation(res.data)
      if (res.data.student_name) {
        const parts = res.data.student_name.split(' ')
        setFirstName(parts[0] || '')
        setLastName(parts.slice(1).join(' ') || '')
      }
      if (res.data.student_email) {
        setEmail(res.data.student_email)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invitación no encontrada')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!firstName.trim()) {
      setError('Por favor ingresa tu nombre')
      return
    }
    
    setSubmitting(true)
    setError('')
    try {
      await api.post(`/invitation/${token}/accept/`, {
        first_name: firstName,
        last_name: lastName,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al aceptar invitación')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async () => {
    setSubmitting(true)
    try {
      await api.post(`/invitation/${token}/decline/`)
      setSuccess(true)
    } catch (err) {
      setError('Error al rechazar invitación')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const copyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado. Puedes pegarlo en WhatsApp, email o cualquier app.')
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ color: 'rgba(240,237,232,0.4)' }}>Cargando...</div>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>{error}</h2>
            <p style={{ color: 'rgba(240,237,232,0.4)' }}>El enlace puede haber expirado o ser inválido</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2.5rem', background: '#18181a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', maxWidth: '450px', width: '100%' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#22c55e', marginBottom: '0.5rem', fontSize: '1.5rem' }}>¡Listo!</h2>
            <p style={{ color: 'rgba(240,237,232,0.8)', marginBottom: '1.5rem' }}>
              Tu asistencia ha sido confirmada
            </p>
            <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#6ee7b7', fontSize: '0.875rem', margin: 0 }}>
                📧 Recibirás el certificado a: <strong>{email || invitation?.student_email}</strong>
              </p>
            </div>
            <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.875rem' }}>
              El certificado se enviará cuando el organizador lo genere
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (invitation?.already_accepted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
        <Header />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '2.5rem', background: '#18181a', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)', maxWidth: '450px', width: '100%' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Ya aceptaste esta invitación</h2>
            <p style={{ color: 'rgba(240,237,232,0.6)' }}>
              Tu asistencia ya fue confirmada anteriormente
            </p>
            <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.875rem', marginTop: '1rem' }}>
              📧 El certificado se enviará a: <strong>{email || invitation?.student_email}</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
      <Header />
      <div style={{ padding: '2rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
          <p style={{ color: '#d4a361', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invitación</p>
        </div>

        <div style={{ background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f0ede8', textAlign: 'center', marginBottom: '1.5rem' }}>
            {invitation?.event_name}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            {invitation?.event_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(240,237,232,0.7)' }}>
                <span style={{ fontSize: '1.25rem' }}>📅</span>
                <span>{formatDate(invitation.event_date)}</span>
              </div>
            )}
            {invitation?.event_location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(240,237,232,0.7)' }}>
                <span style={{ fontSize: '1.25rem' }}>📍</span>
                <span>{invitation.event_location}</span>
              </div>
            )}
            {invitation?.instructor_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(240,237,232,0.7)' }}>
                <span style={{ fontSize: '1.25rem' }}>👨‍🏫</span>
                <span>{invitation.instructor_name}</span>
              </div>
            )}
          </div>

          {invitation?.invitation_message && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'rgba(240,237,232,0.6)', fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.6 }}>
                {invitation.invitation_message}
              </p>
            </div>
          )}

          {invitation?.is_expired ? (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem', textAlign: 'center', color: '#ef4444' }}>
              ⏰ Esta invitación ha expirado
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                  Tu nombre *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input 
                    style={inp} 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    placeholder="Nombre" 
                  />
                  <input 
                    style={inp} 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    placeholder="Apellido" 
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                  Correo electrónico
                </label>
                <input 
                  style={{ ...inp, opacity: 0.6 }} 
                  value={email || invitation?.student_email || ''} 
                  disabled 
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {error && (
                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  ✕ {error}
                </div>
              )}

              <button
                onClick={handleAccept}
                disabled={submitting || !firstName.trim()}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: submitting || !firstName.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !firstName.trim() ? 0.5 : 1,
                  marginBottom: '0.75rem',
                }}
              >
                {submitting ? 'Procesando...' : '✓ Aceptar Invitación'}
              </button>

              <button
                onClick={handleDecline}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  color: 'rgba(240,237,232,0.4)',
                  border: 'none',
                  fontSize: '0.875rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                }}
              >
                Prefiero no asistir
              </button>

              <button
                onClick={copyLink}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(59,130,246,0.1)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  marginTop: '0.5rem',
                }}
              >
                🔗 Copiar enlace para compartir
              </button>
            </>
          )}
        </div>

        {invitation && !invitation.is_expired && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(240,237,232,0.3)' }}>
            ⏱️ Esta invitación expira en {invitation.time_until_expiry}
          </p>
        )}
      </div>
    </div>
  )
}
