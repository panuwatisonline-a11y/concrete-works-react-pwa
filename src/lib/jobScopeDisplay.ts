import type { Column, CrudTableGroupBy } from '@/components/shared/CrudTable'
import type { Job } from '@/types/app.types'

export type JobScopedRow = { job_id?: number | null }

export function resolveJobName(
  jobId: number | null | undefined,
  jobs: readonly Job[],
): string {
  if (jobId == null) return '—'
  return jobs.find((j) => j.id === jobId)?.job_name ?? `Job #${jobId}`
}

export function jobScopeColumn<T extends JobScopedRow>(jobs: readonly Job[]): Column<T> {
  return {
    key: 'job_id',
    label: 'โครงการ',
    render: (row) => resolveJobName(row.job_id, jobs),
  }
}

export function createJobScopeGroupBy<T extends JobScopedRow>(
  jobs: readonly Job[],
): CrudTableGroupBy<T> {
  return {
    groupKey: (row) => String(row.job_id ?? ''),
    compareGroups: (a, b) => {
      const na = resolveJobName(a === '' ? null : Number(a), jobs)
      const nb = resolveJobName(b === '' ? null : Number(b), jobs)
      return na.localeCompare(nb, 'th')
    },
    renderGroupHeading: (groupKey, count) => {
      const name = resolveJobName(groupKey === '' ? null : Number(groupKey), jobs)
      return `${name} · ${count} รายการ`
    },
  }
}

export function rowHasJobScope(rows: readonly JobScopedRow[]): boolean {
  return rows.some((r) => r.job_id != null)
}
