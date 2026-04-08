// src/pages/Eventos.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const LIMIT_CERTS = 30
const LIMIT_EVENTS = 1
const STORAGE_KEY_CERTS = 'generar_simple_count'
const STORAGE_KEY_EVENTS = 'eventos_creados'

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

  const getStatusColor = (status) => {
    const colors = { draft: '#f59e0b', active: '#22c55e', finished: '#94a3b8', cancelled: '#ef4444' }
    return colors[status] || '#94a3b8'
  }

  const remainingCerts = LIMIT_CERTS - count
  const remainingEvents = LIMIT_EVENTS - eventosCreados
  const canCreateEvent = isLoggedIn || eventosCreados < LIMIT_EVENTS

  return (
    <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
      {/* Header siempre visible */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
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
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: '#f0ede8', margin: 0 }}>
              Certify<em style={{ fontStyle: 'italic', color: '#d4a361' }}>Pro</em>
            </p>
          </div>
        </div>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.6)' }}>
              {userName || 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'rgba(240,237,232,0.6)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '0.6rem 1.25rem',
              background: '#d4a361',
              color: '#0e0e0f',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Iniciar Sesión
          </button>
        )}
      </header>

      {/* Contenido principal */}
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Modal de login */}
        {showLoginModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}>
            <div style={{ textAlign: 'center', background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem', maxWidth: '400px', position: 'relative' }}>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'transparent', border: 'none', color: 'rgba(240,237,232,0.4)',
                  fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem'
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
              <h2 style={{ color: '#f0ede8', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                Para guardar tu evento, inicia sesión
              </h2>
              <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>
                Inicia sesión con tu cuenta de Google para poder crear y guardar tu evento.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#d4a361',
                  color: '#0e0e0f',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Modal de límite */}
        {showLimitModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}>
            <div style={{ textAlign: 'center', background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem', maxWidth: '400px', position: 'relative' }}>
              <button
                onClick={() => setShowLimitModal(false)}
                style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'transparent', border: 'none', color: 'rgba(240,237,232,0.4)',
                  fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem'
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ color: '#f0ede8', fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                {limitType === 'certs' ? 'Límite de certificados alcanzado' : 'Límite de eventos alcanzado'}
              </h2>
              <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>
                {limitType === 'certs' 
                  ? `Ya generaste ${count} certificado(s) gratuito(s). Solo puedes generar ${LIMIT_CERTS}.`
                  : `Ya creaste ${eventosCreados} evento(s) sin registrarte. Solo puedes crear ${LIMIT_EVENTS}.`
                }
              </p>
              <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Inicia sesión para {limitType === 'certs' ? 'generar certificados' : 'crear más eventos'} de forma ilimitada
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#d4a361',
                  color: '#0e0e0f',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Título y acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f0ede8', margin: 0 }}>Mis Eventos</h1>
            <p style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.4)', margin: '0.25rem 0 0' }}>Crea y gestiona tus eventos</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {!isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(eventosCreados / LIMIT_EVENTS) * 100}%`, height: '100%', background: '#f59e0b', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)' }}>
                    {eventosCreados}/{LIMIT_EVENTS} eventos
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / LIMIT_CERTS) * 100}%`, height: '100%', background: '#d4a361', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)' }}>
                    {remainingCerts} certs
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={!canCreateEvent && !isLoggedIn}
              style={{
                padding: '0.6rem 1.2rem',
                background: canCreateEvent || isLoggedIn ? '#d4a361' : 'rgba(212,163,97,0.3)',
                color: '#0e0e0f',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: canCreateEvent || isLoggedIn ? 'pointer' : 'not-allowed',
              }}
            >
              {showForm ? '✕ Cancelar' : '+ Crear Evento'}
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {msg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✓ {msg}
          </div>
        )}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '12px', color: 'rgba(255,150,150,.9)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✕ {error}
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div style={{ background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f0ede8', marginBottom: '1.5rem' }}>Nuevo Evento</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                    Nombre del evento *
                  </label>
                  <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Python Avanzado" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                    Instructor/Expositor
                  </label>
                  <input style={inp} value={form.instructor_name} onChange={e => setForm({ ...form, instructor_name: e.target.value })} placeholder="Nombre del expositor" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                  Biografía del instructor
                </label>
                <input style={inp} value={form.instructor_bio} onChange={e => setForm({ ...form, instructor_bio: e.target.value })} placeholder="Cargo, empresa, etc." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                    Fecha y hora *
                  </label>
                  <input type="datetime-local" style={inp} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                    Ubicación
                  </label>
                  <input style={inp} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lima, Perú" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
                  Descripción
                </label>
                <textarea style={{ ...inp, resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe el evento..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="is_public" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#d4a361' }} />
                <label htmlFor="is_public" style={{ color: '#f0ede8', fontSize: '0.875rem' }}>
                  Permitir inscripción pública
                </label>
              </div>

              <button type="submit" disabled={creating} style={{ width: '100%', padding: '0.9rem', background: '#d4a361', color: '#0e0e0f', border: 'none', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.5 : 1 }}>
                {creating ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          </div>
        )}

        {/* Lista de eventos */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,237,232,0.4)' }}>Cargando...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#18181a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <p style={{ color: 'rgba(240,237,232,0.4)', margin: 0 }}>
              {isLoggedIn ? 'No tienes eventos creados' : 'No hay eventos disponibles'}
            </p>
            <p style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {isLoggedIn ? 'Crea tu primer evento para empezar' : 'Crea un evento para comenzar'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {events.map(event => (
              <Link key={event.id} to={`/eventos/${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.25rem', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(212,163,97,0.25)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f0ede8', margin: 0 }}>{event.name}</h3>
                        <span style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem', background: `${getStatusColor(event.status)}20`, color: getStatusColor(event.status), borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                          {event.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'rgba(240,237,232,0.5)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {event.event_date && <span>📅 {formatDate(event.event_date)}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                        {event.instructor_name && <span>👨‍🏫 {event.instructor_name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>
                      <div style={{ marginBottom: '0.25rem' }}>📧 {event.invitations_count || 0} invitados</div>
                      <div style={{ color: '#22c55e' }}>✓ {event.accepted_count || 0} aceptados</div>
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
