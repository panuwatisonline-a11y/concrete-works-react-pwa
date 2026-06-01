import * as React from 'react'
import Check from '@mui/icons-material/Check'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePopoverLayerStyle } from '@/lib/dialogLayer'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/requestUi'

export { SELECT_CONTENT_ELEVATED_Z } from '@/lib/zIndex'

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
  'aria-describedby'?: string
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

/** Desktop — โฟกัสช่องค้นหาทันทีเมื่อเปิด; มือถือ — เลือกจาก list ก่อน ไม่ดึงคีย์บอร์ด */
const SEARCH_FOCUS_MEDIA = '(hover: hover) and (pointer: fine)'

function prefersSearchFocusOnOpen(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(SEARCH_FOCUS_MEDIA).matches
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
  'aria-describedby': ariaDescribedBy,
}: SearchableSelectProps) {
  const popoverLayerStyle = usePopoverLayerStyle()
  const listboxId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [highlight, setHighlight] = React.useState(0)
  const searchRef = React.useRef<HTMLInputElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

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

  const focusSearchIfDesktop = React.useCallback(() => {
    if (!prefersSearchFocusOnOpen()) return
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [])

  const openPicker = React.useCallback(() => {
    if (disabled) return
    setOpen(true)
    setQuery('')
    focusSearchIfDesktop()
  }, [disabled, focusSearchIfDesktop])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) openPicker()
      else {
        close()
        searchRef.current?.blur()
      }
    },
    [close, openPicker],
  )

  const selectOption = React.useCallback(
    (option: SearchableSelectOption) => {
      onValueChange(option.value)
      close()
      searchRef.current?.blur()
      requestAnimationFrame(() => triggerRef.current?.focus())
    },
    [close, onValueChange],
  )

  const onSearchKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        triggerRef.current?.focus()
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
      if (event.key === 'Enter' && filtered[highlight]) {
        event.preventDefault()
        selectOption(filtered[highlight])
      }
    },
    [close, filtered, highlight, selectOption],
  )

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        if (!open) openPicker()
      }
    },
    [open, openPicker],
  )

  return (
    <Popover modal={false} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          onKeyDown={onTriggerKeyDown}
          className={cn(
            glass.picker,
            'flex h-10 min-w-0 max-w-full w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2 pr-3 text-left text-sm font-normal',
            !selected && 'text-[color:var(--pour-ink-3)]',
            disabled && 'cursor-not-allowed opacity-50',
            triggerClassName,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
          <AppIcon
            icon={ExpandMore}
            size="sm"
            className={cn('opacity-50 transition-transform', open && 'rotate-180')}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('flex flex-col gap-1.5 p-1.5', contentClassName)}
        style={popoverLayerStyle}
        align="start"
        collisionPadding={12}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          triggerRef.current?.focus()
        }}
      >
        <Input
          ref={searchRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          placeholder={searchPlaceholder}
          className="h-9 shrink-0 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onSearchKeyDown}
        />
        <div
          id={listboxId}
          role="listbox"
          className={cn(
            'max-h-[min(280px,45dvh)] overflow-y-auto overscroll-y-contain touch-pan-y p-0.5',
            listClassName,
          )}
          onTouchMove={(event) => event.stopPropagation()}
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
                  {isSelected ? <AppIcon icon={Check} size="sm" className="mt-0.5 opacity-70" /> : null}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
