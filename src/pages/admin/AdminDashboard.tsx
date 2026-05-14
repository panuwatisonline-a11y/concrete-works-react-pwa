import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDate, cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { STATUS_LABELS } from '@/types/app.types'
import { app, rq, theme } from '@/lib/requestUi'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
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
  rowPrimaryDateIso,
  type DashboardRequestRow,
  type TrendGranularity,
} from '@/lib/adminDashboardAnalytics'
import {
  TrendGranularityToggle,
  VolumeTrendDualLineChart,
  HorizontalVolumeBarChart,
  StatusVolumeStrip,
} from '@/pages/admin/AdminDashboardCharts'

interface PendingRow {
  id: string
  casting_date: string | null
  postpone_date: string | null
  booked_at: string | null
  /** วันที่ใช้จับกลุ่มกราฟ/ตัวกรอง: postpone → casting → booked */
  primary_date_iso: string | null
  status_id: number
  structure_no: string | null
  client: { client_name: string }[] | null
}

function pendingClientName(r: PendingRow): string {
  if (Array.isArray(r.client)) return r.client[0]?.client_name ?? ''
  return (r.client as { client_name: string } | null)?.client_name ?? ''
}

const PENDING_STATUS_ORDER = [1, 2, 3, 5] as const

const SUMMARY_STATUS_IDS = [1, 2, 3, 4, 5, 8] as const

const LINE_COLORS: Record<number, string> = {
  1: '#2563eb',
  2: '#0891b2',
  3: '#16a34a',
  5: '#d97706',
}

function castingSortKey(d: string | null): string | null {
  if (!d) return null
  const iso = d.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

function PendingQueueLineChart({
  rows,
  statuses,
  loading,
  emptySearch,
}: {
  rows: PendingRow[]
  statuses: { id: number; status_name: string }[]
  loading: boolean
  emptySearch: boolean
}) {
  const model = useMemo(() => {
    const agg = new Map<string, Map<number, number>>()
    for (const r of rows) {
      const iso = castingSortKey(r.primary_date_iso)
      const bucket = iso ?? '__none__'
      if (!agg.has(bucket)) agg.set(bucket, new Map())
      const m = agg.get(bucket)!
      m.set(r.status_id, (m.get(r.status_id) ?? 0) + 1)
    }
    const rawDates = [...agg.keys()].filter((k) => k !== '__none__').sort()
    if (agg.has('__none__')) rawDates.push('__none__')

    const statusIds = PENDING_STATUS_ORDER.filter((sid) => rows.some((r) => r.status_id === sid))

    let maxY = 1
    for (const d of rawDates) {
      const m = agg.get(d)!
      for (const sid of statusIds) {
        const c = m.get(sid) ?? 0
        if (c > maxY) maxY = c
      }
    }

    return { dates: rawDates, statusIds, agg, maxY }
  }, [rows])

  const vbW = 680
  const vbH = 220
  const padL = 44
  const padR = 14
  const padT = 8
  const padB = 40
  const innerW = vbW - padL - padR
  const innerH = vbH - padT - padB
  const x0 = padL
  const y0 = padT
  const x1 = padL + innerW
  const y1 = padT + innerH

  const xAt = (i: number, n: number) => {
    if (n <= 1) return x0 + innerW / 2
    return x0 + (i / (n - 1)) * innerW
  }

  const yAt = (v: number) => y1 - (v / model.maxY) * innerH

  if (loading) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        กำลังโหลด…
      </div>
    )
  }

  if (emptySearch) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        ไม่พบรายการที่ตรงกับคำค้น
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[clamp(11rem,min(26svh,15rem),15rem)] items-center justify-center rounded-[14px] border border-[#e2e6ec] bg-white px-4 py-8 text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        ไม่มีรายการรอ
      </div>
    )
  }

  const { dates, statusIds, agg, maxY } = model
  const n = dates.length
  const tickVs =
    maxY <= 1 ? [0, 1] : [...new Set([0, Math.ceil(maxY / 2), maxY])].sort((a, b) => a - b)

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e6ec]/80 bg-[#f8fafc] px-3 py-2 md:px-4 md:py-2.5">
        <p className="text-[11px] leading-snug text-[#64748b] md:text-xs">
          จำนวนคำขอต่อวันที่อ้างอิง (เลื่อนก่อน แล้ววันเท แล้ววันจอง) · แยกสถานะ · คิวรอสูงสุด 20 รายการ (รวมตัวกรองค้นหา)
        </p>
      </div>
      <div className="p-3 md:p-4">
        <div className="relative mx-auto h-[clamp(11rem,min(26svh,15rem),15rem)] w-full min-w-0 max-w-full">
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="block h-full w-full max-w-full font-sans tabular-nums"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="กราฟเส้นเปรียบเทียบจำนวนคำขอรอดำเนินการตามวันเทและสถานะ"
          >
            <rect x={x0} y={y0} width={innerW} height={innerH} fill="#f1f5f9" rx="8" />

            {tickVs.map((v) => {
              const y = yAt(v)
              return (
                <g key={`y-${v}`}>
                  <line x1={x0} y1={y} x2={x1} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                  <text
                    x={x0 - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-[#94a3b8] text-[11px] font-medium"
                  >
                    {v}
                  </text>
                </g>
              )
            })}

            <line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#cbd5e1" strokeWidth="1" />
            <line x1={x0} y1={y1} x2={x1} y2={y1} stroke="#cbd5e1" strokeWidth="1" />

            {statusIds.map((sid) => {
              const pts = dates.map((d, i) => {
                const c = agg.get(d)?.get(sid) ?? 0
                return { x: xAt(i, n), y: yAt(c), c }
              })
              const dPath =
                pts.length <= 1
                  ? ''
                  : pts
                      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                      .join(' ')
              const color = LINE_COLORS[sid] ?? '#6b7280'
              return (
                <g key={sid}>
                  {dPath ? (
                    <path
                      d={dPath}
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : null}
                  {pts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={p.c > 0 ? 4.5 : 3.5}
                      fill="white"
                      stroke={color}
                      strokeWidth="2"
                    >
                      <title>
                        {(statuses.find((s) => s.id === sid)?.status_name ?? STATUS_LABELS[sid] ?? sid) +
                          ': ' +
                          p.c +
                          ' — ' +
                          (dates[i] === '__none__' ? 'ไม่ระบุวันที่อ้างอิง' : formatDate(dates[i]))}
                      </title>
                    </circle>
                  ))}
                </g>
              )
            })}

            {dates.map((d, i) => {
              const label = d === '__none__' ? 'ไม่ระบุ' : formatDate(d)
              const x = xAt(i, n)
              return (
                <text
                  key={d + i}
                  x={x}
                  y={vbH - 12}
                  textAnchor={n <= 2 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                  className="fill-[#6b7280] text-[9px] md:text-[10px]"
                >
                  {label}
                </text>
              )
            })}
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#e2e6ec]/80 pt-3 text-[10px] text-[#374151] md:text-xs">
          {statusIds.map((sid) => {
            const color = LINE_COLORS[sid] ?? '#6b7280'
            const name = statuses.find((s) => s.id === sid)?.status_name ?? STATUS_LABELS[sid] ?? String(sid)
            return (
              <span key={sid} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
                {name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const { statuses } = useMasterDataStore()
  const [rows, setRows] = useState<DashboardRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>('month')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)

  useDesktopSearchRegistration({
    placeholder: 'ค้นหาในรายการรอดำเนินการ (Client, วันเท, structure)…',
    ariaLabel: 'ค้นหาใน Dashboard',
    showRequestFilterButton: false,
    search: q,
    onSearchChange: setQ,
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDashboardRequestRows(supabase)
        setRows(data)
      } catch (e) {
        console.error('Admin dashboard load:', e)
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  const pendingTop = useMemo(() => {
    return filteredRows
      .filter((r) => [1, 2, 3, 5].includes(r.status_id))
      .sort((a, b) => (b.booked_at ?? '').localeCompare(a.booked_at ?? ''))
      .slice(0, 20)
      .map(
        (r): PendingRow => ({
          id: r.id,
          casting_date: r.casting_date,
          postpone_date: r.postpone_date,
          booked_at: r.booked_at,
          primary_date_iso: rowPrimaryDateIso(r),
          status_id: r.status_id,
          structure_no: r.structure_no,
          client: r.client as PendingRow['client'],
        }),
      )
  }, [filteredRows])

  const summaryCards = useMemo(
    () =>
      SUMMARY_STATUS_IDS.map((id) => ({
        id,
        label: statuses.find((s) => s.id === id)?.status_name ?? STATUS_LABELS[id],
      })),
    [statuses],
  )

  const filteredPending = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return pendingTop
    return pendingTop.filter((r) => {
      const client = pendingClientName(r).toLowerCase()
      const dateCast = formatDate(r.casting_date).toLowerCase()
      const datePost = formatDate(r.postpone_date).toLowerCase()
      const dateBook = formatDate(r.booked_at).toLowerCase()
      const str = (r.structure_no ?? '').toLowerCase()
      const st = String(r.status_id)
      const label = (
        statuses.find((s) => s.id === r.status_id)?.status_name ??
        STATUS_LABELS[r.status_id] ??
        ''
      ).toLowerCase()
      const blob = `${client} ${dateCast} ${datePost} ${dateBook} ${str} ${st} ${label}`
      return blob.includes(t)
    })
  }, [pendingTop, q, statuses])

  const accentBar = [
    'from-[#2563eb] to-[#1d4ed8]',
    'from-[#3b82f6] to-[#2563eb]',
    'from-[#6b7280] to-[#2563eb]',
    'from-[#0891b2] to-[#2563eb]',
    'from-[#2563eb] to-[#1e3a8a]',
    'from-[#9ca3af] to-[#4b5563]',
  ] as const

  const lossPctLabel =
    totals.lossPctOfDwg != null
      ? `${totals.lossPctOfDwg.toFixed(1)}% ของ DWG volume`
      : totals.lossPctOfConfirm != null
        ? `${totals.lossPctOfConfirm.toFixed(1)}% ของ Confirm volume`
        : '—'

  return (
    <div className={app.pageAdmin}>
      <h1 className={cn('text-2xl font-bold tracking-tight md:text-3xl', theme.brandWordmark)}>
        Admin Dashboard
      </h1>

      <section
        aria-label="ตัวกรองช่วงวันที่"
        className="overflow-hidden rounded-[14px] border border-[#e2e6ec] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        <button
          type="button"
          id="dash-date-filter-toggle"
          aria-expanded={dateFilterOpen}
          aria-controls="dash-date-filter-panel"
          onClick={() => setDateFilterOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc]"
        >
          <ChevronDown
            className={cn(
              'h-5 w-5 shrink-0 text-[#6b7280] transition-transform duration-200',
              dateFilterOpen && 'rotate-180',
            )}
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#111827]">ตัวกรองช่วงวันที่</p>
            {!dateFilterOpen && hasDateFilter && dateFilterSummaryLine ? (
              <p className="mt-0.5 truncate text-xs font-medium text-[#2563eb]">
                {dateFilterSummaryLine}
                {!loading ? ` · ${filteredRows.length} รายการ` : null}
              </p>
            ) : !dateFilterOpen ? (
              <p className="mt-0.5 text-xs text-[#9ca3af]">แตะเพื่อเปิดตั้งค่า</p>
            ) : null}
          </div>
        </button>

        {dateFilterOpen ? (
          <div
            id="dash-date-filter-panel"
            role="region"
            aria-labelledby="dash-date-filter-toggle"
            className="border-t border-[#e2e6ec]/80 px-4 pb-4 pt-3"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="dash-filter-from" className="text-xs font-semibold text-[#374151]">
                    วันที่เริ่ม
                  </Label>
                  <Input
                    id="dash-filter-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-10 rounded-xl border-[#e2e6ec] bg-[#fafbfc] font-medium"
                  />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <Label htmlFor="dash-filter-to" className="text-xs font-semibold text-[#374151]">
                    วันที่สิ้นสุด
                  </Label>
                  <Input
                    id="dash-filter-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-10 rounded-xl border-[#e2e6ec] bg-[#fafbfc] font-medium"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-xl border-[#e2e6ec] font-semibold text-[#374151]"
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
              <p className="mt-3 text-[11px] text-[#2563eb] md:text-xs">
                แสดง {filteredRows.length} รายการในช่วงที่เลือก
                {rows.length !== filteredRows.length ? ` (จากทั้งหมด ${rows.length} รายการ)` : null}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-label="สรุปจำนวนและปริมาตร" className="space-y-3">
        <h2 className={rq.cardTitle}>ภาพรวมคำขอและปริมาณ</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 md:gap-4">
          <Card className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[0])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                จำนวนคำขอทั้งหมด
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : totalRequests}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[1])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                Request volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : totals.request.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[2])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                DWG volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : totals.dwg.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80">
            <div className={cn('h-1 bg-gradient-to-r', accentBar[3])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                Confirm volume (m³)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : totals.confirm.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80 md:col-span-1">
            <div className="h-1 bg-gradient-to-r from-[#d97706] to-[#ea580c]" />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                Loss concrete (Confirm − DWG)
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : `${totals.loss.toFixed(1)} m³`}
              </p>
              {!loading ? (
                <p className="mt-1 text-[10px] leading-snug text-[#64748b] md:text-xs">{lossPctLabel}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <StatusVolumeStrip
        statuses={statuses}
        counts={counts}
        total={totalRequests}
        loading={loading}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
        {summaryCards.map(({ id, label }, i) => (
          <Card
            key={id}
            className="overflow-hidden rounded-[14px] border-[#e2e6ec] shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-white/80"
          >
            <div className={cn('h-1 bg-gradient-to-r', accentBar[i % accentBar.length])} />
            <CardContent className="px-4 py-4 md:pb-4 md:pt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280] md:text-xs">
                {label}
              </p>
              <p className="font-pour-mono text-xl font-bold tabular-nums text-[#111827] md:text-2xl">
                {loading ? '—' : (counts[id] ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section aria-label="แนวโน้มปริมาณ" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className={rq.cardTitle}>แนวโน้มปริมาณตามช่วงเวลา</h2>
          <TrendGranularityToggle value={trendGranularity} onChange={setTrendGranularity} />
        </div>
        <VolumeTrendDualLineChart points={trendPoints} granularity={trendGranularity} loading={loading} />
      </section>

      <section aria-label="กราฟแยกตามโครงสร้างและความแข็งแรง" className="grid gap-4 md:grid-cols-2">
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

      <section aria-label="กราฟตามผู้จองและซัพพลายเออร์" className="grid gap-4 md:grid-cols-2">
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

      <div className="space-y-3">
        <h2 className={rq.cardTitle}>รายการรอดำเนินการ</h2>
        <PendingQueueLineChart
          rows={filteredPending}
          statuses={statuses}
          loading={loading}
          emptySearch={!loading && pendingTop.length > 0 && filteredPending.length === 0}
        />
      </div>
    </div>
  )
}
