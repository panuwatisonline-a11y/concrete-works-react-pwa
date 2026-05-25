import type { SxProps, Theme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

/** rem — scales with fluid root font-size on desktop */
export const ICON_FONT_SIZE = {
  xs: '1rem',
  sm: '1.125rem',
  md: '1.25rem',
  lg: '1.5rem',
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
