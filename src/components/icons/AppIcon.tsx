import type { SxProps, Theme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

export const ICON_FONT_SIZE = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 24,
} as const

export type IconSize = keyof typeof ICON_FONT_SIZE

/** MUI icon ขนาดมาตรฐานทั้งแอป (แทน Lucide) */
export function AppIcon({
  icon: Icon,
  size = 'md',
  sx,
  className,
}: {
  icon: SvgIconComponent
  size?: IconSize
  sx?: SxProps<Theme>
  className?: string
}) {
  return (
    <Icon
      className={className}
      aria-hidden
      sx={{ fontSize: ICON_FONT_SIZE[size], flexShrink: 0, ...sx }}
    />
  )
}
