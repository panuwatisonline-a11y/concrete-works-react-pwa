import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function DashboardKpiBox({
  title,
  value,
  unit,
  icon,
  color,
  isAlert,
}: {
  title: string
  value: string | number
  unit: string
  icon: ReactNode
  color: string
  isAlert?: boolean
}) {
  return (
    <div className={cn('rounded-xl bg-gradient-to-br p-px shadow-sm', color)}>
      <div
        className={cn(
          'flex h-full flex-col rounded-xl bg-[color:var(--glass-bg)] p-4',
          isAlert && 'ring-1 ring-rose-500/30',
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-pour-muted">{title}</p>
          <span className="text-[color:var(--pour-ink-2)] opacity-80">{icon}</span>
        </div>
        <p className="font-mono text-2xl font-extrabold tabular-nums text-[color:var(--pour-ink-0)]">
          {value}
          {unit ? <span className="ml-1 text-xs font-semibold text-pour-muted">{unit}</span> : null}
        </p>
      </div>
    </div>
  )
}
