import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import BarChart from '@mui/icons-material/BarChart'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import Print from '@mui/icons-material/Print'
import { AppIcon } from '@/components/icons/AppIcon'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useJobScope } from '@/hooks/useJobScope'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { useDataSyncRefetch } from '@/hooks/useDataSyncRefetch'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { useResizableTableColumns } from '@/hooks/useResizableTableColumns'
import { ResizableTableToolbar } from '@/components/shared/ResizableTableToolbar'
import { TableClampText } from '@/components/shared/TableClampText'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect, mapSearchableOptions } from '@/components/ui/searchable-select'
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
import type { ResizableTableColumnConfig } from '@/lib/resizableTableColumns'
import { app, rq, surface, tableCompact, type } from '@/lib/requestUi'
import { pourPcUi } from '@/lib/pourPcScale'
import { todayIsoLocal } from '@/lib/cstListDue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import type { CstViewRow } from '@/types/database.cst.types'
import type { RequestWithRelations } from '@/types/app.types'

const CONCRETE_SUMMARY_RESIZE_TABLE_ID = 'concrete-summary-v3'

/** ค่าเริ่มต้นตรง pour-pc-col-* (52 / 118 / 76 / 100) + คอลัมน์ข้อความสมดุล */
const CONCRETE_SUMMARY_RESIZE_COLUMNS: ResizableTableColumnConfig[] = [
  { id: 'item', defaultWidth: 52, minWidth: 44, maxWidth: 80 },
  { id: 'date', defaultWidth: 118, minWidth: 96, maxWidth: 160 },
  { id: 'work', defaultWidth: 96, minWidth: 72 },
  { id: 'structure', defaultWidth: 96, minWidth: 72 },
  { id: 'location', defaultWidth: 96, minWidth: 72 },
  { id: 'structureNo', defaultWidth: 88, minWidth: 72 },
  { id: 'supplier', defaultWidth: 96, minWidth: 72 },
  { id: 'slump', defaultWidth: 52, minWidth: 44, maxWidth: 80 },
  { id: 'mix', defaultWidth: 88, minWidth: 72 },
  { id: 'req', defaultWidth: 52, minWidth: 44, maxWidth: 120 },
  ...CONCRETE_SUMMARY_TEST_AGES.map(
    (age): ResizableTableColumnConfig => ({
      id: `avg${age}`,
      defaultWidth: 76,
      minWidth: 64,
      maxWidth: 120,
    }),
  ),
  { id: 'result', defaultWidth: 100, minWidth: 96, maxWidth: 200 },
]

const summaryAgeCol = 'summary-age-col'

const summaryCell = {
  item: 'text-center tabular-nums text-pour-muted',
  date: 'tabular-nums whitespace-nowrap',
  slump: 'text-center tabular-nums',
  req: 'text-center tabular-nums whitespace-nowrap',
  avg: cn('text-center tabular-nums whitespace-nowrap', summaryAgeCol),
  result: cn('summary-result-col text-center whitespace-nowrap font-medium'),
} as const

const summaryTable = {
  table: cn(tableCompact.table, pourPcUi.tableResizable),
  head: cn(
    tableCompact.head,
    '[&_th]:px-1.5 [&_th]:py-2 sm:[&_th]:px-2',
    '[&_th]:whitespace-normal [&_th]:break-words [&_th]:align-middle',
    '[&_th]:text-pour-2xs [&_th]:leading-tight sm:[&_th]:text-pour-xs',
    `[&_th.${summaryAgeCol}]:px-1 [&_th.${summaryAgeCol}]:text-center [&_th.${summaryAgeCol}]:normal-case`,
    `[&_th.${summaryAgeCol}]:bg-[color:var(--pour-bg-2)]/60`,
    '[&_th.summary-result-col]:bg-[color:var(--pour-bg-2)]/40',
  ),
  body: cn(
    tableCompact.body,
    '[&_td]:px-1.5 sm:[&_td]:px-2',
    `[&_td.${summaryAgeCol}]:px-1 [&_td.${summaryAgeCol}]:bg-[color:var(--pour-bg-2)]/30`,
    '[&_td.summary-result-col]:bg-[color:var(--pour-bg-2)]/20',
  ),
} as const

const ALL_STRUCTURES = 'all'

function defaultSummaryDateFrom(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd')
}

function displayCell(v: string | null | undefined): string {
  if (v == null || v === '') return '—'
  return v
}

function summaryResultTone(result: string): string {
  if (result.startsWith('ผ่าน')) return 'text-emerald-700 dark:text-emerald-400'
  if (result.startsWith('ไม่ผ่าน')) return 'text-rose-700 dark:text-rose-400'
  return 'text-[color:var(--pour-ink-1)]'
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
          <p className="mt-px text-pour-2xs text-pour-muted">{fields.castingDate}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-2 gap-y-0.5 px-3 py-2">
        {rows.map(([label, value]) =>
          value ? (
            <Fragment key={label}>
              <span className="text-pour-2xs font-semibold text-pour-muted">{label}</span>
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
  const { queryJobScope } = useJobScope()
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
    [dateFrom, dateTo, queryJobScope],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  useDataSyncRefetch(['Request', 'CST', '*'], loadData)

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

  const summaryTableResize = useResizableTableColumns(
    CONCRETE_SUMMARY_RESIZE_TABLE_ID,
    CONCRETE_SUMMARY_RESIZE_COLUMNS,
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

  return (
    <div className={rq.page}>
      <header className="space-y-1">
        <h1 className={cn(rq.heroTitle, 'flex items-center gap-2')}>
          <AppIcon icon={BarChart} size="md" className="text-[color:var(--pour-accent)]" />
          Concrete Summary
        </h1>
        <p className={rq.sub}>สรุปรายการและผลทดสอบกำลังอัดคอนกรีต (CST)</p>
      </header>

      <div className="mt-5 space-y-3 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg-2)]/40 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="concrete-summary-from" className="flex items-center gap-1.5 text-sm">
              <AppIcon icon={CalendarMonth} size="sm" className="text-[color:var(--pour-accent)]" />
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
              <SearchableSelect
                value={structureId}
                onValueChange={setStructureId}
                disabled={loading || structureOptions.length === 0}
                placeholder={structureOptions.length === 0 ? 'ไม่มีโครงสร้างในช่วงนี้' : 'ทุกโครงสร้าง'}
                options={[
                  { value: ALL_STRUCTURES, label: 'ทุกโครงสร้าง' },
                  ...mapSearchableOptions(structureOptions, (s) => String(s.id), (s) => s.name),
                ]}
              />
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
              <AppIcon icon={Print} size="sm" />
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
            <section className="hidden min-w-0 pour-desktop:block">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="min-w-0 text-pour-xs leading-snug text-pour-muted">
                  ลากขอบหัวคอลัมน์เพื่อปรับความกว้าง · ดับเบิลคลิกที่ขอบเพื่อรีเซ็ตคอลัมน์นั้น
                </p>
                <ResizableTableToolbar onReset={summaryTableResize.resetWidths} className="shrink-0" />
              </div>
              <div className={cn(app.tableWrap, app.tableWrapResizable)}>
                <table className={summaryTable.table}>
                  {summaryTableResize.colGroup}
                  <thead className={summaryTable.head}>
                    <tr>
                      {summaryTableResize.renderHeadCell('item', 'Item', {
                        className: cn('font-medium', summaryCell.item),
                      })}
                      {summaryTableResize.renderHeadCell('date', 'Casting Date', {
                        className: cn('font-medium', summaryCell.date),
                      })}
                      {summaryTableResize.renderHeadCell('work', 'Concrete Works', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('structure', 'Structure', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('location', 'Location', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('structureNo', 'Structure No.', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('supplier', 'Supplier', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('slump', 'Slump', {
                        className: cn('font-medium', summaryCell.slump),
                      })}
                      {summaryTableResize.renderHeadCell('mix', 'Mix Code', { className: 'font-medium' })}
                      {summaryTableResize.renderHeadCell('req', 'Req. Strength', {
                        className: cn('font-medium', summaryCell.req),
                      })}
                      {CONCRETE_SUMMARY_TEST_AGES.map((age) =>
                        summaryTableResize.renderHeadCell(
                          `avg${age}`,
                          CONCRETE_SUMMARY_AVG_LABELS[age],
                          { className: cn('font-medium', summaryCell.avg) },
                        ),
                      )}
                      {summaryTableResize.renderHeadCell('result', 'Result', {
                        className: cn('font-medium', summaryCell.result),
                      })}
                    </tr>
                  </thead>
                  <tbody className={summaryTable.body}>
                    {sorted.map((r, i) => {
                      const views = cstByRequest.get(r.id)
                      const f = buildConcreteSummaryRowFields(r, views)
                      return (
                        <tr key={r.id}>
                          <td className={cn('min-w-0', summaryCell.item)}>{i + 1}</td>
                          <td className={cn('min-w-0', summaryCell.date)}>{f.castingDate}</td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.concrete)} />
                          </td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.structure)} />
                          </td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.location)} />
                          </td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.structureNo)} />
                          </td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.supplier)} />
                          </td>
                          <td className={cn('min-w-0', summaryCell.slump)}>{displayCell(f.slump)}</td>
                          <td className="min-w-0">
                            <TableClampText text={displayCell(f.mixCode)} />
                          </td>
                          <td className={cn('min-w-0', summaryCell.req)}>{displayCell(f.reqStrength)}</td>
                          {CONCRETE_SUMMARY_TEST_AGES.map((age) => (
                            <td key={age} className={cn('min-w-0', summaryCell.avg)}>
                              {f.avgByAge[age]}
                            </td>
                          ))}
                          <td className={cn('min-w-0', summaryCell.result)}>
                            <TableClampText text={f.result} className={summaryResultTone(f.result)} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
