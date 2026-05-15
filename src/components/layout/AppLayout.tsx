import { AnimatedOutlet } from '@/components/motion/AnimatedOutlet'
import { PullToRefreshMain } from '@/components/layout/PullToRefreshMain'
import { AppHeader } from './AppHeader'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import { DesktopSidebar } from './DesktopSidebar'
import { DesktopTopBar } from './DesktopTopBar'
import { RequestFiltersDialog } from '@/components/requests/RequestFiltersDialog'
import { useMasterDataInit } from '@/hooks/useMasterData'
import { usePullToRefreshHost } from '@/hooks/usePullToRefreshHost'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

export function AppLayout() {
  useMasterDataInit()
  usePullToRefreshHost()

  return (
    <div
      className={cn(
        'flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col text-[color:var(--pour-ink-0)]',
        theme.shell,
        theme.shellDesktopAccent,
        'md:flex-row md:gap-4 md:p-4 md:pr-5',
      )}
    >
      <DesktopSidebar />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          theme.mainColumnDesktop,
        )}
      >
        <AppHeader />

        <DesktopTopBar />

        <PullToRefreshMain
          className={cn(
            'mx-auto w-full min-w-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain',
            'px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
            'pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3 md:bg-transparent md:pb-10 md:pt-4',
          )}
        >
          <div className="flex min-w-0 flex-col gap-4 md:gap-5">
            <AppBreadcrumbs />
            <AnimatedOutlet />
          </div>
        </PullToRefreshMain>
      </div>

      <RequestFiltersDialog />
    </div>
  )
}
