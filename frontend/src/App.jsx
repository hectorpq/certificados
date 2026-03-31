// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Eventos from './pages/Eventos';
import Estudiantes from './pages/Estudiantes';
import Certificados from './pages/Certificados';
import GeneradorPublico from './pages/GeneradorPublico';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública - Principal */}
        <Route path="/" element={<GeneradorPublico />} />
        
        {/* Ruta de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/eventos" element={
          <PrivateRoute>
            <Eventos />
          </PrivateRoute>
        } />
        <Route path="/estudiantes" element={
          <PrivateRoute>
            <Estudiantes />
          </PrivateRoute>
        } />
        <Route path="/certificados" element={
          <PrivateRoute>
            <Certificados />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default App;