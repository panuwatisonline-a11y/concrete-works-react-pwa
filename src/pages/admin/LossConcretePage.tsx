import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { LossConcreteDashboard } from '@/components/loss-concrete/LossConcreteDashboard'
import { mapRowsToLossRecords } from '@/lib/lossConcreteAnalytics'
import {
  fetchDashboardRequestRows,
  filterDashboardRowsByDateRange,
  type DashboardRequestRow,
} from '@/lib/adminDashboardAnalytics'
import { supabase } from '@/lib/supabase'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { app, theme } from '@/lib/requestUi'

export function LossConcretePage() {
  const [rows, setRows] = useState<DashboardRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)

  const load = useCallback(async (opts?: { background?: boolean }) => {
    if (!opts?.background) setLoading(true)
    try {
      const data = await fetchDashboardRequestRows(supabase)
      setRows(data)
    } catch (e) {
      console.error('Loss concrete load:', e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useDataSyncRefetch(['Request', '*'], load)
  usePullToRefreshOnLoad(() => load({ background: true }))

  const dateFilteredRows = useMemo(
    () => filterDashboardRowsByDateRange(rows, filterDateFrom, filterDateTo),
    [rows, filterDateFrom, filterDateTo],
  )

  const allRecords = useMemo(
    () => (loading ? [] : mapRowsToLossRecords(rows)),
    [rows, loading],
  )

  const records = useMemo(
    () => (loading ? [] : mapRowsToLossRecords(dateFilteredRows)),
    [dateFilteredRows, loading],
  )

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
          'text-2xl font-bold tracking-tight pour-desktop:text-3xl',
          theme.brandWordmark,
          app.pageAdminTitle,
        )}
      >
        Loss Concrete
      </h1>
      <p className="text-sm text-pour-muted">
        Complete requests with DWG volume and loss (volume_loss or Confirm − DWG)
      </p>

      <section
        aria-label="Date range filter"
        className={cn(
          app.pageAdminSection,
          'overflow-hidden rounded-[14px] border border-[color:var(--pour-surface-border)] bg-[color:var(--glass-bg)] shadow-[var(--glass-shadow-sm)]',
        )}
      >
        <button
          type="button"
          id="loss-date-filter-toggle"
          aria-expanded={dateFilterOpen}
          aria-controls="loss-date-filter-panel"
          onClick={() => setDateFilterOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[color:var(--pour-surface-tint)]"
        >
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-pour-muted transition-transform duration-200',
              dateFilterOpen && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[color:var(--pour-ink-0)]">Date range filter</p>
            {!dateFilterOpen && hasDateFilter && dateFilterSummaryLine ? (
              <p className="mt-0.5 truncate text-xs font-medium text-[color:var(--pour-accent)]">
                {dateFilterSummaryLine}
                {!loading ? ` · ${records.length} records` : null}
              </p>
            ) : !dateFilterOpen ? (
              <p className="mt-0.5 text-xs text-pour-subtle">Tap to set dates</p>
            ) : null}
          </div>
        </button>

        {dateFilterOpen ? (
          <div
            id="loss-date-filter-panel"
            role="region"
            aria-labelledby="loss-date-filter-toggle"
            className="border-t border-[color:var(--pour-surface-border)]/80 px-4 pb-4 pt-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="loss-filter-from" className="text-xs font-semibold text-[color:var(--pour-ink-1)]">
                    From
                  </Label>
                  <Input
                    id="loss-filter-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-10 rounded-xl border-[color:var(--pour-surface-border)] bg-[color:var(--pour-surface-tint)] font-medium"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="loss-filter-to" className="text-xs font-semibold text-[color:var(--pour-ink-1)]">
                    To
                  </Label>
                  <Input
                    id="loss-filter-to"
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
                Clear dates
              </Button>
            </div>
            {!loading && hasDateFilter ? (
              <p className="mt-3 text-[11px] text-[color:var(--pour-accent)] pour-desktop:text-xs">
                Showing {records.length} records in range
                {allRecords.length !== records.length ? ` (of ${allRecords.length} total)` : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--glass-border-subtle)] border-t-[color:var(--pour-accent)]" />
        </div>
      ) : (
        <LossConcreteDashboard records={records} />
      )}
    </div>
  )
}
