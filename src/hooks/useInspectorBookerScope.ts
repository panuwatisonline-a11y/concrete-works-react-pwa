import { useEffect, useState } from 'react'
import { fetchBookerScopeForProfile, type InspectorBookerScope } from '@/lib/inspectorScope'
import { isInspectorRole, normalizeRole } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'

/** โหลดชุด booked_by ที่ Inspector ในสายดูแลได้ (super_admin/admin/engineer = null = ไม่จำกัด workflow ใน job) */
export function useInspectorBookerScope(): {
  bookerScope: InspectorBookerScope
  scopeLoading: boolean
} {
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const [bookerScope, setBookerScope] = useState<InspectorBookerScope>(() => {
    const r = normalizeRole(role)
    return r === 'super_admin' || r === 'admin' || r === 'engineer' ? null : new Set()
  })
  const [scopeLoading, setScopeLoading] = useState(isInspectorRole(role))

  useEffect(() => {
    const r = normalizeRole(role)
    if (r === 'super_admin' || r === 'admin' || r === 'engineer') {
      setBookerScope(null)
      setScopeLoading(false)
      return
    }
    if (!isInspectorRole(role)) {
      setBookerScope(new Set())
      setScopeLoading(false)
      return
    }

    let cancelled = false
    setScopeLoading(true)
    void fetchBookerScopeForProfile(profile)
      .then((scope) => {
        if (!cancelled) setBookerScope(scope)
      })
      .catch(() => {
        if (!cancelled) setBookerScope(new Set())
      })
      .finally(() => {
        if (!cancelled) setScopeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profile?.id, role])

  return { bookerScope, scopeLoading }
}
