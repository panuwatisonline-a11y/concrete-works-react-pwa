import { isSuperAdmin } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useJobFilterStore } from '@/stores/jobFilterStore'

/** Super Admin ดู "ทุกโครงการ" — แสดงคอลัมน์/ badge โครงการ */
export function useSuperAdminShowsAllJobs(): boolean {
  const role = useAuthStore((s) => s.role)
  const filter = useJobFilterStore((s) => s.superAdminJobFilter)
  return isSuperAdmin(role) && filter === 'all'
}
