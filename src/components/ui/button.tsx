import * as React from 'react'
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

/** Kept for type-only consumers (e.g. requestQuickActions) */
const buttonVariants = cva('', {
  variants: {
    variant: {
      default: '',
      destructive: '',
      outline: '',
      secondary: '',
      ghost: '',
      link: '',
      warning: '',
      success: '',
    },
    size: {
      default: '',
      sm: '',
      action: '',
      modalAction: '',
      lg: '',
      icon: '',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>

const VARIANT_MAP: Record<
  ButtonVariant,
  Pick<MuiButtonProps, 'variant' | 'color'> & { sx?: MuiButtonProps['sx'] }
> = {
  default: { variant: 'contained', color: 'primary' },
  destructive: { variant: 'contained', color: 'error' },
  outline: { variant: 'outlined', color: 'inherit' },
  secondary: { variant: 'outlined', color: 'inherit' },
  ghost: { variant: 'text', color: 'inherit' },
  link: { variant: 'text', color: 'primary', sx: { textDecoration: 'underline', textUnderlineOffset: 2 } },
  warning: { variant: 'contained', sx: { bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } } },
  success: { variant: 'contained', sx: { bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } } },
}

const SIZE_MAP: Record<ButtonSize, MuiButtonProps['size']> = {
  default: 'medium',
  sm: 'small',
  action: 'small',
  modalAction: 'small',
  lg: 'large',
  icon: 'medium',
}

const SIZE_SX: Record<ButtonSize, MuiButtonProps['sx']> = {
  default: { minHeight: 40, px: 2 },
  sm: { minHeight: 36, fontSize: '0.75rem' },
  action: { minHeight: 36, fontSize: '0.75rem', px: 1.75 },
  modalAction: { minHeight: 32, fontSize: '0.75rem', px: 1.5 },
  lg: { minHeight: 44, px: 3 },
  icon: { minWidth: 40, width: 40, height: 40, p: 0 },
}

export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'color' | 'size'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, sx, children, ...props }, ref) => {
    const mapped = VARIANT_MAP[variant ?? 'default']
    const muiSize = SIZE_MAP[size ?? 'default']
    const sizeSx = SIZE_SX[size ?? 'default']
    const { sx: mappedSx, ...mappedProps } = mapped

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string; ref?: React.Ref<HTMLButtonElement> }>
      return React.cloneElement(child, {
        ref,
        className: cn(className, child.props.className),
        ...props,
      })
    }

    return (
      <MuiButton
        ref={ref}
        size={muiSize}
        className={className}
        {...mappedProps}
        sx={[sizeSx, mappedSx, sx] as MuiButtonProps['sx']}
        {...props}
      >
        {children}
      </MuiButton>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
