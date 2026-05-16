import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#111827] text-white',
        secondary: 'border-[color:var(--pour-surface-border)] bg-[#dcfce7] text-[#374151]',
        destructive: 'border-transparent bg-[#dc2626] text-white',
        outline: 'border-[color:var(--pour-surface-border)] bg-white text-[#111827]',
        success: 'border-[rgba(22,163,74,0.28)] bg-[rgba(22,163,74,0.10)] text-[#16a34a]',
        warning: 'border-[rgba(217,119,6,0.28)] bg-[rgba(217,119,6,0.10)] text-[#d97706]',
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
