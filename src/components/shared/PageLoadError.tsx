import { Button } from '@/components/ui/button'
import { surface } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

export function PageLoadError({
  message,
  onRetry,
  className,
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={cn(surface.error, 'space-y-4 py-8', className)} role="alert">
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" className="rounded-xl" onClick={onRetry}>
          ลองอีกครั้ง
        </Button>
      ) : null}
    </div>
  )
}
