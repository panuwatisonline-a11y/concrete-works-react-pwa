import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { rq } from '@/lib/requestUi'

interface RequestScreenHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  onBack?: () => void
  right?: ReactNode
  className?: string
}

export function RequestScreenHeader({ title, subtitle, onBack, right, className }: RequestScreenHeaderProps) {
  return (
    <div className={cn('flex items-start gap-1 md:items-center md:gap-2', className)}>
      {onBack ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl text-[#6b7280] hover:bg-[#dcfce7] hover:text-[#111827]"
          onClick={onBack}
          aria-label="กลับ"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className={rq.heroTitle}>{title}</h1>
        {subtitle ? <div className={cn('mt-0.5', rq.sub)}>{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0 pt-0.5">{right}</div> : null}
    </div>
  )
}
