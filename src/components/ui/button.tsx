import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'pour-interactive inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--pour-bg)] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'bg-[color:var(--pour-accent)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_3px_12px_rgba(0,0,0,0.08)] hover:bg-[color:var(--pour-accent-hover)]',
        destructive:
          'bg-[#dc2626] text-white shadow-sm hover:bg-[#b91c1c]',
        outline:
          'border border-[color:var(--glass-border-subtle)] bg-[color:color-mix(in_srgb,var(--glass-bg)_88%,transparent)] text-[color:var(--pour-ink-0)] backdrop-blur-md shadow-none hover:border-[color:var(--glass-edge)] hover:bg-[color:var(--glass-bg-strong)]',
        secondary:
          'border border-[color:var(--glass-border-subtle)] bg-[var(--pour-bg-2)] text-[color:var(--pour-ink-0)] shadow-none hover:bg-[var(--pour-line)]',
        ghost:
          'text-[color:var(--pour-ink-1)] hover:bg-neutral-900/[0.06]',
        link:
          'font-semibold text-[color:var(--pour-accent)] underline-offset-2 hover:text-[color:var(--pour-accent-hover)] hover:underline',
        warning:
          'bg-[#d97706] text-white shadow-sm hover:bg-[#b45309]',
        success:
          'bg-[#16a34a] text-white shadow-sm hover:bg-[#15803d]',
      },
      size: {
        default: 'h-10 px-4 text-sm',
        sm: 'h-9 px-3 text-xs',
        action: 'h-9 min-h-9 px-3.5 text-xs leading-tight',
        /** Dialog / confirm modals — compact footer actions */
        modalAction: 'h-8 min-h-8 px-3 text-xs leading-tight',
        lg: 'h-11 px-6 text-sm',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
