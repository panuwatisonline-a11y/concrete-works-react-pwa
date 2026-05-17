import { BOOKING_SUMMARY_SUPPLIER_NONE } from '@/lib/bookingSummaryRow'
import { cn } from '@/lib/utils'

export type BookingSummarySupplierStackProps = {
  value: string
  onChange: (value: string) => void
  suppliers: string[]
  hasUnspecified: boolean
  disabled?: boolean
}

const stackShell =
  'flex flex-wrap gap-1.5 rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] p-1'

const stackBtn = (active: boolean) =>
  cn(
    'pour-interactive max-w-full shrink-0 rounded-lg px-3 py-1.5 text-left text-xs font-semibold transition-colors',
    active
      ? 'bg-[color:var(--glass-bg)] text-[color:var(--pour-accent)] shadow-sm ring-1 ring-[color:var(--pour-surface-border)]'
      : 'text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )

export function BookingSummarySupplierStack({
  value,
  onChange,
  suppliers,
  hasUnspecified,
  disabled,
}: BookingSummarySupplierStackProps) {
  const options: { id: string; label: string }[] = [
    { id: '', label: 'All' },
    ...(hasUnspecified ? [{ id: BOOKING_SUMMARY_SUPPLIER_NONE, label: '(ไม่ระบุ)' }] : []),
    ...suppliers.map((name) => ({ id: name, label: name })),
  ]

  return (
    <div
      role="tablist"
      aria-label="กรอง Supplier"
      className={cn(stackShell, disabled && 'pointer-events-none opacity-50')}
    >
      {options.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id || '__all__'}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={stackBtn(active)}
            title={opt.label}
          >
            <span className="block max-w-[14rem] truncate">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
