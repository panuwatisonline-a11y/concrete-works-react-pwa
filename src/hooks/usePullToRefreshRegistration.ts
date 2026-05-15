import { useCallback, useEffect, useRef } from 'react'
import { PULL_REFRESH_PAGE_EVENT } from '@/lib/pullRefresh'
import type { PullRefreshHandler } from '@/stores/pullRefreshStore'

/** ลงทะเบียน callback รีเฟรชข้อมูลเฉพาะหน้า (หลัง master data โหลดแล้ว) */
export function usePullToRefreshRegistration(handler: PullRefreshHandler) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const onPageRefresh = useCallback(() => {
    void handlerRef.current()
  }, [])

  useEffect(() => {
    window.addEventListener(PULL_REFRESH_PAGE_EVENT, onPageRefresh)
    return () => window.removeEventListener(PULL_REFRESH_PAGE_EVENT, onPageRefresh)
  }, [onPageRefresh])
}
