// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import GeneradorCertificados from './pages/GeneradorCertificados'
import Eventos from './pages/Eventos'
import EventoDetalle from './pages/EventoDetalle'
import Certificados from './pages/Certificados'
import InvitacionPublica from './pages/InvitacionPublica'
import GenerarSimple from './pages/GenerarSimple'
import Perfil from './pages/Perfil'
import { globalCSS } from './theme'

export default function App() {
  useEffect(() => {
    const id = 'cp-global-styles'
    if (!document.getElementById(id)) {
      const tag = document.createElement('style')
      tag.id = id
      tag.textContent = globalCSS
      document.head.appendChild(tag)
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        {/* Login - público */}
        <Route path="/login" element={<Login />} />
        
        {/* Página principal - Eventos (público con límite) */}
        <Route path="/" element={<Eventos />} />
        
        {/* Detalle del evento - público, maneja sus propios permisos */}
        <Route path="/eventos/:id" element={<EventoDetalle />} />
        
        {/* Invitación pública */}
        <Route path="/invitation/:token" element={<InvitacionPublica />} />
        
        {/* Rutas del panel - redireccionan al home por ahora */}
        <Route path="/generar-simple" element={<Navigate to="/" replace />} />
        <Route path="/panel" element={<Navigate to="/" replace />} />
        <Route path="/generar" element={<Navigate to="/" replace />} />
        <Route path="/eventos" element={<Navigate to="/" replace />} />
        <Route path="/certificados" element={<Navigate to="/" replace />} />
        
        {/* Perfil */}
        <Route path="/perfil" element={<Perfil />} />
        
        {/* Cualquier otra ruta va al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
