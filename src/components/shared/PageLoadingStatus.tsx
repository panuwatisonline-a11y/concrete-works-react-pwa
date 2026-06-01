import { rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

export function PageLoadingStatus({
  message = 'กำลังโหลด…',
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-20', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={rq.spinner} aria-hidden />
      <p className="mt-3 text-sm text-pour-muted">{message}</p>
    </div>
  )
}
