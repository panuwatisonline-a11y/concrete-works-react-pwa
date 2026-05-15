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

export function StructureListMultiSelect({
  value,
  onChange,
  masterNames,
  /** ถ้ากำหนด (รวม `[]`): รายการใน dropdown และค่าที่เก็บ ยอมรับเฉพาะ token ใน set นี้ (จาก Mixcode) */
  allowedTokens,
}: {
  value: string
  onChange: (v: string) => void
  masterNames: string[]
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
    if (arr.length <= 2) return arr.join(STRUCTURE_LIST_JOIN)
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
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    onChange(serializeStructureList(next, masterNames))
  }

  const hasSelection = summaryText != null

  return (
    <PopoverPrimitive.Root
      modal={false}
      open={open}
      onOpenChange={(o) => {
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
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-auto min-h-10 w-full justify-between rounded-xl border-[1.5px] px-3.5 py-2 text-left text-[15px] font-normal shadow-none',
            hasSelection ? 'border-[#c7f0d0] bg-white text-[#111827]' : 'border-[#e2e6ec] bg-white text-[#b4bcc8]',
          )}
        >
          <span className="line-clamp-2 min-w-0 flex-1 break-words">
            {summaryText ?? 'เลือกโครงสร้างจาก Structure'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className={cn(
            'z-[100] w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-[#e2e6ec] bg-white p-2 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
            'max-h-[min(380px,55dvh)] flex flex-col gap-2',
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Input
              className="h-9 min-w-0 flex-1 text-[14px]"
              placeholder="ค้นหา…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 rounded-lg px-2.5 text-[13px] font-semibold text-[#6b7280] hover:text-[#dc2626]"
              disabled={!hasSelection}
              onClick={() => onChange('')}
            >
              ล้างทั้งหมด
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-y-contain pr-0.5">
            {filteredRows.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-[#6b7280]">ไม่พบรายการ</p>
            ) : (
              filteredRows.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-[14px] text-[#111827] hover:bg-[#f0f2f5]"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c8ced8] text-[#2563eb] focus:ring-[#2563eb]"
                    checked={selected.has(name)}
                    onChange={() => toggle(name)}
                  />
                  <span className="min-w-0 leading-snug break-words">{name}</span>
                </label>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { STRUCTURE_LIST_JOIN, parseStructureListTokens } from '@/lib/structureListTokens'
