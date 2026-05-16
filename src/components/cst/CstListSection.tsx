import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-[color:var(--glass-border-subtle)] bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[rgba(17,24,39,0.03)] sm:px-4 sm:py-3"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-pour-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <span className="truncate text-sm font-semibold text-[color:var(--pour-ink-0)]">{title}</span>
          <span className="shrink-0 rounded-full bg-[color:var(--pour-accent-muted)] px-2 py-0.5 text-[10px] font-semibold tabular-nums text-[color:var(--pour-accent)]">
            {count}
          </span>
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="border-t border-[color:var(--glass-border-subtle)] px-3 pb-3 pt-2 sm:px-4 sm:pb-4"
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
