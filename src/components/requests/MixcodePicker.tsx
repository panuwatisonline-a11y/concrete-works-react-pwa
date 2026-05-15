import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MixedCode } from '@/types/app.types'

export function MixcodePicker({
  value,
  onChange,
  mixcodes,
  disabled,
  emptyMessage,
}: {
  value: string
  onChange: (mixcodeId: string) => void
  mixcodes: MixedCode[]
  disabled?: boolean
  /** แสดงเมื่อ `mixcodes` ว่าง (เช่น กรองแล้วไม่มีรายการ) */
  emptyMessage?: string
}) {
  const selected = value ? mixcodes.find((m) => String(m.id) === value) : undefined
  const emptyLabel = emptyMessage ?? 'ยังไม่มี Mixcode ในระบบ'

  return (
    <div className="min-w-0 space-y-2">
      <div
        className={cn(
          'min-w-0 overflow-hidden rounded-xl border-[1.5px] border-[#ccf0ed] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div className="pour-scroll-x max-h-[min(45svh,380px)] overflow-y-auto overscroll-contain">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead className="sticky top-0 z-[1] border-b border-[#ccf0ed] bg-[#f0fdf4] text-[10px] font-medium uppercase leading-tight tracking-wide text-[#6b7280] sm:text-xs">
              <tr>
                <th className="w-9 px-1 py-2 font-medium sm:w-10 sm:px-2" aria-label="เลือก" />
                <th className="w-[26%] px-1.5 py-2 font-medium sm:px-2 sm:py-2.5">Mixcode</th>
                <th className="w-[22%] px-1.5 py-2 font-medium sm:px-2 sm:py-2.5">Strength</th>
                <th className="w-[24%] px-1.5 py-2 font-medium sm:px-2 sm:py-2.5">Slump</th>
                <th className="px-1.5 py-2 font-medium sm:px-2 sm:py-2.5">Supplier</th>
              </tr>
            </thead>
            <tbody className="text-[#111827]">
              {mixcodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#6b7280]">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                mixcodes.map((m) => {
                  const on = String(m.id) === value
                  const strengthLabel =
                    m.strength != null
                      ? `${m.strength}${m.strength_type ? ` ${m.strength_type}` : ''}`
                      : '—'
                  return (
                    <tr
                      key={m.id}
                      tabIndex={disabled ? -1 : 0}
                      role="button"
                      aria-pressed={on}
                      onClick={() => !disabled && onChange(String(m.id))}
                      onKeyDown={(e) => {
                        if (disabled) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onChange(String(m.id))
                        }
                      }}
                      className={cn(
                        'cursor-pointer border-t border-[#f0f2f5] outline-none transition-colors first:border-t-0',
                        'hover:bg-[#f0fdf4] focus-visible:bg-[#f0fdf4] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--pour-accent)]/25',
                        on && 'bg-[#eff6ff] hover:bg-[#eff6ff]',
                      )}
                    >
                      <td className="w-9 px-1 py-2 align-middle text-center sm:w-10 sm:px-2 sm:py-2.5">
                        {on ? (
                          <Check className="mx-auto h-4 w-4 shrink-0 text-[color:var(--pour-accent)]" strokeWidth={2.5} aria-hidden />
                        ) : (
                          <span className="mx-auto block h-4 w-4 shrink-0" aria-hidden />
                        )}
                      </td>
                      <td className="break-words px-1.5 py-2 align-middle text-[13px] font-medium leading-snug sm:px-2 sm:py-2.5 sm:text-sm">
                        {m.mixcode}
                      </td>
                      <td className="break-words px-1.5 py-2 align-middle text-[12px] leading-snug text-[#374151] sm:px-2 sm:py-2.5 sm:text-sm">
                        {strengthLabel}
                      </td>
                      <td className="break-words px-1.5 py-2 align-middle text-[12px] leading-snug text-[#374151] sm:px-2 sm:py-2.5 sm:text-sm">
                        {m.slump ?? '—'}
                      </td>
                      <td className="break-words px-1.5 py-2 align-middle text-[12px] leading-snug text-[#6b7280] sm:px-2 sm:py-2.5 sm:text-sm">
                        {m.supplier ?? '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <p className="text-xs text-[#6b7280]">
          เลือกแล้ว:{' '}
          <span className="font-medium text-[#111827]">
            {selected.mixcode} — {selected.strength != null ? `${selected.strength} ${selected.strength_type ?? ''}`.trim() : '—'}
          </span>
        </p>
      )}
    </div>
  )
}
