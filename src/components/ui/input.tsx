import * as React from 'react'
import TextField from '@mui/material/TextField'
import { cn } from '@/lib/utils'
import {
  formatTemporalInputDisplay,
  isIosWebKit,
  temporalInputPlaceholder,
} from '@/lib/iosTemporal'

const NATIVE_DATE_INPUT_TYPES = new Set(['date', 'datetime-local', 'time', 'month', 'week'])

function assignRef<T>(ref: React.ForwardedRef<T>, node: T | null) {
  if (typeof ref === 'function') ref(node)
  else if (ref) ref.current = node
}

function scheduleFacadeSync(sync: (el: HTMLInputElement) => void, el: HTMLInputElement) {
  sync(el)
  queueMicrotask(() => sync(el))
  requestAnimationFrame(() => {
    sync(el)
    requestAnimationFrame(() => sync(el))
  })
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (
    {
      className,
      type,
      value,
      defaultValue,
      onClick,
      onChange,
      onInput,
      onBlur,
      id,
      placeholder,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined
    const isNativeDateInput = type != null && NATIVE_DATE_INPUT_TYPES.has(type)
    const useIosFacade = isNativeDateInput && isIosWebKit()
    const nativeRef = React.useRef<HTMLInputElement | null>(null)

    const [facadeRaw, setFacadeRaw] = React.useState(() => String(value ?? defaultValue ?? ''))

    React.useEffect(() => {
      if (value !== undefined) setFacadeRaw(String(value))
      else if (defaultValue !== undefined) setFacadeRaw(String(defaultValue))
    }, [value, defaultValue])

    const syncFacadeFromNative = React.useCallback((el: HTMLInputElement | null) => {
      if (!el) return
      const next = el.value
      setFacadeRaw((prev) => (prev === next ? prev : next))
    }, [])

    const setNativeRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        nativeRef.current = node
        assignRef(ref, node)
        if (node) scheduleFacadeSync(syncFacadeFromNative, node)
      },
      [ref, syncFacadeFromNative],
    )

    React.useLayoutEffect(() => {
      if (!useIosFacade) return
      const el = nativeRef.current
      if (!el) return
      scheduleFacadeSync(syncFacadeFromNative, el)
    }, [useIosFacade, syncFacadeFromNative, defaultValue])

    React.useEffect(() => {
      if (!useIosFacade) return
      const el = nativeRef.current
      if (!el) return
      const sync = () => syncFacadeFromNative(el)
      el.addEventListener('input', sync)
      el.addEventListener('change', sync)
      el.addEventListener('blur', sync)
      return () => {
        el.removeEventListener('input', sync)
        el.removeEventListener('change', sync)
        el.removeEventListener('blur', sync)
      }
    }, [useIosFacade, syncFacadeFromNative])

    if (useIosFacade && type) {
      const displayValue = formatTemporalInputDisplay(type, facadeRaw)
      const facadeFilled = displayValue !== ''

      const handleNative =
        (handler?: React.ReactEventHandler<HTMLInputElement>) =>
        (e: React.FormEvent<HTMLInputElement>) => {
          syncFacadeFromNative(e.currentTarget)
          queueMicrotask(() => syncFacadeFromNative(e.currentTarget))
          handler?.(e)
        }

      return (
        <div
          className={cn(
            'pour-date-input-shell relative h-10 w-full min-w-0 max-w-full overflow-hidden',
            facadeFilled && 'pour-date-input-shell--filled',
          )}
        >
          <TextField
            size="small"
            fullWidth
            tabIndex={-1}
            aria-hidden
            disabled={disabled}
            placeholder={temporalInputPlaceholder(type, placeholder)}
            value={displayValue}
            className={cn('pointer-events-none absolute inset-0 z-0', className)}
            slotProps={{ input: { readOnly: true } }}
          />
          <input
            type={type}
            id={id}
            ref={setNativeRef}
            className="pour-date-input-overlay"
            onClick={onClick}
            disabled={disabled}
            {...(isControlled ? { value } : { defaultValue })}
            onChange={handleNative(onChange)}
            onInput={handleNative(onInput)}
            onBlur={handleNative(onBlur)}
            {...props}
          />
        </div>
      )
    }

    if (isNativeDateInput) {
      return (
        <div className="pour-date-input-shell w-full">
          <TextField
            id={id}
            type={type}
            size="small"
            fullWidth
            disabled={disabled}
            placeholder={placeholder}
            className={cn('pour-date-input', className)}
            inputRef={ref}
            onClick={onClick}
            onChange={onChange}
            onBlur={onBlur}
            {...(isControlled ? { value: value as string } : defaultValue !== undefined ? { defaultValue: String(defaultValue) } : {})}
            slotProps={{ htmlInput: props }}
          />
        </div>
      )
    }

    return (
      <TextField
        id={id}
        type={type}
        size="small"
        fullWidth
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        inputRef={ref}
        onClick={onClick}
        onChange={onChange}
        onBlur={onBlur}
        {...(isControlled ? { value: value as string } : defaultValue !== undefined ? { defaultValue: String(defaultValue) } : {})}
        slotProps={{ htmlInput: props }}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
