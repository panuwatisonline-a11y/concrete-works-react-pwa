import { cn } from '@/lib/utils'

export type PourUnderlineTab<T extends string> = {
  id: T
  label: string
}

type PourUnderlineTabsProps<T extends string> = {
  tabs: readonly PourUnderlineTab<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
}

/** แถบแท็บเส้นขอบล่าง — สไตล์เดียวกับ RequestListTabs */
export function PourUnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: PourUnderlineTabsProps<T>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--pour-line)] pb-3">
      <nav aria-label={ariaLabel} className="flex min-w-0 flex-wrap items-center gap-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = value === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'pour-interactive rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
                  : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
