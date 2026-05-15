import { useEffect } from 'react'
import { executePullRefresh } from '@/lib/pullRefresh'
import { usePullRefreshStore } from '@/stores/pullRefreshStore'

/** ลงทะเบียน handler หลักใน AppLayout — ทุกหน้าที่มี layout นี้จะ pull refresh ได้ */
export function usePullToRefreshHost() {
  const setHandler = usePullRefreshStore((s) => s.setHandler)

  useEffect(() => {
    setHandler(executePullRefresh)
    return () => setHandler(null)
  }, [setHandler])
}
