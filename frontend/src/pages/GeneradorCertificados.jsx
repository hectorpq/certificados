import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import { colors, styles } from '../theme'

const uploadBoxStyles = {
  border: `2px dashed ${colors.gold}`,
  borderRadius: '8px',
  padding: '1.5rem',
  cursor: 'pointer',
  transition: 'all 0.3s',
  textAlign: 'center',
}

const canvasContainerStyles = {
  border: `1px solid ${colors.gold}`,
  borderRadius: '8px',
  overflow: 'auto',
  maxWidth: '100%',
  background: '#1a1a1b',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

export default function GeneradorCertificados() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const [templateFile, setTemplateFile] = useState(null)
  const [templatePreview, setTemplatePreview] = useState(null)
  const [templateData, setTemplateData] = useState({
    x: 250,
    y: 300,
    fontSize: 32,
    fontColor: '#000000',
  })

  const [excelFile, setExcelFile] = useState(null)
  const [excelData, setExcelData] = useState([])
  const [previewIndex, setPreviewIndex] = useState(0)

  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef(null)

  const handleTemplateUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Solo PNG y JPG permitidos')
      return
    }

    setTemplateFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setTemplatePreview(event.target.result)
      setMsg('Template cargado')
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Solo archivos Excel aceptados')
      return
    }

    setExcelFile(file)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/generar/procesar-excel/', formData)
      setExcelData(res.data.datos)
      setMsg(`${res.data.datos.length} registros procesados`)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar Excel')
    } finally {
      setLoading(false)
    }
  }

  const redrawPreview = () => {
    if (!canvasRef.current || !templatePreview) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      ctx.drawImage(img, 0, 0)

      const texto = `${excelData[previewIndex]?.nombre} ${excelData[previewIndex]?.apellido}`
      ctx.font = `${templateData.fontSize}px Arial`
      ctx.fillStyle = templateData.fontColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(texto, templateData.x, templateData.y)

      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(templateData.x - 100, templateData.y - 25, 200, 50)
      ctx.setLineDash([])
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
      ctx.beginPath()
      ctx.arc(templateData.x, templateData.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }

    img.src = templatePreview
  }

  useEffect(() => {
    redrawPreview()
  }, [templatePreview, templateData, previewIndex, excelData])

  const handleCanvasMouseDown = (e) => {
    if (!canvasRef.current) return
    setIsDragging(true)
    const rect = canvasRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left - templateData.x,
      y: e.clientY - rect.top - templateData.y,
    })
  }

  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragOffset.x
    const newY = e.clientY - rect.top - dragOffset.y

    setTemplateData({
      ...templateData,
      x: Math.max(0, Math.min(newX, canvasRef.current.width)),
      y: Math.max(0, Math.min(newY, canvasRef.current.height)),
    })
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const generarYEnviar = async () => {
    if (!templateFile || excelData.length === 0) {
      setError('Completa: sube template y Excel')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('template', templateFile)
    formData.append('datos', JSON.stringify(excelData))
    formData.append('posiciones', JSON.stringify(templateData))

    try {
      const res = await api.post('/generar/crear-masivo/', formData, {
        responseType: 'blob'
      })
      
      // Extraer información de los headers
      const generados = res.headers['x-generados'] || 0
      const emails = res.headers['x-emails'] || 0
      
      // Descargar el ZIP
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'certificados.zip')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setMsg(`✓ ${generados} certificados generados y ${emails} emails enviados`)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar certificados')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ color: '#fff', fontSize: '2rem', margin: '0', lineHeight: '1.2', fontWeight: 'bold' }}>
        Generador
      </h1>

      {msg && <div style={{ ...styles.success, fontSize: '0.9rem', padding: '0.75rem 1rem', borderRadius: '6px' }}>{msg}</div>}
      {error && <div style={{ ...styles.error, fontSize: '0.9rem', padding: '0.75rem 1rem', borderRadius: '6px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 0.85fr) 1.5fr', gap: '1.5rem', minHeight: '600px' }}>
        {/* IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0, overflow: 'auto' }}>
          {/* TEMPLATE */}
          <div style={{ background: '#1a1a1b', padding: '1rem', borderRadius: '6px', border: `1px solid ${colors.gold}`, flex: 'none' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Template</h3>
            {!templatePreview ? (
              <div>
                <input
                  id="template-input"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleTemplateUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="template-input" style={{ ...uploadBoxStyles, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', padding: '1rem' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>+</div>
                  <div style={{ color: '#fff', fontSize: '0.75rem' }}>PNG o JPG</div>
                </label>
              </div>
            ) : (
              <img
                src={templatePreview}
                alt="template"
                style={{
                  maxWidth: '100%',
                  height: '80px',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  border: `1px solid ${colors.gold}`,
                }}
              />
            )}
          </div>

          {/* EXCEL */}
          <div style={{ background: '#1a1a1b', padding: '1rem', borderRadius: '6px', border: `1px solid ${colors.gold}`, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Excel</h3>
            {excelData.length === 0 ? (
              <div>
                <input
                  id="excel-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="excel-input" style={{ ...uploadBoxStyles, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', padding: '1rem', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>+</div>
                  <div style={{ color: '#fff', fontSize: '0.75rem' }}>
                    {loading ? 'Procesando...' : 'Nombres, Apellidos, Email'}
                  </div>
                </label>
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: '#999', flex: 1, overflowY: 'auto' }}>
                <p style={{ color: colors.gold, margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                  {excelData.length} registros
                </p>
                {excelData.slice(0, 15).map((item, i) => (
                  <div key={i} style={{ padding: '0.3rem 0', borderBottom: '1px solid #333', fontSize: '0.7rem' }}>
                    <span style={{ color: '#fff' }}>{item.nombre} {item.apellido}</span>
                    <br />
                    <span style={{ fontSize: '0.65rem', color: colors.gold }}>{item.email}</span>
                  </div>
                ))}
                {excelData.length > 15 && (
                  <div style={{ color: colors.gold, marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.7rem' }}>
                    +{excelData.length - 15} mas...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CONFIG */}
          <div style={{ background: '#1a1a1b', padding: '1rem', borderRadius: '6px', border: `1px solid ${colors.gold}`, flex: 'none', maxHeight: '280px', overflowY: 'auto' }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>Config</h3>
            {excelData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ color: '#fff', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                    Tamaño: {templateData.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="80"
                    value={templateData.fontSize}
                    onChange={(e) =>
                      setTemplateData({ ...templateData, fontSize: parseInt(e.target.value) })
                    }
                    style={{ width: '100%', height: '6px' }}
                  />
                </div>

                <div>
                  <label style={{ color: '#fff', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={templateData.fontColor}
                    onChange={(e) =>
                      setTemplateData({ ...templateData, fontColor: e.target.value })
                    }
                    style={{ width: '100%', height: '30px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ color: '#fff', fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>
                    Registro {previewIndex + 1} / {excelData.length}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, excelData.length - 1)}
                    value={previewIndex}
                    onChange={(e) => setPreviewIndex(parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px' }}
                  />
                  <div style={{ color: colors.gold, fontSize: '0.7rem', marginTop: '0.25rem', padding: '0.4rem', background: '#0e0e0f', borderRadius: '4px' }}>
                    <strong>{excelData[previewIndex]?.nombre} {excelData[previewIndex]?.apellido}</strong>
                    <br />
                    <span style={{ fontSize: '0.65rem' }}>{excelData[previewIndex]?.email}</span>
                  </div>
                </div>

                <button
                  onClick={generarYEnviar}
                  disabled={loading || !templateFile}
                  style={{
                    ...styles.button,
                    width: '100%',
                    marginTop: '0.25rem',
                    opacity: (loading || !templateFile) ? 0.6 : 1,
                    cursor: (loading || !templateFile) ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.5rem',
                  }}
                >
                  {loading ? 'Generando...' : 'Enviar'}
                </button>
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', fontSize: '0.85rem' }}>
                Sube Excel primero
              </div>
            )}
          </div>
        </div>

        {/* DERECHA */}
        <div style={{ background: '#1a1a1b', padding: '1rem', borderRadius: '6px', border: `1px solid ${colors.gold}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
            Preview
          </h3>
          <div style={{ ...canvasContainerStyles, flex: 1, minHeight: 0 }}>
            {templatePreview ? (
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ 
                  cursor: 'move', 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{ color: '#666', textAlign: 'center', fontSize: '0.9rem' }}>
                Sube template para ver previsualización
              </div>
            )}
          </div>
          <p style={{ color: '#999', fontSize: '0.65rem', margin: '0.5rem 0 0 0', textAlign: 'center' }}>
            Arrastra para posicionar
          </p>
        </div>
      </div>
    </div>
  )
}
