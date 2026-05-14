import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f6f8] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#2563eb] text-white shadow-[0_1px_2px_rgba(37,99,235,0.25),0_4px_12px_rgba(37,99,235,0.18)] hover:bg-[#1d4ed8] active:translate-y-px',
        destructive: 'bg-[#dc2626] text-white shadow-sm hover:bg-[#b91c1c] active:translate-y-px',
        outline:
          'border-[1.5px] border-[#e2e6ec] bg-white text-[#111827] shadow-none hover:bg-[#f0f2f5] hover:border-[#c8ced8] active:translate-y-px',
        secondary: 'bg-[#f0f2f5] text-[#111827] shadow-none hover:bg-[#e8ebf0] active:translate-y-px',
        ghost: 'rounded-xl text-[#374151] hover:bg-[#f0f2f5]',
        link: 'rounded-xl font-semibold text-[#2563eb] underline-offset-2 hover:text-[#1d4ed8] hover:underline',
        warning: 'bg-[#111827] text-white shadow-sm hover:bg-[#030712] active:translate-y-px',
        success:
          'bg-[#2563eb] text-white shadow-[0_1px_2px_rgba(37,99,235,0.25),0_4px_12px_rgba(37,99,235,0.18)] hover:bg-[#1d4ed8] active:translate-y-px',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-xl px-3 text-xs',
        lg: 'h-12 rounded-xl px-6 text-[15px]',
        icon: 'h-10 w-10 rounded-xl',
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
