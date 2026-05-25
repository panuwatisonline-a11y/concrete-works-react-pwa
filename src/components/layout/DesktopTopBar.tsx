import { useNavigate, Link, useLocation } from 'react-router-dom'
import Notifications from '@mui/icons-material/Notifications'
import FilterList from '@mui/icons-material/FilterList'
import Search from '@mui/icons-material/Search'
import { AppIcon } from '@/components/icons/AppIcon'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useRequestOverlayStore } from '@/stores/requestOverlayStore'
import { useDesktopSearchRegistry } from '@/stores/desktopSearchRegistry'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Input } from '@/components/ui/input'
import { getDesktopSearchBarConfig, topBarPlaceholder } from '@/lib/desktopTopBarSearch'
import { theme } from '@/lib/requestUi'
import { pourPcUi } from '@/lib/pourPcScale'
import { SuperAdminJobFilter } from '@/components/layout/SuperAdminJobFilter'
import { cn } from '@/lib/utils'

/** Desktop-only top strip: job filter (optional) + search + actions */
export function DesktopTopBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile, user } = useAuthStore()
  const filter = useFilterStore((s) => s.filter)
  const setFilter = useFilterStore((s) => s.setFilter)
  const openRequestFilters = useRequestOverlayStore((s) => s.openRequestFilters)

  const active = useDesktopSearchRegistry((s) => s.active)
  const searchRevision = useDesktopSearchRegistry((s) => s.searchRevision)
  void searchRevision

  const fallback = getDesktopSearchBarConfig(pathname)
  const bridged = active != null

  const placeholder = topBarPlaceholder(bridged ? active.placeholder : fallback.placeholder)
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
    openRequestFilters()
  }

  return (
    <div
      className={cn(
        'pour-pc-topbar hidden w-full min-w-0 max-w-full',
        'pour-desktop:flex pour-desktop:flex-row pour-desktop:flex-nowrap pour-desktop:items-center',
        theme.headerBar,
        pourPcUi.topbar,
      )}
    >
      <SuperAdminJobFilter />

      <div className="pour-pc-topbar-search">
        <div className="pour-pc-topbar-search-field">
          <AppIcon
            icon={Search}
            size="sm"
            className={cn(
              'pour-pc-topbar-search-icon pointer-events-none absolute top-1/2 z-0 -translate-y-1/2',
              inputDisabled ? 'text-[color:var(--pour-ink-3)]' : 'text-[color:var(--pour-ink-0)]',
            )}
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
              'pour-input-glass w-full min-w-0 text-[color:var(--pour-ink-1)]',
              'placeholder:font-normal placeholder:text-[color:var(--pour-ink-3)]',
              inputDisabled && 'cursor-not-allowed opacity-50',
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
              'pour-pc-topbar-search-filter pour-glass flex shrink-0 items-center justify-center rounded-xl',
              'text-[color:var(--pour-ink-2)] transition hover:border-[color:var(--glass-edge)] hover:bg-[color:var(--pour-nav-hover-bg)] hover:text-[color:var(--pour-ink-0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent-ring)]',
            )}
            aria-label="เปิดตัวกรองคำขอ"
          >
            <AppIcon icon={FilterList} size="sm" />
          </button>
        ) : null}
      </div>

      <div className="pour-pc-topbar-actions">
        <button
          type="button"
          onClick={() => navigate('/requests?view=latest')}
          className={cn('h-10 shrink-0', theme.iconButtonChrome)}
          title="รายการคำขอ"
        >
          <AppIcon icon={Notifications} size="sm" />
        </button>
        <Link
          to="/profile"
          className="rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-[var(--pour-accent-ring)]"
          title="โปรไฟล์"
        >
          <UserAvatar profile={profile} avatarUrl={user?.user_metadata?.avatar_url as string | undefined} size="sm" />
        </Link>
      </div>
    </div>
  )
}
