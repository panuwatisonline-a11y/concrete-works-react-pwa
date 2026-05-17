import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { Navigate } from 'react-router-dom'
import { BarChart3, CalendarDays, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APP_HOME } from '@/lib/appHome'
import {
  fetchConcreteSummaryRequests,
  fetchCstViewsByRequestIds,
  indexCstViewsByRequestAndAge,
} from '@/lib/concreteSummaryData'
import {
  buildConcreteSummaryRowFields,
  collectStructureOptionsFromRequests,
  concreteSummaryMatchesSearch,
  CONCRETE_SUMMARY_AVG_LABELS,
  CONCRETE_SUMMARY_TEST_AGES,
  requestMatchesStructureFilter,
  sortConcreteSummaryRequests,
  type ConcreteSummaryRowFields,
} from '@/lib/concreteSummaryRow'
import {
  localPrintConcreteSummary,
  warmConcreteSummaryTemplateCache,
} from '@/lib/concreteSummaryPrint'
import {
  CONCRETE_SUMMARY_SEARCH_ARIA,
  CONCRETE_SUMMARY_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { app, icon, ICON_STROKE, rq, surface, tableCompact, type } from '@/lib/requestUi'
import { todayIsoLocal } from '@/lib/cstListDue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { CstViewRow } from '@/types/database.cst.types'
import type { RequestWithRelations } from '@/types/app.types'

const summaryTh = {
  item: 'w-10 min-w-[2.5rem] text-center',
  date: 'min-w-[5.5rem] whitespace-nowrap',
  work: 'min-w-[5rem]',
  structure: 'min-w-[5rem]',
  location: 'min-w-[14rem]',
  structureNo: 'min-w-[10rem]',
  supplier: 'min-w-[4.5rem]',
  slump: 'min-w-[5.5rem] text-center',
  mix: 'min-w-[4.75rem]',
  req: 'min-w-[5.5rem] text-center',
  avg: 'min-w-[4.75rem] max-w-[5.5rem] text-center',
  result: 'min-w-[5.5rem] text-center',
} as const

const summaryTable = {
  table: cn(tableCompact.table, 'w-max min-w-full'),
  head: cn(
    tableCompact.head,
    '[&_th]:px-1.5 [&_th]:py-2 sm:[&_th]:px-2',
    '[&_th]:whitespace-normal [&_th]:break-words [&_th]:align-bottom',
    '[&_th]:text-[10px] [&_th]:leading-tight sm:[&_th]:text-[11px]',
  ),
  body: cn(tableCompact.body, '[&_td]:px-1.5 sm:[&_td]:px-2'),
} as const

const ALL_STRUCTURES = 'all'

function defaultSummaryDateFrom(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd')
}

function displayCell(v: string | null | undefined): string {
  if (v == null || v === '') return '—'
  return v
}

function ConcreteSummaryMobileCard({
  itemNo,
  fields,
}: {
  itemNo: number
  fields: ConcreteSummaryRowFields
}) {
  const rows: [string, string | null | undefined][] = [
    ['Casting Date', fields.castingDate !== '—' && fields.castingDate !== '-' ? fields.castingDate : null],
    ['Concrete Works', fields.concrete],
    ['Structure', fields.structure],
    ['Location', fields.location],
    ['Structure No.', fields.structureNo],
    ['Supplier', fields.supplier],
    ['Slump', fields.slump],
    ['Mix Code', fields.mixCode],
    ['Req. Strength', fields.reqStrength],
    ...CONCRETE_SUMMARY_TEST_AGES.map(
      (age): [string, string | null] => [
        CONCRETE_SUMMARY_AVG_LABELS[age],
        fields.avgByAge[age] !== '—' ? fields.avgByAge[age] : null,
      ],
    ),
    ['Result', fields.result !== '—' ? fields.result : null],
  ]

  return (
    <article className={cn(rq.card, 'overflow-hidden text-xs leading-tight')}>
      <div className="border-b border-[color:var(--glass-border-subtle)] px-3 py-2">
        <p className="text-sm font-semibold leading-tight">
          <span className="mr-1.5 tabular-nums text-pour-muted">#{itemNo}</span>
          {fields.structure ?? fields.location ?? '—'}
        </p>
        {fields.castingDate !== '—' ? (
          <p className="mt-px text-[10px] text-pour-muted">{fields.castingDate}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-2 gap-y-0.5 px-3 py-2">
        {rows.map(([label, value]) =>
          value ? (
            <Fragment key={label}>
              <span className="text-[10px] font-semibold text-pour-muted">{label}</span>
              <span className="min-w-0 font-medium">{value}</span>
            </Fragment>
          ) : null,
        )}
      </div>
    </article>
  )
}

export function ConcreteSummaryPage() {
  const { role } = useAuthStore()
  const filter = useFilterStore((s) => s.filter)
  const setFilter = useFilterStore((s) => s.setFilter)

  const [dateFrom, setDateFrom] = useState(
    () => filter.casting_date_from ?? defaultSummaryDateFrom(),
  )
  const [dateTo, setDateTo] = useState(() => filter.casting_date_to ?? todayIsoLocal())
  const [structureId, setStructureId] = useState<string>(ALL_STRUCTURES)
  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [cstByRequest, setCstByRequest] = useState<Map<string, Map<number, CstViewRow>>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const canAccess = role === 'admin' || role === 'manager'

  const [debouncedSearch, setDebouncedSearch] = useState(() => filter.search)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(filter.search), 280)
    return () => window.clearTimeout(t)
  }, [filter.search])

  useEffect(() => {
    warmConcreteSummaryTemplateCache()
  }, [])

  useDesktopSearchRegistration({
    placeholder: CONCRETE_SUMMARY_SEARCH_PLACEHOLDER,
    ariaLabel: CONCRETE_SUMMARY_SEARCH_ARIA,
    showRequestFilterButton: false,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const loadData = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!opts?.background) setLoading(true)
      setError(null)
      try {
        if (!isSupabaseConfigured) {
          setRequests([])
          setCstByRequest(new Map())
          return
        }
        const rows = await fetchConcreteSummaryRequests({
          castingDateFrom: dateFrom.trim() || null,
          castingDateTo: dateTo.trim() || null,
          structureId: null,
        })
        const views = await fetchCstViewsByRequestIds(rows.map((r) => r.id))
        setRequests(rows)
        setCstByRequest(indexCstViewsByRequestAndAge(views))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'โหลด Concrete Summary ไม่สำเร็จ'
        setError(msg)
        toast.error(msg)
        setRequests([])
        setCstByRequest(new Map())
      } finally {
        setLoading(false)
      }
    },
    [dateFrom, dateTo],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  usePullToRefreshRegistration(() => loadData({ background: true }))

  const searchQ = debouncedSearch.trim().toLowerCase()

  const structureOptions = useMemo(
    () => collectStructureOptionsFromRequests(requests),
    [requests],
  )

  useEffect(() => {
    if (structureId === ALL_STRUCTURES) return
    if (!structureOptions.some((s) => String(s.id) === structureId)) {
      setStructureId(ALL_STRUCTURES)
    }
  }, [structureId, structureOptions])

  const byStructure = useMemo(
    () => requests.filter((r) => requestMatchesStructureFilter(r, structureId, ALL_STRUCTURES)),
    [requests, structureId],
  )

  const filtered = useMemo(() => {
    return byStructure.filter((r) => {
      const views = cstByRequest.get(r.id)
      return concreteSummaryMatchesSearch(r, views, searchQ)
    })
  }, [byStructure, cstByRequest, searchQ])

  const sorted = useMemo(
    () => sortConcreteSummaryRequests(filtered),
    [filtered],
  )

  const dateRangeLabel = useMemo(() => {
    const a = dateFrom.trim() ? formatDate(`${dateFrom.trim()}T12:00:00`) : '—'
    const b = dateTo.trim() ? formatDate(`${dateTo.trim()}T12:00:00`) : '—'
    if (!dateFrom.trim() && !dateTo.trim()) return 'ทุกวันเท'
    if (dateFrom.trim() && dateTo.trim()) return `${a} – ${b}`
    if (dateFrom.trim()) return `ตั้งแต่ ${a}`
    return `ถึง ${b}`
  }, [dateFrom, dateTo])

  const structureLabel = useMemo(() => {
    if (structureId === ALL_STRUCTURES) return null
    return structureOptions.find((s) => String(s.id) === structureId)?.name ?? null
  }, [structureId, structureOptions])

  const countSummaryText = useMemo(() => {
    const n = sorted.length
    const base = searchQ ? byStructure.length : structureId !== ALL_STRUCTURES ? requests.length : n
    if (n === base) return `${n} รายการ`
    return `${n} รายการ (จาก ${base} รายการ)`
  }, [sorted.length, searchQ, byStructure.length, structureId, requests.length])

  if (!canAccess) {
    return <Navigate to={APP_HOME} replace />
  }

  return (
    <div className={rq.page}>
      <header className="space-y-1">
        <h1 className={cn(rq.heroTitle, 'flex items-center gap-2')}>
          <BarChart3 className={cn(icon.md, 'text-[color:var(--pour-accent)]')} strokeWidth={ICON_STROKE} />
          Concrete Summary
        </h1>
        <p className={rq.sub}>
          สรุปผลความแข็งคอนกรีตจาก CST — รายการที่เทเสร็จแล้ว (Complete) ตามช่วงวันเทและโครงสร้าง
        </p>
      </header>

      <div className="mt-5 space-y-3 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg-2)]/40 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="concrete-summary-from" className="flex items-center gap-1.5 text-sm">
              <CalendarDays className="h-4 w-4 text-[color:var(--pour-accent)]" aria-hidden />
              วันเท (เริ่ม)
            </Label>
            <Input
              id="concrete-summary-from"
              type="date"
              value={dateFrom}
              max="9999-12-31"
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[10.5rem] max-w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="concrete-summary-to" className="text-sm">
              วันเท (สิ้นสุด)
            </Label>
            <Input
              id="concrete-summary-to"
              type="date"
              value={dateTo}
              max="9999-12-31"
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[10.5rem] max-w-full"
            />
          </div>
          <div className="flex min-w-[12rem] flex-1 flex-wrap items-end gap-2 sm:max-w-md">
            <div className="min-w-[12rem] flex-1 space-y-1.5">
              <Label className="text-sm">Structure</Label>
              <Select
                value={structureId}
                onValueChange={setStructureId}
                disabled={loading || structureOptions.length === 0}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue
                    placeholder={
                      structureOptions.length === 0 ? 'ไม่มีโครงสร้างในช่วงนี้' : 'ทุกโครงสร้าง'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STRUCTURES}>ทุกโครงสร้าง</SelectItem>
                  {structureOptions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-1.5"
              disabled={loading || sorted.length === 0}
              onClick={() => {
                try {
                  localPrintConcreteSummary({
                    dateFrom,
                    dateTo,
                    structureId,
                    search: filter.search,
                  })
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'เปิดหน้าพิมพ์ไม่สำเร็จ')
                }
              }}
            >
              <Printer className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
              พิมพ์
            </Button>
          </div>
        </div>
        <p className={cn(type.caption, 'pb-0.5')}>
          {dateRangeLabel}
          {structureLabel ? ` · ${structureLabel}` : ''} · {countSummaryText}
          <span className="text-pour-subtle"> · เรียง วันเท ↑ · กำลัง ↑ · Supplier A–Z</span>
        </p>
      </div>

      <div className="mt-6">
        {loading && requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={rq.spinner} />
            <p className="mt-3 text-sm text-pour-muted">กำลังโหลด…</p>
          </div>
        ) : error && requests.length === 0 ? (
          <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-8 text-center text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </p>
        ) : sorted.length === 0 ? (
          <p className={cn(surface.empty, 'py-16 text-center text-sm')}>
            {requests.length === 0
              ? 'ไม่มีรายการในช่วงที่เลือก'
              : byStructure.length === 0
                ? 'ไม่มีรายการตามโครงสร้างที่เลือก'
                : 'ไม่พบรายการตามคำค้นหา'}
          </p>
        ) : (
          <>
            <div className="space-y-2 pour-desktop:hidden">
              {sorted.map((r, i) => {
                const views = cstByRequest.get(r.id)
                const fields = buildConcreteSummaryRowFields(r, views)
                return <ConcreteSummaryMobileCard key={r.id} itemNo={i + 1} fields={fields} />
              })}
            </div>
            <div className={cn(app.tableWrap, 'hidden pour-desktop:block')}>
              <table className={summaryTable.table}>
                <thead className={summaryTable.head}>
                  <tr>
                    <th className={summaryTh.item}>Item</th>
                    <th className={summaryTh.date}>Casting Date</th>
                    <th className={summaryTh.work}>Concrete Works</th>
                    <th className={summaryTh.structure}>Structure</th>
                    <th className={summaryTh.location}>Location</th>
                    <th className={summaryTh.structureNo}>Structure No.</th>
                    <th className={summaryTh.supplier}>Supplier</th>
                    <th className={summaryTh.slump}>Slump</th>
                    <th className={summaryTh.mix}>Mix Code</th>
                    <th className={summaryTh.req}>Req. Strength</th>
                    {CONCRETE_SUMMARY_TEST_AGES.map((age) => (
                      <th key={age} className={cn(summaryTh.avg, 'tabular-nums')}>
                        {CONCRETE_SUMMARY_AVG_LABELS[age]}
                      </th>
                    ))}
                    <th className={summaryTh.result}>Result</th>
                  </tr>
                </thead>
                <tbody className={summaryTable.body}>
                  {sorted.map((r, i) => {
                    const views = cstByRequest.get(r.id)
                    const f = buildConcreteSummaryRowFields(r, views)
                    return (
                      <tr key={r.id}>
                        <td className={cn(summaryTh.item, 'text-pour-muted')}>{i + 1}</td>
                        <td className={cn(summaryTh.date, 'tabular-nums')}>{f.castingDate}</td>
                        <td className={summaryTh.work}>{displayCell(f.concrete)}</td>
                        <td className={summaryTh.structure}>{displayCell(f.structure)}</td>
                        <td className={cn(summaryTh.location, 'break-words')}>{displayCell(f.location)}</td>
                        <td className={cn(summaryTh.structureNo, 'break-words')}>
                          {displayCell(f.structureNo)}
                        </td>
                        <td className={summaryTh.supplier}>{displayCell(f.supplier)}</td>
                        <td className={summaryTh.slump}>{displayCell(f.slump)}</td>
                        <td className={summaryTh.mix}>{displayCell(f.mixCode)}</td>
                        <td className={cn(summaryTh.req, 'whitespace-nowrap tabular-nums')}>
                          {displayCell(f.reqStrength)}
                        </td>
                        {CONCRETE_SUMMARY_TEST_AGES.map((age) => (
                          <td key={age} className={cn(summaryTh.avg, 'tabular-nums whitespace-nowrap')}>
                            {f.avgByAge[age]}
                          </td>
                        ))}
                        <td className={cn(summaryTh.result, 'whitespace-nowrap font-medium')}>
                          {f.result}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
