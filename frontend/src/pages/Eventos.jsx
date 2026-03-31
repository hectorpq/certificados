import { useState } from 'react'
import api from '../api/axios'

const inp = {
  width: '100%', background: '#1e1e2e',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '11px 14px',
  color: '#fff', fontSize: '14px', outline: 'none',
  colorScheme: 'dark'
}

export default function Eventos() {
  const [form, setForm] = useState({ name: '', category: '', event_date: '', location: '', description: '' })
  const [plantilla, setPlantilla] = useState(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setMsg(''); setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      if (plantilla) data.append('background_url', plantilla)
      await api.post('/events/', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg('Evento creado correctamente')
      setForm({ name: '', category: '', event_date: '', location: '', description: '' })
      setPlantilla(null)
    } catch {
      setError('Error al crear el evento')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Crear Evento</h1>
        <p className="text-sm" style={{ color: '#555' }}>Registra un nuevo evento y sube la plantilla del certificado</p>
      </div>

      <div className="rounded-2xl p-8" style={{ background: '#13131a', border: '0.5px solid rgba(255,255,255,0.08)' }}>
        {msg && <div className="px-4 py-3 rounded-xl mb-5 text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>✓ {msg}</div>}
        {error && <div className="px-4 py-3 rounded-xl mb-5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', color: '#f87171' }}>✕ {error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Nombre del evento</label>
              <input style={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Python Avanzado" required />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Categoría</label>
              <input style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Programación" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Fecha</label>
              <input type="datetime-local" style={inp} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Ubicación</label>
              <input style={inp} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ej: Lima, Perú" />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Descripción</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción del evento..." />
          </div>
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#666' }}>Plantilla del certificado</label>
            <label htmlFor="plantillaInput" className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer py-8 transition-all"
              style={{ border: `1px dashed ${plantilla ? 'rgba(59,91,219,0.4)' : 'rgba(255,255,255,0.1)'}`, background: plantilla ? 'rgba(59,91,219,0.05)' : 'transparent' }}>
              {plantilla ? (
                <>
                  <img src={URL.createObjectURL(plantilla)} alt="preview" className="max-h-32 rounded-lg object-contain" />
                  <span className="text-xs" style={{ color: '#4ade80' }}>✓ {plantilla.name}</span>
                </>
              ) : (
                <>
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm" style={{ color: '#555' }}>Click para subir imagen del certificado</span>
                  <span className="text-xs" style={{ color: '#444' }}>PNG, JPG</span>
                </>
              )}
            </label>
            <input id="plantillaInput" type="file" accept="image/*" className="hidden" onChange={e => setPlantilla(e.target.files[0])} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
            style={{ background: '#3b5bdb' }}>
            {loading ? 'Creando...' : 'Crear Evento'}
          </button>
        </form>
      </div>
    </div>
  )
}