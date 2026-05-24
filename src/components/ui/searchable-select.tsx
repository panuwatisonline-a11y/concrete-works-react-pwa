import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/requestUi'

export { SELECT_CONTENT_ELEVATED_Z } from '@/components/ui/select'

export type SearchableSelectOption = {
  value: string
  label: string
  keywords?: string
}

export type SearchableSelectProps = {
  value?: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
  listClassName?: string
  id?: string
  'aria-invalid'?: boolean
}

export function mapSearchableOptions<T>(
  items: readonly T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
  getKeywords?: (item: T) => string | undefined,
): SearchableSelectOption[] {
  return items.map((item) => ({
    value: getValue(item),
    label: getLabel(item),
    keywords: getKeywords?.(item),
  }))
}

function optionHaystack(option: SearchableSelectOption): string {
  return `${option.label} ${option.keywords ?? ''}`.toLowerCase()
}

export function SearchableSelect({
  value = '',
  onValueChange,
  options,
  placeholder = 'เลือก…',
  searchPlaceholder = 'พิมพ์เพื่อค้นหา…',
  emptyMessage = 'ไม่พบรายการ',
  disabled,
  triggerClassName,
  contentClassName,
  listClassName,
  id,
  'aria-invalid': ariaInvalid,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [highlight, setHighlight] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const selected = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((option) => optionHaystack(option).includes(q))
  }, [options, query])

  React.useEffect(() => {
    setHighlight(0)
  }, [query, filtered.length])

  const close = React.useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const openPicker = React.useCallback(() => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [disabled])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) openPicker()
      else close()
    },
    [close, openPicker],
  )

  const selectOption = React.useCallback(
    (option: SearchableSelectOption) => {
      onValueChange(option.value)
      close()
      inputRef.current?.blur()
    },
    [close, onValueChange],
  )

  const displayValue = open ? query : (selected?.label ?? '')

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div className="relative min-w-0 max-w-full">
          <input
            ref={inputRef}
            id={id}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-invalid={ariaInvalid}
            disabled={disabled}
            readOnly={!open}
            value={displayValue}
            placeholder={open ? searchPlaceholder : placeholder}
            onChange={(event) => {
              if (open) setQuery(event.target.value)
            }}
            onFocus={openPicker}
            onClick={() => {
              if (!open) openPicker()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                close()
                inputRef.current?.blur()
                return
              }
              if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                openPicker()
                return
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setHighlight((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)))
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlight((current) => Math.max(current - 1, 0))
              }
              if (event.key === 'Enter' && open && filtered[highlight]) {
                event.preventDefault()
                selectOption(filtered[highlight])
              }
            }}
            className={cn(
              glass.picker,
              'h-10 min-w-0 max-w-full w-full rounded-xl px-3.5 py-2 pr-9 text-sm font-medium',
              'placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)]',
              !open && !selected && 'text-[color:var(--pour-ink-3)]',
              open ? 'cursor-text' : 'cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
              triggerClassName,
            )}
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className={cn('p-0', contentClassName)}
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div
          role="listbox"
          className={cn('max-h-60 overflow-y-auto overscroll-contain p-1', listClassName)}
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[color:var(--pour-ink-3)]">{emptyMessage}</p>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value
              const isHighlighted = index === highlight
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'relative flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none',
                    isHighlighted && 'bg-[color:var(--pour-accent-soft)]',
                    isSelected && 'font-medium',
                  )}
                  onMouseEnter={() => setHighlight(index)}
                  onPointerDown={(event) => {
                    if (event.pointerType === 'mouse') event.preventDefault()
                  }}
                  onClick={() => selectOption(option)}
                >
                  <span className="min-w-0 flex-1 break-words">{option.label}</span>
                  {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-70" /> : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
