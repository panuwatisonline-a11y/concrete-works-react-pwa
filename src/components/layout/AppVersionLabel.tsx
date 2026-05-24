import { APP_VERSION } from '@/lib/appVersion'
import { cn } from '@/lib/utils'

export function AppVersionLabel({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'mt-2 text-center text-[10px] tabular-nums leading-none text-[color:var(--pour-ink-3)]',
        className,
      )}
      aria-label={`เวอร์ชันแอป ${APP_VERSION}`}
    >
      v{APP_VERSION}
    </p>
  )
}
