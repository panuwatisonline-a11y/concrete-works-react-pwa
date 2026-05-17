import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BookingSummaryOkToggleProps = {
  value: boolean | null | undefined
  onChange: (next: boolean | null) => void
  disabled?: boolean
}

const shell = 'inline-flex gap-0.5 rounded-lg border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] p-0.5'

function btnClass(active: boolean, tone: 'ok' | 'fail') {
  return cn(
    'pour-interactive inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
    active && tone === 'ok' && 'bg-emerald-600 text-white shadow-sm',
    active && tone === 'fail' && 'bg-rose-600 text-white shadow-sm',
    !active && 'text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )
}

export function BookingSummaryOkToggle({
  value,
  onChange,
  disabled,
}: BookingSummaryOkToggleProps) {
  const ok = value === true
  const fail = value === false
  const locked = disabled

  const pickOk = () => onChange(ok ? null : true)
  const pickFail = () => onChange(fail ? null : false)

  return (
    <div
      role="group"
      aria-label="Accept / No"
      className={cn(shell, locked && 'pointer-events-none opacity-60')}
    >
      <button
        type="button"
        disabled={locked}
        aria-pressed={ok}
        aria-label={ok ? 'ยกเลิก Accept' : 'Accept'}
        className={btnClass(ok, 'ok')}
        title={ok ? 'ยกเลิก Accept' : 'Accept'}
        onClick={pickOk}
      >
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
      <button
        type="button"
        disabled={locked}
        aria-pressed={fail}
        aria-label={fail ? 'ยกเลิก No' : 'No'}
        className={btnClass(fail, 'fail')}
        title={fail ? 'ยกเลิก No' : 'No'}
        onClick={pickFail}
      >
        <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
    </div>
  )
}
