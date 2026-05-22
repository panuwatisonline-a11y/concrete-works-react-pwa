import { useEffect } from 'react'
import { isPourDesktopViewport, subscribePourDesktop } from '@/lib/pourLayout'
import { initTouchPressEnhancer } from '@/lib/touchPressEnhancer'

/** Touch press feedback — mobile / portrait only (not PC layout). */
export function TouchPressEnhancer() {
  useEffect(() => {
    let teardown = isPourDesktopViewport() ? () => {} : initTouchPressEnhancer()

    const unsubMq = subscribePourDesktop((isDesktop) => {
      teardown()
      teardown = isDesktop ? () => {} : initTouchPressEnhancer()
    })

    return () => {
      unsubMq()
      teardown()
    }
  }, [])

  return null
}
