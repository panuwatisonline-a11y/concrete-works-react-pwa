import { create } from 'zustand'
import {
  applyTheme,
  isDarkVariant,
  persistTheme,
  readStoredTheme,
  type AppTheme,
  type ThemeVariant,
} from '@/lib/theme'

interface ThemeState extends AppTheme {
  setTheme: (theme: AppTheme) => void
  setVariant: (variant: ThemeVariant) => void
}

function commit(theme: AppTheme, set: (partial: AppTheme) => void) {
  applyTheme(theme)
  persistTheme(theme)
  set(theme)
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = readStoredTheme()
  return {
    variant: initial.variant,
    setTheme: (theme) => commit(theme, set),
    setVariant: (variant) => commit({ variant }, set),
  }
})

/** Charts / canvas that branch on dark vs light */
export function useIsDarkTheme(): boolean {
  return useThemeStore((s) => isDarkVariant(s.variant))
}
