import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react'
import { RefreshCw } from 'lucide-react'
import { usePullRefreshStore } from '@/stores/pullRefreshStore'
import {
  isPullRefreshEnabled,
  isScrollAtTop,
  resolveScrollRoot,
  subscribePullRefreshEnabled,
} from '@/lib/pourLayout'
import { type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const THRESHOLD = 72
const MAX_PULL = 112
/** กันหมุนค้างถ้า refresh ค้างจริง (มากกว่า reload master + ดึงหน้าโดยประมาณ) */
const REFRESH_SAFETY_TIMEOUT_MS = 60_000

type PullToRefreshMainProps = ComponentPropsWithoutRef<'main'> & {
  children: ReactNode
}

type TouchSession = {
  active: boolean
  startY: number
  scrollRoot: HTMLElement | null
}

export function PullToRefreshMain({ children, className, ...rest }: PullToRefreshMainProps) {
  const handler = usePullRefreshStore((s) => s.handler)
  const mainRef = useRef<HTMLElement>(null)
  const touchRef = useRef<TouchSession>({ active: false, startY: 0, scrollRoot: null })
  const pullRef = useRef(0)
  const handlerRef = useRef(handler)
  const refreshingRef = useRef(false)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  handlerRef.current = handler

  const [pullEnabled, setPullEnabled] = useState(() =>
    typeof window !== 'undefined' ? isPullRefreshEnabled() : true,
  )

  pullRef.current = pull

  useEffect(() => subscribePullRefreshEnabled(setPullEnabled), [])

  const resetPull = useCallback(() => {
    touchRef.current = { active: false, startY: 0, scrollRoot: null }
    setPull(0)
  }, [])

  const runRefresh = useCallback(async () => {
    const activeHandler = handlerRef.current
    if (!activeHandler || refreshingRef.current) {
      resetPull()
      return
    }
    refreshingRef.current = true
    setRefreshing(true)
    setPull(THRESHOLD * 0.65)
    try {
      await Promise.race([
        activeHandler(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error('Pull refresh timed out')), REFRESH_SAFETY_TIMEOUT_MS)
        }),
      ])
    } catch (e) {
      console.error('Pull refresh:', e)
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
      resetPull()
    }
  }, [resetPull])

  useEffect(() => {
    const el = mainRef.current
    if (!el || !pullEnabled || !handler) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || e.touches.length !== 1) return
      const scrollRoot = resolveScrollRoot(e.target, el)
      if (!isScrollAtTop(scrollRoot)) return
      touchRef.current = { active: true, startY: e.touches[0].clientY, scrollRoot }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current.active || refreshingRef.current || e.touches.length !== 1) return
      const scrollRoot = touchRef.current.scrollRoot ?? el
      if (!isScrollAtTop(scrollRoot)) {
        resetPull()
        return
      }
      const dy = e.touches[0].clientY - touchRef.current.startY
      if (dy <= 0) {
        resetPull()
        return
      }
      e.preventDefault()
      setPull(Math.min(dy * 0.45, MAX_PULL))
    }

    const onTouchEnd = () => {
      if (!touchRef.current.active) return
      touchRef.current.active = false
      if (pullRef.current >= THRESHOLD) {
        void runRefresh()
      } else {
        resetPull()
      }
    }

    const onTouchCancel = () => {
      resetPull()
    }

    const opts = { capture: true } as const
    const moveOpts = { capture: true, passive: false } as const

    el.addEventListener('touchstart', onTouchStart, opts)
    el.addEventListener('touchmove', onTouchMove, moveOpts)
    el.addEventListener('touchend', onTouchEnd, opts)
    el.addEventListener('touchcancel', onTouchCancel, opts)
    return () => {
      el.removeEventListener('touchstart', onTouchStart, opts)
      el.removeEventListener('touchmove', onTouchMove, moveOpts)
      el.removeEventListener('touchend', onTouchEnd, opts)
      el.removeEventListener('touchcancel', onTouchCancel, opts)
    }
  }, [pullEnabled, handler, resetPull, runRefresh])

  const ready = pull >= THRESHOLD
  const label = refreshing
    ? 'กำลังอัปเดต…'
    : ready
      ? 'ปล่อยเพื่อรีเฟรช'
      : 'ดึงลงเพื่อรีเฟรช'

  const showIndicator = pullEnabled && handler && (pull > 0 || refreshing)
  const indicatorHeight = showIndicator ? Math.max(pull, refreshing ? THRESHOLD * 0.65 : 0) : 0

  return (
    <main ref={mainRef} className={className} {...rest}>
      <div
        aria-live="polite"
        aria-hidden={!showIndicator}
        className={cn(
          'flex items-end justify-center overflow-hidden transition-[height,opacity] duration-200 ease-out',
          !pullEnabled && 'hidden',
          !showIndicator && 'pointer-events-none opacity-0',
        )}
        style={{ height: indicatorHeight }}
      >
        <div className="mb-1 flex items-center gap-2 rounded-full border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-strong)] px-3 py-1.5 shadow-[var(--glass-shadow-sm)]">
          <RefreshCw
            className={cn(
              'h-4 w-4 text-[color:var(--pour-accent)]',
              (refreshing || ready) && 'animate-spin',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <span className={cn(type.caption, 'text-[color:var(--pour-ink-2)]')}>{label}</span>
        </div>
      </div>
      {children}
    </main>
  )
}
