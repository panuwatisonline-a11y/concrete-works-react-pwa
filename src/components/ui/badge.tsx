import * as React from 'react'
import Chip from '@mui/material/Chip'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva('', {
  variants: {
    variant: {
      default: '',
      secondary: '',
      destructive: '',
      outline: '',
      success: '',
      warning: '',
    },
  },
  defaultVariants: { variant: 'default' },
})

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

const VARIANT_PROPS: Record<
  BadgeVariant,
  { color?: 'default' | 'primary' | 'secondary' | 'error' | 'success' | 'warning'; variant?: 'filled' | 'outlined' }
> = {
  default: { color: 'primary', variant: 'filled' },
  secondary: { color: 'default', variant: 'filled' },
  destructive: { color: 'error', variant: 'filled' },
  outline: { color: 'default', variant: 'outlined' },
  success: { color: 'success', variant: 'filled' },
  warning: { color: 'warning', variant: 'filled' },
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const chipProps = VARIANT_PROPS[variant ?? 'default']
  return (
    <Chip
      size="small"
      label={children}
      className={className}
      {...chipProps}
      {...(props as object)}
    />
  )
}

export { Badge, badgeVariants }
