// src/pages/GenerarSimple.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, styles } from '../styles'

const LIMIT = 30
const STORAGE_KEY = 'generar_simple_count'

export default function GenerarSimple() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')
  const [count, setCount] = useState(0)
  const [excelFile, setExcelFile] = useState(null)
  const [templateFile, setTemplateFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [preview, setPreview] = useState([])
  const [positions] = useState({ x: 200, y: 300, font_size: 32, font_color: '#000000' })

  useEffect(() => {
    if (!isLoggedIn) {
      const savedCount = Number.parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
      setCount(savedCount)
      if (savedCount >= LIMIT) {
        setShowLimitModal(true)
      }
    }
  }, [isLoggedIn])

  const updateCount = (newCount) => {
    setCount(newCount)
    localStorage.setItem(STORAGE_KEY, newCount.toString())
    if (newCount >= LIMIT) {
      setShowLimitModal(true)
    }
  }

  const handleExcelChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setExcelFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        import('xlsx').then(XLSX => {
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
          const headers = jsonData[0] || []
          const rows = jsonData.slice(1, 6).map(row => {
            const obj = {}
            headers.forEach((h, i) => { obj[h] = row[i] })
            return obj
          })
          setPreview(rows)
        })
      } catch (err) {
        console.error('Error reading Excel:', err)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleGenerate = async () => {
    if (!excelFile) {
      setError('Sube un archivo Excel')
      return
    }

    const fileCount = preview.length || 1
    if (!isLoggedIn && count + fileCount > LIMIT) {
      setError(`Solo puedes generar ${LIMIT - count} certificados más`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', excelFile)
      if (templateFile) {
        formData.append('template', templateFile)
      }
      formData.append('positions', JSON.stringify(positions))

      let url = 'http://localhost:8000/api/publico/generar/'
      if (isLoggedIn) {
        url = 'http://localhost:8000/api/generate/excel/'
        formData.append('event_id', '1')
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: isLoggedIn ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}
      })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = globalThis.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'certificados.zip'
        document.body.appendChild(a)
        a.click()
        a.remove()
        globalThis.URL.revokeObjectURL(downloadUrl)

        if (!isLoggedIn) {
          updateCount(count + fileCount)
        }
        setSuccess(true)
        setExcelFile(null)
        setTemplateFile(null)
        setPreview([])
      } else {
        throw new Error('Error en la respuesta')
      }
    } catch (err) {
      console.error('Error generating:', err)
      setError('Error al generar certificados. Verifica el formato del Excel.')
    } finally {
      setLoading(false)
    }
  }

  const remaining = LIMIT - count

  if (showLimitModal && !isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '2.5rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: colors.text, fontSize: '1.25rem', marginBottom: '0.75rem' }}>Límite alcanzado</h2>
          <p style={{ color: colors.textMuted, marginBottom: '1.5rem' }}>
            Has alcanzado el límite de {LIMIT} certificados gratuitos.
          </p>
          <p style={{ color: colors.textDim, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Inicia sesión para generar certificados de forma ilimitada
          </p>
          <button onClick={() => navigate('/login')} style={styles.btnPrimary}>
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, margin: '0 0 0.5rem' }}>
          {isLoggedIn ? 'Generador de Certificados' : 'Generador Simple'}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>
          {isLoggedIn ? 'Genera certificados de forma ilimitada' : `Sin registro • ${remaining} certificados disponibles`}
        </p>
      </div>

      {!isLoggedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(count / LIMIT) * 100}%`, height: '100%', background: colors.gold, transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: colors.textMuted, minWidth: '50px', textAlign: 'right' }}>
            {count}/{LIMIT}
          </span>
        </div>
      )}

      <div style={{ ...styles.card, padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={styles.label}>
            Archivo Excel *
          </label>
          <label htmlFor="excelInput" style={{ display: 'block', cursor: 'pointer', border: `1.5px dashed ${excelFile ? 'rgba(59,91,219,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', transition: 'all 0.2s' }}>
            {excelFile ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ color: colors.mint, fontSize: '0.875rem' }}>{excelFile.name}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: colors.textDim }}>📁</div>
                <div style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Subir Excel</div>
                <div style={{ color: colors.textDim, fontSize: '0.75rem', marginTop: '0.25rem' }}>.xlsx, .xls, .csv</div>
              </div>
            )}
          </label>
          <input id="excelInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelChange} />
        </div>

        {preview.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginBottom: '0.5rem' }}>Preview ({preview.length} registros)</div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem', color: colors.textMuted }}>
              {preview.map((row, i) => (
                <div key={i} style={{ padding: '0.25rem 0' }}>{Object.values(row).join(' • ')}</div>
              ))}
            </div>
          </div>
        )}

        {error && <div style={styles.alertError}>✕ {error}</div>}
        {success && <div style={styles.alertSuccess}>✓ Certificados generados y descargados</div>}

        <button
          onClick={handleGenerate}
          disabled={loading || !excelFile}
          style={{ 
            ...styles.btnPrimary, 
            opacity: (loading || !excelFile) ? 0.5 : 1, 
            cursor: (loading || !excelFile) ? 'not-allowed' : 'pointer' 
          }}
        >
          {loading ? 'Generando...' : 'Generar y Descargar ZIP'}
        </button>
      </div>

      {!isLoggedIn && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: colors.textDim }}>
          <a href="/login" style={{ color: colors.gold, textDecoration: 'none' }}>Inicia sesión</a> para funciones completas
        </p>
      )}

      {isLoggedIn && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/panel" style={{ color: colors.gold, textDecoration: 'none', fontSize: '0.875rem' }}>
            Ir al panel completo →
          </a>
        </div>
      )}
    </div>
  )
}