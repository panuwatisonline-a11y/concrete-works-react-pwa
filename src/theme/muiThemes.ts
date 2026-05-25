import { createTheme, alpha, type Theme } from '@mui/material/styles'
import type { ThemeVariant } from '@/lib/theme'

const FONT =
  '"LINE Seed Sans", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'

/** Matches src/styles/fluid-typography.css — root rem on desktop landscape */
const FLUID_HTML_FONT_SIZE =
  'clamp(13px, calc(13px + (15px - 13px) * ((100vw - 48rem) / 42)), 15px)'

const shared = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: FONT,
    htmlFontSize: 16,
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          '@media (orientation: landscape) and (min-width: 768px)': {
            fontSize: FLUID_HTML_FONT_SIZE,
          },
        },
        body: {
          overflow: 'hidden',
          height: '100dvh',
          margin: 0,
          fontFamily: FONT,
          WebkitFontSmoothing: 'antialiased',
        },
        '#root': {
          height: '100dvh',
          minHeight: 0,
          overflow: 'hidden',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 600, textTransform: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16, margin: 12 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' as const, fullWidth: true },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: 'none' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
}

const SIDEBAR: Record<ThemeVariant, string> = {
  dark: '#181818',
  light: '#fafcfe',
  green: '#e8f7f2',
  pink: '#fff0f6',
}

/** Dark — ดำ ฟ้า (ค่าเริ่มต้น) */
const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#18a0fb', dark: '#0d8ce8', light: '#3db3fc', contrastText: '#fff' },
  secondary: { main: '#5eb8ff', contrastText: '#0f172a' },
  error: { main: '#ef4444' },
  warning: { main: '#f59e0b' },
  success: { main: '#22c55e' },
  background: { default: '#1e1e1e', paper: '#262626' },
  text: { primary: '#ffffff', secondary: '#a3a3a3', disabled: '#737373' },
  divider: '#383838',
}

/** Light — ขาว ฟ้า */
const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#18a0fb', dark: '#0d8ce8', light: '#5eb8ff', contrastText: '#fff' },
  secondary: { main: '#7ec8f8', dark: '#5eb0e8', light: '#a8dcff', contrastText: '#1e3a5f' },
  error: { main: '#dc2626' },
  warning: { main: '#d97706' },
  success: { main: '#16a34a' },
  background: { default: '#f5f9fc', paper: '#ffffff' },
  text: { primary: '#1e3a5f', secondary: '#4a6b8a', disabled: '#8aa3b8' },
  divider: '#c5d9eb',
}

/** Green — พาสเทลมินท์ */
const greenPalette = {
  mode: 'light' as const,
  primary: { main: '#5BB89A', dark: '#48A887', light: '#7DD4B8', contrastText: '#fff' },
  secondary: { main: '#A8E6CF', dark: '#8AD4B8', light: '#C8F0DE', contrastText: '#2D4A42' },
  error: { main: '#E11D48' },
  warning: { main: '#D97706' },
  success: { main: '#059669' },
  background: { default: '#EFFAF6', paper: '#F8FDFB' },
  text: { primary: '#2D4A42', secondary: '#5A7A6E', disabled: '#8FA89C' },
  divider: '#C5E8DC',
}

/** Pink — พาสเทลชมพู */
const pinkPalette = {
  mode: 'light' as const,
  primary: { main: '#E88CAD', dark: '#D67598', light: '#F5B8CC', contrastText: '#fff' },
  secondary: { main: '#D8B4E2', dark: '#C49BD4', light: '#E8D0EF', contrastText: '#4D3344' },
  error: { main: '#E11D48' },
  warning: { main: '#D97706' },
  success: { main: '#059669' },
  background: { default: '#FFF5F9', paper: '#FFFAFC' },
  text: { primary: '#4D3344', secondary: '#7A5C6E', disabled: '#A8959F' },
  divider: '#F3D6E4',
}

const schemes = {
  dark: darkPalette,
  light: lightPalette,
  green: greenPalette,
  pink: pinkPalette,
}

const themeCache = new Map<ThemeVariant, Theme>()

export function getMuiTheme(variant: ThemeVariant): Theme {
  const cached = themeCache.get(variant)
  if (cached) return cached

  const theme = createTheme({
    ...shared,
    palette: schemes[variant],
  })
  themeCache.set(variant, theme)
  return theme
}

/** Map MUI palette → legacy --pour-* for layout / Tailwind shells */
export function syncPourCssVars(theme: Theme, variant: ThemeVariant) {
  const p = theme.palette
  const root = document.documentElement
  const isLight = p.mode === 'light'

  root.style.setProperty('--pour-bg', p.background?.default ?? '')
  root.style.setProperty('--pour-bg-2', p.background?.paper ?? '')
  root.style.setProperty('--pour-sidebar', SIDEBAR[variant])
  root.style.setProperty('--pour-cream', p.background?.default ?? '')
  root.style.setProperty('--pour-ink-0', p.text?.primary ?? '')
  root.style.setProperty('--pour-ink-1', p.text?.primary ?? '')
  root.style.setProperty('--pour-ink-2', p.text?.secondary ?? '')
  root.style.setProperty('--pour-ink-3', p.text?.disabled ?? '')
  root.style.setProperty('--pour-accent', p.primary?.main ?? '')
  root.style.setProperty('--pour-accent-hover', p.primary?.dark ?? p.primary?.main ?? '')
  root.style.setProperty('--pour-accent-muted', alpha(p.primary?.main ?? '#000', isLight ? 0.14 : 0.16))
  root.style.setProperty('--pour-accent-ring', alpha(p.primary?.main ?? '#000', isLight ? 0.32 : 0.38))
  root.style.setProperty('--pour-brand', p.secondary?.main ?? '')
  root.style.setProperty('--pour-brand-hover', p.secondary?.dark ?? p.secondary?.main ?? '')
  root.style.setProperty('--pour-line', p.divider ?? '')
  root.style.setProperty('--pour-surface-border', p.divider ?? '')
  root.style.setProperty('--glass-bg', p.background?.paper ?? '')
  root.style.setProperty('--glass-border-subtle', p.divider ?? '')
  root.style.setProperty('--glass-border', p.divider ?? '')
  root.style.setProperty('--chart-grid', p.divider ?? '')
  root.style.setProperty('--chart-surface', p.background?.paper ?? '')
  root.style.setProperty('--chart-axis', p.text?.disabled ?? '')
  root.style.setProperty('--chart-label', p.text?.secondary ?? '')
  root.style.setProperty('--chart-label-strong', p.text?.primary ?? '')
  root.style.setProperty('--chart-dim', p.divider ?? '')
  root.style.setProperty('--chart-cursor', p.text?.secondary ?? '')
  root.style.setProperty('--chart-pie-stroke', p.background?.paper ?? '')
  root.style.setProperty(
    '--chart-tooltip-cursor',
    alpha(p.primary?.main ?? '#000', isLight ? 0.1 : 0.14),
  )
}
