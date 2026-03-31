// src/pages/Certificados.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import { colors, styles, statusConfig } from '../theme'

export default function Certificados() {
  const [eventos,       setEventos]       = useState([])
  const [eventoId,      setEventoId]      = useState('')
  const [archivo,       setArchivo]       = useState(null)
  const [certs,         setCerts]         = useState([])
  const [step,          setStep]          = useState(1)
  const [msg,           setMsg]           = useState('')
  const [error,         setError]         = useState('')
  const [loadingImport, setLoadingImport] = useState(false)
  const [loadingGen,    setLoadingGen]    = useState(false)
  const [loadingSend,   setLoadingSend]   = useState(false)

  useEffect(() => {
    api.get('/eventos/').then(r => setEventos(r.data)).catch(() => {})
  }, [])

  const showMsg = (m) => { setMsg(m);  setError('') }
  const showErr = (e) => { setError(e); setMsg('') }

  const cargarCerts = async () => {
    if (!eventoId) return
    try {
      const res = await api.get(`/certs/?event_id=${eventoId}`)
      setCerts(res.data)
    } catch {}
  }

  const importar = async () => {
    if (!archivo || !eventoId) return showErr('Selecciona un evento y un archivo Excel')
    setLoadingImport(true)
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('event_id', eventoId)
      const res = await api.post('/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showMsg(`✓ ${res.data.estudiantes_procesados} estudiantes importados, ${res.data.certificados_creados} certificados creados`)
      await cargarCerts()
      setStep(2)
    } catch { showErr('Error al importar. Verifica el formato del Excel.') }
    finally { setLoadingImport(false) }
  }

  const generarTodos = async () => {
    setLoadingGen(true)
    try {
      const res = await api.post('/generar/', { event_id: eventoId })
      showMsg(`✓ ${res.data.generados} PDFs generados`)
      await cargarCerts()
    } catch { showErr('Error al generar PDFs') }
    finally { setLoadingGen(false) }
  }

  const enviarTodos = async () => {
    setLoadingSend(true)
    try {
      const res = await api.post('/enviar/', { event_id: eventoId })
      showMsg(`✓ ${res.data.enviados} certificados enviados por Gmail`)
      await cargarCerts()
      setStep(3)
    } catch { showErr('Error al enviar emails') }
    finally { setLoadingSend(false) }
  }

  const pendientes = certs.filter(c => c.status === 'pending').length
  const generados  = certs.filter(c => c.status === 'generated').length
  const enviados   = certs.filter(c => c.status === 'sent').length

  // ── UI helpers ──────────────────────────────────────────────
  const StepDot = ({ n, label }) => {
    const idx = parseInt(n)
    const done = step > idx
    const active = step === idx
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700,
          background: done ? colors.mint : active ? colors.gold : 'rgba(255,255,255,0.05)',
          color: done || active ? colors.bg : colors.textDim,
          border: `1px solid ${done ? colors.mintBorder : active ? colors.goldBorder : colors.border}`,
          transition: 'all .3s',
        }}>
          {done ? '✓' : n}
        </div>
        <span style={{ fontSize: '12px', color: active ? colors.text : done ? colors.mint : colors.textDim, transition: 'color .3s' }}>
          {label}
        </span>
      </div>
    )
  }

  const Connector = ({ idx }) => (
    <div style={{
      width: '32px', height: '1px', margin: '0 4px',
      background: step > idx ? colors.mint : colors.border,
      transition: 'background .3s',
    }} />
  )

  const CardSection = ({ n, title, sub, children }) => (
    <div className="cp-card" style={{ ...styles.card, padding: '1.75rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1.4rem' }}>
        <div style={{
          width: '2rem', height: '2rem', borderRadius: '8px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700,
          background: colors.goldMuted, border: `1px solid ${colors.goldBorder}`,
          color: colors.gold,
        }}>{n}</div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: colors.text, margin: '0 0 2px' }}>{title}</p>
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 900, color: colors.text, margin: '0 0 .3rem' }}>
          Envío de <em style={{ fontStyle: 'italic', color: colors.gold }}>Certificados</em>
        </h1>
        <p style={{ fontSize: '13px', color: colors.textMuted, margin: 0, fontWeight: 300 }}>
          Sube el Excel, genera los PDFs y envía todo por Gmail
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}>
        <StepDot n="1" label="Subir Excel" />
        <Connector idx={1} />
        <StepDot n="2" label="Generar PDFs" />
        <Connector idx={2} />
        <StepDot n="3" label="Enviado" />
      </div>

      {/* Alerts */}
      {msg   && <div style={styles.alertSuccess}><span>✓</span> {msg}</div>}
      {error && <div style={styles.alertError}><span>✕</span> {error}</div>}

      {/* ── PASO 1 ── */}
      <CardSection n="1" title="Selecciona evento y sube el Excel" sub="Columnas: document_id, first_name, last_name, email, phone">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={styles.label}>Evento</label>
            <select
              value={eventoId}
              onChange={e => { setEventoId(e.target.value); setCerts([]); setStep(1) }}
              className="cp-input"
              style={{ ...styles.input, fontFamily: 'inherit' }}
            >
              <option value="">— Seleccionar evento —</option>
              {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.name} — {ev.category}</option>)}
            </select>
          </div>

          <div>
            <label style={styles.label}>Archivo Excel</label>
            <label htmlFor="excelInput" className={`cp-drop-zone ${archivo ? 'active' : ''}`}>
              {archivo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
                  <svg width="28" height="28" fill="none" stroke={colors.mint} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{archivo.name}</span>
                  <span style={{ fontSize: '11px', color: colors.mint }}>✓ {(archivo.size / 1024).toFixed(1)} KB listo</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem' }}>
                  <svg width="28" height="28" fill="none" stroke={colors.textDim} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span style={{ fontSize: '13px', color: colors.textMuted }}>Click para seleccionar Excel</span>
                  <span style={{ fontSize: '11px', color: colors.textDim }}>.xlsx · .xls · .csv</span>
                </div>
              )}
            </label>
            <input id="excelInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => setArchivo(e.target.files[0])} />
          </div>

          <button onClick={importar} disabled={!archivo || !eventoId || loadingImport}
            className="cp-btn-primary" style={styles.btnPrimary}>
            {loadingImport
              ? <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
                  <svg className="cp-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Importando…
                </span>
              : 'Importar estudiantes →'
            }
          </button>
        </div>
      </CardSection>

      {/* ── PASO 2 ── */}
      {certs.length > 0 && (
        <CardSection n="2" title="Generar PDFs" sub={`${certs.length} certificados en total`}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Pendientes', value: pendientes, color: colors.amber },
              { label: 'Generados',  value: generados,  color: colors.blue  },
              { label: 'Enviados',   value: enviados,   color: colors.mint  },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${colors.border}`,
                borderRadius: '10px', padding: '1rem', textAlign: 'center',
              }}>
                <p style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, margin: '0 0 2px', fontFamily: "'DM Mono', monospace" }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lista */}
          <div style={{
            border: `1px solid ${colors.border}`, borderRadius: '10px',
            overflow: 'hidden', marginBottom: '1.25rem',
          }}>
            <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
              {certs.map((cert, i) => {
                const st = statusConfig[cert.status] || statusConfig.pending
                return (
                  <div key={cert.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.75rem 1rem',
                    borderBottom: i < certs.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: '13px', color: colors.text, margin: '0 0 2px', fontWeight: 500 }}>{cert.student_name}</p>
                      <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>{cert.student_email}</p>
                    </div>
                    <span style={{
                      padding: '.2rem .65rem', borderRadius: '999px',
                      fontSize: '11px', fontWeight: 600,
                      background: st.bg, border: `1px solid ${st.border}`, color: st.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {pendientes > 0 && (
            <button onClick={generarTodos} disabled={loadingGen}
              className="cp-btn-primary"
              style={{ ...styles.btnPrimary, background: colors.blueMuted, color: colors.blue, boxShadow: 'none', border: `1px solid ${colors.blueBorder}` }}>
              {loadingGen ? 'Generando PDFs…' : `Generar ${pendientes} PDFs →`}
            </button>
          )}
        </CardSection>
      )}

      {/* ── PASO 3 ── */}
      {generados > 0 && (
        <CardSection n="3" title="Enviar por Gmail" sub={`${generados} certificados listos para enviar`}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            background: colors.mintMuted, border: `1px solid ${colors.mintBorder}`,
            borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem',
          }}>
            <svg width="20" height="20" fill="none" stroke={colors.mint} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: colors.text, margin: '0 0 2px' }}>
                {generados} estudiantes recibirán su certificado
              </p>
              <p style={{ fontSize: '11px', color: colors.textMuted, margin: 0 }}>Se enviará el PDF a cada correo registrado</p>
            </div>
          </div>
          <button onClick={enviarTodos} disabled={loadingSend}
            className="cp-btn-primary"
            style={{ ...styles.btnPrimary, background: colors.greenMuted, color: colors.green, boxShadow: 'none', border: `1px solid ${colors.greenBorder}` }}>
            {loadingSend ? 'Enviando…' : `Enviar ${generados} certificados por Gmail →`}
          </button>
        </CardSection>
      )}

      {/* ── ÉXITO ── */}
      {step === 3 && enviados > 0 && pendientes === 0 && generados === 0 && (
        <div className="cp-card" style={{ ...styles.card, padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{
            width: '4rem', height: '4rem', borderRadius: '50%',
            border: `1px solid ${colors.mintBorder}`, background: colors.mintMuted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <svg width="24" height="24" fill="none" stroke={colors.mint} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 900, color: colors.text, margin: '0 0 .4rem' }}>
            ¡Todo listo!
          </h2>
          <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 1.75rem' }}>
            {enviados} certificados enviados por Gmail
          </p>
          <button
            onClick={() => { setStep(1); setArchivo(null); setCerts([]); setEventoId(''); setMsg('') }}
            className="cp-btn-ghost" style={{ ...styles.btnGhost, padding: '.6rem 1.5rem' }}>
            Nuevo envío
          </button>
        </div>
      )}
    </div>
  )
}