// src/pages/InvitacionPublica.jsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { colors, styles } from '../styles'


function Header() {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '2.5rem', height: '2.5rem',
          background: colors.goldMuted,
          border: `1px solid ${colors.goldBorder}`,
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🎓</span>
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: colors.text, margin: 0 }}>
          Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
        </p>
      </div>
    </header>
  )
}


function LoadingView() {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ color: colors.textMuted }}>Cargando...</div>
      </div>
    </div>
  )
}


function ErrorView({ error }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: colors.red, marginBottom: '0.5rem' }}>{error}</h2>
          <p style={{ color: colors.textMuted }}>El enlace puede haber expirado o ser inválido</p>
        </div>
      </div>
    </div>
  )
}


function SuccessView({ email }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '2.5rem', maxWidth: '450px', width: '100%' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: colors.green, marginBottom: '0.5rem', fontSize: '1.5rem' }}>¡Listo!</h2>
          <p style={{ color: colors.text, marginBottom: '1.5rem' }}>
            Tu asistencia ha sido confirmada
          </p>
          <div style={{ background: colors.greenMuted, borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ color: colors.mint, fontSize: '0.875rem', margin: 0 }}>
              📧 Recibirás el certificado a: <strong>{email}</strong>
            </p>
          </div>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
            El certificado se enviará cuando el organizador lo genere
          </p>
        </div>
      </div>
    </div>
  )
}


function AlreadyAcceptedView({ email }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '2.5rem', maxWidth: '450px', width: '100%' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
          <h2 style={{ color: colors.amber, marginBottom: '0.5rem', fontSize: '1.25rem' }}>Ya aceptaste esta invitación</h2>
          <p style={{ color: colors.textMuted }}>
            Tu asistencia ya fue confirmada anteriormente
          </p>
          <p style={{ color: colors.textMuted, fontSize: '0.875rem', marginTop: '1rem' }}>
            📧 El certificado se enviará a: <strong>{email}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}


function EventDetails({ invitation, formatDate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
      {invitation?.event_date && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: colors.textMuted }}>
          <span style={{ fontSize: '1.25rem' }}>📅</span>
          <span>{formatDate(invitation.event_date)}</span>
        </div>
      )}
      {invitation?.event_location && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: colors.textMuted }}>
          <span style={{ fontSize: '1.25rem' }}>📍</span>
          <span>{invitation.event_location}</span>
        </div>
      )}
      {invitation?.instructor_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: colors.textMuted }}>
          <span style={{ fontSize: '1.25rem' }}>👨‍🏫</span>
          <span>{invitation.instructor_name}</span>
        </div>
      )}
    </div>
  )
}


function InvitationForm({ firstName, lastName, email, error, submitting, onFirstNameChange, onLastNameChange, onAccept, onDecline, onCopyLink, isExpired }) {
  const canSubmit = submitting || !firstName.trim()
  
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>
          Tu nombre *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <input 
            style={styles.input}
            value={firstName} 
            onChange={e => onFirstNameChange(e.target.value)} 
            placeholder="Nombre" 
          />
          <input 
            style={styles.input}
            value={lastName} 
            onChange={e => onLastNameChange(e.target.value)} 
            placeholder="Apellido" 
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={styles.label}>
          Correo electrónico
        </label>
        <input 
          style={{ ...styles.input, opacity: 0.6 }} 
          value={email} 
          disabled 
          placeholder="correo@ejemplo.com"
        />
      </div>

      {error && (
        <div style={{ ...styles.alertError, marginBottom: '1rem' }}>
          ✕ {error}
        </div>
      )}

      <button
        onClick={onAccept}
        disabled={canSubmit}
        style={{
          ...styles.btnPrimary,
          background: colors.green,
          marginBottom: '0.75rem',
          opacity: canSubmit ? 0.5 : 1,
          cursor: canSubmit ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Procesando...' : '✓ Aceptar Invitación'}
      </button>

      <button
        onClick={onDecline}
        disabled={submitting}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'transparent',
          color: colors.textMuted,
          border: 'none',
          fontSize: '0.875rem',
          cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.5 : 1,
        }}
      >
        Prefiero no asistir
      </button>

      <button
        onClick={onCopyLink}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: colors.blueMuted,
          color: colors.blue,
          border: `1px solid ${colors.blueBorder}`,
          borderRadius: '12px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          marginTop: '0.5rem',
        }}
      >
        🔗 Copiar enlace para compartir
      </button>
    </>
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
    const url = globalThis.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado. Puedes pegarlo en WhatsApp, email o cualquier app.')
    })
  }

  if (loading) return <LoadingView />

  if (error && !invitation) return <ErrorView error={error} />

  const displayEmail = email || invitation?.student_email

  if (success) return <SuccessView email={displayEmail} />

  if (invitation?.already_accepted) return <AlreadyAcceptedView email={displayEmail} />

  const isExpired = invitation?.is_expired
  const displayEventDetails = (
    <EventDetails invitation={invitation} formatDate={formatDate} />
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header />
      <div style={{ padding: '2rem 1rem', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎓</div>
          <p style={{ color: colors.gold, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Invitación</p>
        </div>

        <div style={{ ...styles.card, padding: '2rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, textAlign: 'center', marginBottom: '1.5rem' }}>
            {invitation?.event_name}
          </h1>

          {displayEventDetails}

          {invitation?.invitation_message && (
            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.6 }}>
                {invitation.invitation_message}
              </p>
            </div>
          )}

          {isExpired ? (
            <div style={{ background: colors.redMuted, border: `1px solid ${colors.redBorder}`, borderRadius: '12px', padding: '1rem', textAlign: 'center', color: colors.red }}>
              ⏰ Esta invitación ha expirado
            </div>
          ) : (
            <InvitationForm
              firstName={firstName}
              lastName={lastName}
              email={displayEmail}
              error={error}
              submitting={submitting}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCopyLink={copyLink}
              isExpired={isExpired}
            />
          )}
        </div>

        {invitation && !isExpired && (
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: colors.textDim }}>
            ⏱️ Esta invitación expira en {invitation.time_until_expiry}
          </p>
        )}
      </div>
    </div>
  )
}