import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Bell, ListFilter, Search } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistry } from '@/stores/desktopSearchRegistry'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Input } from '@/components/ui/input'
import { getDesktopSearchBarConfig } from '@/lib/desktopTopBarSearch'
import { theme } from '@/lib/requestUi'
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
        'hidden shrink-0 items-center gap-4 px-4 py-3 sm:px-6 md:flex lg:px-8 xl:px-10 2xl:px-12',
        theme.headerBar,
      )}
    >
      <div className="relative flex min-w-0 flex-1 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2',
              inputDisabled ? 'text-[#9ca3af]' : 'text-[#2563eb]',
            )}
            strokeWidth={1.75}
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
              'h-10 w-full rounded-xl border-[#e2e6ec] bg-white pl-10 pr-3 text-sm shadow-sm shadow-black/[0.04]',
              'placeholder:font-normal placeholder:text-[#b4bcc8]',
              'focus-visible:border-[#2563eb] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(37,99,235,0.10)]',
              inputDisabled && 'cursor-not-allowed bg-[#f5f6f8] text-[#6b7280]',
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
              'flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#e2e6ec] bg-white px-3 text-sm shadow-sm shadow-black/[0.04]',
              'text-[#6b7280] transition hover:border-[#2563eb]/35 hover:bg-[rgba(37,99,235,0.06)] hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/25',
            )}
            aria-label="เปิดตัวกรองคำขอ"
          >
            <ListFilter className="h-[18px] w-[18px]" strokeWidth={1.75} />
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
          <Bell className="h-[20px] w-[20px]" strokeWidth={1.75} />
        </button>
        <Link
          to="/profile"
          className="rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-[rgba(37,99,235,0.25)]"
          title="โปรไฟล์"
        >
          <UserAvatar profile={profile} size="sm" />
        </Link>
      </div>
    </div>
  )
}
