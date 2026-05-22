import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePourDesktop } from '@/lib/pourLayout'
import { PAGE_TRANSITION_MS } from '@/lib/pageTransition'
import {
  getRequestListScrollKey,
  restoreMainScroll,
  saveMainScroll,
  scrollMainToTop,
} from '@/stores/mainScrollStore'

/**
 * Saves list scroll when leaving /requests; resets main scroll on other routes
 * so detail pages start at the top (scroll host is outside AnimatedOutlet).
 */
export function useMainScrollRouteSync() {
  const { pathname, search } = useLocation()
  const isDesktop = usePourDesktop()
  const prevRef = useRef({ pathname, search })
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useLayoutEffect(() => {
    const prev = prevRef.current
    const prevListKey = getRequestListScrollKey(prev.pathname, prev.search)
    const nextListKey = getRequestListScrollKey(pathname, search)

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)

    if (prevListKey && prevListKey !== nextListKey) {
      saveMainScroll(prevListKey)
    }

    if (!nextListKey) {
      scrollMainToTop()
    } else if (prevListKey && prevListKey !== nextListKey) {
      const restore = () => {
        if (!restoreMainScroll(nextListKey)) scrollMainToTop()
      }
      if (isDesktop) {
        restore()
      } else {
        scrollTimerRef.current = setTimeout(restore, PAGE_TRANSITION_MS)
      }
    }

    prevRef.current = { pathname, search }

    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [pathname, search, isDesktop])
}
