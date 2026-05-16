import { useMemo, useState } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { STRUCTURE_LIST_JOIN, parseStructureListTokens } from '@/lib/structureListTokens'

function serializeStructureList(selected: Set<string>, masterOrder: string[]): string {
  const picked = masterOrder.filter((n) => selected.has(n))
  const extras = [...selected]
    .filter((n) => !masterOrder.includes(n))
    .sort((a, b) => a.localeCompare(b, 'th'))
  return [...picked, ...extras].join(STRUCTURE_LIST_JOIN)
}

const triggerClass = (hasSelection: boolean) =>
  cn(
    'h-auto min-h-10 w-full justify-between rounded-xl border-[1.5px] px-3.5 py-2 text-left text-[15px] font-normal shadow-none',
    hasSelection ? 'border-[color:var(--pour-accent)]/55 bg-[color:var(--glass-bg)] text-[color:var(--pour-ink-0)]' : 'border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] text-pour-subtle',
  )

function StructureListPanel({
  filter,
  onFilterChange,
  filteredRows,
  selected,
  hasSelection,
  onClear,
  onToggle,
  isOptionDisabled,
  listHint,
  listClassName,
}: {
  filter: string
  onFilterChange: (v: string) => void
  filteredRows: string[]
  selected: Set<string>
  hasSelection: boolean
  onClear: () => void
  onToggle: (name: string) => void
  isOptionDisabled?: (name: string) => boolean
  listHint?: string
  listClassName?: string
}) {
  return (
    <>
      {listHint ? (
        <p className="shrink-0 text-xs leading-snug text-pour-muted">{listHint}</p>
      ) : null}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-0 flex-1 text-[14px]"
          placeholder="ค้นหา…"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 shrink-0 rounded-lg px-2.5 text-[13px] font-semibold text-pour-muted hover:text-[#dc2626]"
          disabled={!hasSelection}
          onClick={onClear}
        >
          ล้างทั้งหมด
        </Button>
      </div>
      <div
        className={cn(
          'min-h-0 space-y-0.5 overflow-y-auto overscroll-y-contain touch-pan-y pr-0.5',
          listClassName,
        )}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {filteredRows.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-pour-muted">ไม่พบรายการ</p>
        ) : (
          filteredRows.map((name) => {
            const disabled = isOptionDisabled?.(name) ?? false
            return (
              <label
                key={name}
                className={cn(
                  'flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-[14px]',
                  disabled
                    ? 'cursor-not-allowed text-pour-subtle'
                    : 'cursor-pointer text-[color:var(--pour-ink-0)] hover:bg-[color:var(--pour-nav-hover-bg)]',
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c8ced8] text-[color:var(--pour-accent)] focus:ring-[color:var(--pour-accent)] disabled:opacity-40"
                  checked={selected.has(name)}
                  disabled={disabled}
                  onChange={() => onToggle(name)}
                />
                <span className="min-w-0 leading-snug break-words">{name}</span>
              </label>
            )
          })
        )}
      </div>
    </>
  )
}

export function StructureListMultiSelect({
  value,
  onChange,
  masterNames,
  /** ใช้ใน modal — แสดงรายการใน flow ของฟอร์ม แทน popover ลอย */
  inDialog = false,
  /** ถ้ากำหนด (รวม `[]`): รายการใน dropdown และค่าที่เก็บ ยอมรับเฉพาะ token ใน set นี้ (จาก Mixcode) */
  allowedTokens,
}: {
  value: string
  onChange: (v: string) => void
  masterNames: string[]
  inDialog?: boolean
  allowedTokens?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const allowedSet = useMemo(
    () => (allowedTokens !== undefined ? new Set(allowedTokens) : null),
    [allowedTokens],
  )

  const selected = useMemo(() => new Set(parseStructureListTokens(value)), [value])

  const summaryText = useMemo(() => {
    const arr = parseStructureListTokens(value).sort((a, b) => a.localeCompare(b, 'th'))
    if (arr.length === 0) return null
    if (arr.length <= 3) return arr.join(STRUCTURE_LIST_JOIN)
    return `เลือกแล้ว ${arr.length} รายการ`
  }, [value])

  const rows = useMemo(() => {
    const masterSet = new Set(masterNames)
    const fromValue = parseStructureListTokens(value)
    let extras = fromValue.filter((n) => !masterSet.has(n))
    if (allowedSet) {
      extras = extras.filter((n) => allowedSet.has(n))
    }
    extras.sort((a, b) => a.localeCompare(b, 'th'))
    return [...masterNames, ...extras]
  }, [masterNames, value, allowedSet])

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((n) => n.toLowerCase().includes(q))
  }, [rows, filter])

  function toggle(name: string) {
    if (allowedSet && !allowedSet.has(name)) return
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    onChange(serializeStructureList(next, masterNames))
  }

  const listHint = useMemo(() => {
    const n = filteredRows.length
    if (n === 0) return 'ไม่มีรายการให้เลือก'
    const selectable = allowedSet
      ? filteredRows.filter((name) => allowedSet.has(name)).length
      : n
    if (allowedSet && selectable < n) {
      return `แสดง ${n} รายการจาก Structure — เลือกได้ ${selectable} รายการ (ตาม Mixcode)`
    }
    return `ทั้งหมด ${n} รายการจาก Structure`
  }, [filteredRows, allowedSet])

  const hasSelection = summaryText != null

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) setFilter('')
    if (o && allowedSet) {
      const tokens = parseStructureListTokens(value)
      const kept = tokens.filter((t) => allowedSet.has(t))
      if (kept.length !== tokens.length) {
        const next = serializeStructureList(new Set(kept), masterNames)
        if (next !== value) onChange(next)
      }
    }
  }

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className={triggerClass(hasSelection)}
      aria-expanded={open}
      onClick={inDialog ? () => handleOpenChange(!open) : undefined}
    >
      <span className="line-clamp-2 min-w-0 flex-1 break-words">
        {summaryText ?? 'เลือกโครงสร้างจาก Structure'}
      </span>
      <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')} />
    </Button>
  )

  const panel = (
    <StructureListPanel
      filter={filter}
      onFilterChange={setFilter}
      filteredRows={filteredRows}
      selected={selected}
      hasSelection={hasSelection}
      onClear={() => onChange('')}
      onToggle={toggle}
      isOptionDisabled={allowedSet ? (name) => !allowedSet.has(name) : undefined}
      listHint={listHint}
      listClassName={inDialog ? 'max-h-[min(240px,40dvh)]' : 'min-h-0 flex-1'}
    />
  )

  if (inDialog) {
    return (
      <div className="min-w-0 space-y-2">
        {trigger}
        {open ? (
          <div className="flex flex-col gap-2 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            {panel}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <PopoverPrimitive.Root modal open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-[200] flex w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-hidden rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
            'max-h-[min(380px,55dvh)]',
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {panel}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { STRUCTURE_LIST_JOIN, parseStructureListTokens } from '@/lib/structureListTokens'
