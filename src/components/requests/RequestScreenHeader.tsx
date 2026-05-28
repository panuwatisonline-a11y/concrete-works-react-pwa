import type { ReactNode } from 'react'
import ArrowBack from '@mui/icons-material/ArrowBack'
import { AppIcon } from '@/components/icons/AppIcon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { rq } from '@/lib/requestUi'

interface RequestScreenHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  right?: ReactNode
  /** แถวเดียวกับปุ่มกลับ — รหัส + badge (หน้ารายละเอียด) */
  titleLayout?: 'page' | 'inline'
  className?: string
}

export function RequestScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  titleLayout = 'page',
  className,
}: RequestScreenHeaderProps) {
  const inline = titleLayout === 'inline'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="!h-10 !min-h-10 !w-10 shrink-0 !p-0 rounded-xl text-pour-muted hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]"
          onClick={onBack}
          aria-label="กลับ"
        >
          <AppIcon icon={ArrowBack} size="md" />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1
          className={cn(
            'min-w-0',
            inline ? 'text-base font-semibold leading-none' : rq.heroTitle,
          )}
        >
          {title}
        </h1>
        {subtitle ? <div className={cn('mt-0.5', rq.sub)}>{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0 self-center">{right}</div> : null}
    </div>
  )
}
