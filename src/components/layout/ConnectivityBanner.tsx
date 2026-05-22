import { WifiOff, CloudOff, Loader2, Clock } from 'lucide-react'
import { CONNECTIVITY_MESSAGES } from '@/lib/connectivity'
import { useConnectivityStore, type ConnectivityPhase } from '@/stores/connectivityStore'
import { icon, ICON_STROKE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const BANNER: Record<
  Exclude<ConnectivityPhase, 'online'>,
  { message: string; Icon: typeof WifiOff; className: string }
> = {
  offline: {
    message: CONNECTIVITY_MESSAGES.offline,
    Icon: WifiOff,
    className:
      'border-amber-500/35 bg-amber-500/12 text-amber-100 [--banner-icon:theme(colors.amber.400)]',
  },
  degraded: {
    message: CONNECTIVITY_MESSAGES.degraded,
    Icon: CloudOff,
    className:
      'border-orange-500/35 bg-orange-500/12 text-orange-50 [--banner-icon:theme(colors.orange.400)]',
  },
  syncing: {
    message: CONNECTIVITY_MESSAGES.syncing,
    Icon: Loader2,
    className:
      'border-[color:var(--pour-accent)]/30 bg-[color:var(--pour-accent)]/10 text-[color:var(--pour-ink-0)] [--banner-icon:var(--pour-accent)]',
  },
}

export function ConnectivityBanner() {
  const phase = useConnectivityStore((s) => s.phase)
  const pending = useConnectivityStore((s) => s.pendingMutationCount)
  const usingCache = useConnectivityStore((s) => s.usingOfflineCache)
  const flushing = useConnectivityStore((s) => s.flushingQueue)

  const showPendingBar = pending > 0 && (phase === 'online' || flushing)
  const showNetworkBanner = phase !== 'online'

  if (!showNetworkBanner && !showPendingBar && !usingCache) return null

  if (showPendingBar && !showNetworkBanner) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'shrink-0 border-b border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sky-100 sm:px-6',
          'pour-desktop:px-6 lg:pour-desktop:px-8',
        )}
      >
        <BannerRow
          icon={Loader2}
          spin={flushing}
          message={
            flushing
              ? CONNECTIVITY_MESSAGES.flushingQueue
              : CONNECTIVITY_MESSAGES.pendingQueue(pending)
          }
        />
      </div>
    )
  }

  const cfg = showNetworkBanner ? BANNER[phase] : null
  const extras: string[] = []
  if (usingCache) extras.push(CONNECTIVITY_MESSAGES.viewingCache)
  if (pending > 0) extras.push(CONNECTIVITY_MESSAGES.pendingQueue(pending))
  if (flushing) extras.push(CONNECTIVITY_MESSAGES.flushingQueue)

  if (!cfg && extras.length === 0) return null

  const { Icon, message, className } = cfg ?? {
    message: extras.join(' · '),
    Icon: Clock,
    className: 'border-amber-500/35 bg-amber-500/12 text-amber-100',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'shrink-0 border-b px-4 py-2 sm:px-6',
        'pour-desktop:px-6 lg:pour-desktop:px-8',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-none flex-col gap-1">
        <BannerRow
          icon={Icon}
          spin={phase === 'syncing' || flushing}
          message={cfg ? message : extras[0]}
        />
        {cfg && extras.length > 0 ? (
          <p className={cn(type.caption, 'pl-[26px] font-normal opacity-90')}>{extras.join(' · ')}</p>
        ) : null}
      </div>
    </div>
  )
}

function BannerRow({
  icon: IconComp,
  spin,
  message,
}: {
  icon: typeof WifiOff
  spin?: boolean
  message: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <IconComp
        className={cn(icon.sm, 'text-[var(--banner-icon,theme(colors.amber.400))]', spin && 'animate-spin')}
        strokeWidth={ICON_STROKE}
        aria-hidden
      />
      <p className={cn(type.caption, 'min-w-0 flex-1 font-medium leading-snug')}>{message}</p>
    </div>
  )
}
