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
        'flex min-h-0 h-[100dvh] max-h-[100dvh] w-full flex-col text-[color:var(--pour-ink-0)]',
        theme.shell,
        theme.shellDesktopAccent,
        /* โหมด PC: sidebar คงที่ซ้าย — edge-to-edge ไม่มี padding รอบ */
        'pour-desktop:flex-row pour-desktop:gap-0 pour-desktop:p-0 pour-desktop:min-h-0 pour-desktop:overflow-hidden',
      )}
    >
      <DesktopSidebar />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          theme.mainColumnDesktop,
          'pour-desktop:min-h-0 pour-desktop:flex-1',
        )}
      >
        <AppHeader />

        <DesktopTopBar />

        <PullToRefreshMain
          className={cn(
            'mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain',
            'px-4 sm:px-6',
            'pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3',
            'pour-desktop:min-h-0 pour-desktop:flex-1 pour-desktop:bg-transparent',
            'pour-desktop:px-6 pour-desktop:pb-8 pour-desktop:pt-5 lg:pour-desktop:px-8',
            'pour-wide:px-10 pour-wide:pt-6 pour-wide:pb-10',
          )}
        >
          <div className="flex min-w-0 flex-col gap-4 pour-desktop:gap-6 pour-wide:mx-auto pour-wide:w-full pour-wide:max-w-328 pour-wide:gap-7">
            <AppBreadcrumbs />
            <AnimatedOutlet />
          </div>
        </PullToRefreshMain>
      </div>

      <RequestFiltersDialog />
    </div>
  )
}
