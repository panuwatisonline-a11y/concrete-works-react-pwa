import type { ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export { dashboardBarChartHeight } from '@/lib/dashboardChartLayout'

export function DashboardChartBox({
  title,
  isActive,
  onClear,
  height = 200,
  emptyMessage = 'ไม่มีข้อมูล',
  isEmpty = false,
  className,
  headerActions,
  children,
}: {
  title: string
  isActive?: boolean
  onClear?: () => void
  height?: number
  isEmpty?: boolean
  emptyMessage?: string
  /** เช่น lg:col-span-2 สำหรับกราฟที่ต้องการความกว้างเต็มแถว */
  className?: string
  /** ปุ่ม/ตัวกรองเพิ่มในแถบหัวข้อ (เช่น dropdown โครงสร้าง) */
  headerActions?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-[14px] border bg-[color:var(--glass-bg)] p-4 shadow-[var(--glass-shadow-sm)] backdrop-blur-sm transition-all sm:p-5',
        isActive ? 'border-[color:var(--pour-accent)]/50' : 'border-[color:var(--pour-surface-border)]',
        className,
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold leading-snug text-[color:var(--pour-ink-0)]">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              isActive ? 'animate-pulse bg-[color:var(--pour-accent)]' : 'bg-pour-muted',
            )}
          />
          <span className="truncate">{title}</span>
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {headerActions}
          {isActive && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex shrink-0 items-center gap-1 rounded border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-pour-muted transition-colors hover:text-[color:var(--pour-ink-0)]"
            >
              <X size={10} aria-hidden />
              Clear
            </button>
          ) : null}
        </div>
      </div>
      {isEmpty ? (
        <div
          className="flex items-center justify-center text-sm italic text-pour-muted"
          style={{ height }}
        >
          {emptyMessage}
        </div>
      ) : (
        <div className="min-w-0 w-full" style={{ height, minHeight: height }}>
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
