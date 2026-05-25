export type ThemeVariant = 'dark' | 'light' | 'green' | 'pink'

/** @deprecated Use ThemeVariant */
export type ColorMode = ThemeVariant
/** @deprecated Use ThemeVariant */
export type ThemeMode = ThemeVariant

export type AppTheme = {
  variant: ThemeVariant
}

export const THEME_STORAGE_KEY = 'cw-theme'
export const LEGACY_THEME_STORAGE_KEY = 'pour-theme'

export const THEME_VARIANTS: ReadonlyArray<{ id: ThemeVariant; label: string }> = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'green', label: 'Green' },
  { id: 'pink', label: 'Pink' },
]

const DEFAULT_THEME: AppTheme = { variant: 'dark' }

const META_THEME_COLOR: Record<ThemeVariant, string> = {
  dark: '#1e1e1e',
  light: '#f5f9fc',
  green: '#effaf6',
  pink: '#fff5f9',
}

const VARIANTS: ThemeVariant[] = ['dark', 'light', 'green', 'pink']

function isThemeVariant(value: string): value is ThemeVariant {
  return (VARIANTS as string[]).includes(value)
}

function parseStoredJson(raw: string): AppTheme | null {
  try {
    const parsed = JSON.parse(raw) as { variant?: string; mode?: string }
    if (typeof parsed.variant === 'string' && isThemeVariant(parsed.variant)) {
      return { variant: parsed.variant }
    }
    if (typeof parsed.mode === 'string') {
      if (parsed.mode === 'dark') return { variant: 'dark' }
      if (parsed.mode === 'light') return { variant: 'pink' }
    }
  } catch {
    /* ignore */
  }
  return null
}

export function isDarkVariant(variant: ThemeVariant): boolean {
  return variant === 'dark'
}

export function readStoredTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) {
      const fromJson = parseStoredJson(raw)
      if (fromJson) return fromJson
    }

    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (legacy === 'light') return { variant: 'pink' }
    if (legacy === 'dark') return { variant: 'dark' }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

export function persistTheme(theme: AppTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement
  const isDark = isDarkVariant(theme.variant)

  root.dataset.theme = theme.variant
  root.classList.toggle('dark', isDark)
  root.classList.toggle('light', !isDark)

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = META_THEME_COLOR[theme.variant]
}
