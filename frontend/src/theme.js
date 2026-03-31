// src/theme.js — Sistema de diseño CertifyPro

export const colors = {
  bg:        '#0e0e0f',
  surface:   '#18181a',
  surfaceAlt:'#1e1e28',
  border:    'rgba(255,255,255,0.07)',
  borderHover:'rgba(212,163,97,0.25)',
  gold:      '#d4a361',
  goldMuted: 'rgba(212,163,97,0.15)',
  goldBorder:'rgba(212,163,97,0.25)',
  mint:      '#6ee7b7',
  mintMuted: 'rgba(110,231,183,0.12)',
  mintBorder:'rgba(110,231,183,0.25)',
  text:      '#f0ede8',
  textMuted: 'rgba(240,237,232,0.4)',
  textDim:   'rgba(240,237,232,0.2)',
  red:       '#ff5050',
  redMuted:  'rgba(255,80,80,0.08)',
  redBorder: 'rgba(255,80,80,0.2)',
  blue:      '#60a5fa',
  blueMuted: 'rgba(59,130,246,0.1)',
  blueBorder:'rgba(59,130,246,0.25)',
  amber:     '#f59e0b',
  amberMuted:'rgba(245,158,11,0.1)',
  green:     '#22c55e',
  greenMuted:'rgba(34,197,94,0.1)',
  greenBorder:'rgba(34,197,94,0.2)',
}

export const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
`

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
}

// Estilos reutilizables como objetos JS (para style={})
export const styles = {
  card: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '11px 14px',
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    colorScheme: 'dark',
    boxSizing: 'border-box',
    transition: 'border-color .2s, box-shadow .2s',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: '6px',
    fontFamily: "'DM Sans', sans-serif",
  },
  btnPrimary: {
    width: '100%',
    padding: '.9rem',
    background: colors.gold,
    color: colors.bg,
    border: 'none',
    borderRadius: radius.md,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(212,163,97,0.22)',
    transition: 'opacity .2s, transform .15s, box-shadow .2s',
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textMuted,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'opacity .2s',
    padding: '.55rem 1rem',
  },
  alertSuccess: {
    display: 'flex', alignItems: 'center', gap: '.6rem',
    background: colors.greenMuted,
    border: `1px solid ${colors.greenBorder}`,
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: colors.mint,
    marginBottom: '1rem',
  },
  alertError: {
    display: 'flex', alignItems: 'center', gap: '.6rem',
    background: colors.redMuted,
    border: `1px solid ${colors.redBorder}`,
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: 'rgba(255,150,150,.9)',
    marginBottom: '1rem',
  },
}

// CSS global compartido (inyectar una sola vez en App)
export const globalCSS = `
  ${fonts}

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'DM Sans', sans-serif;
    background: ${colors.bg};
    color: ${colors.text};
    -webkit-font-smoothing: antialiased;
  }

  .cp-input:focus {
    border-color: rgba(212,163,97,0.45) !important;
    background: rgba(212,163,97,0.04) !important;
    box-shadow: 0 0 0 3px rgba(212,163,97,0.08) !important;
  }

  .cp-btn-primary:hover:not(:disabled) {
    opacity: .88;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(212,163,97,0.3) !important;
  }
  .cp-btn-primary:active:not(:disabled) { transform: scale(.98); }
  .cp-btn-primary:disabled { opacity: .35; cursor: not-allowed; }

  .cp-btn-ghost:hover { opacity: .7; }

  .cp-card:hover { border-color: rgba(212,163,97,0.18) !important; }

  .cp-drop-zone {
    border: 1.5px dashed rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 2.5rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color .2s, background .2s;
    background: transparent;
  }
  .cp-drop-zone:hover,
  .cp-drop-zone.active {
    border-color: rgba(212,163,97,0.4);
    background: rgba(212,163,97,0.03);
  }

  .cp-spin { animation: cpSpin 1s linear infinite; }
  @keyframes cpSpin { to { transform: rotate(360deg); } }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
`

// Status badges (para Certificados)
export const statusConfig = {
  pending:   { label: 'Pendiente', color: colors.amber,  bg: colors.amberMuted,  border: 'rgba(245,158,11,0.25)' },
  generated: { label: 'Generado',  color: colors.blue,   bg: colors.blueMuted,   border: colors.blueBorder },
  sent:      { label: 'Enviado',   color: colors.mint,   bg: colors.mintMuted,   border: colors.mintBorder },
  failed:    { label: 'Fallido',   color: colors.red,    bg: colors.redMuted,    border: colors.redBorder },
}