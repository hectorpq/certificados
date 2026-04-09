import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { colors } from '../styles/theme'
import { inputStyles, headerStyles, buttonStyles, cardStyles, modalStyles, alertStyles, labelStyles, progressBarStyles, sectionTitleStyles, textStyles, statusColors } from '../styles/components'

const LIMIT_CERTS = 30
const LIMIT_EVENTS = 1
const STORAGE_KEY_CERTS = 'generar_simple_count'
const STORAGE_KEY_EVENTS = 'eventos_creados'

export default function Eventos() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const userName = localStorage.getItem('user_name') || ''
  const [count, setCount] = useState(0)
  const [eventosCreados, setEventosCreados] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitType, setLimitType] = useState('certs')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    instructor_name: '',
    instructor_bio: '',
    is_public: false,
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      const savedCount = parseInt(localStorage.getItem(STORAGE_KEY_CERTS) || '0', 10)
      const savedEvents = parseInt(localStorage.getItem(STORAGE_KEY_EVENTS) || '0', 10)
      setCount(savedCount)
      setEventosCreados(savedEvents)
    }
    loadEvents()
  }, [isLoggedIn])

  const loadEvents = async () => {
    try {
      const res = await api.get('/events/')
      const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
      setEvents(data)
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    localStorage.removeItem('is_admin')
    localStorage.removeItem('admin_mode')
    navigate('/')
    window.location.reload()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMsg('')
    setError('')
    
    if (!isLoggedIn && eventosCreados >= LIMIT_EVENTS) {
      setError(`No se pudo crear porque ya creaste ${LIMIT_EVENTS} evento(s) sin registrarte.`)
      setCreating(false)
      return
    }

    if (!isLoggedIn) {
      setShowLoginModal(true)
      setCreating(false)
      return
    }

    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'is_public') {
          data.append(k, v ? 'true' : 'false')
        } else {
          data.append(k, v || '')
        }
      })
      await api.post('/events/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg('Evento creado correctamente')
      setForm({ name: '', description: '', event_date: '', end_date: '', location: '', instructor_name: '', instructor_bio: '', is_public: false })
      setShowForm(false)
      loadEvents()
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.detail
      if (errorMsg) {
        setError(`No se pudo crear porque: ${errorMsg}`)
      } else {
        setError('No se pudo crear el evento. Intenta de nuevo.')
      }
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const remainingCerts = LIMIT_CERTS - count
  const remainingEvents = LIMIT_EVENTS - eventosCreados
  const canCreateEvent = isLoggedIn || eventosCreados < LIMIT_EVENTS

  return (
    <div style={{ minHeight: '100vh', background: colors.dark }}>
      <header style={headerStyles.container}>
        <div style={headerStyles.logo}>
          <div style={headerStyles.logoIcon}>
            <span style={{ fontSize: '1.25rem' }}>🎓</span>
          </div>
          <div>
            <p style={headerStyles.logoText}>
              Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
            </p>
          </div>
        </div>

        {isLoggedIn ? (
          <div style={headerStyles.userInfo}>
            <span style={headerStyles.userName}>
              {userName || 'Usuario'}
            </span>
            <button onClick={handleLogout} style={headerStyles.logoutButton}>
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} style={headerStyles.loginButton}>
            Iniciar Sesión
          </button>
        )}
      </header>

      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {showLoginModal && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
              <button onClick={() => setShowLoginModal(false)} style={modalStyles.closeButton}>✕</button>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
              <h2 style={{ color: textStyles.light, fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                Para guardar tu evento, inicia sesión
              </h2>
              <p style={{ color: textStyles.muted, marginBottom: '1.5rem' }}>
                Inicia sesión con tu cuenta de Google para poder crear y guardar tu evento.
              </p>
              <button onClick={() => navigate('/login')} style={buttonStyles.submit}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {showLimitModal && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.content}>
              <button onClick={() => setShowLimitModal(false)} style={modalStyles.closeButton}>✕</button>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ color: textStyles.light, fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                {limitType === 'certs' ? 'Límite de certificados alcanzado' : 'Límite de eventos alcanzado'}
              </h2>
              <p style={{ color: textStyles.muted, marginBottom: '1.5rem' }}>
                {limitType === 'certs' 
                  ? `Ya generaste ${count} certificado(s) gratuito(s). Solo puedes generar ${LIMIT_CERTS}.`
                  : `Ya creaste ${eventosCreados} evento(s) sin registrarte. Solo puedes crear ${LIMIT_EVENTS}.`
                }
              </p>
              <p style={{ color: textStyles.muted, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Inicia sesión para {limitType === 'certs' ? 'generar certificados' : 'crear más eventos'} de forma ilimitada
              </p>
              <button onClick={() => navigate('/login')} style={buttonStyles.submit}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: textStyles.light, margin: 0 }}>Mis Eventos</h1>
            <p style={{ fontSize: '0.875rem', color: textStyles.muted, margin: '0.25rem 0 0' }}>Crea y gestiona tus eventos</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {!isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={progressBarStyles.container}>
                    <div style={{ width: `${(eventosCreados / LIMIT_EVENTS) * 100}%`, height: '100%', background: statusColors.draft, transition: 'width 0.3s' }} />
                  </div>
                  <span style={progressBarStyles.label}>{eventosCreados}/{LIMIT_EVENTS} eventos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={progressBarStyles.container}>
                    <div style={{ width: `${(count / LIMIT_CERTS) * 100}%`, height: '100%', background: colors.gold, transition: 'width 0.3s' }} />
                  </div>
                  <span style={progressBarStyles.label}>{remainingCerts} certs</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={!canCreateEvent && !isLoggedIn}
              style={canCreateEvent || isLoggedIn ? buttonStyles.primary : buttonStyles.primaryDisabled}
            >
              {showForm ? '✕ Cancelar' : '+ Crear Evento'}
            </button>
          </div>
        </div>

        {msg && <div style={alertStyles.success}>✓ {msg}</div>}
        {error && <div style={alertStyles.error}>✕ {error}</div>}

        {showForm && (
          <div style={{ ...cardStyles.container, marginBottom: '1.5rem' }}>
            <h2 style={sectionTitleStyles}>Nuevo Evento</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyles.required}>Nombre del evento *</label>
                  <input style={inputStyles} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Python Avanzado" required />
                </div>
                <div>
                  <label style={labelStyles.required}>Instructor/Expositor</label>
                  <input style={inputStyles} value={form.instructor_name} onChange={e => setForm({ ...form, instructor_name: e.target.value })} placeholder="Nombre del expositor" />
                </div>
              </div>

              <div>
                <label style={labelStyles.required}>Biografía del instructor</label>
                <input style={inputStyles} value={form.instructor_bio} onChange={e => setForm({ ...form, instructor_bio: e.target.value })} placeholder="Cargo, empresa, etc." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyles.required}>Fecha y hora *</label>
                  <input type="datetime-local" style={inputStyles} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyles.required}>Ubicación</label>
                  <input style={inputStyles} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lima, Perú" />
                </div>
              </div>

              <div>
                <label style={labelStyles.required}>Descripción</label>
                <textarea style={{ ...inputStyles, resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe el evento..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="is_public" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: colors.gold }} />
                <label htmlFor="is_public" style={{ color: textStyles.light, fontSize: '0.875rem' }}>
                  Permitir inscripción pública
                </label>
              </div>

              <button type="submit" disabled={creating} style={{ ...buttonStyles.submit, opacity: creating ? 0.5 : 1, cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: textStyles.muted }}>Cargando...</div>
        ) : events.length === 0 ? (
          <div style={{ ...cardStyles.container, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <p style={{ color: textStyles.muted, margin: 0 }}>
              {isLoggedIn ? 'No tienes eventos creados' : 'No hay eventos disponibles'}
            </p>
            <p style={{ color: textStyles.muted, fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {isLoggedIn ? 'Crea tu primer evento para empezar' : 'Crea un evento para comenzar'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {events.map(event => (
              <Link key={event.id} to={`/eventos/${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={cardStyles.container}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: textStyles.light, margin: 0 }}>{event.name}</h3>
                        <span style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem', background: `${statusColors[event.status] || statusColors.finished}20`, color: statusColors[event.status] || statusColors.finished, borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {event.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: textStyles.lightMuted, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {event.event_date && <span>📅 {formatDate(event.event_date)}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                        {event.instructor_name && <span>👨‍🏫 {event.instructor_name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: textStyles.muted }}>
                      <div style={{ marginBottom: '0.25rem' }}>📧 {event.invitations_count || 0} invitados</div>
                      <div style={{ color: statusColors.active }}>✓ {event.accepted_count || 0} aceptados</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}