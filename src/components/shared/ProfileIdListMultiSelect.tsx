import { useId, useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { usePopoverLayerStyle } from '@/lib/dialogLayer'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { parseProfileIdList, profilePickerLabel, serializeProfileIdList } from '@/lib/inspectorScope'

export type ProfilePickerOption = {
  id: string
  label: string
}

const triggerClass = (hasSelection: boolean) =>
  cn(
    'pour-form-picker data-pour-no-press h-auto min-h-10 w-full justify-between rounded-xl border-[1.5px] border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] px-3.5 py-2 text-left text-[15px] font-normal shadow-none',
    hasSelection ? 'text-[color:var(--pour-ink-0)]' : 'text-pour-subtle',
  )

function ProfilePickerListPanel({
  filter,
  onFilterChange,
  filteredOptions,
  selectionMode,
  selected,
  selectedId,
  radioGroupName,
  hasSelection,
  onClear,
  onToggle,
  listClassName,
  listHint,
  highlightIds,
}: {
  filter: string
  onFilterChange: (v: string) => void
  filteredOptions: ProfilePickerOption[]
  selectionMode: 'single' | 'multiple'
  selected: Set<string>
  selectedId: string
  radioGroupName: string
  hasSelection: boolean
  onClear: () => void
  onToggle: (id: string) => void
  listClassName?: string
  listHint?: string
  highlightIds?: Iterable<string>
}) {
  const highlight = useMemo(() => new Set(highlightIds ?? []), [highlightIds])
  return (
    <>
      {listHint ? (
        <p className="shrink-0 text-xs leading-snug text-pour-muted">{listHint}</p>
      ) : null}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-0 flex-1 text-[14px]"
          placeholder="ค้นหาชื่อ / รหัสพนักงาน…"
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
        {filteredOptions.length === 0 ? (
          <p className="px-2 py-3 text-center text-sm text-pour-muted">ไม่พบรายการ</p>
        ) : (
          filteredOptions.map((opt) => {
            const isMulti = selectionMode === 'multiple'
            const checked = isMulti ? selected.has(opt.id) : selectedId === opt.id
            return (
              <label
                key={opt.id}
                className="pour-form-picker flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-[14px] text-[color:var(--pour-ink-0)] pour-pointer-fine:hover:bg-[color:var(--pour-nav-hover-bg)]"
                onClick={(e) => {
                  if (!isMulti) return
                  e.preventDefault()
                  onToggle(opt.id)
                }}
              >
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  name={isMulti ? undefined : radioGroupName}
                  className="mt-0.5 h-4 w-4 shrink-0 border-[#c8ced8] text-[color:var(--pour-accent)] focus:ring-[color:var(--pour-accent)]"
                  checked={checked}
                  readOnly={isMulti}
                  tabIndex={isMulti ? -1 : 0}
                  onChange={() => {
                    if (!isMulti) onToggle(opt.id)
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="min-w-0 leading-snug break-words">
                  {opt.label}
                  {highlight.has(opt.id) ? (
                    <span className="ml-1.5 text-xs font-medium text-[color:var(--pour-accent)]">(หัวสาย)</span>
                  ) : null}
                </span>
              </label>
            )
          })
        )}
      </div>
    </>
  )
}

export function profilePickerOptionsFromProfiles(
  rows: {
    id?: string
    profile_id?: string
    fname: string | null
    lname: string | null
    employee_id: string | null
    role?: string | null
  }[],
): ProfilePickerOption[] {
  return rows
    .map((p) => {
      const id = (p.profile_id ?? p.id ?? '').trim()
      if (!id) return null
      return { id, label: profilePickerLabel({ ...p, role: p.role ?? null }) }
    })
    .filter((o): o is ProfilePickerOption => o != null)
    .sort((a, b) => a.label.localeCompare(b.label, 'th'))
}

function useFilteredProfileOptions(
  options: ProfilePickerOption[],
  value: string,
  excludeIds?: Iterable<string>,
) {
  const exclude = useMemo(() => new Set(excludeIds ?? []), [excludeIds])
  const visibleOptions = useMemo(
    () => options.filter((o) => !exclude.has(o.id)),
    [options, exclude],
  )
  const labelById = useMemo(() => new Map(options.map((o) => [o.id, o.label])), [options])
  const masterOrder = useMemo(() => visibleOptions.map((o) => o.id), [visibleOptions])

  const rows = useMemo(() => {
    const masterSet = new Set(masterOrder)
    const extras = parseProfileIdList(value)
      .filter((id) => !masterSet.has(id) && !exclude.has(id))
      .map((id) => ({ id, label: labelById.get(id) ?? `${id.slice(0, 8)}…` }))
    return [...visibleOptions, ...extras]
  }, [visibleOptions, value, masterOrder, labelById, exclude])

  return { visibleOptions, labelById, masterOrder, rows, exclude }
}

export function ProfileIdSingleSelect({
  value,
  onChange,
  options,
  inDialog = false,
  alwaysExpanded = false,
  excludeIds,
  placeholder = 'เลือกคนหนึ่ง',
  listHint,
}: {
  value: string
  onChange: (profileId: string) => void
  options: ProfilePickerOption[]
  inDialog?: boolean
  alwaysExpanded?: boolean
  excludeIds?: Iterable<string>
  placeholder?: string
  listHint?: string
  highlightIds?: Iterable<string>
}) {
  const popoverLayerStyle = usePopoverLayerStyle()
  const radioGroupName = useId()
  const [open, setOpen] = useState(inDialog && alwaysExpanded)
  const [filter, setFilter] = useState('')
  const { labelById, rows } = useFilteredProfileOptions(options, value, excludeIds)

  const selectedId = value.trim()
  const summaryText = selectedId ? labelById.get(selectedId) ?? null : null
  const hasSelection = summaryText != null

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
    )
  }, [rows, filter])

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) setFilter('')
  }

  function pick(id: string) {
    onChange(selectedId === id ? '' : id)
  }

  const panel = (
    <ProfilePickerListPanel
      filter={filter}
      onFilterChange={setFilter}
      filteredOptions={filteredOptions}
      selectionMode="single"
      selected={new Set()}
      selectedId={selectedId}
      radioGroupName={radioGroupName}
      hasSelection={hasSelection}
      onClear={() => onChange('')}
      onToggle={pick}
      listHint={listHint ?? `ทั้งหมด ${rows.length} คน — เลือกได้คนเดียว`}
      listClassName={
        inDialog && alwaysExpanded
          ? 'max-h-[min(240px,38dvh)]'
          : inDialog
            ? 'max-h-[min(220px,36dvh)]'
            : 'min-h-0 flex-1'
      }
    />
  )

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className={triggerClass(hasSelection)}
      aria-expanded={open}
      onClick={inDialog ? () => handleOpenChange(!open) : undefined}
    >
      <span className="line-clamp-2 min-w-0 flex-1 break-words">{summaryText ?? placeholder}</span>
      <AppIcon icon={ExpandMore} size="sm" className={cn('opacity-50', open && 'rotate-180')} />
    </Button>
  )

  if (inDialog && alwaysExpanded) {
    return (
      <div
        className="flex min-w-0 flex-col gap-2 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {panel}
      </div>
    )
  }

  if (inDialog) {
    return (
      <div className="min-w-0 space-y-2">
        {trigger}
        {open ? (
          <div
            className="flex flex-col gap-2 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {panel}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        style={popoverLayerStyle}
        className="flex max-w-[calc(100vw-2rem)] flex-col gap-2 p-2 max-h-[min(380px,52dvh)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {panel}
      </PopoverContent>
    </Popover>
  )
}

export function ProfileIdListMultiSelect({
  value,
  onChange,
  options,
  inDialog = false,
  alwaysExpanded = false,
  excludeIds,
  highlightIds,
  placeholder = 'เลือกผู้ใช้ใน list',
  listHint,
}: {
  value: string
  onChange: (v: string) => void
  options: ProfilePickerOption[]
  inDialog?: boolean
  /** ใน modal — แสดงรายการ checkbox ตลอด ไม่ต้องกดเปิด */
  alwaysExpanded?: boolean
  excludeIds?: Iterable<string>
  highlightIds?: Iterable<string>
  placeholder?: string
  listHint?: string
}) {
  const popoverLayerStyle = usePopoverLayerStyle()
  const [open, setOpen] = useState(inDialog && alwaysExpanded)
  const [filter, setFilter] = useState('')

  const { labelById, masterOrder, rows, visibleOptions } = useFilteredProfileOptions(
    options,
    value,
    excludeIds,
  )
  const selected = useMemo(() => new Set(parseProfileIdList(value)), [value])

  const summaryText = useMemo(() => {
    const ids = parseProfileIdList(value)
    if (ids.length === 0) return null
    const labels = ids.map((id) => labelById.get(id) ?? id.slice(0, 8))
    if (labels.length <= 2) return labels.join(', ')
    return `เลือกแล้ว ${labels.length} คน`
  }, [value, labelById])

  const filteredOptions = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (o) => o.label.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
    )
  }, [rows, filter])

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(serializeProfileIdList(next, masterOrder))
  }

  const hasSelection = summaryText != null

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) setFilter('')
  }

  const panel = (
    <ProfilePickerListPanel
      filter={filter}
      onFilterChange={setFilter}
      filteredOptions={filteredOptions}
      selectionMode="multiple"
      selected={selected}
      selectedId=""
      radioGroupName=""
      hasSelection={hasSelection}
      onClear={() => onChange('')}
      onToggle={toggle}
      highlightIds={highlightIds}
      listHint={listHint ?? `ทั้งหมด ${visibleOptions.length} คน — เลือกได้หลายคน`}
      listClassName={
        inDialog && alwaysExpanded
          ? 'max-h-[min(320px,50dvh)]'
          : inDialog
            ? 'max-h-[min(280px,45dvh)]'
            : 'min-h-0 flex-1'
      }
    />
  )

  const trigger = (
    <Button
      type="button"
      variant="outline"
      className={triggerClass(hasSelection)}
      aria-expanded={open}
      onClick={inDialog ? () => handleOpenChange(!open) : undefined}
    >
      <span className="line-clamp-2 min-w-0 flex-1 break-words">{summaryText ?? placeholder}</span>
      <AppIcon icon={ExpandMore} size="sm" className={cn('opacity-50', open && 'rotate-180')} />
    </Button>
  )

  if (inDialog && alwaysExpanded) {
    return (
      <div
        className="flex min-w-0 flex-col gap-2 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {panel}
      </div>
    )
  }

  if (inDialog) {
    return (
      <div className="min-w-0 space-y-2">
        {trigger}
        {open ? (
          <div
            className="flex flex-col gap-2 rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] p-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {panel}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        style={popoverLayerStyle}
        className="flex max-w-[calc(100vw-2rem)] flex-col gap-2 p-2 max-h-[min(420px,60dvh)]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {panel}
      </PopoverContent>
    </Popover>
  )
}
