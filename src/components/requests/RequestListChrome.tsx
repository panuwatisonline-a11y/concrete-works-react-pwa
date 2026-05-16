import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { useFilterStore } from '@/stores/filterStore'
import { icon, ICON_STROKE, type, anim } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

type ListTab = 'summary' | 'latest' | 'mine'

const TABS: { id: ListTab; label: string }[] = [
  { id: 'summary', label: 'สถานะการจอง' },
  { id: 'latest', label: 'รายการทั้งหมด' },
  { id: 'mine', label: 'รายการของฉัน' },
]

function tabHref(tab: ListTab): string {
  if (tab === 'summary') return '/requests?view=summary'
  if (tab === 'mine') return '/requests?view=latest&scope=mine'
  return '/requests?view=latest'
}

function readActiveTab(pathname: string, search: URLSearchParams): ListTab {
  if (pathname !== '/requests') return 'summary'
  if (search.get('view') === 'summary') return 'summary'
  if (search.get('scope') === 'mine') return 'mine'
  return 'latest'
}

/** Figma-style tab strip + optional grid/list toggle for request list views */
export function RequestListTabs({
  layoutMode,
  onLayoutModeChange,
}: {
  layoutMode?: 'grid' | 'list'
  onLayoutModeChange?: (mode: 'grid' | 'list') => void
}) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const resetFilter = useFilterStore((s) => s.resetFilter)
  const active = readActiveTab(location.pathname, searchParams)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--pour-line)] pb-3">
      <nav aria-label="มุมมองรายการ" className="flex min-w-0 flex-wrap items-center gap-1">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              to={tabHref(tab.id)}
              onClick={() => {
                if (tab.id !== 'summary') resetFilter()
              }}
              className={cn(
                'pour-interactive rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
                  : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {layoutMode && onLayoutModeChange ? (
        <div
          className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[color:var(--pour-line)] p-0.5"
          role="group"
          aria-label="สลับมุมมอง"
        >
          <button
            type="button"
            title="มุมมองตาราง"
            aria-label="มุมมองตาราง"
            className={cn(
              'pour-interactive flex h-8 w-8 items-center justify-center rounded-md',
              layoutMode === 'grid'
                ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
                : 'text-[color:var(--pour-ink-3)] hover:text-[color:var(--pour-ink-0)]',
            )}
            onClick={() => onLayoutModeChange('grid')}
          >
            <LayoutGrid className={icon.xs} strokeWidth={ICON_STROKE} />
          </button>
          <button
            type="button"
            title="มุมมองรายการ"
            aria-label="มุมมองรายการ"
            className={cn(
              'pour-interactive flex h-8 w-8 items-center justify-center rounded-md',
              layoutMode === 'list'
                ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
                : 'text-[color:var(--pour-ink-3)] hover:text-[color:var(--pour-ink-0)]',
            )}
            onClick={() => onLayoutModeChange('list')}
          >
            <List className={icon.xs} strokeWidth={ICON_STROKE} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function RequestListPageHeader({
  title,
  subtitle,
  showCreate = true,
}: {
  title: string
  subtitle?: string
  showCreate?: boolean
}) {
  return (
    <header className={cn('flex min-w-0 flex-wrap items-end justify-between gap-4', anim.fadeIn)}>
      <div className="min-w-0">
        <h1 className={type.hero}>{title}</h1>
        {subtitle ? <p className={cn('mt-1', type.caption)}>{subtitle}</p> : null}
      </div>
      {showCreate ? (
        <Link
          to="/requests/new"
          className={cn(
            'pour-interactive inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5',
            'bg-[color:var(--pour-accent)] text-white shadow-sm',
            'hover:bg-[color:var(--pour-accent-hover)]',
            type.bodyStrong,
          )}
        >
          <Plus className={icon.md} strokeWidth={ICON_STROKE} />
          เพิ่มรายการจอง
        </Link>
      ) : null}
    </header>
  )
}
