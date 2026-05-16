import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[color:var(--pour-accent)] text-white',
        secondary: 'border-[color:var(--glass-border)] bg-[color:var(--glass-bg-muted)] text-[color:var(--pour-ink-1)]',
        destructive: 'border-transparent bg-[#dc2626] text-white',
        outline: 'border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] text-[color:var(--pour-ink-0)]',
        success: 'border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.12)] text-[#4ade80]',
        warning: 'border-[rgba(251,191,36,0.35)] bg-[rgba(251,191,36,0.12)] text-[#fbbf24]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
