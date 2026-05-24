import { useEffect, useRef } from 'react'
import { isSuperAdmin } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useJobFilterStore } from '@/stores/jobFilterStore'

type ScopedLoadOpts = { background?: boolean }

/**
 * โหลดข้อมูลตาม job scope — รันใหม่เมื่อ Super Admin เปลี่ยนตัวกรองโครงการ
 */
export function useScopedPageLoad(load: (opts?: ScopedLoadOpts) => void | Promise<void>) {
  const role = useAuthStore((s) => s.role)
  const jobFilter = useJobFilterStore((s) => s.superAdminJobFilter)
  const loadRef = useRef(load)
  loadRef.current = load

  const scopeKey = isSuperAdmin(role) ? jobFilter : role
  const mounted = useRef(false)

  useEffect(() => {
    void loadRef.current({ background: mounted.current })
    mounted.current = true
  }, [scopeKey])
}
