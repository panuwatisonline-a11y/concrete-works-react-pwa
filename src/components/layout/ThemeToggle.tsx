import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { THEME_VARIANTS, type ThemeVariant } from '@/lib/theme'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const variant = useThemeStore((s) => s.variant)
  const setVariant = useThemeStore((s) => s.setVariant)

  return (
    <Box className={className}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, px: 0.5 }}>
        ธีมสี
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={variant}
        aria-label="เลือกธีมสี"
        sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}
        onChange={(_e, value: ThemeVariant | null) => {
          if (value) setVariant(value)
        }}
      >
        {THEME_VARIANTS.map((t) => (
          <ToggleButton
            key={t.id}
            value={t.id}
            sx={{ textTransform: 'none', fontWeight: 600, py: 0.75 }}
          >
            {t.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
