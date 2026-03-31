// frontend/src/pages/GeneradorPublico.jsx

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

export default function GeneradorPublico() {
  const [imagen, setImagen] = useState(null);
  const [excel, setExcel] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [coordenadas, setCoordenadas] = useState({ x: 200, y: 300 });
  const [fontSize, setFontSize] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [excelDragActive, setExcelDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [excelFileName, setExcelFileName] = useState('');
  
  const canvasRef = useRef(null);
  const imagenOriginalRef = useRef(null);
  const fileInputRef = useRef(null);
  const excelInputRef = useRef(null);
  
  // Drag & drop para imagen
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      setImagen(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target.result);
        const img = new Image();
        img.onload = () => {
          imagenOriginalRef.current = img;
          dibujarCanvas(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      setError('Por favor sube un archivo PNG o JPG');
    }
  };
  
  // Drag & drop para Excel
  const handleExcelDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setExcelDragActive(true);
    } else if (e.type === "dragleave") {
      setExcelDragActive(false);
    }
  };
  
  const handleExcelDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExcelDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      setExcel(file);
      setExcelFileName(file.name);
    } else {
      setError('Por favor sube un archivo Excel (.xlsx, .xls, .csv)');
    }
  };
  
  // Manejar subida de imagen
  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagenPreview(e.target.result);
        const img = new Image();
        img.onload = () => {
          imagenOriginalRef.current = img;
          dibujarCanvas(img);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Dibujar imagen en canvas
  const dibujarCanvas = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    
    // Dibujar marcador de texto con glow effect
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(coordenadas.x - 10, coordenadas.y - 45, 320, 70);
    
    // Dibujar marcador de posición
    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 14px "Inter", system-ui';
    ctx.fillText('✍️ NOMBRE AQUÍ', coordenadas.x, coordenadas.y - 55);
    
    // Dibujar líneas guía
    ctx.beginPath();
    ctx.moveTo(coordenadas.x - 15, coordenadas.y - 20);
    ctx.lineTo(coordenadas.x + 300, coordenadas.y - 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(coordenadas.x - 15, coordenadas.y + 20);
    ctx.lineTo(coordenadas.x + 300, coordenadas.y + 20);
    ctx.stroke();
    
    ctx.setLineDash([]);
  };
  
  // Actualizar canvas cuando cambian coordenadas
  useEffect(() => {
    if (imagenOriginalRef.current) {
      dibujarCanvas(imagenOriginalRef.current);
    }
  }, [coordenadas]);
  
  // Manejar click en canvas para posicionar
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    setCoordenadas({ x, y });
  };
  
  // Manejar subida de Excel
  const handleExcelChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExcel(file);
      setExcelFileName(file.name);
    }
  };
  
  // Generar certificados
  const handleGenerar = async () => {
    if (!imagen || !excel) {
      setError('Por favor sube la plantilla y el archivo Excel');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('excel', excel);
    formData.append('x_coord', coordenadas.x);
    formData.append('y_coord', coordenadas.y);
    formData.append('font_size', fontSize);
    
    try {
      const response = await axios.post(
        'http://localhost:8000/api/publico/generar/',
        formData,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificados_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`✅ ${excelFileName} procesado correctamente. ZIP descargado.`);
      
    } catch (err) {
      console.error(err);
      setError('Error al generar los certificados. Verifica los archivos.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .gp-root {
          font-family: 'DM Sans', sans-serif;
          background: #0e0e0f;
          min-height: 100vh;
          color: #f0ede8;
        }

        /* ── HERO ── */
        .gp-hero {
          position: relative;
          padding: 5rem 2rem 7rem;
          text-align: center;
          overflow: hidden;
        }
        .gp-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,163,97,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(255,100,60,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .gp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          border: 1px solid rgba(212,163,97,0.35);
          border-radius: 999px;
          padding: .35rem 1.1rem;
          font-size: .78rem;
          font-weight: 500;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: #d4a361;
          margin-bottom: 2rem;
        }
        .gp-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: 900;
          line-height: 1.05;
          margin: 0 0 1.2rem;
          color: #f0ede8;
        }
        .gp-hero h1 em {
          font-style: italic;
          color: #d4a361;
        }
        .gp-hero p {
          font-size: 1.1rem;
          color: rgba(240,237,232,.55);
          max-width: 480px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.7;
        }
        .gp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,163,97,0.25), transparent);
          margin: 0 2rem;
        }

        /* ── GRID ── */
        .gp-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .gp-main { grid-template-columns: 1fr; }
        }

        /* ── CARDS ── */
        .gp-card {
          background: #18181a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.25rem;
          padding: 1.75rem;
          margin-bottom: 1.25rem;
          transition: border-color .2s;
        }
        .gp-card:hover { border-color: rgba(212,163,97,0.2); }

        .gp-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.4rem;
        }
        .gp-step-num {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 50%;
          border: 1.5px solid rgba(212,163,97,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: 700;
          color: #d4a361;
          flex-shrink: 0;
        }
        .gp-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #f0ede8;
          margin: 0 0 .1rem;
          letter-spacing: .02em;
        }
        .gp-card-sub {
          font-size: .78rem;
          color: rgba(240,237,232,.38);
          margin: 0;
          font-weight: 400;
        }

        /* ── DROP ZONES ── */
        .gp-drop {
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: .875rem;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: border-color .2s, background .2s;
          background: rgba(255,255,255,0.02);
        }
        .gp-drop:hover { border-color: rgba(212,163,97,0.4); background: rgba(212,163,97,0.03); }
        .gp-drop.active-img { border-color: #d4a361; background: rgba(212,163,97,0.06); }
        .gp-drop.active-xls { border-color: #6ee7b7; background: rgba(110,231,183,0.05); }

        .gp-drop-icon {
          width: 3rem;
          height: 3rem;
          border-radius: .75rem;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        .gp-drop-icon svg { width: 1.5rem; height: 1.5rem; color: rgba(240,237,232,.35); }
        .gp-drop p { margin: 0; color: rgba(240,237,232,.5); font-size: .875rem; }
        .gp-drop-btn { color: #d4a361; font-weight: 600; font-size: .875rem; }
        .gp-drop-btn-green { color: #6ee7b7; font-weight: 600; font-size: .875rem; }
        .gp-drop-hint { font-size: .72rem; color: rgba(240,237,232,.25); margin-top: .4rem !important; }

        .gp-drop-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .6rem;
        }
        .gp-check-ring {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          border: 2px solid #6ee7b7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gp-check-ring svg { width: 1.6rem; height: 1.6rem; color: #6ee7b7; }
        .gp-file-name {
          font-size: .82rem;
          color: rgba(240,237,232,.7);
          font-family: 'DM Mono', monospace;
          word-break: break-all;
        }
        .gp-change-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: .75rem;
          color: rgba(255,80,80,.7);
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }
        .gp-change-btn:hover { color: #ff5050; }

        .gp-template-link {
          display: inline-block;
          font-size: .72rem;
          color: rgba(212,163,97,.6);
          text-decoration: none;
          margin-top: .75rem;
          letter-spacing: .05em;
        }
        .gp-template-link:hover { color: #d4a361; }

        /* ── FONT SIZE SLIDER ── */
        .gp-slider-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: .6rem;
        }
        .gp-slider-label { font-size: .82rem; color: rgba(240,237,232,.55); font-weight: 500; }
        .gp-slider-val {
          font-family: 'DM Mono', monospace;
          font-size: .82rem;
          color: #d4a361;
          background: rgba(212,163,97,0.1);
          border: 1px solid rgba(212,163,97,0.2);
          border-radius: .35rem;
          padding: .1rem .5rem;
        }
        input[type='range'].gp-range {
          width: 100%;
          height: 4px;
          appearance: none;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          outline: none;
          cursor: pointer;
          accent-color: #d4a361;
        }
        input[type='range'].gp-range::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #d4a361;
          box-shadow: 0 0 0 4px rgba(212,163,97,0.2);
          cursor: pointer;
          transition: box-shadow .15s;
        }
        input[type='range'].gp-range::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 6px rgba(212,163,97,0.25);
        }

        .gp-hint-box {
          display: flex;
          align-items: flex-start;
          gap: .75rem;
          background: rgba(212,163,97,0.06);
          border: 1px solid rgba(212,163,97,0.15);
          border-radius: .75rem;
          padding: .9rem 1rem;
          margin-top: 1.2rem;
        }
        .gp-hint-box span { font-size: 1.1rem; line-height: 1; flex-shrink: 0; }
        .gp-hint-box p { margin: 0; font-size: .8rem; color: rgba(212,163,97,.8); line-height: 1.5; }

        /* ── GENERATE BTN ── */
        .gp-btn-generate {
          width: 100%;
          padding: 1.1rem;
          border: none;
          border-radius: 1rem;
          background: #d4a361;
          color: #0e0e0f;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: .04em;
          cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 24px rgba(212,163,97,0.25);
          margin-bottom: .25rem;
        }
        .gp-btn-generate:hover:not(:disabled) {
          opacity: .9;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(212,163,97,0.35);
        }
        .gp-btn-generate:disabled {
          background: rgba(255,255,255,0.08);
          color: rgba(240,237,232,.25);
          cursor: not-allowed;
          box-shadow: none;
        }
        .gp-btn-inner { display: flex; align-items: center; justify-content: center; gap: .6rem; }
        .gp-spin { animation: gpSpin 1s linear infinite; width: 1.1rem; height: 1.1rem; }
        @keyframes gpSpin { to { transform: rotate(360deg); } }

        /* ── ALERTS ── */
        .gp-alert {
          display: flex;
          align-items: flex-start;
          gap: .75rem;
          padding: .9rem 1rem;
          border-radius: .75rem;
          font-size: .84rem;
          margin-top: .75rem;
        }
        .gp-alert svg { width: 1.1rem; height: 1.1rem; flex-shrink: 0; margin-top: .05rem; }
        .gp-alert-error {
          background: rgba(255,80,80,0.07);
          border: 1px solid rgba(255,80,80,0.2);
          color: rgba(255,150,150,.9);
        }
        .gp-alert-error svg { color: #ff5050; }
        .gp-alert-success {
          background: rgba(110,231,183,0.07);
          border: 1px solid rgba(110,231,183,0.2);
          color: rgba(110,231,183,.9);
        }
        .gp-alert-success svg { color: #6ee7b7; }

        /* ── PREVIEW PANEL ── */
        .gp-preview-card {
          background: #18181a;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.25rem;
          padding: 1.75rem;
          position: sticky;
          top: 1.5rem;
        }
        .gp-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .gp-preview-title { font-size: .92rem; font-weight: 600; color: #f0ede8; margin: 0; letter-spacing: .02em; }
        .gp-preview-sub { font-size: .73rem; color: rgba(240,237,232,.35); margin: .1rem 0 0; }
        .gp-coords-badge {
          font-family: 'DM Mono', monospace;
          font-size: .7rem;
          color: rgba(212,163,97,.7);
          background: rgba(212,163,97,0.08);
          border: 1px solid rgba(212,163,97,0.15);
          border-radius: .4rem;
          padding: .2rem .55rem;
          white-space: nowrap;
        }
        .gp-canvas-wrap {
          border-radius: .875rem;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
        }
        .gp-canvas-wrap canvas {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          cursor: crosshair;
        }
        .gp-canvas-overlay {
          position: absolute;
          bottom: .75rem;
          left: .75rem;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(8px);
          border-radius: .5rem;
          padding: .25rem .65rem;
          font-size: .7rem;
          color: rgba(240,237,232,.7);
          display: flex;
          align-items: center;
          gap: .3rem;
        }
        .gp-canvas-empty {
          aspect-ratio: 16/10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: .75rem;
          color: rgba(240,237,232,.2);
        }
        .gp-canvas-empty svg { width: 3rem; height: 3rem; opacity: .3; }
        .gp-canvas-empty p { font-size: .82rem; margin: 0; }

        /* ── FOOTER FEATURES ── */
        .gp-features {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          text-align: center;
        }
        @media (max-width: 600px) { .gp-features { grid-template-columns: 1fr; } }
        .gp-feat-icon {
          width: 2.75rem;
          height: 2.75rem;
          border: 1px solid rgba(212,163,97,0.2);
          border-radius: .75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto .9rem;
        }
        .gp-feat-icon svg { width: 1.25rem; height: 1.25rem; color: #d4a361; }
        .gp-feat-title { font-size: .9rem; font-weight: 600; color: #f0ede8; margin: 0 0 .3rem; }
        .gp-feat-desc { font-size: .78rem; color: rgba(240,237,232,.35); margin: 0; line-height: 1.5; }
      `}</style>

      <div className="gp-root">

        {/* ── HERO ── */}
        <header className="gp-hero">
          <div className="gp-hero-badge">
            <span>✦</span> Generador de Certificados
          </div>
          <h1>
            Certificados<br/>
            <em>en segundos</em>
          </h1>
          <p>
            Sube tu plantilla, posiciona el nombre y genera todos los certificados al instante.
          </p>
        </header>

        <div className="gp-divider" />

        {/* ── MAIN GRID ── */}
        <div className="gp-main">

          {/* ─ PANEL IZQUIERDO ─ */}
          <div>

            {/* 1. Plantilla */}
            <div className="gp-card">
              <div className="gp-card-header">
                <div className="gp-step-num">1</div>
                <div>
                  <p className="gp-card-title">Sube tu plantilla</p>
                  <p className="gp-card-sub">PNG o JPG — sin el nombre del estudiante</p>
                </div>
              </div>

              <div
                className={`gp-drop ${dragActive ? 'active-img' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  style={{ display: 'none' }}
                />

                {imagenPreview ? (
                  <div className="gp-drop-success">
                    <div className="gp-check-ring">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="gp-file-name">{fileName}</span>
                    <button
                      className="gp-change-btn"
                      onClick={(e) => { e.stopPropagation(); setImagen(null); setImagenPreview(null); setFileName(''); }}
                    >
                      Cambiar imagen
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="gp-drop-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p>Arrastra tu imagen aquí o <span className="gp-drop-btn">selecciona un archivo</span></p>
                    <p className="gp-drop-hint">PNG, JPG — hasta 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* 2. Excel */}
            <div className="gp-card">
              <div className="gp-card-header">
                <div className="gp-step-num">2</div>
                <div>
                  <p className="gp-card-title">Sube tu Excel</p>
                  <p className="gp-card-sub">Columnas: first_name, last_name, email</p>
                </div>
              </div>

              <div
                className={`gp-drop ${excelDragActive ? 'active-xls' : ''}`}
                onDragEnter={handleExcelDrag}
                onDragLeave={handleExcelDrag}
                onDragOver={handleExcelDrag}
                onDrop={handleExcelDrop}
                onClick={() => excelInputRef.current?.click()}
              >
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelChange}
                  style={{ display: 'none' }}
                />

                {excel ? (
                  <div className="gp-drop-success">
                    <div className="gp-check-ring">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="gp-file-name">{excelFileName}</span>
                    <button
                      className="gp-change-btn"
                      onClick={(e) => { e.stopPropagation(); setExcel(null); setExcelFileName(''); }}
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="gp-drop-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p>Arrastra tu Excel aquí o <span className="gp-drop-btn-green">selecciona un archivo</span></p>
                    <p className="gp-drop-hint">.xlsx, .xls, .csv</p>
                    <a
                      href="#"
                      className="gp-template-link"
                      onClick={(e) => {
                        e.preventDefault();
                        const template = "first_name,last_name,email,document_id\nJuan,Pérez,juan@email.com,12345\nMaría,García,maria@email.com,67890";
                        const blob = new Blob([template], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template_certificados.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      ↓ Descargar plantilla ejemplo
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* 3. Configurar texto */}
            <div className="gp-card">
              <div className="gp-card-header">
                <div className="gp-step-num">3</div>
                <div>
                  <p className="gp-card-title">Configura el texto</p>
                  <p className="gp-card-sub">Ajusta tamaño y posición en la imagen</p>
                </div>
              </div>

              <div className="gp-slider-row">
                <span className="gp-slider-label">Tamaño de fuente</span>
                <span className="gp-slider-val">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="gp-range"
              />

              <div className="gp-hint-box">
                <span>↖</span>
                <p>Haz click en la imagen de la derecha para posicionar el nombre del estudiante.</p>
              </div>
            </div>

            {/* Botón generar */}
            <button
              onClick={handleGenerar}
              disabled={loading || !imagen || !excel}
              className="gp-btn-generate"
            >
              {loading ? (
                <span className="gp-btn-inner">
                  <svg className="gp-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity=".25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando certificados…
                </span>
              ) : (
                'Generar certificados →'
              )}
            </button>

            {error && (
              <div className="gp-alert gp-alert-error">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="gp-alert gp-alert-success">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* ─ PANEL DERECHO — PREVIEW ─ */}
          <div className="gp-preview-card">
            <div className="gp-preview-header">
              <div>
                <p className="gp-preview-title">Vista previa</p>
                <p className="gp-preview-sub">Click en la imagen para posicionar el nombre</p>
              </div>
              {imagenPreview && (
                <span className="gp-coords-badge">
                  {Math.round(coordenadas.x)}, {Math.round(coordenadas.y)}
                </span>
              )}
            </div>

            <div className="gp-canvas-wrap">
              {imagenPreview ? (
                <>
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                  />
                  <div className="gp-canvas-overlay">
                    ✦ Click para mover posición
                  </div>
                </>
              ) : (
                <div className="gp-canvas-empty">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>La plantilla aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER FEATURES ── */}
        <div className="gp-features">
          <div>
            <div className="gp-feat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="gp-feat-title">Sin registro</p>
            <p className="gp-feat-desc">Genera certificados sin necesidad de crear una cuenta</p>
          </div>
          <div>
            <div className="gp-feat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="gp-feat-title">100% Gratis</p>
            <p className="gp-feat-desc">Genera todos los certificados que necesites, sin límites</p>
          </div>
          <div>
            <div className="gp-feat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <p className="gp-feat-title">Descarga ZIP</p>
            <p className="gp-feat-desc">Todos tus certificados comprimidos en un solo archivo</p>
          </div>
        </div>

      </div>
    </>
  );
}