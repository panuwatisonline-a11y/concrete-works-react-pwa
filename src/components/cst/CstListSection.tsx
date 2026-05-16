import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { frame } from '@/lib/requestUi'

type CstListSectionProps = {
  title: string
  count: number
  /** เปิดตอนโหลดครั้งแรก */
  defaultOpen?: boolean
  emptyMessage?: string
  children: ReactNode
  className?: string
}

/** กลุ่มรายการ CST แบบยุบ/ขยาย */
export function CstListSection({
  title,
  count,
  defaultOpen = true,
  emptyMessage,
  children,
  className,
}: CstListSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `cst-section-${title.replace(/\s+/g, '-')}`

  return (
    <section className={cn(frame.section, className)}>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]/70 sm:px-5"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-pour-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <span className={cn(frame.sectionTitle, 'truncate')}>{title}</span>
          <span className="shrink-0 rounded-full bg-[color:var(--pour-accent-muted)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--pour-accent)]">
            {count}
          </span>
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className={frame.sectionBody}
        >
          {count === 0 && emptyMessage ? (
            <p className="py-4 text-center text-sm text-pour-muted">{emptyMessage}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </section>
  )
}
