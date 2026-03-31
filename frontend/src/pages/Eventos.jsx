// frontend/src/pages/Eventos.jsx

import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'

// ─── Estilos base ────────────────────────────────────────────────────────────

const input = {
  width: '100%',
  background: '#0d0d14',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#e8e8f0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
}

const card = {
  background: '#13131c',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px',
  padding: '24px',
  transition: 'border-color 0.2s, transform 0.15s',
}

const btn = (color = '#3b5bdb') => ({
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s, transform 0.1s',
  letterSpacing: '0.02em',
})

const label = {
  display: 'block',
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#555',
  marginBottom: '8px',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Eventos() {
  // Lista de eventos
  const [eventos, setEventos] = useState([])
  const [loadingEventos, setLoadingEventos] = useState(false)

  // Modal crear evento
  const [showCrear, setShowCrear] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', event_date: '', location: '', description: '' })
  const [loadingCrear, setLoadingCrear] = useState(false)
  const [msgCrear, setMsgCrear] = useState('')
  const [errCrear, setErrCrear] = useState('')

  // Modal template
  const [showTemplate, setShowTemplate] = useState(false)
  const [eventoSel, setEventoSel] = useState(null)
  const [imagen, setImagen] = useState(null)
  const [nombreTemplate, setNombreTemplate] = useState('')
  const [coords, setCoords] = useState({ x: 200, y: 300 })
  const [fontSize, setFontSize] = useState(32)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [msgTemplate, setMsgTemplate] = useState('')

  const canvasRef = useRef(null)
  const imgRef = useRef(null)

  // ── Cargar eventos ──────────────────────────────────────────────────────────

  useEffect(() => { cargarEventos() }, [])

  const cargarEventos = async () => {
    setLoadingEventos(true)
    try {
      const res = await api.get('/eventos/')
      setEventos(res.data)
    } catch (e) {
      console.error('Error cargando eventos:', e)
    } finally {
      setLoadingEventos(false)
    }
  }

  // ── Crear evento ────────────────────────────────────────────────────────────

  const handleCrear = async (e) => {
    e.preventDefault()
    setLoadingCrear(true); setMsgCrear(''); setErrCrear('')
    try {
      await api.post('/events/', form)
      setMsgCrear('Evento creado correctamente')
      setForm({ name: '', category: '', event_date: '', location: '', description: '' })
      cargarEventos()
      setTimeout(() => setShowCrear(false), 1200)
    } catch {
      setErrCrear('Error al crear el evento. Verifica los datos.')
    } finally {
      setLoadingCrear(false)
    }
  }

  // ── Editor de template ──────────────────────────────────────────────────────

  const abrirTemplate = (evento) => {
    setEventoSel(evento)
    setImagen(null); setNombreTemplate('')
    setCoords({ x: 200, y: 300 }); setFontSize(32)
    setMsgTemplate('')
    imgRef.current = null
    setShowTemplate(true)
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        dibujarCanvas(img, coords, fontSize)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const dibujarCanvas = (img, c, fs) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const MAX = 700
    const scale = img.width > MAX ? MAX / img.width : 1
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const sx = c.x * scale
    const sy = c.y * scale
    const sfs = Math.max(fs * scale, 12)

    ctx.font = `bold ${sfs}px Georgia`
    const text = 'Juan García López'
    const tw = ctx.measureText(text).width

    // Sombra suave
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, sx, sy)
    ctx.shadowBlur = 0

    // Línea guía
    ctx.strokeStyle = 'rgba(255,80,80,0.85)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.strokeRect(sx - 4, sy - sfs - 4, tw + 8, sfs + 12)
    ctx.setLineDash([])

    // Pin
    ctx.fillStyle = 'rgba(255,80,80,0.9)'
    ctx.beginPath()
    ctx.arc(sx, sy - sfs, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  useEffect(() => {
    if (imgRef.current) dibujarCanvas(imgRef.current, coords, fontSize)
  }, [coords, fontSize])

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const img = imgRef.current
    if (!img) return
    const MAX = 700
    const scale = img.width > MAX ? MAX / img.width : 1
    const rx = (e.clientX - rect.left) / scale
    const ry = (e.clientY - rect.top) / scale
    setCoords({ x: rx, y: ry })
  }

  const guardarTemplate = async () => {
    if (!imagen || !nombreTemplate) {
      setMsgTemplate('⚠ Sube una imagen y añade un nombre')
      return
    }
    setLoadingTemplate(true); setMsgTemplate('')
    const fd = new FormData()
    fd.append('name', nombreTemplate)
    fd.append('imagen', imagen)
    fd.append('x_coord', Math.round(coords.x))
    fd.append('y_coord', Math.round(coords.y))
    fd.append('font_size', fontSize)
    if (eventoSel) fd.append('event_id', eventoSel.id)
    try {
      await api.post('/templates/crear/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMsgTemplate('✓ Template guardado')
      cargarEventos()
      setTimeout(() => setShowTemplate(false), 1000)
    } catch {
      setMsgTemplate('✕ Error al guardar el template')
    } finally {
      setLoadingTemplate(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#09090f', color: '#e8e8f0', fontFamily: "'DM Sans', sans-serif", padding: '40px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#444', marginBottom: '6px' }}>Panel de gestión</p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e8e8f0', margin: 0 }}>Eventos</h1>
        </div>
        <button style={btn()} onClick={() => { setShowCrear(true); setMsgCrear(''); setErrCrear('') }}>
          + Nuevo evento
        </button>
      </div>

      {/* Grid de eventos */}
      {loadingEventos ? (
        <p style={{ color: '#444', fontSize: '14px' }}>Cargando eventos...</p>
      ) : eventos.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 24px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📅</p>
          <p style={{ color: '#555', fontSize: '14px' }}>No hay eventos aún. Crea el primero.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {eventos.map(ev => (
            <div key={ev.id} style={card}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,91,219,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#e8e8f0', margin: '0 0 6px' }}>{ev.name}</h3>
                  <span style={{ fontSize: '11px', background: 'rgba(59,91,219,0.15)', color: '#7b93f7', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(59,91,219,0.2)' }}>
                    {ev.category || 'Sin categoría'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>
                📅 {ev.event_date ? new Date(ev.event_date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{ ...btn('rgba(59,91,219,0.15)'), color: '#7b93f7', border: '1px solid rgba(59,91,219,0.2)', flex: 1, fontSize: '12px' }}
                  onClick={() => abrirTemplate(ev)}>
                  🎨 Plantilla
                </button>
                <button style={{ ...btn('rgba(34,197,94,0.1)'), color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)', flex: 1, fontSize: '12px' }}
                  onClick={() => window.location.href = `/certificados?evento=${ev.id}`}>
                  📄 Certificados
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal crear evento ─────────────────────────────────────────────── */}
      {showCrear && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#13131c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '520px', margin: '0 16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', color: '#e8e8f0' }}>Nuevo evento</h2>

            {msgCrear && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>✓ {msgCrear}</div>}
            {errCrear && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>✕ {errCrear}</div>}

            <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={label}>Nombre</label>
                  <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Python Avanzado" required />
                </div>
                <div>
                  <label style={label}>Categoría</label>
                  <input style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Programación" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={label}>Fecha</label>
                  <input type="datetime-local" style={{ ...input, colorScheme: 'dark' }} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
                </div>
                <div>
                  <label style={label}>Ubicación</label>
                  <input style={input} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lima, Perú" />
                </div>
              </div>
              <div>
                <label style={label}>Descripción</label>
                <textarea style={{ ...input, resize: 'none' }} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve..." />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowCrear(false)}
                  style={{ ...btn('rgba(255,255,255,0.05)'), color: '#888', flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loadingCrear}
                  style={{ ...btn(), flex: 2, opacity: loadingCrear ? 0.5 : 1 }}>
                  {loadingCrear ? 'Creando...' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal editor de template ────────────────────────────────────────── */}
      {showTemplate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '40px 16px' }}>
          <div style={{ background: '#13131c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '1000px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '4px' }}>Plantilla de certificado</p>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e8e8f0', margin: 0 }}>{eventoSel?.name}</h2>
              </div>
              <button onClick={() => setShowTemplate(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#888', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px' }}>

              {/* Panel izquierdo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={label}>Nombre del template</label>
                  <input style={input} value={nombreTemplate} onChange={e => setNombreTemplate(e.target.value)} placeholder="Ej: Certificado Python 2025" />
                </div>

                <div>
                  <label style={label}>Imagen plantilla</label>
                  <label htmlFor="imgInput" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '24px 16px', cursor: 'pointer', background: imagen ? 'rgba(59,91,219,0.05)' : 'transparent' }}>
                    {imagen ? (
                      <span style={{ fontSize: '12px', color: '#4ade80' }}>✓ {imagen.name}</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '24px' }}>🖼️</span>
                        <span style={{ fontSize: '12px', color: '#555' }}>Click para subir</span>
                        <span style={{ fontSize: '11px', color: '#444' }}>PNG, JPG</span>
                      </>
                    )}
                  </label>
                  <input id="imgInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagenChange} />
                </div>

                <div>
                  <label style={label}>Tamaño de fuente: {fontSize}px</label>
                  <input type="range" min={12} max={80} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b5bdb' }} />
                </div>

                <div style={{ background: 'rgba(59,91,219,0.08)', border: '1px solid rgba(59,91,219,0.15)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: '#7b93f7', lineHeight: 1.6 }}>
                  💡 Haz click en la imagen para posicionar el nombre del estudiante
                </div>

                {msgTemplate && (
                  <div style={{ fontSize: '13px', padding: '10px 14px', borderRadius: '10px', background: msgTemplate.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: msgTemplate.startsWith('✓') ? '#4ade80' : '#f87171', border: `1px solid ${msgTemplate.startsWith('✓') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    {msgTemplate}
                  </div>
                )}

                <button onClick={guardarTemplate} disabled={loadingTemplate}
                  style={{ ...btn(), padding: '12px', opacity: loadingTemplate ? 0.5 : 1 }}>
                  {loadingTemplate ? 'Guardando...' : '💾 Guardar template'}
                </button>
              </div>

              {/* Panel derecho - canvas */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ ...label, margin: 0 }}>Editor visual</label>
                  {imagen && (
                    <span style={{ fontSize: '11px', color: '#555' }}>
                      X: {Math.round(coords.x)}px &nbsp;·&nbsp; Y: {Math.round(coords.y)}px
                    </span>
                  )}
                </div>
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden', background: '#0d0d14', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imagen ? (
                    <canvas
                      ref={canvasRef}
                      onClick={handleCanvasClick}
                      style={{ maxWidth: '100%', height: 'auto', cursor: 'crosshair', display: 'block' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#333', padding: '60px 24px' }}>
                      <p style={{ fontSize: '32px', marginBottom: '10px' }}>🖼️</p>
                      <p style={{ fontSize: '13px' }}>Sube una imagen para activar el editor</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}