import * as React from 'react'
import { cn } from '@/lib/utils'

const NATIVE_DATE_INPUT_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week'])

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, value, defaultValue, ...props }, ref) => {
    const isControlled = value !== undefined
    const filledFromValue = isControlled && String(value ?? '').trim() !== ''
    const isNativeDateInput = type != null && NATIVE_DATE_INPUT_TYPES.has(type)
    const inputClassName = cn(
      'flex h-10 min-w-0 max-w-full w-full items-center rounded-xl border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 py-2 text-[15px] font-medium text-[color:var(--pour-ink-0)] transition-[border-color,background-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none focus-visible:bg-[var(--glass-bg-strong)] focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50',
      isNativeDateInput && 'pour-date-input',
      '[&:not(:placeholder-shown)]:border-[color:var(--pour-accent)] [&:not(:placeholder-shown)]:bg-[var(--glass-bg-strong)]',
      filledFromValue && 'border-[color:var(--pour-accent)] bg-[var(--glass-bg-strong)]',
      className,
    )
    const input = (
      <input
        type={type}
        className={inputClassName}
        ref={ref}
        {...props}
        {...(isControlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
      />
    )
    if (!isNativeDateInput) return input
    return <div className="pour-date-input-shell">{input}</div>
  },
)
Input.displayName = 'Input'

export { Input }
