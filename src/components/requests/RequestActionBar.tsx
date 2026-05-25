import type { ReactNode, MouseEvent } from 'react'
import ContentCopy from '@mui/icons-material/ContentCopy'
import { AppIcon } from '@/components/icons/AppIcon'
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
        const isCopy = 'copyOrderLoad' in a
        const needsStopPropagation =
          'cloneFromRequestId' in a || 'printChecklist' in a || isCopy
        return (
          <Button
            key={a.key}
            type="button"
            size="action"
            variant={a.variant}
            className={isCopy ? 'px-2.5' : undefined}
            aria-label={isCopy ? a.label : undefined}
            title={isCopy ? a.label : undefined}
            onClick={(e) => {
              if (needsStopPropagation) e.stopPropagation()
              onItemClick(a, e)
            }}
          >
            {isCopy ? (
              <AppIcon icon={ContentCopy} size="sm" />
            ) : (
              a.label
            )}
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
