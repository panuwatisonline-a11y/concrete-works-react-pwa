import { cn } from '@/lib/utils'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/app.types'

interface StatusBadgeProps {
  statusId: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** ชื่อสั้นจากแอป (ไม่ใช้ชื่อยาวจาก master) + ขนาด chip เล็กลง — เหมาะการ์ดรายการบนมือถือ */
  compact?: boolean
}

export function StatusBadge({ statusId, className, size = 'md', compact = false }: StatusBadgeProps) {
  const statuses = useMasterDataStore((s) => s.statuses)
  const fromDb = statuses.find((s) => s.id === statusId)?.status_name?.trim()
  const appShort = STATUS_LABELS[statusId]
  const color = STATUS_COLORS[statusId] ?? 'bg-gray-100 text-gray-800'
  const label = compact
    ? (appShort ?? fromDb ?? `สถานะ #${statusId}`)
    : (fromDb ||
        (statuses.length === 0 ? (appShort ?? `S${statusId}`) : `สถานะ #${statusId}`))

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' && !compact && 'px-2 py-0.5 text-xs',
        size === 'sm' &&
          compact &&
          'shrink-0 px-1.5 py-px text-[10px] leading-tight pour-desktop:px-2 pour-desktop:py-0.5 pour-desktop:text-xs',
        size === 'md' && 'px-2.5 py-1 text-xs',
        size === 'lg' && 'px-3 py-1 text-sm',
        color,
        className,
      )}
    >
      {label}
    </span>
  )
}
