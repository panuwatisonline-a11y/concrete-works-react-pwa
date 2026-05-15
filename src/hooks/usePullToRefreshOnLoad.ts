import { useCallback, useRef } from 'react'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'

/** ลงทะเบียนรีเฟรชข้อมูลของหน้า (เรียก load ของหน้านั้นเมื่อผู้ใช้ดึงลง) */
export function usePullToRefreshOnLoad(load: () => void | Promise<void>) {
  const loadRef = useRef(load)
  loadRef.current = load

  usePullToRefreshRegistration(
    useCallback(async () => {
      await loadRef.current()
    }, []),
  )
}
