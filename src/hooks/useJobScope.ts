import { useMemo } from 'react'
import { resolveInsertJobId, resolveQueryJobScope, type QueryJobScope } from '@/lib/jobScope'
import { useAuthStore } from '@/stores/authStore'
import { useJobFilterStore } from '@/stores/jobFilterStore'

export function useJobScope(): {
  queryJobScope: QueryJobScope
  insertJobId: number | null
  superAdminJobFilter: ReturnType<typeof useJobFilterStore.getState>['superAdminJobFilter']
  setSuperAdminJobFilter: ReturnType<typeof useJobFilterStore.getState>['setSuperAdminJobFilter']
} {
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const superAdminJobFilter = useJobFilterStore((s) => s.superAdminJobFilter)
  const setSuperAdminJobFilter = useJobFilterStore((s) => s.setSuperAdminJobFilter)

  const queryJobScope = useMemo(
    () => resolveQueryJobScope({ role, profile, superAdminFilter: superAdminJobFilter }),
    [role, profile?.job_id, superAdminJobFilter],
  )

  const insertJobId = useMemo(() => {
    try {
      return resolveInsertJobId({ role, profile, superAdminFilter: superAdminJobFilter })
    } catch {
      return null
    }
  }, [role, profile?.job_id, superAdminJobFilter])

  return { queryJobScope, insertJobId, superAdminJobFilter, setSuperAdminJobFilter }
}
