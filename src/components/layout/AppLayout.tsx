import { useLocation } from 'react-router-dom'
import { AnimatedOutlet } from '@/components/motion/AnimatedOutlet'
import { PullToRefreshMain } from '@/components/layout/PullToRefreshMain'
import { AppHeader } from './AppHeader'
import { DesktopSidebar } from './DesktopSidebar'
import { DesktopTopBar } from './DesktopTopBar'
import { RequestFiltersDialog } from '@/components/requests/RequestFiltersDialog'
import { RequestWorkflowModals } from '@/components/requests/RequestWorkflowModals'
import { useMasterDataInit } from '@/hooks/useMasterData'
import { usePullToRefreshHost } from '@/hooks/usePullToRefreshHost'
import { useMainScrollRouteSync } from '@/hooks/useMainScrollRouteSync'
import { ConnectivityBanner } from '@/components/layout/ConnectivityBanner'
import { useConnectivity } from '@/hooks/useConnectivity'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { useRequestOverlayStore } from '@/stores/requestOverlayStore'
import Box from '@mui/material/Box'
import { getContentMaxClass, theme } from '@/lib/requestUi'
import { pourMobileUi } from '@/lib/pourMobileScale'
import { pourPcUi } from '@/lib/pourPcScale'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { pathname } = useLocation()
  const contentMaxClass = getContentMaxClass(pathname)
  const workflow = useRequestOverlayStore((s) => s.workflow)
  const workflowHostReady = useRequestOverlayStore((s) => s.workflowHostReady)
  const closeWorkflow = useRequestOverlayStore((s) => s.closeWorkflow)
  const workflowRequest = workflow?.request ?? null

  useConnectivity()
  useMasterDataInit()
  usePullToRefreshHost()
  useMainScrollRouteSync()

  return (
    <Box
      className={cn(
        'flex min-h-0 h-[100dvh] max-h-[100dvh] w-full flex-col',
        theme.shell,
        theme.shellDesktopAccent,
        'pour-desktop:flex-row pour-desktop:gap-0 pour-desktop:p-0 pour-desktop:min-h-0 pour-desktop:overflow-hidden',
        pourMobileUi.root,
        pourPcUi.root,
      )}
      sx={{ bgcolor: 'background.default', color: 'text.primary' }}
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

        <ConnectivityBanner />

        <DesktopTopBar />

        <PullToRefreshMain
          className={cn(
            'mx-auto min-h-0 w-full min-w-0 flex-1',
            theme.mainScrollSurface,
            theme.mainScrollPadX,
            pourMobileUi.mainScroll,
            'pour-desktop:min-h-0 pour-desktop:flex-1',
            'pour-desktop:pb-8 pour-desktop:pt-5',
            'pour-wide:pt-6 pour-wide:pb-10',
            pourPcUi.mainScroll,
          )}
        >
          <div className={cn('flex min-w-0 flex-col', contentMaxClass)}>
            <AnimatedOutlet />
          </div>
        </PullToRefreshMain>
      </div>

      <RequestFiltersDialog />

      {workflowHostReady && workflowRequest ? (
        <RequestWorkflowModals
          request={workflowRequest}
          modal={workflow?.modal ?? null}
          onClose={closeWorkflow}
          onCompleted={() => void notifyRequestListChanged()}
        />
      ) : null}
    </Box>
  )
}
