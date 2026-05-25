import { useEffect, useMemo } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import { applyTheme } from '@/lib/theme'
import { useThemeStore } from '@/stores/themeStore'
import { getMuiTheme, syncPourCssVars } from '@/theme/muiThemes'

function ThemeCssBridge() {
  const theme = useTheme()
  const variant = useThemeStore((s) => s.variant)
  useEffect(() => {
    syncPourCssVars(theme, variant)
  }, [theme, variant])
  return null
}

function HtmlThemeSync() {
  const variant = useThemeStore((s) => s.variant)

  useEffect(() => {
    applyTheme({ variant })
  }, [variant])

  return null
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const variant = useThemeStore((s) => s.variant)
  const theme = useMemo(() => getMuiTheme(variant), [variant])

  return (
    <ThemeProvider theme={theme} storageManager={null} disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      <HtmlThemeSync />
      <ThemeCssBridge />
      {children}
    </ThemeProvider>
  )
}
