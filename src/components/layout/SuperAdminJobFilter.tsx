import { useMasterDataStore } from '@/stores/masterDataStore'
import { useAuthStore } from '@/stores/authStore'
import { mapSearchableOptions, SearchableSelect } from '@/components/ui/searchable-select'
import { isSuperAdmin } from '@/lib/permissions'
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
        isMobile ? 'flex w-full flex-col gap-2' : 'pour-pc-topbar-job',
        className,
      )}
    >
      <span className={cn(type.caption, 'shrink-0 text-pour-subtle', !isMobile && 'sr-only')}>
        {isMobile ? 'โครงการ' : 'โครงการ'}
      </span>
      <div className={cn(!isMobile && 'pour-pc-topbar-job-select min-w-0 flex-1')}>
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
          triggerClassName={cn(
            isMobile ? 'h-9 w-full min-h-9 text-sm' : 'pour-pc-topbar-job-trigger w-full min-w-0',
          )}
          listClassName="max-h-[min(50dvh,18rem)]"
        />
      </div>
    </div>
  )
}
