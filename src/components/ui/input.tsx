import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, value, defaultValue, ...props }, ref) => {
    const isControlled = value !== undefined
    const filledFromValue = isControlled && String(value ?? '').trim() !== ''
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 min-w-0 max-w-full w-full rounded-xl border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 py-2 text-[15px] font-medium text-[color:var(--pour-ink-0)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none focus-visible:bg-white/75 focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50',
          '[&:not(:placeholder-shown)]:border-[color:var(--pour-accent)] [&:not(:placeholder-shown)]:bg-white',
          filledFromValue && 'border-[color:var(--pour-accent)] bg-white',
          className,
        )}
        ref={ref}
        {...props}
        {...(isControlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
