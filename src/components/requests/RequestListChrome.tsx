import { Link, useLocation, useSearchParams } from 'react-router-dom'
import GridView from '@mui/icons-material/GridView'
import ListIcon from '@mui/icons-material/List'
import { AppIcon } from '@/components/icons/AppIcon'
import { useFilterStore } from '@/stores/filterStore'
import { anim } from '@/lib/requestUi'
import { REQUEST_LIST_TAB_ICONS, AddCircle } from '@/lib/statusIcons'
import { cn } from '@/lib/utils'

type ListTab = 'summary' | 'latest' | 'mine' | 'calendar'

const TABS: { id: ListTab; label: string }[] = [
  { id: 'summary', label: 'สถานะการจอง' },
  { id: 'calendar', label: 'ปฏิทิน' },
  { id: 'latest', label: 'รายการทั้งหมด' },
  { id: 'mine', label: 'รายการของฉัน' },
]

function tabHref(tab: ListTab): string {
  if (tab === 'summary') return '/requests?view=summary'
  if (tab === 'calendar') return '/requests?view=calendar'
  if (tab === 'mine') return '/requests?view=latest&scope=mine'
  return '/requests?view=latest'
}

function readActiveTab(pathname: string, search: URLSearchParams): ListTab {
  if (pathname !== '/requests') return 'summary'
  if (search.get('view') === 'summary') return 'summary'
  if (search.get('view') === 'calendar') return 'calendar'
  if (search.get('scope') === 'mine') return 'mine'
  return 'latest'
}

const tabLinkClass = (isActive: boolean) =>
  cn(
    'pour-interactive pour-nav-item flex min-h-8 min-w-0 max-md:flex-1 max-md:basis-0 items-center justify-center rounded-md px-0.5 py-1 text-center text-pour-xs font-medium leading-none transition-colors',
    'max-w-full',
    'pour-desktop:min-h-0 pour-desktop:gap-1 pour-desktop:rounded-lg pour-desktop:px-2 pour-desktop:py-2 pour-desktop:text-pour-md pour-desktop:leading-tight pour-desktop:line-clamp-none pour-desktop:whitespace-normal',
    isActive
      ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
      : 'text-[color:var(--pour-ink-2)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )

/** Figma-style tab strip for request list views */
export function RequestListTabs() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const resetFilter = useFilterStore((s) => s.resetFilter)
  const active = readActiveTab(location.pathname, searchParams)

  return (
    <div className="pour-request-list-tabs flex flex-nowrap items-stretch gap-1 border-b border-[color:var(--pour-line)] pb-2 max-md:gap-0.5 pour-desktop:gap-2 pour-desktop:pb-3">
      <nav
        aria-label="มุมมองรายการ"
        className="flex min-w-0 flex-1 items-stretch gap-0.5 pour-desktop:flex-none pour-desktop:gap-1"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              to={tabHref(tab.id)}
              onClick={() => {
                if (tab.id !== 'summary' && tab.id !== 'calendar') resetFilter()
              }}
              className={tabLinkClass(isActive)}
              aria-current={isActive ? 'page' : undefined}
              title={tab.label}
            >
              <AppIcon
                icon={REQUEST_LIST_TAB_ICONS[tab.id]}
                size="xs"
                className="hidden shrink-0 pour-desktop:block"
              />
              <span className="block min-w-0 w-full text-center leading-tight line-clamp-1 truncate pour-desktop:w-auto pour-desktop:text-left pour-desktop:line-clamp-2">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

const layoutToggleBtnClass = (active: boolean) =>
  cn(
    'pour-interactive flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
    active
      ? 'bg-[color:var(--pour-nav-active-bg)] text-[color:var(--pour-ink-0)]'
      : 'text-[color:var(--pour-ink-3)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)]',
  )

/** Grid/list toggle — inline toolbar control (not dialog chrome) */
export function RequestListLayoutToggle({
  layoutMode,
  onLayoutModeChange,
}: {
  layoutMode: 'grid' | 'list'
  onLayoutModeChange: (mode: 'grid' | 'list') => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5" role="group" aria-label="สลับมุมมอง">
      <button
        type="button"
        title="มุมมองตาราง"
        aria-label="มุมมองตาราง"
        aria-pressed={layoutMode === 'grid'}
        className={layoutToggleBtnClass(layoutMode === 'grid')}
        onClick={() => onLayoutModeChange('grid')}
      >
        <AppIcon icon={GridView} size="xs" />
      </button>
      <button
        type="button"
        title="มุมมองรายการ"
        aria-label="มุมมองรายการ"
        aria-pressed={layoutMode === 'list'}
        className={layoutToggleBtnClass(layoutMode === 'list')}
        onClick={() => onLayoutModeChange('list')}
      >
        <AppIcon icon={ListIcon} size="xs" />
      </button>
    </div>
  )
}

/** Toolbar row above grouped feed — separated from accordion section cards */
export function RequestListFeedToolbar({
  layoutMode,
  onLayoutModeChange,
}: {
  layoutMode: 'grid' | 'list'
  onLayoutModeChange: (mode: 'grid' | 'list') => void
}) {
  return (
    <div
      role="toolbar"
      aria-label="ตัวเลือกรายการ"
      className="flex min-w-0 items-center justify-between gap-3 border-b border-[color:var(--pour-line)] pb-2.5 max-md:pb-2"
    >
      <span className="text-pour-xs font-medium uppercase tracking-wide text-pour-subtle">มุมมอง</span>
      <RequestListLayoutToggle layoutMode={layoutMode} onLayoutModeChange={onLayoutModeChange} />
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
    <header className={cn('flex min-w-0 flex-col gap-1.5', anim.fadeIn)}>
      <div className="flex min-w-0 items-start justify-between gap-2 pour-desktop:gap-3">
        <h1
          className={cn(
            'min-w-0 flex-1 text-pour-title font-semibold leading-snug tracking-[-0.02em] text-[color:var(--pour-ink-0)]',
            'line-clamp-2 pour-desktop:line-clamp-none',
          )}
        >
          {title}
        </h1>
        {showCreate ? (
          <Link
            to="/requests/new"
            className={cn(
              'pour-interactive inline-flex w-auto shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-2.5',
              'text-pour-sm font-medium leading-none whitespace-nowrap',
              'bg-[color:var(--pour-accent)] text-white shadow-sm',
              'hover:bg-[color:var(--pour-accent-hover)]',
              'pour-desktop:gap-2 pour-desktop:px-4 pour-desktop:py-3.5 pour-desktop:text-pour-base',
            )}
          >
            <AppIcon icon={AddCircle} size="xs" className="opacity-95" />
            <span>เพิ่มรายการจอง</span>
          </Link>
        ) : null}
      </div>
      {subtitle ? (
        <p
          className="min-w-0 truncate text-pour-sm leading-relaxed text-pour-muted pour-desktop:text-pour-sm"
          title={subtitle}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}
