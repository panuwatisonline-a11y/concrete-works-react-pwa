import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, value, defaultValue, ...props }, ref) => {
    const isControlled = value !== undefined
    const filledFromValue = isControlled && String(value ?? '').trim() !== ''
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] min-w-0 max-w-full w-full rounded-xl border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 py-2.5 text-sm font-medium text-[color:var(--pour-ink-0)] backdrop-blur-xl placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none focus-visible:bg-white/75 focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50',
          '[&:not(:placeholder-shown)]:border-[#5eead4] [&:not(:placeholder-shown)]:bg-white',
          filledFromValue && 'border-[#5eead4] bg-white',
          className,
        )}
        ref={ref}
        {...props}
        {...(isControlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
