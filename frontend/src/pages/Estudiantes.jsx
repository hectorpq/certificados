import { useState } from 'react'
import api from '../api/axios'

export default function Estudiantes() {
  const [archivo, setArchivo] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async () => {
    if (!archivo) return
    setLoading(true); setMsg(''); setError('')
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      await api.post('/students/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg('Estudiantes importados correctamente')
      setArchivo(null)
    } catch {
      setError('Error al importar. Verifica el formato del Excel.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Importar Estudiantes</h1>
        <p className="text-sm" style={{ color: '#555' }}>Sube tu Excel con la lista de estudiantes</p>
      </div>

      {/* Formato requerido */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#13131a', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: '#666' }}>Formato requerido del Excel</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                {['document_id', 'first_name', 'last_name', 'email', 'phone'].map(h => (
                  <th key={h} className="text-left py-2 pr-6 text-xs tracking-widest uppercase" style={{ color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pr-6 text-sm" style={{ color: '#888' }}>12345678</td>
                <td className="py-2 pr-6 text-sm" style={{ color: '#888' }}>Juan</td>
                <td className="py-2 pr-6 text-sm" style={{ color: '#888' }}>Pérez</td>
                <td className="py-2 pr-6 text-sm" style={{ color: '#888' }}>juan@email.com</td>
                <td className="py-2 pr-6 text-sm" style={{ color: '#888' }}>+51 999888777</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload */}
      <div className="rounded-2xl p-8" style={{ background: '#13131a', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        {msg && (
          <div className="px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
            ✓ {msg}
          </div>
        )}
        {error && (
          <div className="px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            ✕ {error}
          </div>
        )}

        <label htmlFor="excelInput"
          className="flex flex-col items-center justify-center gap-3 rounded-xl cursor-pointer transition-all py-12 mb-6"
          style={{ border: `1px dashed ${archivo ? 'rgba(59,91,219,0.4)' : 'rgba(255,255,255,0.08)'}`, background: archivo ? 'rgba(59,91,219,0.05)' : 'transparent' }}>
          {archivo ? (
            <>
              <span className="text-3xl">📊</span>
              <span className="text-sm font-medium text-white">{archivo.name}</span>
              <span className="text-xs" style={{ color: '#4ade80' }}>
                ✓ {(archivo.size / 1024).toFixed(1)} KB — listo para importar
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl">📂</span>
              <span className="text-sm text-white">Arrastra tu Excel aquí</span>
              <span className="text-xs" style={{ color: '#555' }}>o haz click para seleccionar · .xlsx, .xls, .csv</span>
            </>
          )}
        </label>
        <input id="excelInput" type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => setArchivo(e.target.files[0])} />

        <div className="flex gap-3">
          <button onClick={handleUpload} disabled={!archivo || loading}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: '#3b5bdb' }}>
            {loading ? 'Importando...' : '⬆️ Importar estudiantes'}
          </button>
          {archivo && (
            <button onClick={() => setArchivo(null)}
              className="px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', color: '#888' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}