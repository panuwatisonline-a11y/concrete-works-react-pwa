import { useCallback, useEffect, useRef } from 'react'
import { PULL_REFRESH_PAGE_EVENT, type PullRefreshPageDetail } from '@/lib/pullRefresh'
import type { PullRefreshHandler } from '@/stores/pullRefreshStore'

/** ลงทะเบียน callback รีเฟรชข้อมูลเฉพาะหน้า (หลัง master data โหลดแล้ว) */
export function usePullToRefreshRegistration(handler: PullRefreshHandler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const onPageRefresh = useCallback((e: Event) => {
    const detail = (e as CustomEvent<PullRefreshPageDetail>).detail
    const waitFor = detail?.waitFor
    const result = handlerRef.current()
    waitFor?.(result)
  }, [])

  useEffect(() => {
    window.addEventListener(PULL_REFRESH_PAGE_EVENT, onPageRefresh)
    return () => window.removeEventListener(PULL_REFRESH_PAGE_EVENT, onPageRefresh)
  }, [onPageRefresh])
}
