import { useState, type ReactNode } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
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
    <section
      className={cn(
        'overflow-visible rounded-none border-0 bg-transparent',
        'border-b border-[color:var(--glass-border-subtle)] last:border-b-0',
        className,
      )}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3.5 text-left transition-colors',
          'shadow-[var(--glass-shadow-sm)]',
          open
            ? 'bg-[color:var(--glass-bg)]'
            : 'bg-[color:var(--glass-bg-muted)] hover:bg-[color:var(--glass-bg)]',
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <AppIcon
            icon={ExpandMore}
            size="md"
            className={cn(
              'text-pour-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
          <span className={cn(frame.sectionTitle, 'truncate')}>{title}</span>
          <span className="shrink-0 rounded-full border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[color:var(--pour-ink-1)]">
            {count}
          </span>
        </span>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${panelId}-trigger`}
          className="min-w-0 px-0 pb-3 pt-2"
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
