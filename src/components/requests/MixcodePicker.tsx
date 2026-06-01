import Check from '@mui/icons-material/Check'
import { AppIcon } from '@/components/icons/AppIcon'
import { cn } from '@/lib/utils'
import { pourPcUi } from '@/lib/pourPcScale'
import type { MixedCode } from '@/types/app.types'
import { getMixcodeOverDwgHint, parseDwgStrengthOption } from '@/lib/mixcodeBookingFilter'
import { formatMixcodeStrengthLabel } from '@/lib/mixcodeStrengthOptions'

export function MixcodePicker({
  value,
  onChange,
  mixcodes,
  disabled,
  emptyMessage,
  dwgStrengthOption,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: {
  value: string
  onChange: (mixcodeId: string) => void
  mixcodes: MixedCode[]
  disabled?: boolean
  /** แสดงเมื่อ `mixcodes` ว่าง (เช่น กรองแล้วไม่มีรายการ) */
  emptyMessage?: string
  /** ค่า Select DWG Strength — ใช้แสดง hint เมื่อ Mixcode สูงกว่าแบบ */
  dwgStrengthOption?: string
  id?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}) {
  const selected = value ? mixcodes.find((m) => String(m.id) === value) : undefined
  const emptyLabel = emptyMessage ?? 'ยังไม่มี Mixcode ในระบบ'
  const overDwgHint = getMixcodeOverDwgHint(selected, dwgStrengthOption)
  const dwgParts = parseDwgStrengthOption(dwgStrengthOption)

  function strengthCellLabel(m: MixedCode): string {
    const label =
      m.strength != null
        ? `${m.strength}${m.strength_type ? ` ${m.strength_type}` : ''}`
        : '—'
    if (dwgParts && m.strength != null && m.strength > dwgParts.strength) {
      return `${label} ↑`
    }
    return label
  }

  function strengthCellToneClass(m: MixedCode): string {
    if (!dwgParts || m.strength == null) return ''
    if (m.strength > dwgParts.strength) {
      return 'bg-orange-500/10 text-[color:var(--pour-ink-0)] ring-1 ring-inset ring-orange-500/35'
    }
    if (m.strength === dwgParts.strength) {
      return 'bg-emerald-500/10 text-[color:var(--pour-ink-0)] ring-1 ring-inset ring-emerald-500/35'
    }
    return ''
  }

  return (
    <div className="min-w-0 space-y-2">
      <div
        id={id}
        role="group"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={cn(
          'min-w-0 overflow-hidden rounded-xl border-[1.5px] border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] shadow-[var(--glass-shadow-sm)]',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div className="pour-scroll-x max-h-[min(42svh,340px)] overflow-y-auto overscroll-contain">
          <table
            className={cn(
              'w-full table-auto max-[430px]:table-fixed border-collapse text-left text-sm max-[430px]:text-[10.5px]',
              pourPcUi.table,
            )}
          >
            <colgroup>
              <col className="w-[6%] max-[430px]:w-[7%]" />
              <col className="w-[27%] max-[430px]:w-[27%]" />
              <col className="w-[22%] max-[430px]:w-[22%]" />
              <col className="w-[18%] max-[430px]:w-[18%]" />
              <col className="w-[27%] max-[430px]:w-[26%]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] border-b border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] text-pour-2xs font-medium uppercase leading-tight tracking-wide text-pour-muted sm:text-xs">
              <tr>
                <th
                  className={cn(pourPcUi.colNarrow, 'px-0.5 py-1.5 font-medium max-[430px]:px-0.5 max-[430px]:py-1 sm:px-1')}
                  aria-label="เลือก"
                />
                <th className="px-1.5 py-1.5 font-medium whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 sm:px-2 sm:py-2.5">Mixcode</th>
                <th className="px-1.5 py-1.5 font-medium whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 sm:px-2 sm:py-2.5">Strength</th>
                <th className="px-1.5 py-1.5 font-medium whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 sm:px-2 sm:py-2.5">Slump</th>
                <th className="px-1.5 py-1.5 font-medium whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 sm:px-2 sm:py-2.5">Supplier</th>
              </tr>
            </thead>
            <tbody className="text-[color:var(--pour-ink-0)]">
              {mixcodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-pour-muted">
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                mixcodes.map((m) => {
                  const on = String(m.id) === value
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
                        'pour-form-picker cursor-pointer border-t border-[color:var(--glass-border-subtle)] outline-none first:border-t-0',
                        'pour-pointer-fine:hover:bg-[color:var(--pour-nav-hover-bg)]',
                        on && 'bg-[color:var(--pour-accent-muted)]/40',
                      )}
                    >
                      <td className={cn(pourPcUi.colNarrow, 'px-0.5 py-1.5 align-middle text-center max-[430px]:px-0.5 max-[430px]:py-1 sm:px-1 sm:py-2.5')}>
                        {on ? (
                          <AppIcon icon={Check} size="sm" className="mx-auto scale-90 text-[color:var(--pour-accent)] max-[430px]:scale-75" />
                        ) : (
                          <span className="mx-auto block h-3.5 w-3.5 shrink-0 max-[430px]:h-3 max-[430px]:w-3" aria-hidden />
                        )}
                      </td>
                      <td className="px-1.5 py-1.5 align-middle text-pour-base font-medium leading-tight whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 max-[430px]:text-[10.5px] sm:px-2 sm:py-2.5 sm:text-sm">
                        {m.mixcode}
                      </td>
                      <td className="px-1.5 py-1.5 align-middle text-pour-sm leading-tight text-[color:var(--pour-ink-1)] whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 max-[430px]:text-[10.5px] sm:px-2 sm:py-2.5 sm:text-sm">
                        <span
                          className={cn(
                            'inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 text-[0.95em] max-[430px]:px-1 max-[430px]:py-0',
                            strengthCellToneClass(m),
                          )}
                        >
                          {strengthCellLabel(m)}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 align-middle text-pour-sm leading-tight text-[color:var(--pour-ink-1)] whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 max-[430px]:text-[10.5px] sm:px-2 sm:py-2.5 sm:text-sm">
                        {m.slump ?? '—'}
                      </td>
                      <td className="px-1.5 py-1.5 align-middle text-pour-sm leading-tight text-pour-muted whitespace-nowrap max-[430px]:px-1 max-[430px]:py-1 max-[430px]:text-[10.5px] sm:px-2 sm:py-2.5 sm:text-sm">
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
      {selected ? (
        <div className="space-y-2">
          <p className="rounded-lg border border-[color:var(--pour-accent)]/35 bg-[color:var(--pour-accent-muted)] px-3 py-2 text-sm leading-snug">
            <span className="text-[color:var(--pour-ink-2)]">เลือกแล้ว: </span>
            <span className="font-semibold text-[color:var(--pour-ink-0)]">
              {selected.mixcode} — {formatMixcodeStrengthLabel(selected) ?? '—'}
            </span>
          </p>
          {overDwgHint ? (
            <p className="text-xs leading-snug text-pour-muted">{overDwgHint}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
