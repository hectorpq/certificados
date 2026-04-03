// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './pages/Login'
import GeneradorCertificados from './pages/GeneradorCertificados'
import Navbar from './components/Navbar'
import { globalCSS } from './theme'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

const Layout = ({ children }) => (
  <div style={{ minHeight: '100vh', background: '#0e0e0f', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <div style={{ flex: 1, width: '100%', padding: '2rem 1.5rem', overflowY: 'auto' }}>
      {children}
    </div>
  </div>
)

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
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/generar" element={
          <PrivateRoute>
            <Layout>
              <GeneradorCertificados />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/generar" replace />} />
        <Route path="*" element={<Navigate to="/generar" replace />} />
      </Routes>
    </BrowserRouter>
  )
}