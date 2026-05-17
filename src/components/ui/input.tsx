import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  formatTemporalInputDisplay,
  isIosWebKit,
  temporalInputPlaceholder,
} from '@/lib/iosTemporal'

const NATIVE_DATE_INPUT_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week'])

const INPUT_BASE =
  'flex h-10 min-w-0 max-w-full w-full items-center rounded-xl border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 py-2 text-[15px] font-medium text-[color:var(--pour-ink-0)] transition-[border-color,background-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)] focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none focus-visible:bg-[var(--glass-bg-strong)] focus-visible:shadow-[0_0_0_3px_var(--pour-accent-ring)] disabled:cursor-not-allowed disabled:opacity-50'

function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, value, defaultValue, onClick, onChange, id, placeholder, ...props }, ref) => {
    const isControlled = value !== undefined
    const filledFromValue = isControlled && String(value ?? '').trim() !== ''
    const isNativeDateInput = type != null && NATIVE_DATE_INPUT_TYPES.has(type)
    const useIosFacade = isNativeDateInput && isIosWebKit()

    const [localValue, setLocalValue] = React.useState(() => String(value ?? defaultValue ?? ''))

    React.useEffect(() => {
      if (value !== undefined) setLocalValue(String(value))
    }, [value])

    const filledClasses = cn(
      '[&:not(:placeholder-shown)]:border-[color:var(--pour-accent)] [&:not(:placeholder-shown)]:bg-[var(--glass-bg-strong)]',
      filledFromValue && 'border-[color:var(--pour-accent)] bg-[var(--glass-bg-strong)]',
    )

    if (useIosFacade && type) {
      const rawValue = isControlled ? String(value ?? '') : localValue
      const displayValue = formatTemporalInputDisplay(type, rawValue)
      const facadeFilled = displayValue !== ''
      const shellFilled = facadeFilled || filledFromValue

      return (
        <div
          className={cn(
            'pour-date-input-shell relative h-10 w-full min-w-0 max-w-full overflow-hidden',
            'focus-within:[&>input:first-child]:border-[color:var(--pour-accent)]',
            'focus-within:[&>input:first-child]:bg-[var(--glass-bg-strong)]',
            'focus-within:[&>input:first-child]:shadow-[0_0_0_3px_var(--pour-accent-ring)]',
            shellFilled && 'pour-date-input-shell--filled',
          )}
        >
          <input
            type="text"
            readOnly
            tabIndex={-1}
            aria-hidden
            disabled={props.disabled}
            placeholder={temporalInputPlaceholder(type, placeholder)}
            value={displayValue}
            className={cn(
              INPUT_BASE,
              'pointer-events-none absolute inset-0 z-0',
              facadeFilled && 'border-[color:var(--pour-accent)] bg-[var(--glass-bg-strong)]',
              className,
            )}
          />
          <input
            type={type}
            id={id}
            ref={(node) => assignRef(ref, node)}
            className="pour-date-input-overlay"
            onClick={onClick}
            {...(isControlled ? { value } : { defaultValue })}
            onChange={(e) => {
              if (!isControlled) setLocalValue(e.target.value)
              onChange?.(e)
            }}
            {...props}
          />
        </div>
      )
    }

    const inputClassName = cn(
      INPUT_BASE,
      isNativeDateInput && 'pour-date-input',
      filledClasses,
      className,
    )

    const input = (
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        className={inputClassName}
        ref={ref}
        onClick={onClick}
        onChange={onChange}
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
