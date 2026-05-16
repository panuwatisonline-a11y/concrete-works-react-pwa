import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { theme, icon, ICON_STROKE } from '@/lib/requestUi'
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
          'mb-0 flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-[color:var(--pour-accent-muted)]/40',
          headerClassName,
        )}
      >
        <span>{title}</span>
        <ChevronDown
          className={cn(icon.sm, 'shrink-0 transition-transform duration-200', open && 'rotate-180')}
          strokeWidth={ICON_STROKE}
          aria-hidden
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
