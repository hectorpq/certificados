// frontend/src/pages/Login.jsx

import { useState } from 'react';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username,
        password
      });
      
      localStorage.setItem('token', response.data.access);
      window.location.href = '/eventos';
      
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .lg-root {
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glow */
        .lg-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 50% -5%, rgba(212,163,97,0.14) 0%, transparent 65%),
            radial-gradient(ellipse 35% 35% at 15% 85%, rgba(110,231,183,0.05) 0%, transparent 55%);
          pointer-events: none;
        }

        /* Decorative grid lines */
        .lg-root::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .lg-wrap {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }

        /* ── HEADER ── */
        .lg-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .lg-logo-ring {
          width: 4rem;
          height: 4rem;
          border: 1px solid rgba(212,163,97,0.35);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.4rem;
          background: rgba(212,163,97,0.05);
        }
        .lg-logo-ring svg {
          width: 1.6rem;
          height: 1.6rem;
          color: #d4a361;
        }
        .lg-brand {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: #f0ede8;
          margin: 0 0 .35rem;
          letter-spacing: -.01em;
        }
        .lg-brand em {
          font-style: italic;
          color: #d4a361;
        }
        .lg-tagline {
          font-size: .82rem;
          color: rgba(240,237,232,.35);
          margin: 0;
          letter-spacing: .06em;
          text-transform: uppercase;
          font-weight: 500;
        }

        /* ── CARD ── */
        .lg-card {
          background: #18181a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.25rem;
          padding: 2.25rem 2rem;
          margin-bottom: 1rem;
        }

        /* ── FORM FIELDS ── */
        .lg-field {
          margin-bottom: 1.25rem;
        }
        .lg-label {
          display: block;
          font-size: .78rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: rgba(240,237,232,.45);
          margin-bottom: .5rem;
        }
        .lg-input {
          width: 100%;
          padding: .85rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: .75rem;
          color: #f0ede8;
          font-family: 'DM Sans', sans-serif;
          font-size: .95rem;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
          box-sizing: border-box;
        }
        .lg-input::placeholder { color: rgba(240,237,232,.2); }
        .lg-input:focus {
          border-color: rgba(212,163,97,0.5);
          background: rgba(212,163,97,0.04);
          box-shadow: 0 0 0 3px rgba(212,163,97,0.08);
        }

        /* ── DIVIDER ── */
        .lg-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          margin: 1.5rem 0;
        }

        /* ── ERROR ── */
        .lg-error {
          display: flex;
          align-items: center;
          gap: .6rem;
          background: rgba(255,80,80,0.07);
          border: 1px solid rgba(255,80,80,0.2);
          border-radius: .65rem;
          padding: .75rem 1rem;
          margin-bottom: 1.25rem;
          font-size: .82rem;
          color: rgba(255,150,150,.9);
        }
        .lg-error svg { width: 1rem; height: 1rem; color: #ff5050; flex-shrink: 0; }

        /* ── BUTTON ── */
        .lg-btn {
          width: 100%;
          padding: .95rem;
          background: #d4a361;
          color: #0e0e0f;
          border: none;
          border-radius: .875rem;
          font-family: 'DM Sans', sans-serif;
          font-size: .95rem;
          font-weight: 700;
          letter-spacing: .04em;
          cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(212,163,97,0.22);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .5rem;
        }
        .lg-btn:hover:not(:disabled) {
          opacity: .88;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(212,163,97,0.3);
        }
        .lg-btn:disabled {
          background: rgba(255,255,255,0.07);
          color: rgba(240,237,232,.25);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .lg-spin {
          animation: lgSpin 1s linear infinite;
          width: 1rem;
          height: 1rem;
        }
        @keyframes lgSpin { to { transform: rotate(360deg); } }

        /* ── BACK LINK ── */
        .lg-back {
          display: block;
          text-align: center;
          margin-top: 1.5rem;
          font-size: .8rem;
          color: rgba(240,237,232,.3);
          text-decoration: none;
          transition: color .2s;
          letter-spacing: .03em;
        }
        .lg-back:hover { color: rgba(212,163,97,.7); }

        /* ── FEATURE PILLS ── */
        .lg-pills {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: .75rem;
          margin-top: 1.25rem;
        }
        .lg-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: .75rem;
          padding: .75rem 1rem;
          text-align: center;
          font-size: .75rem;
          color: rgba(240,237,232,.3);
          letter-spacing: .04em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .4rem;
        }
        .lg-pill-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #d4a361;
          opacity: .6;
          flex-shrink: 0;
        }
      `}</style>

      <div className="lg-root">
        <div className="lg-wrap">

          {/* ── HEADER ── */}
          <div className="lg-header">
            <div className="lg-logo-ring">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h1 className="lg-brand">Certify<em>Pro</em></h1>
            <p className="lg-tagline">Plataforma profesional de certificación</p>
          </div>

          {/* ── CARD ── */}
          <div className="lg-card">
            <form onSubmit={handleLogin}>
              <div className="lg-field">
                <label className="lg-label">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="lg-input"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>

              <div className="lg-field">
                <label className="lg-label">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="lg-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="lg-error">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="lg-divider" />

              <button type="submit" disabled={loading} className="lg-btn">
                {loading ? (
                  <>
                    <svg className="lg-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".2" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Iniciando sesión…
                  </>
                ) : (
                  'Iniciar sesión →'
                )}
              </button>
            </form>

            <a href="/" className="lg-back">← Volver al generador público</a>
          </div>

          {/* ── PILLS ── */}
          <div className="lg-pills">
            <div className="lg-pill">
              <span className="lg-pill-dot" />
              Envío por Gmail
            </div>
            <div className="lg-pill">
              <span className="lg-pill-dot" />
              WhatsApp integrado
            </div>
          </div>

        </div>
      </div>
    </>
  );
}