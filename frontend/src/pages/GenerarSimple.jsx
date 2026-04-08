// src/pages/GenerarSimple.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
  const [positions, setPositions] = useState({ x: 200, y: 300, font_size: 32, font_color: '#000000' })

  useEffect(() => {
    if (!isLoggedIn) {
      const savedCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
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
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = 'certificados.zip'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)

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
      <div style={{ minHeight: '100vh', background: '#0e0e0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '2.5rem', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ color: '#f0ede8', fontSize: '1.25rem', marginBottom: '0.75rem' }}>Límite alcanzado</h2>
          <p style={{ color: 'rgba(240,237,232,0.5)', marginBottom: '1.5rem' }}>
            Has alcanzado el límite de {LIMIT} certificados gratuitos.
          </p>
          <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Inicia sesión para generar certificados de forma ilimitada
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
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f0ede8', margin: '0 0 0.5rem' }}>
          {isLoggedIn ? 'Generador de Certificados' : 'Generador Simple'}
        </h1>
        <p style={{ color: 'rgba(240,237,232,0.4)', fontSize: '0.875rem' }}>
          {isLoggedIn ? 'Genera certificados de forma ilimitada' : `Sin registro • ${remaining} certificados disponibles`}
        </p>
      </div>

      {!isLoggedIn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(count / LIMIT) * 100}%`, height: '100%', background: '#d4a361', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)', minWidth: '50px', textAlign: 'right' }}>
            {count}/{LIMIT}
          </span>
        </div>
      )}

      <div style={{ background: '#18181a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(240,237,232,0.4)', marginBottom: '6px' }}>
            Archivo Excel *
          </label>
          <label htmlFor="excelInput" style={{ display: 'block', cursor: 'pointer', border: `1.5px dashed ${excelFile ? 'rgba(59,91,219,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '2rem', textAlign: 'center', transition: 'all 0.2s' }}>
            {excelFile ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ color: '#6ee7b7', fontSize: '0.875rem' }}>{excelFile.name}</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'rgba(240,237,232,0.3)' }}>📁</div>
                <div style={{ color: 'rgba(240,237,232,0.5)', fontSize: '0.875rem' }}>Subir Excel</div>
                <div style={{ color: 'rgba(240,237,232,0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>.xlsx, .xls, .csv</div>
              </div>
            )}
          </label>
          <input id="excelInput" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleExcelChange} />
        </div>

        {preview.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(240,237,232,0.4)', marginBottom: '0.5rem' }}>Preview ({preview.length} registros)</div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem', color: 'rgba(240,237,232,0.5)' }}>
              {preview.map((row, i) => (
                <div key={i} style={{ padding: '0.25rem 0' }}>{Object.values(row).join(' • ')}</div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✕ {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✓ Certificados generados y descargados
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !excelFile}
          style={{
            width: '100%',
            padding: '0.9rem',
            background: '#d4a361',
            color: '#0e0e0f',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: loading || !excelFile ? 'not-allowed' : 'pointer',
            opacity: loading || !excelFile ? 0.5 : 1,
          }}
        >
          {loading ? 'Generando...' : 'Generar y Descargar ZIP'}
        </button>
      </div>

      {!isLoggedIn && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(240,237,232,0.3)' }}>
          <a href="/login" style={{ color: '#d4a361', textDecoration: 'none' }}>Inicia sesión</a> para funciones completas
        </p>
      )}

      {isLoggedIn && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/panel" style={{ color: '#d4a361', textDecoration: 'none', fontSize: '0.875rem' }}>
            Ir al panel completo →
          </a>
        </div>
      )}
    </div>
  )
}
