import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePourDesktop } from '@/lib/pourLayout'
import { getRequestListScrollKey, restoreMainScroll } from '@/stores/mainScrollStore'
import { afterPageTransition } from '@/stores/pageTransitionStore'

/** Restore main scroll after list data is ready (return from detail). */
export function useRequestListScrollRestore(ready: boolean) {
  const { pathname, search } = useLocation()
  const isDesktop = usePourDesktop()
  const scrollKey = getRequestListScrollKey(pathname, search)
  const restoredKeyRef = useRef<string | null>(null)

  useEffect(() => {
    restoredKeyRef.current = null
  }, [scrollKey])

  useEffect(() => {
    if (!scrollKey || !ready) return
    if (restoredKeyRef.current === scrollKey) return

    const run = () => {
      if (!scrollKey) return
      if (restoreMainScroll(scrollKey)) {
        restoredKeyRef.current = scrollKey
      }
    }

    const schedule = () => requestAnimationFrame(() => requestAnimationFrame(run))

    if (isDesktop) {
      schedule()
      return
    }
    return afterPageTransition(schedule)
  }, [scrollKey, ready, isDesktop])
}
