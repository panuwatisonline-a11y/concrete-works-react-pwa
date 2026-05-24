import { useMasterDataStore } from '@/stores/masterDataStore'
import { useAuthStore } from '@/stores/authStore'
import { mapSearchableOptions, SearchableSelect } from '@/components/ui/searchable-select'
import { isSuperAdmin } from '@/lib/permissions'
import { resolveJobName } from '@/lib/jobScopeDisplay'
import { useJobScope } from '@/hooks/useJobScope'
import { reloadMasterData } from '@/lib/reloadMasterData'
import { type } from '@/lib/requestUi'
import { cn } from '@/lib/utils'

/** Super Admin: pick active Job for scoped reads / inserts. */
export function SuperAdminJobFilter({
  className,
  variant = 'default',
}: {
  className?: string
  /** mobile — แถบใต้ header / ใน drawer; default — แถบ desktop top bar */
  variant?: 'default' | 'mobile'
}) {
  const role = useAuthStore((s) => s.role)
  const jobs = useMasterDataStore((s) => s.jobs)
  const { superAdminJobFilter, setSuperAdminJobFilter } = useJobScope()

  if (!isSuperAdmin(role)) return null

  const value = superAdminJobFilter === 'all' ? 'all' : String(superAdminJobFilter)
  const isMobile = variant === 'mobile'

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        isMobile ? 'w-full' : 'sm:flex-row sm:items-center sm:gap-2',
        className,
      )}
    >
      <span className={cn(type.caption, 'shrink-0 text-pour-subtle')}>
        {isMobile ? 'โครงการ' : 'โครงการ:'}
      </span>
      <SearchableSelect
        value={value}
        onValueChange={(v) => {
          setSuperAdminJobFilter(v === 'all' ? 'all' : Number.parseInt(v, 10))
          void reloadMasterData()
        }}
        placeholder="เลือกโครงการ"
        options={[
          { value: 'all', label: 'ทุกโครงการ' },
          ...mapSearchableOptions(jobs, (j) => String(j.id), (j) => j.job_name),
        ]}
        triggerClassName={cn(isMobile && 'h-9 w-full min-h-9 text-sm')}
        listClassName="max-h-[min(50dvh,18rem)]"
      />
      {superAdminJobFilter === 'all' ? (
        <span className={cn(type.caption, 'text-amber-700 dark:text-amber-400/90')}>
          มุมมองรวม — แสดงโครงการในรายการ
        </span>
      ) : !isMobile ? (
        <span className={cn(type.caption, 'text-pour-subtle')}>
          {resolveJobName(superAdminJobFilter, jobs)}
        </span>
      ) : null}
    </div>
  )
}
