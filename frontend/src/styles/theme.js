// src/styles/theme.js — Sistema de diseño CertifyPro

export const colors = {
  bg:        '#0e0e0f',
  surface:   '#18181a',
  surfaceAlt:'#1e1e28',
  border:    'rgba(255,255,255,0.07)',
  borderHover:'rgba(212,163,97,0.25)',
  gold:      '#d4a361',
  goldMuted: 'rgba(212,163,97,0.15)',
  goldBorder:'rgba(212,163,97,0.25)',
  goldLight: '#e6c98a',
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
  purple:    '#a78bfa',
  purpleMuted:'rgba(167,139,250,0.1)',
}

export const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
`

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
}

// ═══════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════
export const animations = {
  fadeIn: 'fadeIn 0.3s ease',
  slideUp: 'slideUp 0.4s ease',
  pulse: 'pulse 2s infinite',
  shimmer: 'shimmer 3s infinite',
  float: 'float 6s ease-in-out infinite',
}

export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(212,163,97,0.2); }
    50% { box-shadow: 0 0 40px rgba(212,163,97,0.4); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .cp-spin { animation: spin 1s linear infinite; }
`

// ═══════════════════════════════════════════════════════════════
// BACKGROUND EFFECTS
// ═══════════════════════════════════════════════════════════════
export const backgrounds = {
  grid: {
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
  },
  glowGold: (size = '600px') => ({
    background: `radial-gradient(ellipse, rgba(212,163,97,0.15) 0%, transparent 70%)`,
    width: size,
    height: '300px',
  }),
  glowMint: (size = '320px') => ({
    background: `radial-gradient(circle, rgba(110,231,183,0.08) 0%, transparent 65%)`,
    width: size,
    height: size,
  }),
  glowPurple: (size = '280px') => ({
    background: `radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 65%)`,
    width: size,
    height: size,
  }),
  card: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceAlt} 100%)`,
  cardHover: `linear-gradient(135deg, ${colors.surfaceAlt} 0%, ${colors.surface} 100%)`,
}

// ═══════════════════════════════════════════════════════════════
// BUTTONS
// ═══════════════════════════════════════════════════════════════
export const buttons = {
  primary: {
    padding: '.9rem 1.5rem',
    background: colors.gold,
    color: colors.bg,
    border: 'none',
    borderRadius: radius.md,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(212,163,97,0.25)',
    transition: 'all 0.25s ease',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  secondary: {
    padding: '.9rem 1.5rem',
    background: 'rgba(255,255,255,0.05)',
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    outline: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  ghost: {
    padding: '.6rem 1rem',
    background: 'rgba(255,255,255,0.03)',
    color: colors.textMuted,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  icon: {
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '0.6rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

// ═══════════════════════════════════════════════════════════════
// CARDS
// ═══════════════════════════════════════════════════════════════
export const cards = {
  container: {
    background: backgrounds.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  hover: {
    cursor: 'pointer',
    borderColor: colors.goldBorder,
    boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
  },
  highlight: {
    background: backgrounds.card,
    border: `1px solid ${colors.goldBorder}`,
    borderRadius: radius.lg,
    padding: '1.5rem',
    boxShadow: `0 0 30px ${colors.goldMuted}`,
  },
}

// ═══════════════════════════════════════════════════════════════
// INPUTS
// ═══════════════════════════════════════════════════════════════
export const inputs = {
  text: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '12px 16px',
    color: colors.text,
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    colorScheme: 'dark',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  file: {
    background: 'rgba(255,255,255,0.02)',
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.md,
    padding: '2rem',
    color: colors.textMuted,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
  },
  select: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '12px 16px',
    color: colors.text,
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
}

// ═══════════════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════════════
export const alerts = {
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: colors.greenMuted,
    border: `1px solid ${colors.greenBorder}`,
    borderRadius: radius.md,
    padding: '1rem 1.25rem',
    fontSize: '14px',
    color: colors.mint,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: colors.redMuted,
    border: `1px solid ${colors.redBorder}`,
    borderRadius: radius.md,
    padding: '1rem 1.25rem',
    fontSize: '14px',
    color: '#ff9999',
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: colors.amberMuted,
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: radius.md,
    padding: '1rem 1.25rem',
    fontSize: '14px',
    color: colors.amber,
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: colors.blueMuted,
    border: `1px solid ${colors.blueBorder}`,
    borderRadius: radius.md,
    padding: '1rem 1.25rem',
    fontSize: '14px',
    color: colors.blue,
  },
}

// ═══════════════════════════════════════════════════════════════
// BADGES & STATUS
// ═══════════════════════════════════════════════════════════════
export const badges = {
  pill: {
    padding: '0.35rem 0.85rem',
    borderRadius: radius.full,
    fontSize: '12px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
}

export const statusConfig = {
  pending:   { label: 'Pendiente', color: colors.amber,  bg: colors.amberMuted,  border: 'rgba(245,158,11,0.25)' },
  generated: { label: 'Generado',  color: colors.blue,   bg: colors.blueMuted,   border: colors.blueBorder },
  sent:      { label: 'Enviado',   color: colors.mint,   bg: colors.mintMuted,   border: colors.mintBorder },
  failed:    { label: 'Fallido',   color: colors.red,    bg: colors.redMuted,    border: colors.redBorder },
  active:    { label: 'Activo',     color: colors.green,  bg: colors.greenMuted,  border: colors.greenBorder },
  inactive:  { label: 'Inactivo',  color: colors.textDim, bg: 'rgba(255,255,255,0.04)', border: colors.border },
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT HELPERS
// ═══════════════════════════════════════════════════════════════
export const layout = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  section: {
    padding: '2.5rem 0',
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: (cols = 3, gap = '1.5rem') => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: gap,
  }),
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════
export const typography = {
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2.5rem',
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '2rem',
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.3,
  },
  h3: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.text,
    lineHeight: 1.4,
  },
  body: {
    fontSize: '14px',
    color: colors.textMuted,
    lineHeight: 1.6,
  },
  small: {
    fontSize: '12px',
    color: colors.textDim,
    lineHeight: 1.5,
  },
  label: {
    fontSize: '11px',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: colors.textMuted,
  },
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════════════
export const globalCSS = `
  ${fonts}
  ${keyframes}

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'DM Sans', sans-serif;
    background: ${colors.bg};
    color: ${colors.text};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

  a { color: inherit; text-decoration: none; }

  ::selection {
    background: ${colors.goldMuted};
    color: ${colors.text};
  }
`

// Export everything as styles for compatibility
export const styles = {
  card: cards.container,
  input: inputs.text,
  label: typography.label,
  btnPrimary: buttons.primary,
  btnGhost: buttons.ghost,
  alertSuccess: alerts.success,
  alertError: alerts.error,
}

export const sectionStyles = {
  main: { minHeight: '100vh', padding: '2rem 1.5rem', background: colors.bg },
  container: layout.container,
  header: { marginBottom: '2rem' },
  grid: layout.grid(),
}