import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import { AppIcon } from '@/components/icons/AppIcon'
import { cn } from '@/lib/utils'

export type BookingSummaryOkToggleProps = {
  value: boolean | null | undefined
  onChange: (next: boolean | null) => void
  disabled?: boolean
}

const shell =
  'inline-flex gap-0.5 rounded-lg border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] p-0.5'

const btnBase = cn(
  'pour-interactive pour-booking-toggle-btn inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
  'h-9 w-9 min-h-9 min-w-9',
  'max-md:h-11 max-md:w-11 max-md:min-h-[44px] max-md:min-w-[44px]',
)

function btnClass(active: boolean, tone: 'ok' | 'fail') {
  return cn(
    btnBase,
    active && tone === 'ok' && 'pour-booking-toggle-btn--ok-active',
    active && tone === 'fail' && 'pour-booking-toggle-btn--no-active',
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
      aria-label="ยืนยันการจอง"
      className={cn(shell, locked && 'pointer-events-none opacity-60')}
    >
      <button
        type="button"
        disabled={locked}
        aria-pressed={ok}
        aria-label={ok ? 'ยกเลิก ยอมรับ' : 'ยอมรับ'}
        className={btnClass(ok, 'ok')}
        title={ok ? 'ยกเลิก ยอมรับ' : 'ยอมรับ'}
        onClick={pickOk}
      >
        <AppIcon icon={Check} size="xs" />
      </button>
      <button
        type="button"
        disabled={locked}
        aria-pressed={fail}
        aria-label={fail ? 'ยกเลิก ไม่ผ่าน' : 'ไม่ผ่าน'}
        className={btnClass(fail, 'fail')}
        title={fail ? 'ยกเลิก ไม่ผ่าน' : 'ไม่ผ่าน'}
        onClick={pickFail}
      >
        <AppIcon icon={Close} size="xs" />
      </button>
    </div>
  )
}
