// frontend/src/pages/Certificados.jsx

import { useState, useEffect } from 'react'
import api from '../api/axios'

// ─── Config ───────────────────────────────────────────────────────────────────

const statusConfig = {
  pending:   { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  generated: { label: 'Generado',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
  sent:      { label: 'Enviado',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
  failed:    { label: 'Fallido',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
}

// ─── Estilos base ─────────────────────────────────────────────────────────────

const card = {
  background: '#13131a',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
}

const inputSt = {
  background: '#1e1e2e',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  colorScheme: 'dark',
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Certificados() {
  const [eventos, setEventos]         = useState([])
  const [eventoId, setEventoId]       = useState('')
  const [archivo, setArchivo]         = useState(null)
  const [certs, setCerts]             = useState([])
  const [step, setStep]               = useState(1)
  const [msg, setMsg]                 = useState('')
  const [error, setError]             = useState('')
  const [loadingImport, setLoadingImport] = useState(false)
  const [loadingGen, setLoadingGen]   = useState(false)
  const [loadingSend, setLoadingSend] = useState(false)

  useEffect(() => {
    api.get('/eventos/').then(r => setEventos(r.data)).catch(() => {})
  }, [])

  const showMsg = (m) => { setMsg(m);  setError('') }
  const showErr = (e) => { setError(e); setMsg('') }

  const cargarCerts = async (eid) => {
    const id = eid || eventoId
    if (!id) return
    const res = await api.get(`/certs/?event_id=${id}`)
    setCerts(res.data)
    return res.data
  }

  // ── Paso 1: Importar Excel ─────────────────────────────────────────────────

  const importar = async () => {
    if (!archivo || !eventoId) return showErr('Selecciona un evento y un archivo Excel')
    setLoadingImport(true)
    try {
      const fd = new FormData()
      fd.append('file', archivo)
      fd.append('event_id', eventoId)
      const res = await api.post('/import/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      showMsg(`✓ ${res.data.estudiantes_procesados} estudiantes importados, ${res.data.certificados_creados} certificados creados`)
      await cargarCerts()
      setStep(2)
    } catch {
      showErr('Error al importar. Verifica el formato del Excel.')
    } finally {
      setLoadingImport(false)
    }
  }

  // ── Paso 2: Generar PDFs ───────────────────────────────────────────────────

  const generarTodos = async () => {
    const eventoSel = eventos.find(e => e.id === parseInt(eventoId))

    if (!eventoSel?.template) {
      return showErr('Este evento no tiene plantilla. Primero sube una en la sección Eventos.')
    }

    setLoadingGen(true)
    try {
      const res = await api.post('/generar/', { event_id: eventoId })
      showMsg(`✓ ${res.data.generados} PDFs generados`)
      await cargarCerts()
    } catch {
      showErr('Error al generar PDFs')
    } finally {
      setLoadingGen(false)
    }
  }

  // ── Paso 3: Enviar por email ───────────────────────────────────────────────

  const enviarTodos = async () => {
    setLoadingSend(true)
    try {
      const res = await api.post('/enviar/', { event_id: eventoId })
      showMsg(`✓ ${res.data.enviados} certificados enviados`)
      await cargarCerts()
      setStep(3)
    } catch {
      showErr('Error al enviar emails')
    } finally {
      setLoadingSend(false)
    }
  }

  // ── Contadores ─────────────────────────────────────────────────────────────

  const pendientes = certs.filter(c => c.status === 'pending').length
  const generados  = certs.filter(c => c.status === 'generated').length
  const enviados   = certs.filter(c => c.status === 'sent').length

  const eventoSel  = eventos.find(e => e.id === parseInt(eventoId))
  const tieneTemplate = !!eventoSel?.template

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', fontFamily: "'DM Sans', sans-serif", color: '#e8e8f0' }}>

      {/* Header */}
      <div style={{ marginBottom: '36px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#e8e8f0', margin: '0 0 6px' }}>
          Envío de Certificados
        </h1>
        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>
          Importa el Excel, genera los PDFs y envíalos por email
        </p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
        {[['1', 'Subir Excel'], ['2', 'Generar PDFs'], ['3', 'Enviado']].map(([n, lbl], i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
                background: step > i + 1 ? '#22c55e' : step === i + 1 ? '#3b5bdb' : '#1e1e2e',
                color: step >= i + 1 ? '#fff' : '#444',
                border: `0.5px solid ${step >= i + 1 ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              }}>
                {step > i + 1 ? '✓' : n}
              </div>
              <span style={{ fontSize: '12px', color: step >= i + 1 ? '#e8e8f0' : '#444' }}>{lbl}</span>
            </div>
            {i < 2 && (
              <div style={{ width: '32px', height: '1px', background: step > i + 1 ? '#22c55e' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Mensajes */}
      {msg && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.2)', color: '#4ade80', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          {msg}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          ✕ {error}
        </div>
      )}

      {/* ── Paso 1: Subir Excel ─────────────────────────────────────────────── */}
      <div style={{ ...card, padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, background: step >= 1 ? 'rgba(59,91,219,0.2)' : '#1e1e2e', color: step >= 1 ? '#818cf8' : '#444' }}>1</div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0', margin: '0 0 2px' }}>Selecciona evento y sube el Excel</p>
            <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>Columnas: document_id, first_name, last_name, email, phone</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Evento</label>
            <select value={eventoId}
              onChange={e => { setEventoId(e.target.value); setCerts([]); setStep(1) }}
              style={inputSt}>
              <option value="">-- Seleccionar evento --</option>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name} — {ev.category}</option>
              ))}
            </select>
          </div>

          {/* Aviso si no tiene template */}
          {eventoId && !tieneTemplate && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '0.5px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠ Este evento no tiene plantilla. Súbela en <strong>Eventos</strong> antes de generar PDFs.
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>Archivo Excel</label>
            <label htmlFor="excelInput" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px dashed ${archivo ? 'rgba(59,91,219,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '32px 16px', cursor: 'pointer', background: archivo ? 'rgba(59,91,219,0.05)' : 'transparent' }}>
              {archivo ? (
                <>
                  <span style={{ fontSize: '24px' }}>📊</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0' }}>{archivo.name}</span>
                  <span style={{ fontSize: '12px', color: '#4ade80' }}>✓ {(archivo.size / 1024).toFixed(1)} KB listo</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '24px' }}>📂</span>
                  <span style={{ fontSize: '13px', color: '#e8e8f0' }}>Click para seleccionar Excel</span>
                  <span style={{ fontSize: '11px', color: '#555' }}>.xlsx · .xls · .csv</span>
                </>
              )}
            </label>
            <input id="excelInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => setArchivo(e.target.files[0])} />
          </div>

          <button onClick={importar} disabled={!archivo || !eventoId || loadingImport}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#3b5bdb', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (!archivo || !eventoId || loadingImport) ? 0.4 : 1, letterSpacing: '0.02em' }}>
            {loadingImport ? 'Importando...' : '⬆️ Importar estudiantes'}
          </button>
        </div>
      </div>

      {/* ── Paso 2: Generar PDFs ────────────────────────────────────────────── */}
      {certs.length > 0 && (
        <div style={{ ...card, padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, background: step >= 2 ? 'rgba(59,91,219,0.2)' : '#1e1e2e', color: step >= 2 ? '#818cf8' : '#444' }}>2</div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0', margin: '0 0 2px' }}>Generar PDFs</p>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{certs.length} certificados en total</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pendientes', value: pendientes, color: '#f59e0b' },
              { label: 'Generados',  value: generados,  color: '#3b82f6' },
              { label: 'Enviados',   value: enviados,   color: '#22c55e' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1e1e2e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lista */}
          <div style={{ borderRadius: '10px', overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {certs.map((cert, i) => {
                const st = statusConfig[cert.status] || statusConfig.pending
                return (
                  <div key={cert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < certs.length - 1 ? '0.5px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', color: '#e8e8f0', margin: '0 0 2px' }}>{cert.student_name}</p>
                      <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>{cert.student_email}</p>
                    </div>
                    <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: st.bg, border: `0.5px solid ${st.border}`, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {pendientes > 0 && (
            <button onClick={generarTodos} disabled={loadingGen}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', border: '0.5px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: loadingGen ? 0.5 : 1, letterSpacing: '0.02em' }}>
              {loadingGen ? 'Generando PDFs...' : `🎨 Generar ${pendientes} PDFs`}
            </button>
          )}
        </div>
      )}

      {/* ── Paso 3: Enviar por email ────────────────────────────────────────── */}
      {generados > 0 && (
        <div style={{ ...card, padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>3</div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#e8e8f0', margin: '0 0 2px' }}>Enviar por email</p>
              <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>{generados} certificados listos para enviar</p>
            </div>
          </div>

          <div style={{ background: 'rgba(34,197,94,0.05)', border: '0.5px solid rgba(34,197,94,0.15)', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>📧</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0', margin: '0 0 2px' }}>{generados} estudiantes recibirán su certificado</p>
              <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>Se enviará el PDF directamente a su correo</p>
            </div>
          </div>

          <button onClick={enviarTodos} disabled={loadingSend}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#22c55e', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: loadingSend ? 0.5 : 1, letterSpacing: '0.02em' }}>
            {loadingSend ? 'Enviando...' : `📧 Enviar ${generados} certificados`}
          </button>
        </div>
      )}

      {/* ── Éxito total ─────────────────────────────────────────────────────── */}
      {step === 3 && enviados > 0 && pendientes === 0 && generados === 0 && (
        <div style={{ ...card, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#e8e8f0', margin: '0 0 8px' }}>¡Todo listo!</p>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '28px' }}>{enviados} certificados entregados</p>
          <button
            onClick={() => { setStep(1); setArchivo(null); setCerts([]); setEventoId(''); setMsg('') }}
            style={{ padding: '10px 24px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', color: '#888', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Nuevo envío
          </button>
        </div>
      )}
    </div>
  )
}