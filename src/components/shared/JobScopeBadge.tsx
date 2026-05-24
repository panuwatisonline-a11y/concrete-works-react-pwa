import { resolveJobName } from '@/lib/jobScopeDisplay'
import { useSuperAdminShowsAllJobs } from '@/hooks/useSuperAdminShowsAllJobs'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { cn } from '@/lib/utils'
import { type } from '@/lib/requestUi'

export function JobScopeBadge({
  jobId,
  className,
}: {
  jobId?: number | null
  className?: string
}) {
  const show = useSuperAdminShowsAllJobs()
  const jobs = useMasterDataStore((s) => s.jobs)

  if (!show || jobId == null) return null

  return (
    <span
      className={cn(
        'inline-flex max-w-full shrink-0 items-center truncate rounded-md border border-[color:var(--pour-accent)]/25 bg-[color:var(--pour-accent-muted)] px-1.5 py-0.5',
        type.caption,
        'font-medium text-[color:var(--pour-accent-hover)]',
        className,
      )}
      title={resolveJobName(jobId, jobs)}
    >
      {resolveJobName(jobId, jobs)}
    </span>
  )
}
