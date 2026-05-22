import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom'
import { usePourDesktop } from '@/lib/pourLayout'
import {
  PAGE_TRANSITION_MS,
  enterClassForMode,
  exitClassForMode,
  resolvePageTransition,
  type PageTransitionMode,
} from '@/lib/pageTransition'
import { setPageTransitionActive } from '@/stores/pageTransitionStore'
import { cn } from '@/lib/utils'

type ShownPage = {
  pathname: string
  outlet: ReactNode
}

/** Mobile: iOS-like horizontal push/pop. Desktop: short cross-fade. */
export function AnimatedOutlet({ className }: { className?: string }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const liveOutlet = useOutlet()
  const isDesktop = usePourDesktop()
  const [shown, setShown] = useState<ShownPage>(() => ({
    pathname: location.pathname,
    outlet: liveOutlet,
  }))
  const [mode, setMode] = useState<PageTransitionMode>('fade')
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipEnterRef = useRef(true)

  const transitioning = location.pathname !== shown.pathname

  useLayoutEffect(() => {
    setPageTransitionActive(transitioning)
  }, [transitioning])

  useLayoutEffect(() => {
    if (location.pathname === shown.pathname) {
      if (shown.outlet !== liveOutlet) {
        setShown({ pathname: location.pathname, outlet: liveOutlet })
      }
      return
    }

    const nextMode = resolvePageTransition(
      shown.pathname,
      location.pathname,
      navigationType,
      !isDesktop,
    )
    setMode(nextMode)

    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null
      setShown({ pathname: location.pathname, outlet: liveOutlet })
    }, PAGE_TRANSITION_MS)

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [location.pathname, liveOutlet, shown.pathname, shown.outlet, navigationType, isDesktop])

  const playEnter = transitioning || skipEnterRef.current
  const enterClass = playEnter ? enterClassForMode(transitioning ? mode : 'fade') : undefined
  const exitClass = exitClassForMode(mode)
  const isStack = transitioning && mode !== 'fade'

  useLayoutEffect(() => {
    skipEnterRef.current = false
  }, [])

  return (
    <div
      className={cn(
        'pour-page-stage min-w-0',
        transitioning && 'pour-page-transition-active',
        isStack && 'pour-page-transition-stack',
        className,
      )}
    >
      {transitioning ? (
        <div
          key={`exit-${shown.pathname}`}
          className={cn('pour-page-stack-exit pointer-events-none z-0 min-w-0', exitClass)}
          aria-hidden
        >
          <div className="pour-page-stack-surface min-h-full min-w-0">{shown.outlet}</div>
        </div>
      ) : null}
      <div className={cn('pour-page-stack-enter relative z-[1] min-w-0', enterClass)}>
        <div className="pour-page-stack-surface min-w-0">
          {transitioning ? liveOutlet : shown.outlet}
        </div>
      </div>
    </div>
  )
}
