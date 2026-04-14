// src/styles/components.js — Componentes reutilizables

import { colors, radius } from './theme'

export const inputStyles = {
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
}

export const headerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
}

export const buttonStyles = {
  primary: {
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
  ghost: {
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
  small: {
    padding: '.5rem .75rem',
    fontSize: '12px',
    borderRadius: '8px',
  },
}

export const cardStyles = {
  container: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: '1.5rem',
    transition: 'border-color .2s',
  },
  hover: {
    cursor: 'pointer',
  },
}

export const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
}

export const alertStyles = {
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: '.6rem',
    background: colors.greenMuted,
    border: `1px solid ${colors.greenBorder}`,
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: colors.mint,
    marginBottom: '1rem',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '.6rem',
    background: colors.redMuted,
    border: `1px solid ${colors.redBorder}`,
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: 'rgba(255,150,150,.9)',
    marginBottom: '1rem',
  },
  warning: {
    display: 'flex',
    alignItems: 'center',
    gap: '.6rem',
    background: colors.amberMuted,
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: colors.amber,
    marginBottom: '1rem',
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '.6rem',
    background: colors.blueMuted,
    border: `1px solid ${colors.blueBorder}`,
    borderRadius: radius.md,
    padding: '.75rem 1rem',
    fontSize: '13px',
    color: colors.blue,
    marginBottom: '1rem',
  },
}

export const labelStyles = {
  container: {
    display: 'block',
    fontSize: '11px',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: '6px',
    fontFamily: "'DM Sans', sans-serif",
  },
  required: {
    color: colors.red,
    marginLeft: '2px',
  },
}

export const progressBarStyles = {
  container: {
    width: '100%',
    height: '8px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '99px',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    background: colors.gold,
    borderRadius: '99px',
    transition: 'width .3s ease',
  },
}

export const sectionTitleStyles = {
  main: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colors.text,
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: colors.textMuted,
    marginBottom: '0.5rem',
  },
}

export const textStyles = {
  heading: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: colors.text,
  },
  body: {
    fontSize: '14px',
    color: colors.textMuted,
    lineHeight: 1.6,
  },
  small: {
    fontSize: '12px',
    color: colors.textDim,
  },
  link: {
    color: colors.gold,
    textDecoration: 'none',
    cursor: 'pointer',
  },
}

export const statusColors = {
  pending: {
    color: colors.amber,
    background: colors.amberMuted,
    border: 'rgba(245,158,11,0.25)',
  },
  generated: {
    color: colors.blue,
    background: colors.blueMuted,
    border: colors.blueBorder,
  },
  sent: {
    color: colors.mint,
    background: colors.mintMuted,
    border: colors.mintBorder,
  },
  failed: {
    color: colors.red,
    background: colors.redMuted,
    border: colors.redBorder,
  },
  active: {
    color: colors.green,
    background: colors.greenMuted,
    border: colors.greenBorder,
  },
  inactive: {
    color: colors.textDim,
    background: 'rgba(255,255,255,0.04)',
    border: colors.border,
  },
}