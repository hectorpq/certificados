// src/pages/Eventos.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { colors, buttons, cards, inputs, alerts, radius, typography, badges } from '../styles'

const LIMIT_CERTS = 30
const LIMIT_EVENTS = 1
const STORAGE_KEY_CERTS = 'generar_simple_count'
const STORAGE_KEY_EVENTS = 'eventos_creados'
const DEFAULT_LIMIT_TYPE = 'certs'

export default function Eventos() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const userName = localStorage.getItem('user_name') || ''
  const [count, setCount] = useState(0)
  const [eventosCreados, setEventosCreados] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
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
      const savedCount = Number.parseInt(localStorage.getItem(STORAGE_KEY_CERTS) || '0', 10)
      const savedEvents = Number.parseInt(localStorage.getItem(STORAGE_KEY_EVENTS) || '0', 10)
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
    localStorage.clear()
    navigate('/')
    globalThis.location.reload()
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
  const canCreateEvent = isLoggedIn || eventosCreados < LIMIT_EVENTS

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        padding: '0.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px',
            border: `1px solid ${colors.goldBorder}`,
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${colors.goldMuted} 0%, ${colors.gold} 100%)`,
            boxShadow: `0 2px 10px ${colors.goldMuted}`,
          }}>
            <svg width="16" height="16" fill="none" stroke={colors.bg} strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" 
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700, fontSize: '1rem',
            color: colors.text,
          }}>
            Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
          </span>
        </Link>

        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg, ${colors.gold} 0%, #b8860b 100%)`, border: `1px solid ${colors.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: colors.bg }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '12px', color: colors.text, fontWeight: 500 }}>{userName}</span>
            </div>
            <button onClick={handleLogout} style={{ ...buttons.ghost, padding: '0.35rem 0.75rem', fontSize: '11px' }}>
              Salir
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} style={{ ...buttons.primary, padding: '0.5rem 1rem', fontSize: '13px' }}>
            Iniciar Sesión
          </button>
        )}
      </header>

      {/* Main Content */}
      <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Modals */}
        {showLoginModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ ...cards.container, maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
              <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: colors.textMuted, fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h2 style={{ ...typography.h3, marginBottom: '0.75rem' }}>Inicia sesión</h2>
              <p style={{ ...typography.body, marginBottom: '1.5rem' }}>Para crear y guardar tu evento, inicia sesión con tu cuenta de Google.</p>
              <button onClick={() => navigate('/login')} style={{ ...buttons.primary, width: '100%' }}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {showLimitModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ ...cards.container, maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
              <button onClick={() => setShowLimitModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: colors.textMuted, fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ ...typography.h3, marginBottom: '0.75rem' }}>Límite alcanzado</h2>
              <p style={{ ...typography.body, marginBottom: '1rem' }}>
                {DEFAULT_LIMIT_TYPE === 'certs' ? `Ya generaste ${count} certificado(s) gratuito(s). Solo puedes generar ${LIMIT_CERTS}.` : `Ya creaste ${eventosCreados} evento(s). Solo puedes crear ${LIMIT_EVENTS}.`}
              </p>
              <p style={{ ...typography.small, marginBottom: '1.5rem' }}>Inicia sesión para {DEFAULT_LIMIT_TYPE === 'certs' ? 'generar certificados' : 'crear más eventos'} de forma ilimitada.</p>
              <button onClick={() => navigate('/login')} style={{ ...buttons.primary, width: '100%' }}>
                Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Title Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ ...typography.h2, fontSize: '1.25rem', margin: 0 }}>
              Mis Eventos
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Progress bars for non-logged in */}
            {!isLoggedIn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(eventosCreados / LIMIT_EVENTS) * 100}%`, height: '100%', background: colors.blue, borderRadius: '99px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>{eventosCreados}/{LIMIT_EVENTS} eventos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${(count / LIMIT_CERTS) * 100}%`, height: '100%', background: colors.gold, borderRadius: '99px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>{remainingCerts} certs</span>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowForm(!showForm)}
              disabled={!canCreateEvent && !isLoggedIn}
              style={{
                ...buttons.primary,
                opacity: (!canCreateEvent && !isLoggedIn) ? 0.5 : 1,
                cursor: (!canCreateEvent && !isLoggedIn) ? 'not-allowed' : 'pointer',
              }}
            >
              {showForm ? '✕ Cancelar' : '+ Crear Evento'}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {msg && (
          <div style={{ ...alerts.success, marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <span style={{ fontSize: '1.2rem' }}>✓</span> {msg}
          </div>
        )}
        {error && (
          <div style={{ ...alerts.error, marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <span style={{ fontSize: '1.2rem' }}>✕</span> {error}
          </div>
        )}

        {/* Create Event Form */}
        {showForm && (
          <div style={{ ...cards.container, marginBottom: '2rem', animation: 'slideUp 0.4s ease' }}>
            <h3 style={{ ...typography.h3, fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📅</span> Nuevo Evento
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Nombre del evento *</label>
                  <input style={inputs.text} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Python Avanzado" required />
                </div>
                <div>
                  <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Instructor/Expositor</label>
                  <input style={inputs.text} value={form.instructor_name} onChange={e => setForm({ ...form, instructor_name: e.target.value })} placeholder="Nombre del expositor" />
                </div>
              </div>

              <div>
                <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Biografía del instructor</label>
                <input style={inputs.text} value={form.instructor_bio} onChange={e => setForm({ ...form, instructor_bio: e.target.value })} placeholder="Cargo, empresa, etc." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Fecha y hora *</label>
                  <input type="datetime-local" style={inputs.text} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Ubicación</label>
                  <input style={inputs.text} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lima, Perú" />
                </div>
              </div>

              <div>
                <label style={{ ...typography.label, marginBottom: '0.5rem', display: 'block' }}>Descripción</label>
                <textarea style={{ ...inputs.text, resize: 'vertical', minHeight: '80px' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe el evento..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="is_public" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: colors.gold }} />
                <label htmlFor="is_public" style={{ color: colors.text, fontSize: '0.9rem' }}>
                  Permitir inscripción pública
                </label>
              </div>

              <button type="submit" disabled={creating} style={{ ...buttons.primary, opacity: creating ? 0.5 : 1, cursor: creating ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
                {creating ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: colors.textMuted }}>
            <div className="cp-spin" style={{ width: '40px', height: '40px', border: `3px solid ${colors.border}`, borderTopColor: colors.gold, borderRadius: '50%', margin: '0 auto 1rem' }} />
            Cargando eventos...
          </div>
        ) : events.length === 0 ? (
          <div style={{ ...cards.container, textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ 
              width: '80px', height: '80px', 
              borderRadius: '50%', 
              background: colors.goldMuted, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2.5rem',
            }}>
              📅
            </div>
            <h3 style={{ ...typography.h3, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              {isLoggedIn ? 'No tienes eventos creados' : 'No hay eventos disponibles'}
            </h3>
            <p style={{ ...typography.body, margin: 0 }}>
              {isLoggedIn ? 'Crea tu primer evento para empezar' : 'Crea un evento para comenzar'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {events.map(event => (
              <Link key={event.id} to={`/eventos/${event.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  ...cards.container, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = colors.goldBorder
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: colors.text, margin: 0 }}>{event.name}</h3>
                        <span style={{ 
                          ...badges.pill, 
                          fontSize: '10px', 
                          background: event.status === 'active' ? colors.greenMuted : colors.blueMuted,
                          border: `1px solid ${event.status === 'active' ? colors.greenBorder : colors.blueBorder}`,
                          color: event.status === 'active' ? colors.green : colors.blue,
                        }}>
                          {event.status || 'active'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: colors.textMuted, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {event.event_date && <span>📅 {formatDate(event.event_date)}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                        {event.instructor_name && <span>👨‍🏫 {event.instructor_name}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: colors.textMuted }}>
                      <div style={{ marginBottom: '0.25rem' }}>📧 {event.invitations_count || 0} invitados</div>
                      <div style={{ color: colors.mint }}>✓ {event.accepted_count || 0} aceptados</div>
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