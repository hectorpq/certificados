// src/pages/EventoDetalle.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { colors, styles } from '../styles'

const LIMIT_CERTS = 30
const STORAGE_KEY_CERTS = 'generar_simple_count'
const LIMIT_INVITATIONS = 50
const STORAGE_KEY_INVITATIONS = 'invitaciones_count'

function LoadingSpinner() {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: colors.gold, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'rgba(240,237,232,0.6)' }}>Cargando...</span>
    </div>
  )
}

function Header({ isLoggedIn, userName, onLogout, onLogin }) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: colors.surface, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', background: 'rgba(212,163,97,0.15)', border: '1px solid rgba(212,163,97,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.25rem' }}>🎓</span>
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1rem', color: colors.text, margin: 0 }}>
          Certify<em style={{ fontStyle: 'italic', color: colors.gold }}>Pro</em>
        </p>
      </Link>
      {isLoggedIn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.6)' }}>{userName || 'Usuario'}</span>
          <button onClick={onLogout} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(240,237,232,0.6)', fontSize: '0.8125rem', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <button onClick={onLogin} style={{ padding: '0.6rem 1.25rem', background: colors.gold, color: colors.bg, border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
          Iniciar Sesión
        </button>
      )}
    </header>
  )
}

function Modal({ children, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ textAlign: 'center', background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem', maxWidth: '450px', position: 'relative', width: '100%' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'rgba(240,237,232,0.4)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem' }}>✕</button>
        {children}
      </div>
    </div>
  )
}

export default function EventoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const userName = localStorage.getItem('user_name') || ''
  const [countCerts, setCountCerts] = useState(0)
  const [countInvitations, setCountInvitations] = useState(0)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitMessage, setLimitMessage] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [event, setEvent] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('invitations')
  const [msg, setMsg] = useState('')
  const [actionError, setActionError] = useState('')
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showAppPasswordWarning, setShowAppPasswordWarning] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [certStats, setCertStats] = useState({})
  const [generatingAceptados, setGeneratingAceptados] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Template states
  const [templateImage, setTemplateImage] = useState(null)
  const [templatePreview, setTemplatePreview] = useState(null)
  const [nameX, setNameX] = useState(200)
  const [nameY, setNameY] = useState(150)
  const [fontSize, setFontSize] = useState(24)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [previewName, setPreviewName] = useState('Juan Pérez García Lardo Para Probar')
  const previewRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    
    if (!isLoggedIn) {
      const savedCerts = parseInt(localStorage.getItem(STORAGE_KEY_CERTS) || '0', 10)
      const savedInvitations = parseInt(localStorage.getItem(STORAGE_KEY_INVITATIONS) || '0', 10)
      setCountCerts(savedCerts)
      setCountInvitations(savedInvitations)
    }
    
    loadEvent()
    loadInvitations()
    loadCertificates()
  }, [id])

  // Actualizar previewName cuando cambian certificados o invitaciones
  useEffect(() => {
    if (certificates.length > 0 && certificates[0]?.student_name) {
      setPreviewName(certificates[0].student_name)
    } else if (invitations.length > 0) {
      const firstAccepted = invitations.find(i => i.status === 'accepted')
      if (firstAccepted?.student_name) {
        setPreviewName(firstAccepted.student_name)
      }
    }
  }, [certificates, invitations])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    localStorage.removeItem('is_admin')
    localStorage.removeItem('admin_mode')
    localStorage.removeItem('user_id')
    window.location.href = '/'
  }

  const loadEvent = async () => {
    try {
      const res = await api.get(`/events/${id}/`)
      setEvent(res.data)
      
      // Cargar datos de plantilla si existen
      if (res.data.template_image_url) {
        setTemplatePreview(res.data.template_image_url)
      }
      if (res.data.name_x) setNameX(res.data.name_x)
      if (res.data.name_y) setNameY(res.data.name_y)
      if (res.data.name_font_size) setFontSize(res.data.name_font_size)
      
      setError(null)
    } catch (err) {
      setError('No se pudo cargar el evento')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setActionError('Solo se permiten imágenes JPG o PNG')
      return
    }
    
    setTemplateImage(file)
    
    // Vista previa local
    const reader = new FileReader()
    reader.onload = (ev) => {
      setTemplatePreview(ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const saveTemplate = async () => {
    setSaving(true)
    setActionError('')
    setMsg('')
    
    try {
      if (!templateImage) {
        // Solo guardar coordenadas si no hay imagen nueva
        await api.patch(`/events/${id}/update_template/`, {
          name_x: nameX,
          name_y: nameY,
          name_font_size: fontSize
        })
        setMsg('✓ Posición guardada')
      } else {
        // Guardar imagen + coordenadas
        const formData = new FormData()
        formData.append('template_image', templateImage)
        formData.append('name_x', nameX)
        formData.append('name_y', nameY)
        formData.append('name_font_size', fontSize)
        
        const res = await api.post(`/events/${id}/update_template/`, formData)
        // Mantener la imagen como preview
        if (res.data.template_image_url) {
          setTemplatePreview(res.data.template_image_url)
        }
        setTemplateImage(null)
        setMsg('✓ Plantilla guardada correctamente')
      }
    } catch (err) {
      console.error('Save error:', err)
      setActionError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleMouseDown = (e) => {
    if (!templatePreview) return
    setDragging(true)
    
    const rect = previewRef.current?.getBoundingClientRect()
    if (rect) {
      const scaleX = previewRef.current.naturalWidth ? (previewRef.current.offsetWidth / previewRef.current.naturalWidth) : 1
      const scaleY = previewRef.current.naturalHeight ? (previewRef.current.offsetHeight / previewRef.current.naturalHeight) : 1
      
      setDragOffset({
        x: (e.clientX - rect.left) / scaleX - nameX,
        y: (e.clientY - rect.top) / scaleY - nameY
      })
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging || !previewRef.current) return
    
    const rect = previewRef.current.getBoundingClientRect()
    const scaleX = previewRef.current.naturalWidth ? (previewRef.current.offsetWidth / previewRef.current.naturalWidth) : 1
    const scaleY = previewRef.current.naturalHeight ? (previewRef.current.offsetHeight / previewRef.current.naturalHeight) : 1
    
    const newX = Math.max(0, Math.min((e.clientX - rect.left) / scaleX - dragOffset.x, previewRef.current.naturalWidth || 800))
    const newY = Math.max(0, Math.min((e.clientY - rect.top) / scaleY - dragOffset.y, previewRef.current.naturalHeight || 600))
    
    setNameX(Math.round(newX))
    setNameY(Math.round(newY))
  }

  const handleMouseUp = () => {
    setDragging(false)
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, dragOffset])

  const loadInvitations = async () => {
    try {
      const res = await api.get(`/events/${id}/invitations/`)
      setInvitations(res.data.invitations || [])
      setStats(res.data.stats || {})
    } catch (err) {
      console.error('Error loading invitations:', err)
    }
  }

  const loadCertificates = async () => {
    try {
      const res = await api.get(`/events/${id}/certificados/`)
      setCertificates(res.data.certificates || [])
      setCertStats(res.data.stats || {})
    } catch (err) {
      console.error('Error loading certificates:', err)
    }
  }

  const handleGenerarAceptados = async () => {
    setGeneratingAceptados(true)
    setActionError('')
    setMsg('')

    try {
      const res = await api.post(`/events/${id}/generar-aceptados/`)
      const { generated = 0, errors = [] } = res.data
      
      if (generated > 0) {
        setMsg(`✓ ${generated} certificado(s) generado(s)`)
        loadCertificates()
      } else if (errors.length > 0) {
        setActionError(errors[0])
      } else {
        setMsg('No hay certificados pendientes por generar')
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Error al generar certificados')
    } finally {
      setGeneratingAceptados(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!isLoggedIn) {
      setActionError('Debes iniciar sesión para eliminar el evento')
      return
    }
    
    setDeleting(true)
    setActionError('')
    
    try {
      await api.delete(`/events/${id}/`)
      navigate('/')
    } catch (err) {
      setActionError(err.response?.data?.error || 'No se pudo eliminar el evento')
      setDeleting(false)
    }
  }

  const handleClearInvitations = async () => {
    setClearing(true)
    setActionError('')
    
    try {
      const res = await api.post(`/events/${id}/clear_invitations/`)
      setMsg(res.data.message)
      loadInvitations()
      setShowClearModal(false)
    } catch (err) {
      setActionError(err.response?.data?.error || 'No se pudieron limpiar las invitaciones')
    } finally {
      setClearing(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getStatusIcon = (status) => {
    const icons = { pending: '○', sent: '○', accepted: '✓', declined: '✗', expired: '⏰' }
    return icons[status] || '○'
  }

  const getStatusColor = (status) => {
    const colors = { pending: '#f59e0b', sent: '#60a5fa', accepted: '#22c55e', declined: '#ef4444', expired: '#94a3b8' }
    return colors[status] || '#94a3b8'
  }

  // Subir Excel para invitaciones (funciona con y sin login)
  const handleUploadExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setActionError('')
    setMsg('')

    if (!isLoggedIn && countInvitations >= LIMIT_INVITATIONS) {
      setLimitMessage(`Ya creaste ${countInvitations} invitaciones. El límite es ${LIMIT_INVITATIONS} sin registrarte.`)
      setShowLimitModal(true)
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/events/${id}/create_invitations/`, formData)
      console.log('Upload response:', res.data)
      
      const { created = 0, skipped = 0, errors = [] } = res.data
      
      if (!isLoggedIn) {
        const newCount = countInvitations + created
        setCountInvitations(newCount)
        localStorage.setItem(STORAGE_KEY_INVITATIONS, newCount.toString())
        
        if (newCount >= LIMIT_INVITATIONS) {
          setLimitMessage(`Llegaste al límite de ${LIMIT_INVITATIONS} invitaciones gratuitas.`)
          setShowLimitModal(true)
        }
      }
      
      let msgText = `${created} invitación(es) creada(s)`
      if (skipped > 0) msgText += `, ${skipped} omitida(s)`
      if (errors && errors.length > 0) msgText += `. ${errors.length} error(es)`
      
      setMsg(msgText)
      loadInvitations()
    } catch (err) {
      console.error('Upload error:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'No se pudo subir el archivo. Verifica que el Excel tenga columnas "nombre" y "email".'
      setActionError(errorMsg)
    }
  }

  // Enviar invitaciones (funciona con y sin login)
  const handleSendInvitations = async (via = 'both') => {
    if (!isLoggedIn && invitations.length === 0) {
      setActionError('Primero sube un Excel con estudiantes')
      return
    }

    setSending(true)
    setActionError('')
    setMsg('')
    setShowAppPasswordWarning(false)

    try {
      const res = await api.post(`/events/${id}/send_invitations/`, { via })
      console.log('Send response:', res.data)
      
      const { sent_email = 0, sent_whatsapp = 0, message = '', errors = [] } = res.data
      
      let successMsg = message
      if (!successMsg && sent_email === 0 && sent_whatsapp === 0) {
        successMsg = 'No hay invitaciones para enviar'
      } else if (!successMsg) {
        successMsg = `${sent_email} email(s) y ${sent_whatsapp} WhatsApp(s) enviados`
      }
      
      if (errors && errors.length > 0) {
        successMsg += `. ${errors.length} error(es).`
      }
      
      setMsg(successMsg)
      loadInvitations()
    } catch (err) {
      console.error('Send error:', err)
      
      let errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'No se pudieron enviar las invitaciones'
      
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        errorMsg = err.response.data.errors[0]
      }
      
      if (errorMsg.includes('App Password')) {
        setShowAppPasswordWarning(true)
      }
      
      setActionError(errorMsg)
    } finally {
      setSending(false)
    }
  }

  // Reenviar invitaciones
  const handleResend = async () => {
    setSending(true)
    setActionError('')

    try {
      const res = await api.post(`/events/${id}/resend_invitations/`)
      const { sent_email = 0, sent_whatsapp = 0 } = res.data
      setMsg(`${sent_email} email(s) y ${sent_whatsapp} WhatsApp(s) reenviados`)
      loadInvitations()
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'No se pudieron reenviar las invitaciones'
      setActionError(errorMsg)
    } finally {
      setSending(false)
    }
  }

  // Generar certificados desde Excel
  const handleGenerateExcel = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setGenerating(true)
    setActionError('')
    setMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post(`/events/${id}/generar_certificados/`, formData)
      console.log('Generate response:', res.data)
      
      const { created = 0, skipped = 0, errors = [] } = res.data
      
      loadCertificates()
      
      let msgText = `✓ ${created} certificado(s) creado(s)`
      if (skipped > 0) msgText += `, ${skipped} omitido(s)`
      if (errors && errors.length > 0) msgText += `. ${errors.length} error(es)`
      
      setMsg(msgText)
    } catch (err) {
      console.error('Generate error:', err)
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'No se pudieron crear los certificados. Verifica que el Excel tenga columnas "nombre" y "email".'
      setActionError(errorMsg)
    } finally {
      setGenerating(false)
    }
  }

  // Enviar certificados
  const handleSendCertificates = async () => {
    setSending(true)
    setActionError('')

    try {
      const res = await api.post(`/events/${id}/enviar-certificados/`)
      const { sent = 0, message = '' } = res.data
      if (res.data.success) {
        setMsg(message || `${sent} certificado(s) enviado(s) por email`)
      } else {
        setActionError(res.data.message || 'Error al enviar')
      }
    } catch (err) {
      console.error('Send error:', err)
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data?.errors?.[0] || 'No se pudieron enviar los certificados'
      setActionError(errorMsg)
    } finally {
      setSending(false)
    }
  }

  const pendingCount = stats.pending || 0
  const remainingCerts = LIMIT_CERTS - countCerts
  const remainingInvitations = LIMIT_INVITATIONS - countInvitations

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg }}>
        <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} onLogin={() => navigate('/login')} />
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg }}>
        <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} onLogin={() => navigate('/login')} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: colors.text, marginBottom: '0.5rem' }}>{error}</h2>
            <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>El evento puede que no exista o hay un problema de conexión.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 1.5rem', background: colors.gold, color: colors.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                Reintentar
              </button>
              <Link to="/" style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: colors.gold, border: '1px solid #d4a361', borderRadius: '10px', textDecoration: 'none' }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <Header isLoggedIn={isLoggedIn} userName={userName} onLogout={handleLogout} onLogin={() => navigate('/login')} />

      {/* Modal de límite */}
      {showLimitModal && (
        <Modal onClose={() => setShowLimitModal(false)}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: colors.text, fontSize: '1.25rem', marginBottom: '0.75rem' }}>Límite alcanzado</h2>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>{limitMessage}</p>
          <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '0.9rem', background: colors.gold, color: colors.bg, border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
            Iniciar Sesión
          </button>
        </Modal>
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <Modal onClose={() => setShowSuccessModal(false)}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ color: '#22c55e', fontSize: '1.25rem', marginBottom: '0.75rem' }}>¡Certificados generados!</h2>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>{successMessage}</p>
          <button onClick={() => setShowSuccessModal(false)} style={{ padding: '0.75rem 1.5rem', background: colors.gold, color: colors.bg, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
            Continuar
          </button>
        </Modal>
      )}

      {/* Modal de confirmar eliminación */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#ef4444', fontSize: '1.25rem', marginBottom: '0.75rem' }}>¿Eliminar evento?</h2>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>
            Esta acción eliminará el evento y todas sus invitaciones. No se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setShowDeleteModal(false)} 
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: colors.text, cursor: 'pointer', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleDeleteEvent} 
              disabled={deleting}
              style={{ flex: 1, padding: '0.75rem', background: deleting ? '#6b7280' : '#ef4444', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600, opacity: deleting ? 0.6 : 1 }}
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal de confirmar limpiar */}
      {showClearModal && (
        <Modal onClose={() => setShowClearModal(false)}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗑️</div>
          <h2 style={{ color: '#f59e0b', fontSize: '1.25rem', marginBottom: '0.75rem' }}>¿Limpiar invitaciones?</h2>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>
            Se eliminarán todas las invitaciones pendientes y enviadas (excepto las aceptadas). Podrás subir un Excel nuevo.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setShowClearModal(false)} 
              style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: colors.text, cursor: 'pointer', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button 
              onClick={handleClearInvitations} 
              disabled={clearing}
              style={{ flex: 1, padding: '0.75rem', background: clearing ? '#6b7280' : '#f59e0b', border: 'none', borderRadius: '10px', color: colors.bg, cursor: 'pointer', fontWeight: 600, opacity: clearing ? 0.6 : 1 }}
            >
              {clearing ? 'Limpiando...' : 'Sí, limpiar'}
            </button>
          </div>
        </Modal>
      )}

      <div style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Volver */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(240,237,232,0.4)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          ← Volver a eventos
        </Link>

        {/* Info del evento */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: 0 }}>{event?.name || 'Evento'}</h1>
            {isLoggedIn && (
              <button 
                onClick={() => setShowDeleteModal(true)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'rgba(239,68,68,0.1)', 
                  border: '1px solid rgba(239,68,68,0.3)', 
                  borderRadius: '8px', 
                  color: '#ef4444', 
                  fontSize: '0.8125rem', 
                  cursor: 'pointer'
                }}
              >
                🗑️ Eliminar
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.5)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {event?.event_date && <span>📅 {formatDate(event.event_date)}</span>}
            {event?.location && <span>📍 {event.location}</span>}
            {event?.instructor_name && <span>👨‍🏫 {event.instructor_name}</span>}
          </div>
          
          {/* Barras de progreso para no logueados */}
          {!isLoggedIn && (
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(countInvitations / LIMIT_INVITATIONS) * 100}%`, height: '100%', background: '#60a5fa', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)' }}>{remainingInvitations} invitaciones</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(countCerts / LIMIT_CERTS) * 100}%`, height: '100%', background: colors.gold, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'rgba(240,237,232,0.4)' }}>{remainingCerts} certificados</span>
              </div>
            </div>
          )}
        </div>

        {/* Mensajes */}
        {msg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✓ {msg}
          </div>
        )}
        {actionError && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✕ {actionError}
          </div>
        )}
        
        {showAppPasswordWarning && (
          <div style={{ padding: '1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', color: '#f59e0b', fontSize: '0.875rem', marginBottom: '1rem' }}>
            <strong>⚠️ Configura tu App Password</strong>
            <p style={{ margin: '0.5rem 0 0' }}>Para enviar invitaciones por email necesitas configurar tu App Password una vez.</p>
            <button
              onClick={() => navigate('/perfil')}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: '#f59e0b',
                color: colors.bg,
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ir a Mi Perfil →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setTab('invitations')} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: tab === 'invitations' ? '2px solid #d4a361' : '2px solid transparent', color: tab === 'invitations' ? colors.text : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            📧 Invitaciones
          </button>
          <button onClick={() => setTab('certificates')} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', borderBottom: tab === 'certificates' ? '2px solid #d4a361' : '2px solid transparent', color: tab === 'certificates' ? colors.text : 'rgba(240,237,232,0.4)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            📜 Generar Certificados
          </button>
        </div>

        {/* Tab: Invitaciones */}
        {tab === 'invitations' && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', color: colors.text }}>
                📊 Subir Excel
                <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleUploadExcel} />
              </label>
              <button onClick={() => handleSendInvitations('both')} disabled={sending || invitations.length === 0} style={{ padding: '0.6rem 1rem', background: sending || invitations.length === 0 ? '#6b7280' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: sending || invitations.length === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 500, opacity: sending ? 0.6 : 1 }}>
                {sending ? 'Enviando...' : '📤 Enviar Todos'}
              </button>
              {pendingCount > 0 && (
                <button onClick={handleResend} disabled={sending} style={{ padding: '0.6rem 1rem', background: sending ? '#6b7280' : 'rgba(255,255,255,0.04)', color: 'rgba(240,237,232,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: sending ? 0.6 : 1 }}>
                  🔄 Reenviar ({pendingCount})
                </button>
              )}
            </div>

            {/* Botón limpiar + stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>📊 Resumen</h3>
              {invitations.length > 0 && (
                <button 
                  onClick={() => setShowClearModal(true)}
                  style={{ 
                    padding: '0.5rem 1rem', 
                    background: 'rgba(239,68,68,0.1)', 
                    border: '1px solid rgba(239,68,68,0.2)', 
                    borderRadius: '8px', 
                    color: '#ef4444', 
                    fontSize: '0.8125rem', 
                    cursor: 'pointer'
                  }}
                >
                  🗑️ Limpiar lista
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text }}>{stats.total || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Total</div>
              </div>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{stats.accepted || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Aceptados</div>
              </div>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats.pending || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Pendientes</div>
              </div>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats.declined || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Rechazados</div>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: colors.surface, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                <p style={{ color: 'rgba(240,237,232,0.4)', margin: 0 }}>No hay invitaciones</p>
                <p style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Sube un Excel para invitar estudiantes</p>
              </div>
            ) : (
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', fontWeight: 600 }}>Estado</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', fontWeight: 600 }}>Nombre</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,237,232,0.4)', fontWeight: 600 }}>Vía</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: getStatusColor(inv.status), fontSize: '0.875rem' }}>
                            {getStatusIcon(inv.status)} {inv.status_display}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: colors.text, fontSize: '0.875rem' }}>{inv.student_name}</td>
                        <td style={{ padding: '1rem', color: 'rgba(240,237,232,0.5)', fontSize: '0.875rem' }}>{inv.student_email}</td>
                        <td style={{ padding: '1rem', color: 'rgba(240,237,232,0.5)', fontSize: '0.875rem' }}>{inv.sent_via_display || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab: Certificados */}
        {tab === 'certificates' && (
          <div>
            {/* 1. Subir imagen de plantilla */}
            <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>📷 Plantilla del Certificado</h3>
              
              <label style={{ 
                display: 'block', 
                padding: '2rem', 
                background: 'rgba(255,255,255,0.03)', 
                border: '2px dashed rgba(255,255,255,0.1)', 
                borderRadius: '12px', 
                textAlign: 'center', 
                cursor: 'pointer',
                marginBottom: '1rem'
              }}>
                <input 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png" 
                  style={{ display: 'none' }} 
                  onChange={handleTemplateUpload} 
                />
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <p style={{ color: colors.text, margin: 0 }}>Subir imagen (JPG o PNG)</p>
                <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Tamaño recomendado: 1200x800px</p>
              </label>
              
              {templateImage && (
                <p style={{ color: '#22c55e', fontSize: '0.875rem' }}>✓ {templateImage.name}</p>
              )}
            </div>

            {/* 2. Vista previa con drag & drop */}
            {templatePreview && (
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '1rem' }}>🎯 Vista Previa - Arrastra el nombre</h3>
                
                {/* Preview del nombre */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)', marginBottom: '4px' }}>Nombre de prueba:</label>
                  <input
                    type="text"
                    value={previewName}
                    onChange={e => setPreviewName(e.target.value)}
                    placeholder="Escribe un nombre largo para probar..."
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: colors.text,
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                {/* Contenedor de preview */}
                <div style={{ 
                  position: 'relative', 
                  display: 'inline-block',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  cursor: dragging ? 'grabbing' : 'grab'
                }}>
                  <img 
                    ref={previewRef}
                    src={templatePreview} 
                    alt="Plantilla" 
                    style={{ 
                      maxWidth: '100%', 
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    onLoad={(e) => {
                      // Escalar para preview
                      const maxWidth = 600
                      if (e.target.naturalWidth > maxWidth) {
                        e.target.style.width = maxWidth + 'px'
                      }
                    }}
                  />
                  <div 
                    ref={nameRef}
                    onMouseDown={handleMouseDown}
                    style={{
                      position: 'absolute',
                      left: nameX,
                      top: nameY,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${fontSize}px`,
                      fontWeight: 'bold',
                      color: '#000',
                      textShadow: '0 0 2px rgba(255,255,255,0.8)',
                      cursor: dragging ? 'grabbing' : 'grab',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.3)',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {previewName}
                  </div>
                </div>
                
                {/* Controles */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.5)' }}>Tamaño:</span>
                    <button 
                      onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                      style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: colors.text, cursor: 'pointer' }}
                    >-</button>
                    <span style={{ color: colors.text, minWidth: '40px', textAlign: 'center' }}>{fontSize}px</span>
                    <button 
                      onClick={() => setFontSize(Math.min(72, fontSize + 2))}
                      style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: colors.text, cursor: 'pointer' }}
                    >+</button>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>
                    X: {nameX} | Y: {nameY}
                  </div>
                  
                  <button 
                    onClick={saveTemplate}
                    disabled={saving}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      background: saving ? '#6b7280' : '#22c55e', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      fontSize: '0.8125rem', 
                      fontWeight: 600, 
                      cursor: saving ? 'not-allowed' : 'pointer',
                      marginLeft: 'auto'
                    }}
                  >
                    {saving ? 'Guardando...' : '💾 Guardar Posición'}
                  </button>
                </div>
              </div>
            )}

            {/* Info sobre cómo funciona */}
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, margin: 0 }}>¿Cómo funciona?</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.7)', margin: 0, lineHeight: 1.6 }}>
                Los certificados se crean <strong style={{ color: '#60a5fa' }}>automáticamente</strong> cuando un invitado acepta la invitación. 
                Sube la plantilla y genera los certificados para los que ya acceptaron.
              </p>
            </div>

            {/* Stats y generar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text }}>{certStats.total || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Total</div>
              </div>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{certStats.pending || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Pendiente</div>
              </div>
              <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{certStats.generated || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)' }}>Generado</div>
              </div>
            </div>

            {/* 5. Generar certificados */}
            <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>📋 Generar Certificados</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.4)', marginBottom: '1rem' }}>
                Crea los PDFs con la plantilla subida
              </p>
              <button 
                onClick={handleGenerarAceptados} 
                disabled={generatingAceptados || (certStats.pending || 0) === 0}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  background: generatingAceptados || (certStats.pending || 0) === 0 ? '#6b7280' : '#22c55e', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: generatingAceptados || (certStats.pending || 0) === 0 ? 'not-allowed' : 'pointer', 
                  fontSize: '0.875rem', 
                  fontWeight: 600, 
                  opacity: generatingAceptados ? 0.6 : 1 
                }}
              >
                {generatingAceptados ? 'Generando...' : `✓ Generar ${certStats.pending || 0} certificado(s)`}
              </button>
            </div>

            {/* 6. Enviar certificados */}
            <div style={{ background: colors.surface, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: colors.text, marginBottom: '0.5rem' }}>✈️ Enviar Certificados por Email</h3>
              <p style={{ fontSize: '0.875rem', color: 'rgba(240,237,232,0.4)', marginBottom: '1rem' }}>
                {certStats.generated || 0} certificado(s) listo(s) para enviar con PDF adjunto
              </p>
              <button 
                onClick={handleSendCertificates} 
                disabled={sending || (certStats.generated || 0) === 0}
                style={{ 
                  padding: '0.875rem 2rem', 
                  background: sending || (certStats.generated || 0) === 0 ? '#6b7280' : '#3b82f6', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  cursor: sending || (certStats.generated || 0) === 0 ? 'not-allowed' : 'pointer', 
                  fontSize: '1rem', 
                  fontWeight: 600 
                }}
              >
                {sending ? 'Enviando...' : '📧 Enviar todos por Email'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
