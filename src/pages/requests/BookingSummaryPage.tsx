import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookingSummaryOkToggle } from '@/components/requests/BookingSummaryOkToggle'
import { BookingSummarySupplierStack } from '@/components/requests/BookingSummarySupplierStack'
import { setRequestBookingOk } from '@/lib/bookingSummaryCheck'
import { fetchBookingSummaryForDate } from '@/lib/bookingSummaryData'
import {
  BOOKING_SUMMARY_COLUMNS,
  BOOKING_SUMMARY_SUPPLIER_NONE,
  bookingSummaryMatchesSearch,
  bookingSummaryMatchesSupplierFilter,
  collectBookingSummarySuppliers,
  getBookingSummaryRowFields,
  type BookingSummaryRowFields,
} from '@/lib/bookingSummaryRow'
import {
  localPrintBookingSummary,
  warmBookingSummaryTemplateCache,
} from '@/lib/bookingSummaryPrint'
import { todayIsoLocal } from '@/lib/cstListDue'
import {
  BOOKING_SUMMARY_SEARCH_ARIA,
  BOOKING_SUMMARY_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { app, icon, ICON_STROKE, rq, surface, tableCompact, type } from '@/lib/requestUi'
import { cn, formatDate } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { RequestWithRelations } from '@/types/app.types'

const summaryTable = {
  table: cn(tableCompact.table, 'min-w-[80rem]'),
  head: tableCompact.head,
  body: tableCompact.body,
} as const

function cellDisplay(f: BookingSummaryRowFields, key: keyof BookingSummaryRowFields): string {
  const v = f[key]
  if (v == null || v === '') return '-'
  return String(v)
}

function mobileShowValue(f: BookingSummaryRowFields, key: keyof BookingSummaryRowFields): string | null {
  const v = cellDisplay(f, key)
  if (v === '-') return null
  return v
}

function BookingSummaryMobileCard({
  itemNo,
  r,
  canEdit,
  saving,
  onBookingOkChange,
}: {
  itemNo: number
  r: RequestWithRelations
  canEdit: boolean
  saving: boolean
  onBookingOkChange: (next: boolean | null) => void
}) {
  const f = getBookingSummaryRowFields(r)
  const rows = BOOKING_SUMMARY_COLUMNS.flatMap((col) => {
    if (col.skipMobileCard) return []
    if (col.hideOnMobileIfEmpty) {
      const v = mobileShowValue(f, col.key)
      return v ? ([[col.label, v]] as [string, string][]) : []
    }
    const v = f[col.key]
    return v ? ([[col.label, String(v)]] as [string, string][]) : []
  })

  const headerSub = [f.time !== '-' ? f.time : null, f.booker, f.bookerPhone]
    .filter(Boolean)
    .join(' · ')

  return (
    <article className={cn(rq.card, 'overflow-hidden text-xs leading-tight')}>
      <div className="border-b border-[color:var(--glass-border-subtle)] px-3 py-2">
        <p className="text-sm font-semibold leading-tight">
          <span className="mr-1.5 tabular-nums text-pour-muted">#{itemNo}</span>
          {f.structure ?? f.location ?? '—'}
        </p>
        {headerSub ? <p className="mt-px text-[10px] text-pour-muted">{headerSub}</p> : null}
      </div>
      <div className="grid grid-cols-[minmax(5.5rem,auto)_1fr] gap-x-2 gap-y-0.5 px-3 py-2">
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span className="text-[10px] font-semibold text-pour-muted">{label}</span>
            <span className="min-w-0 font-medium">{value}</span>
          </Fragment>
        ))}
      </div>
      <div className="border-t border-[color:var(--glass-border-subtle)] px-3 py-2">
        <BookingSummaryOkToggle
          value={r.booking_ok}
          disabled={!canEdit || saving}
          onChange={onBookingOkChange}
        />
      </div>
    </article>
  )
}

export function BookingSummaryPage() {
  const { profile, role } = useAuthStore()
  const filter = useFilterStore((s) => s.filter)
  const setFilter = useFilterStore((s) => s.setFilter)
  const [castingDateIso, setCastingDateIso] = useState(todayIsoLocal)
  const [supplierFilter, setSupplierFilter] = useState('')
  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingBookingOkId, setSavingBookingOkId] = useState<string | null>(null)

  const canEditBookingOk = role === 'admin' || role === 'manager'

  const [debouncedSearch, setDebouncedSearch] = useState(() => filter.search)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(filter.search), 280)
    return () => window.clearTimeout(t)
  }, [filter.search])

  useDesktopSearchRegistration({
    placeholder: BOOKING_SUMMARY_SEARCH_PLACEHOLDER,
    ariaLabel: BOOKING_SUMMARY_SEARCH_ARIA,
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
          return
        }
        const rows = await fetchBookingSummaryForDate({
          castingDateIso,
          clientId: role === 'user' ? profile?.client_id ?? null : null,
        })
        setRequests(rows)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'โหลดรายการจองไม่สำเร็จ'
        setError(msg)
        toast.error(msg)
        setRequests([])
      } finally {
        setLoading(false)
      }
    },
    [castingDateIso, profile?.client_id, role],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    warmBookingSummaryTemplateCache()
  }, [])

  useEffect(() => {
    setSupplierFilter('')
  }, [castingDateIso])

  usePullToRefreshRegistration(() => loadData({ background: true }))

  const handleBookingOkChange = useCallback(
    async (requestId: string, next: boolean | null) => {
      if (!canEditBookingOk) return
      let prev: boolean | null = null
      setSavingBookingOkId(requestId)
      setRequests((list) => {
        prev = list.find((r) => r.id === requestId)?.booking_ok ?? null
        return list.map((r) => (r.id === requestId ? { ...r, booking_ok: next } : r))
      })
      try {
        await setRequestBookingOk(requestId, next)
      } catch (e) {
        const rollback = prev
        setRequests((list) =>
          list.map((r) => (r.id === requestId ? { ...r, booking_ok: rollback } : r)),
        )
        const msg = e instanceof Error ? e.message : 'บันทึก Accept/No ไม่สำเร็จ'
        toast.error(msg)
      } finally {
        setSavingBookingOkId(null)
      }
    },
    [canEditBookingOk],
  )

  const { suppliers: supplierOptions, hasUnspecified } = useMemo(
    () => collectBookingSummarySuppliers(requests),
    [requests],
  )

  const searchQ = debouncedSearch.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          bookingSummaryMatchesSearch(r, searchQ) &&
          bookingSummaryMatchesSupplierFilter(r, supplierFilter),
      ),
    [requests, searchQ, supplierFilter],
  )

  /** ฐานสำหรับ "(จาก N รายการ)" — เปลี่ยนตาม Supplier / ค้นหาที่เลือก */
  const countFrom = useMemo(() => {
    if (searchQ) {
      return requests.filter((r) => bookingSummaryMatchesSupplierFilter(r, supplierFilter)).length
    }
    if (supplierFilter) return requests.length
    return requests.length
  }, [requests, supplierFilter, searchQ])

  const countSummaryText = useMemo(() => {
    const n = filtered.length
    if (n === countFrom) return `${n} รายการ`
    return `${n} รายการ (จาก ${countFrom} รายการ)`
  }, [filtered.length, countFrom])

  const supplierFilterLabel = useMemo(() => {
    if (!supplierFilter) return null
    if (supplierFilter === BOOKING_SUMMARY_SUPPLIER_NONE) return '(ไม่ระบุ)'
    return supplierFilter
  }, [supplierFilter])

  const dateDisplay =
    castingDateIso && formatDate(`${castingDateIso}T12:00:00`) !== '-'
      ? formatDate(`${castingDateIso}T12:00:00`)
      : castingDateIso

  return (
    <div className={rq.page}>
      <header className="space-y-1">
        <h1 className={cn(rq.heroTitle, 'flex items-center gap-2')}>
          <ClipboardList className={cn(icon.md, 'text-[color:var(--pour-accent)]')} strokeWidth={ICON_STROKE} />
          สรุปรายการจองคอนกรีต
        </h1>
        <p className={rq.sub}>ตารางรายการจองจากคำขอ — เลือกวันเทเพื่อดูรายการในวันนั้น</p>
      </header>

      <div className="mt-5 space-y-3 rounded-2xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--pour-bg-2)]/40 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="booking-summary-date" className="flex items-center gap-1.5 text-sm">
              <CalendarDays className="h-4 w-4 text-[color:var(--pour-accent)]" aria-hidden />
              วันเท
            </Label>
            <Input
              id="booking-summary-date"
              type="date"
              value={castingDateIso}
              max="9999-12-31"
              onChange={(e) => setCastingDateIso(e.target.value || todayIsoLocal())}
              className="w-[10.5rem] max-w-full"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 gap-1.5"
            disabled={loading || filtered.length === 0}
            onClick={() => {
              try {
                localPrintBookingSummary({
                  castingDateIso,
                  supplier: supplierFilter,
                  search: debouncedSearch,
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
        <p className={cn(type.caption, 'pb-0.5')}>
          วันเท {dateDisplay}
          {supplierFilterLabel ? ` · ${supplierFilterLabel}` : ''} · {countSummaryText}
        </p>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm text-pour-muted">
            Supplier <span className="font-normal">(วันเท {dateDisplay})</span>
          </p>
          <BookingSummarySupplierStack
            value={supplierFilter}
            onChange={setSupplierFilter}
            suppliers={supplierOptions}
            hasUnspecified={hasUnspecified}
            disabled={loading || requests.length === 0}
          />
        </div>
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
        ) : filtered.length === 0 ? (
          <p className={cn(surface.empty, 'py-16 text-center text-sm')}>
            {requests.length === 0
              ? 'ไม่มีรายการจองในวันที่เลือก'
              : 'ไม่พบรายการตามตัวกรองที่เลือก'}
          </p>
        ) : (
          <>
            <div className="space-y-2 pour-desktop:hidden">
              {filtered.map((r, i) => (
                <BookingSummaryMobileCard
                  key={r.id}
                  itemNo={i + 1}
                  r={r}
                  canEdit={canEditBookingOk}
                  saving={savingBookingOkId === r.id}
                  onBookingOkChange={(next) => void handleBookingOkChange(r.id, next)}
                />
              ))}
            </div>
            <div className={cn(app.tableWrap, 'hidden pour-desktop:block')}>
              <table className={summaryTable.table}>
                <thead className={summaryTable.head}>
                  <tr>
                    <th className="w-12 text-center">Item</th>
                    {BOOKING_SUMMARY_COLUMNS.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th className="whitespace-nowrap text-center">Accept/No</th>
                  </tr>
                </thead>
                <tbody className={summaryTable.body}>
                  {filtered.map((r, i) => {
                    const f = getBookingSummaryRowFields(r)
                    return (
                      <tr key={r.id}>
                        <td className="text-center tabular-nums text-pour-muted">{i + 1}</td>
                        {BOOKING_SUMMARY_COLUMNS.map((col) => {
                          const text = cellDisplay(f, col.key)
                          return (
                            <td
                              key={col.key}
                              className={col.className}
                              title={col.key === 'remark' ? (f.remark ?? undefined) : undefined}
                            >
                              {text}
                            </td>
                          )
                        })}
                        <td className="text-center whitespace-nowrap">
                          <BookingSummaryOkToggle
                            value={r.booking_ok}
                            disabled={!canEditBookingOk || savingBookingOkId === r.id}
                            onChange={(next) => void handleBookingOkChange(r.id, next)}
                          />
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




