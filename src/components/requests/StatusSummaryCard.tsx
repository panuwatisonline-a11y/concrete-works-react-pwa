import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { getStatusRingTheme } from '@/lib/statusRingTheme'
import { rq, anim } from '@/lib/requestUi'

type StatusSummaryCardProps = {
  statusId: number
  statusName: string
  count: number | string
  onClick: () => void
}

/** การ์ดสรุปสถานะ — liquid glass + เส้นขอบบาง 1px กระพริบเบาตามสีสถานะ */
export function StatusSummaryCard({ statusId, statusName, count, onClick }: StatusSummaryCardProps) {
  const accent = getStatusRingTheme(statusId)

  const style = {
    '--status-accent': accent.color,
    '--status-tint': accent.tint,
  } as CSSProperties

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        rq.card,
        anim.cardLift,
        'pour-status-border-pulse pour-request-summary-card',
        'pour-interactive group relative w-full overflow-hidden text-left',
        'rounded-2xl pour-desktop:rounded-2xl',
        'bg-[color:color-mix(in_srgb,var(--glass-bg)_85%,var(--status-tint))]',
        'hover:bg-[color:color-mix(in_srgb,var(--glass-bg-strong)_90%,var(--status-tint))]',
      )}
      style={style}
    >
      <span className="relative z-0 w-full pour-desktop:flex pour-desktop:items-center pour-desktop:justify-between pour-desktop:gap-3 pour-desktop:px-4 pour-desktop:py-3.5">
        <span
          className={cn(
            'min-w-0 text-pour-lg font-medium leading-snug text-[color:var(--pour-ink-0)]',
            'line-clamp-2 pour-desktop:line-clamp-none pour-desktop:flex-1',
            'pour-desktop:text-pour-base pour-desktop:font-normal pour-desktop:leading-relaxed',
          )}
        >
          {statusName}
        </span>
        <span
          className={cn(
            'min-w-[2.75rem] shrink-0 justify-self-end rounded-full px-2.5 py-1 text-center font-pour-mono text-pour-xl font-semibold tabular-nums leading-none backdrop-blur-sm',
            'pour-desktop:min-w-0 pour-desktop:px-2.5 pour-desktop:py-1 pour-desktop:text-pour-base pour-desktop:font-medium',
          )}
          style={{
            color: accent.color,
            backgroundColor: 'color-mix(in srgb, var(--glass-bg-strong) 65%, transparent)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {count}
        </span>
      </span>
    </button>
  )
}
