import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'
import { AppBreadcrumbs } from './AppBreadcrumbs'
import { DesktopSidebar } from './DesktopSidebar'
import { DesktopTopBar } from './DesktopTopBar'
import { RequestFiltersDialog } from '@/components/requests/RequestFiltersDialog'
import { useMasterDataInit } from '@/hooks/useMasterData'
import { theme } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

export function AppLayout() {
  useMasterDataInit()

  return (
    <div
      className={cn(
        'flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col text-[#111827]',
        theme.shell,
        theme.shellDesktopAccent,
        'md:flex-row md:gap-3 md:p-3 md:pr-4',
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

        <main
          className={cn(
            'mx-auto w-full min-w-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
            'px-0 py-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-0 md:py-0 md:pb-0',
          )}
        >
          <div
            className={cn(
              'mx-auto w-full min-w-0 max-w-none',
              'px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-0 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
              'md:pb-10 md:pt-2',
            )}
          >
            <AppBreadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>

      <RequestFiltersDialog />
    </div>
  )
}
