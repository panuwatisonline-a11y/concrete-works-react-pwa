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
import { type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

const THRESHOLD = 72
const MAX_PULL = 112
/** กันหมุนค้างถ้า refresh ค้างจริง (มากกว่า reload master + ดึงหน้าโดยประมาณ) */
const REFRESH_SAFETY_TIMEOUT_MS = 60_000

type PullToRefreshMainProps = ComponentPropsWithoutRef<'main'> & {
  children: ReactNode
}

export function PullToRefreshMain({ children, className, ...rest }: PullToRefreshMainProps) {
  const handler = usePullRefreshStore((s) => s.handler)
  const mainRef = useRef<HTMLElement>(null)
  const touchRef = useRef({ active: false, startY: 0 })
  const pullRef = useRef(0)
  const handlerRef = useRef(handler)
  const refreshingRef = useRef(false)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  handlerRef.current = handler

  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  pullRef.current = pull

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const resetPull = useCallback(() => {
    touchRef.current.active = false
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
    if (!el || !mobile || !handler) return

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || e.touches.length !== 1) return
      if (el.scrollTop > 0) return
      touchRef.current = { active: true, startY: e.touches[0].clientY }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current.active || refreshingRef.current || e.touches.length !== 1) return
      if (el.scrollTop > 0) {
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

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [mobile, handler, resetPull, runRefresh])

  const ready = pull >= THRESHOLD
  const label = refreshing
    ? 'กำลังอัปเดต…'
    : ready
      ? 'ปล่อยเพื่อรีเฟรช'
      : 'ดึงลงเพื่อรีเฟรช'

  const showIndicator = mobile && handler && (pull > 0 || refreshing)
  const indicatorHeight = showIndicator ? Math.max(pull, refreshing ? THRESHOLD * 0.65 : 0) : 0

  return (
    <main ref={mainRef} className={className} {...rest}>
      <div
        aria-live="polite"
        aria-hidden={!showIndicator}
        className={cn(
          'flex items-end justify-center overflow-hidden transition-[height,opacity] duration-200 ease-out md:hidden',
          !showIndicator && 'pointer-events-none opacity-0',
        )}
        style={{ height: indicatorHeight }}
      >
        <div className="mb-1 flex items-center gap-2 rounded-full border border-[color:var(--glass-border-subtle)] bg-white/85 px-3 py-1.5 shadow-[var(--glass-shadow-sm)]">
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
