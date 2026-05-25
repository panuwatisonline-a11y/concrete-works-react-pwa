import { useCallback, useMemo, useState } from 'react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { useScopedPageLoad } from '@/hooks/useScopedPageLoad'
import { supabase } from '@/lib/supabase'
import { AdminDashboardContent } from '@/components/dashboard/AdminDashboardContent'
import {
  EMPTY_DASHBOARD_FILTERS,
  filterDashboardRows,
  mapDashboardRows,
  type DashboardFilters,
} from '@/lib/dashboardRecordMapper'
import {
  fetchDashboardRequestRows,
  filterDashboardRowsByDateRange,
  type DashboardRequestRow,
} from '@/lib/adminDashboardAnalytics'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
import { app, theme } from '@/lib/requestUi'

export function AdminDashboard() {
  const [rows, setRows] = useState<DashboardRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>(EMPTY_DASHBOARD_FILTERS)

  const loadDashboard = useCallback(async (opts?: { background?: boolean }) => {
    if (!opts?.background) setLoading(true)
    try {
      const data = await fetchDashboardRequestRows(supabase)
      setRows(data)
    } catch (e) {
      console.error('Admin dashboard load:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useScopedPageLoad(loadDashboard)

  useDataSyncRefetch(['Request', '*'], loadDashboard)
  usePullToRefreshOnLoad(() => loadDashboard({ background: true }))

  const dateFilteredRows = useMemo(
    () => filterDashboardRowsByDateRange(rows, filterDateFrom, filterDateTo),
    [rows, filterDateFrom, filterDateTo],
  )

  const chartFilteredRows = useMemo(
    () => filterDashboardRows(dateFilteredRows, filters),
    [dateFilteredRows, filters],
  )

  const chartRecords = useMemo(
    () => (loading ? [] : mapDashboardRows(dateFilteredRows)),
    [dateFilteredRows, loading],
  )

  const tableRecords = useMemo(
    () => (loading ? [] : mapDashboardRows(chartFilteredRows)),
    [chartFilteredRows, loading],
  )

  const toggleFilter = useCallback((key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }))
  }, [])

  const hasDateFilter = Boolean(filterDateFrom.trim() || filterDateTo.trim())

  const dateFilterSummaryLine = useMemo(() => {
    if (!hasDateFilter) return null
    const a = filterDateFrom.trim() ? formatDate(`${filterDateFrom.trim()}T12:00:00`) : '—'
    const b = filterDateTo.trim() ? formatDate(`${filterDateTo.trim()}T12:00:00`) : '—'
    return `${a} – ${b}`
  }, [filterDateFrom, filterDateTo, hasDateFilter])

  return (
    <div className={app.pageAdmin}>
      <h1
        className={cn(
          'text-2xl font-bold tracking-tight',
          theme.brandWordmark,
          app.pageAdminTitle,
        )}
      >
        Dashboard
      </h1>

      <section
        aria-label="ตัวกรองช่วงวันที่"
        className={cn(
          app.pageAdminSection,
          'overflow-hidden rounded-[14px] border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] shadow-[var(--glass-shadow-sm)]',
        )}
      >
        <button
          type="button"
          id="dash-date-filter-toggle"
          aria-expanded={dateFilterOpen}
          aria-controls="dash-date-filter-panel"
          onClick={() => setDateFilterOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--pour-surface-tint)]"
        >
          <AppIcon
            icon={ExpandMore}
            size="md"
            className={cn(
              'text-pour-muted transition-transform duration-200',
              dateFilterOpen && 'rotate-180',
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[color:var(--pour-ink-0)]">ตัวกรองช่วงวันที่</p>
            {!dateFilterOpen && hasDateFilter && dateFilterSummaryLine ? (
              <p className="mt-0.5 truncate text-xs font-medium text-[color:var(--pour-accent)]">
                {dateFilterSummaryLine}
                {!loading ? ` · ${dateFilteredRows.length} รายการ` : null}
              </p>
            ) : !dateFilterOpen ? (
              <p className="mt-0.5 text-xs text-pour-subtle">แตะเพื่อเปิดตั้งค่า</p>
            ) : null}
          </div>
        </button>

        {dateFilterOpen ? (
          <div
            id="dash-date-filter-panel"
            role="region"
            aria-labelledby="dash-date-filter-toggle"
            className="border-t border-[color:var(--pour-surface-border)]/80 px-4 pb-4 pt-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="dash-filter-from" className="text-xs font-semibold text-[color:var(--pour-ink-1)]">
                    วันที่เริ่ม
                  </Label>
                  <Input
                    id="dash-filter-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-10 rounded-xl border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] font-medium"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="dash-filter-to" className="text-xs font-semibold text-[color:var(--pour-ink-1)]">
                    วันที่สิ้นสุด
                  </Label>
                  <Input
                    id="dash-filter-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-10 rounded-xl border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] font-medium"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-xl border-[color:var(--pour-surface-border)] font-semibold text-[color:var(--pour-ink-1)]"
                disabled={!hasDateFilter}
                onClick={() => {
                  setFilterDateFrom('')
                  setFilterDateTo('')
                }}
              >
                ล้างตัวกรองวันที่
              </Button>
            </div>
            {!loading && hasDateFilter ? (
              <p className="mt-3 text-pour-xs text-[color:var(--pour-accent)] pour-desktop:text-xs">
                แสดง {dateFilteredRows.length} รายการในช่วงที่เลือก
                {rows.length !== dateFilteredRows.length ? ` (จากทั้งหมด ${rows.length} รายการ)` : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
        </div>
      ) : (
        <AdminDashboardContent
          chartData={chartRecords}
          tableData={tableRecords}
          filters={filters}
          toggleFilter={toggleFilter}
        />
      )}
    </div>
  )
}
