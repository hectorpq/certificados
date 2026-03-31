// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import Eventos from './pages/Eventos'
import Certificados from './pages/Certificados'
import Navbar from './components/Navbar'
import { globalCSS } from './theme'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  // Inyectar CSS global una sola vez
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
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div style={{ minHeight: '100vh', background: '#0e0e0f' }}>
              <Navbar />
              <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
                <Routes>
                  <Route path="/eventos"      element={<Eventos />} />
                  <Route path="/certificados" element={<Certificados />} />
                  <Route path="*"             element={<Navigate to="/certificados" />} />
                </Routes>
              </div>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}