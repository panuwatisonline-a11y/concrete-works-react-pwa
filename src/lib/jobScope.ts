import type { Profile } from '@/types/app.types'
import type { SuperAdminJobFilter } from '@/stores/jobFilterStore'
import { isSuperAdmin, normalizeRole } from '@/lib/permissions'

export type QueryJobScope = number | 'all' | null

/** Job used for SELECT filters (null = no filter applied at app layer). */
export function resolveQueryJobScope(opts: {
  role: string | null | undefined
  profile: Profile | null | undefined
  superAdminFilter?: SuperAdminJobFilter
}): QueryJobScope {
  const { role, profile, superAdminFilter = 'all' } = opts
  if (isSuperAdmin(role)) return superAdminFilter
  return profile?.job_id ?? null
}

/** Job id required when inserting job-scoped rows. */
export function resolveInsertJobId(opts: {
  role: string | null | undefined
  profile: Profile | null | undefined
  superAdminFilter?: SuperAdminJobFilter
}): number {
  const scope = resolveQueryJobScope(opts)
  if (scope === 'all' || scope == null) {
    throw new Error('กรุณาเลือกโครงการ (Job) ก่อนบันทึก')
  }
  return scope
}

/** Apply job_id filter to a Supabase query builder when scope is a concrete job. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyJobScope(query: any, jobScope: QueryJobScope): any {
  if (jobScope !== null && jobScope !== 'all') {
    return query.eq('job_id', jobScope)
  }
  return query
}

export function withJobId<T extends Record<string, unknown>>(row: T, jobId: number): T & { job_id: number } {
  return { ...row, job_id: jobId }
}

export function jobScopeLabel(scope: QueryJobScope): string {
  if (scope === 'all') return 'ทุกโครงการ'
  if (scope == null) return '—'
  return `Job #${scope}`
}

export function roleRequiresJobAssignment(role: string | null | undefined): boolean {
  const r = normalizeRole(role)
  return r != null && r !== 'super_admin'
}
