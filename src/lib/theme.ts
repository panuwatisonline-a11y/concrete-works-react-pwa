export type ThemeMode = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'pour-theme'

export function readStoredTheme(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* ignore */
  }
  return 'dark'
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('light', mode === 'light')
  root.classList.toggle('dark', mode === 'dark')

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = mode === 'light' ? '#edf8f6' : '#1e1e1e'
}
