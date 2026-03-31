import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="337496486510-29ju4aop35beq7pcvvgko885tmejbudp.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
)