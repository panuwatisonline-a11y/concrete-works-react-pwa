import { useCallback, useEffect, useState, useMemo } from 'react'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { supabase } from '@/lib/supabase'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, cn, formatVolumeNumber, formatPercentNumber } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { STATUS_LABELS } from '@/types/app.types'
import { app, layout, rq, theme } from '@/lib/requestUi'
import {
  fetchDashboardRequestRows,
  statusCountsFromRows,
  volumeTotals,
  buildVolumeTrend,
  aggregateCompleteVolumeByStructure,
  aggregateCompleteVolumeByStrength,
  aggregateConfirmVolumeByStaff,
  aggregateConfirmVolumeBySupplier,
  filterDashboardRowsByDateRange,
  type DashboardRequestRow,
  type TrendGranularity,
} from '@/lib/adminDashboardAnalytics'
import {
  TrendGranularityToggle,
  VolumeTrendDualLineChart,
  HorizontalVolumeBarChart,
  StatusVolumeStrip,
} from '@/pages/admin/AdminDashboardCharts'


const SUMMARY_STATUS_IDS = [1, 2, 3, 4, 5, 8] as const

export function AdminDashboard() {
  const { statuses } = useMasterDataStore()
  const [rows, setRows] = useState<DashboardRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('month')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)

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

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  usePullToRefreshOnLoad(() => loadDashboard({ background: true }))

  const filteredRows = useMemo(
    () => filterDashboardRowsByDateRange(rows, filterDateFrom, filterDateTo),
    [rows, filterDateFrom, filterDateTo],
  )

  const hasDateFilter = Boolean(filterDateFrom.trim() || filterDateTo.trim())

  const dateFilterSummaryLine = useMemo(() => {
    if (!hasDateFilter) return null
    const a = filterDateFrom.trim() ? formatDate(`${filterDateFrom.trim()}T12:00:00`) : '—'
    const b = filterDateTo.trim() ? formatDate(`${filterDateTo.trim()}T12:00:00`) : '—'
    return `${a} – ${b}`
  }, [filterDateFrom, filterDateTo, hasDateFilter])

  const counts = useMemo(() => statusCountsFromRows(filteredRows), [filteredRows])
  const totalRequests = filteredRows.length

  const totals = useMemo(() => volumeTotals(filteredRows), [filteredRows])

  const trendPoints = useMemo(
    () => buildVolumeTrend(filteredRows, trendGranularity),
    [filteredRows, trendGranularity],
  )

  const byStructure = useMemo(() => aggregateCompleteVolumeByStructure(filteredRows), [filteredRows])
  const byStrength = useMemo(() => aggregateCompleteVolumeByStrength(filteredRows), [filteredRows])
  const byStaff = useMemo(() => aggregateConfirmVolumeByStaff(filteredRows), [filteredRows])
  const bySupplier = useMemo(() => aggregateConfirmVolumeBySupplier(filteredRows), [filteredRows])

  const summaryCards = useMemo(
    () =>
      SUMMARY_STATUS_IDS.map((id) => ({
        id,
        label: statuses.find((s) => s.id === id)?.status_name ?? STATUS_LABELS[id],
      })),
    [statuses],
  )

  const accentBar = [
    'from-neutral-600 to-neutral-900',
    'from-neutral-500 to-neutral-800',
    'from-neutral-400 to-neutral-700',
    'from-neutral-300 to-neutral-600',
    'from-neutral-700 to-neutral-950',
    'from-neutral-200 to-neutral-500',
  ] as const

  const lossPctLabel =
    totals.lossPctOfDwg != null
      ? `${formatPercentNumber(totals.lossPctOfDwg)}% ของ DWG volume`
      : totals.lossPctOfConfirm != null
        ? `${formatPercentNumber(totals.lossPctOfConfirm)}% ของ Confirm volume`
        : '—'

  return (
    <div className={app.pageAdmin}>
      <h1
        className={cn(
          'text-2xl font-bold tracking-tight pour-desktop:text-3xl',
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
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-pour-muted transition-transform duration-200',
              dateFilterOpen && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[color:var(--pour-ink-0)]">ตัวกรองช่วงวันที่</p>
            {!dateFilterOpen && hasDateFilter && dateFilterSummaryLine ? (
              <p className="mt-0.5 truncate text-xs font-medium text-[color:var(--pour-accent)]">
                {dateFilterSummaryLine}
                {!loading ? ` · ${filteredRows.length} รายการ` : null}
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
              <p className="mt-3 text-[11px] text-[color:var(--pour-accent)] pour-desktop:text-xs">
                แสดง {filteredRows.length} รายการในช่วงที่เลือก
                {rows.length !== filteredRows.length ? ` (จากทั้งหมด ${rows.length} รายการ)` : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-label="สรุปจำนวนและปริมาตร" className={app.pageAdminSection}>
        <h2 className={cn(rq.cardTitle, 'px-0.5')}>ภาพรวมคำขอและปริมาณ</h2>
        <div className={cn(layout.statGrid5, 'pour-desktop:gap-4')}>
          <Card className="overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[0])} />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                จำนวนคำขอทั้งหมด
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : totalRequests}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[1])} />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                Request volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : formatVolumeNumber(totals.request)}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[2])} />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                DWG volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : formatVolumeNumber(totals.dwg)}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[3])} />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                Confirm volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : formatVolumeNumber(totals.confirm)}
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80 pour-desktop:col-span-1">
            <div className="h-1 bg-gradient-to-r from-[#d97706] to-[#ea580c]" />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                Loss concrete (Confirm − DWG)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : `${formatVolumeNumber(totals.loss)} m³`}
              </p>
              {!loading ? (
                <p className="mt-1 text-[10px] leading-snug text-pour-muted pour-desktop:text-xs">{lossPctLabel}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-label="สัดส่วนสถานะคำขอ" className={app.pageAdminSection}>
        <StatusVolumeStrip
          statuses={statuses}
          counts={counts}
          total={totalRequests}
          loading={loading}
        />
      </section>

      <section aria-label="จำนวนตามสถานะ" className={app.pageAdminSection}>
      <div className={layout.statGrid6}>
        {summaryCards.map(({ id, label }, i) => (
          <Card
            key={id}
            className="overflow-hidden rounded-[14px] border-[color:var(--pour-surface-border)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80"
          >
            <div className={cn('h-1 bg-gradient-to-r', accentBar[i % accentBar.length])} />
            <CardContent className={rq.cardContentTight}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-pour-muted pour-desktop:text-xs">
                {label}
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[color:var(--pour-ink-0)] pour-desktop:text-2xl">
                {loading ? '—' : (counts[id] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      </section>

      <section aria-label="แนวโน้มปริมาณ" className={app.pageAdminSection}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={rq.cardTitle}>แนวโน้มปริมาณตามช่วงเวลา</h2>
          <TrendGranularityToggle value={trendGranularity} onChange={setTrendGranularity} />
        </div>
        <VolumeTrendDualLineChart points={trendPoints} granularity={trendGranularity} loading={loading} />
      </section>

      <section
        aria-label="กราฟแยกตามโครงสร้างและความแข็งแรง"
        className={cn(app.pageAdminSection, 'grid gap-4 pour-desktop:grid-cols-2 pour-desktop:items-stretch pour-desktop:gap-5')}
      >
        <HorizontalVolumeBarChart
          title="Complete volume ตามโครงสร้าง"
          subtitle="เฉพาะรายการที่มี confirmed volume · แสดง % ของรวมในกราฟ"
          slices={byStructure}
          loading={loading}
          emptyMessage="ยังไม่มี confirmed volume ตามโครงสร้าง"
        />
        <HorizontalVolumeBarChart
          title="Complete volume ตาม Strength"
          subtitle="จาก Mixed Code (strength + strength_type)"
          slices={byStrength}
          loading={loading}
          emptyMessage="ยังไม่มี confirmed volume ตาม strength"
        />
      </section>

      <section
        aria-label="กราฟตามผู้จองและซัพพลายเออร์"
        className={cn(app.pageAdminSection, 'grid gap-4 pour-desktop:grid-cols-2 pour-desktop:items-stretch pour-desktop:gap-5')}
      >
        <HorizontalVolumeBarChart
          title="Confirm volume ตามผู้จอง (Request by)"
          subtitle="รวมจาก booked_by / โปรไฟล์"
          slices={byStaff}
          loading={loading}
          emptyMessage="ยังไม่มี confirm volume ตามผู้จอง"
        />
        <HorizontalVolumeBarChart
          title="Confirm volume ตาม Supplier"
          subtitle="จาก Mixed Code ที่ผูกกับคำขอ"
          slices={bySupplier}
          loading={loading}
          emptyMessage="ยังไม่มี confirm volume ตามซัพพลายเออร์"
        />
      </section>

    </div>
  )
}
