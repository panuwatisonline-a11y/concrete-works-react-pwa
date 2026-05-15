import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { getStatusRingTheme } from '@/lib/statusRingTheme'
import { rq, type, anim } from '@/lib/requestUi'

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
        'pour-status-border-pulse',
        'pour-interactive group relative w-full overflow-hidden text-left',
        'bg-[color:color-mix(in_srgb,var(--glass-bg)_85%,var(--status-tint))]',
        'hover:bg-[color:color-mix(in_srgb,var(--glass-bg-strong)_90%,var(--status-tint))]',
      )}
      style={style}
    >
      <span className="relative z-0 flex w-full items-center justify-between gap-3 px-4 py-3.5">
        <span className={cn('min-w-0 flex-1', type.body, 'text-[color:var(--pour-ink-0)]')}>{statusName}</span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 font-pour-mono tabular-nums backdrop-blur-sm',
            type.bodyStrong,
          )}
          style={{
            color: accent.color,
            backgroundColor: 'color-mix(in srgb, var(--glass-bg-strong) 65%, transparent)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {count}
        </span>
      </span>
    </button>
  )
}
