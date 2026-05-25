import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { THEME_VARIANTS, type ThemeVariant } from '@/lib/theme'
import { useThemeStore } from '@/stores/themeStore'

interface ThemeToggleProps {
  className?: string
  /** แบบกะทัดรัดสำหรับ footer ที่ยุบได้ */
  compact?: boolean
}

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const variant = useThemeStore((s) => s.variant)
  const setVariant = useThemeStore((s) => s.setVariant)

  return (
    <Box className={className}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: compact ? 0.5 : 0.75, px: 0.5, fontSize: compact ? 10 : undefined }}
      >
        ธีมสี
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={variant}
        aria-label="เลือกธีมสี"
        sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: compact ? 0.35 : 0.5 }}
        onChange={(_e, value: ThemeVariant | null) => {
          if (value) setVariant(value)
        }}
      >
        {THEME_VARIANTS.map((t) => (
          <ToggleButton
            key={t.id}
            value={t.id}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              py: compact ? 0.4 : 0.75,
              fontSize: compact ? 11 : undefined,
              minHeight: compact ? 30 : undefined,
            }}
          >
            {t.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
