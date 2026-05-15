import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Bell, ListFilter, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistry } from '@/stores/desktopSearchRegistry'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Input } from '@/components/ui/input'
import { getDesktopSearchBarConfig } from '@/lib/desktopTopBarSearch'
import { theme, icon, ICON_STROKE, type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

/** Desktop-only top strip: wide search + actions (matches dashboard ref layout). */
export function DesktopTopBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile } = useAuthStore()
  const filter = useFilterStore((s) => s.filter)
  const setFilter = useFilterStore((s) => s.setFilter)
  const setRequestFiltersOpen = useFilterStore((s) => s.setRequestFiltersOpen)

  const active = useDesktopSearchRegistry((s) => s.active)
  const searchRevision = useDesktopSearchRegistry((s) => s.searchRevision)
  void searchRevision

  const fallback = getDesktopSearchBarConfig(pathname)
  const bridged = active != null

  const placeholder = bridged ? active.placeholder : fallback.placeholder
  const ariaLabel = bridged ? active.ariaLabel : fallback.ariaLabel
  const inputDisabled = bridged ? false : fallback.inputDisabled
  const showFilter = bridged ? active.showRequestFilterButton : fallback.showRequestFilterButton
  const searchValue = bridged ? active.getSearch() : fallback.bindFilter ? filter.search : ''

  function applySearchChange(v: string) {
    if (bridged) active.setSearch(v)
    else if (fallback.bindFilter) setFilter({ search: v })
  }

  function openFiltersDialog() {
    navigate('/requests?view=latest')
    setRequestFiltersOpen(true)
  }

  return (
    <div
      className={cn(
        'hidden shrink-0 items-center gap-4 px-4 py-3.5 sm:px-6 md:flex lg:px-8 xl:px-10 2xl:px-12',
        theme.headerBar,
      )}
    >
      <div className="relative flex min-w-0 flex-1 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
              icon.sm,
              inputDisabled ? 'text-[color:var(--pour-ink-3)]' : 'text-[color:var(--pour-ink-0)]',
            )}
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
          <Input
            type="search"
            autoComplete="off"
            disabled={inputDisabled}
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => applySearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (inputDisabled) return
              if (e.key === 'Enter') navigate('/requests?view=latest')
            }}
            className={cn(
              'h-10 w-full rounded-xl border-[color:var(--glass-border-subtle)] bg-[var(--glass-bg)] pl-10 pr-3 backdrop-blur-xl',
              type.body,
              'placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)]',
              'focus-visible:border-[color:var(--pour-accent)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--pour-accent-ring)]',
              inputDisabled && 'cursor-not-allowed bg-white/30 text-[#6b7280]',
            )}
            aria-label={ariaLabel}
          />
        </div>
        {showFilter ? (
          <button
            type="button"
            onClick={openFiltersDialog}
            title="ตัวกรองสถานะและอื่นๆ"
            className={cn(
              'pour-glass flex h-10 shrink-0 items-center justify-center rounded-xl px-3',
              type.body,
              'text-[#6b7280] transition hover:border-[#c8ced8] hover:bg-[rgba(17,24,39,0.04)] hover:text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9ca3af]/35',
            )}
            aria-label="เปิดตัวกรองคำขอ"
          >
            <ListFilter className={icon.sm} strokeWidth={ICON_STROKE} />
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/requests?view=latest')}
          className={cn('h-10 w-10 shrink-0', theme.iconButtonChrome)}
          title="รายการคำขอ"
        >
          <Bell className={icon.sm} strokeWidth={ICON_STROKE} />
        </button>
        <Link
          to="/profile"
          className="rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-[var(--pour-accent-ring)]"
          title="โปรไฟล์"
        >
          <UserAvatar profile={profile} size="sm" />
        </Link>
      </div>
    </div>
  )
}
