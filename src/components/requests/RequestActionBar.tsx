import type { ReactNode, MouseEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import type { RequestListActionItem } from '@/lib/requestQuickActions'

type RequestActionBarProps = {
  items: RequestListActionItem[]
  onItemClick: (item: RequestListActionItem, e: MouseEvent<HTMLButtonElement>) => void
  layout?: 'panel' | 'strip'
  className?: string
  children?: ReactNode
}

function ActionButtons({
  items,
  onItemClick,
}: Pick<RequestActionBarProps, 'items' | 'onItemClick'>) {
  return (
    <div className={rq.actions.buttonRow}>
      {items.map((a) => {
        const needsStopPropagation = 'cloneFromRequestId' in a || 'printChecklist' in a
        return (
          <Button
            key={a.key}
            type="button"
            size="action"
            variant={a.variant}
            onClick={(e) => {
              if (needsStopPropagation) e.stopPropagation()
              onItemClick(a, e)
            }}
          >
            {a.label}
          </Button>
        )
      })}
    </div>
  )
}

export function RequestActionBar({
  items,
  onItemClick,
  layout = 'panel',
  className,
  children,
}: RequestActionBarProps) {
  if (items.length === 0 && !children) return null

  if (layout === 'strip') {
    return (
      <div className={cn(rq.actions.strip, className)}>
        {items.length > 0 ? <ActionButtons items={items} onItemClick={onItemClick} /> : null}
        {children}
      </div>
    )
  }

  return (
    <Card id="request-actions" className={cn(rq.card, className)}>
      <CardContent className={rq.actions.panelBody}>
        {items.length > 0 ? <ActionButtons items={items} onItemClick={onItemClick} /> : null}
        {children}
      </CardContent>
    </Card>
  )
}
