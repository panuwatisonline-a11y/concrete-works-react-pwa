import { cn } from '@/lib/utils'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/app.types'

interface StatusBadgeProps {
  statusId: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ statusId, className, size = 'md' }: StatusBadgeProps) {
  const statuses = useMasterDataStore((s) => s.statuses)
  const fromDb = statuses.find((s) => s.id === statusId)?.status_name?.trim()
  const color = STATUS_COLORS[statusId] ?? 'bg-gray-100 text-gray-800'
  const label =
    fromDb ||
    (statuses.length === 0 ? (STATUS_LABELS[statusId] ?? `S${statusId}`) : `สถานะ #${statusId}`)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm',
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
