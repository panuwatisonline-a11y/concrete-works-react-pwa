import { useState, type ReactNode } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

type CollapsibleNavSectionProps = {
  title: string
  defaultOpen?: boolean
  className?: string
  headerClassName?: string
  panelClassName?: string
  children: ReactNode
}

export function CollapsibleNavSection({
  title,
  defaultOpen = true,
  className,
  headerClassName,
  panelClassName,
  children,
}: CollapsibleNavSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `nav-section-${title.toLowerCase()}`

  return (
    <section className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          theme.navSectionLabel,
          'pour-interactive pour-nav-item mb-0 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[color:var(--pour-accent-muted)]/40',
          headerClassName,
        )}
      >
        <span>{title}</span>
        <AppIcon
          icon={ExpandMore}
          size="sm"
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div id={panelId} className={cn('mt-1', panelClassName)}>
          {children}
        </div>
      ) : null}
    </section>
  )
}
