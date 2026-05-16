import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FlaskConical, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CST_AGE_COLUMN_LABELS, CstAgeColumnCell } from '@/components/cst/CstAgeColumnCell'
import { CstAgeQuickActions } from '@/components/cst/CstAgeQuickActions'
import { CstListSection } from '@/components/cst/CstListSection'
import { cstAgesDueToday } from '@/lib/cstListDue'
import { cstTestDateDisplay, cstTestDateDisplayShort } from '@/lib/cstForm'
import { CST_TEST_AGES } from '@/types/app.types'
import { CstFormDialog } from '@/components/requests/CstFormDialog'
import { CstRequestInfoDialog } from '@/components/requests/CstRequestInfoDialog'
import { APP_HOME } from '@/lib/appHome'
import { fetchCstDueTodayList, fetchCstListPage, mergeCstAgeMaps } from '@/lib/cstListData'
import { warmCstReportTemplateCache } from '@/lib/cstPrint'
import { activeCastingDateIso } from '@/lib/activeCastingDate'
import {
  CST_LIST_SEARCH_ARIA,
  CST_LIST_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { app, icon, ICON_STROKE, rq, tableCompact, type } from '@/lib/requestUi'
import { cn, formatDate, formatVolumeNumber } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import type { CstTestAge, RequestWithRelations } from '@/types/app.types'

const PAGE_SIZE = 20

const cstTableCompact = {
  table: cn(tableCompact.table, 'min-w-[58rem]'),
  head: cn(
    tableCompact.head,
    '[&_th.cst-age-col]:max-w-none [&_th.cst-age-col]:w-[5rem] [&_th.cst-age-col]:px-1 [&_th.cst-age-col]:text-center [&_th.cst-age-col]:normal-case [&_th.cst-age-col]:tracking-normal',
    '[&_th.cst-age-col:first-of-type]:border-l-2 [&_th.cst-age-col:first-of-type]:border-[color:var(--glass-border-subtle)]',
    '[&_th.cst-age-col]:bg-[color:var(--pour-bg-2)]/60',
  ),
  body: cn(
    tableCompact.body,
    '[&_td.cst-age-col]:max-w-none [&_td.cst-age-col]:w-[5rem] [&_td.cst-age-col]:px-1 [&_td.cst-age-col]:align-top',
    '[&_td.cst-age-col:first-of-type]:border-l-2 [&_td.cst-age-col:first-of-type]:border-[color:var(--glass-border-subtle)]',
    '[&_td.cst-age-col]:bg-[color:var(--pour-bg-2)]/40',
  ),
} as const

type CstListMix = {
  mixcode: string
  supplier: string | null
}

function volumeLine(r: RequestWithRelations): string {
  if (r.volume_confirm != null) return formatVolumeNumber(r.volume_confirm)
  if (r.volume_actual != null) return formatVolumeNumber(r.volume_actual)
  if (r.volume_request != null) return formatVolumeNumber(r.volume_request)
  return '-'
}

function castingDateDisplay(r: RequestWithRelations): string {
  const active = activeCastingDateIso(r)
  const date = active ? formatDate(active) : formatDate(r.casting_date)
  return date && date !== '-' ? date : '-'
}

function getCstRowFields(r: RequestWithRelations) {
  const structure = (r.structure as { structure_name: string } | null)?.structure_name?.trim() || null
  const structureNo = r.structure_no?.trim() || null
  const location =
    (r.location as { full_location: string | null; location1: string } | null)?.full_location ??
    (r.location as { location1: string } | null)?.location1 ??
    null
  const concrete = (r.concrete_work as { concrete_work: string } | null)?.concrete_work ?? null
  const mix = (r.mixcode as CstListMix | null) ?? null
  return {
    castingDate: castingDateDisplay(r),
    concrete,
    structure,
    location,
    structureNo,
    mix,
    volume: volumeLine(r),
  }
}

function mixCodeLabel(mix: CstListMix | null): string | null {
  if (!mix?.mixcode?.trim()) return mix?.supplier?.trim() || null
  const code = mix.mixcode.trim()
  const supplier = mix.supplier?.trim()
  return supplier ? `${code} · ${supplier}` : code
}

function MixCodeCell({ mix }: { mix: CstListMix | null }) {
  if (!mix?.mixcode?.trim()) {
    const supplierOnly = mix?.supplier?.trim()
    return supplierOnly ? <span>{supplierOnly}</span> : <>-</>
  }
  const supplier = mix.supplier?.trim()
  return (
    <>
      <span>{mix.mixcode.trim()}</span>
      {supplier ? (
        <span className="mt-px block text-[10px] leading-tight text-pour-muted">{supplier}</span>
      ) : null}
    </>
  )
}

function CstMobileCard({
  r,
  savedAges,
  canEdit,
  onAgeClick,
  onInfoClick,
  emphasizeAges,
}: {
  r: RequestWithRelations
  savedAges: number[]
  canEdit: boolean
  onAgeClick: (age: CstTestAge) => void
  onInfoClick: () => void
  emphasizeAges?: CstTestAge[]
}) {
  const f = getCstRowFields(r)
  const rows: [string, string | null | undefined][] = [
    ['Concrete Work', f.concrete],
    ['Structure', f.structure],
    ['Location', f.location],
    ['Structure No.', f.structureNo],
    ['Mix Code', mixCodeLabel(f.mix)],
    ['Volume', f.volume !== '-' ? f.volume : null],
  ]

  return (
    <article className={cn(rq.card, 'overflow-hidden text-xs leading-tight')}>
      <button
        type="button"
        className="w-full cursor-pointer text-left transition-colors hover:bg-[color:var(--pour-nav-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent-ring)] focus-visible:ring-inset"
        onClick={onInfoClick}
      >
        <div className="flex items-start justify-between gap-2 border-b border-[color:var(--glass-border-subtle)] px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">{f.structure ?? f.location ?? '—'}</p>
            <p className="mt-px text-[10px] text-pour-muted">{f.castingDate}</p>
          </div>
          <StatusBadge statusId={r.status_id} size="sm" compact />
        </div>
        <div className="grid grid-cols-[minmax(5.25rem,auto)_1fr] gap-x-2 gap-y-0.5 px-3 py-2">
          {rows.map(([label, value]) =>
            value ? (
              <Fragment key={label}>
                <span className="text-[10px] font-semibold text-pour-muted">{label}</span>
                <span className="min-w-0 font-medium">{value}</span>
              </Fragment>
            ) : null,
          )}
        </div>
      </button>
      <div className="border-t border-[color:var(--glass-border)] bg-[color:var(--pour-bg-2)]/50 px-4 py-3">
        <p className={cn(rq.actions.sectionLabel, 'mb-2 text-[10px]')}>บันทึกผล CST</p>
        <CstAgeQuickActions
          savedAges={savedAges}
          onAgeClick={onAgeClick}
          disabled={!canEdit}
          compact
          grid
          emphasizeAges={emphasizeAges}
        />
        <Link
          to={`/requests/${r.id}`}
          className={cn(rq.link, 'mt-2 inline-flex items-center gap-0.5 text-[10px]')}
        >
          รายละเอียด
          <ExternalLink className="h-3 w-3" strokeWidth={ICON_STROKE} aria-hidden />
        </Link>
      </div>
    </article>
  )
}

function CstListContent({
  requests,
  savedAgesFor,
  canEdit,
  onAgeClick,
  onInfoClick,
}: {
  requests: RequestWithRelations[]
  savedAgesFor: (id: string) => number[]
  canEdit: boolean
  onAgeClick: (request: RequestWithRelations, age: CstTestAge) => void
  onInfoClick: (request: RequestWithRelations) => void
}) {
  return (
    <>
      <div className="space-y-2 pour-desktop:hidden">
        {requests.map((r) => {
          const savedAges = savedAgesFor(r.id)
          const emphasizeAges = cstAgesDueToday(r, savedAges)
          return (
            <CstMobileCard
              key={r.id}
              r={r}
              savedAges={savedAges}
              canEdit={canEdit}
              onAgeClick={(age) => onAgeClick(r, age)}
              onInfoClick={() => onInfoClick(r)}
              emphasizeAges={emphasizeAges}
            />
          )
        })}
      </div>

      <div className={cn(app.tableWrapNested, 'mt-0')}>
        <table className={cstTableCompact.table}>
          <thead className={cstTableCompact.head}>
            <tr>
              <th>Casting date</th>
              <th>Concrete Work</th>
              <th>Structure</th>
              <th>Location</th>
              <th>Structure No.</th>
              <th>Mix Code</th>
              <th>Volume</th>
              {CST_TEST_AGES.map((age) => (
                <th key={age} className="cst-age-col">
                  <span className="font-bold tabular-nums">{CST_AGE_COLUMN_LABELS[age]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cstTableCompact.body}>
            {requests.map((r) => {
              const f = getCstRowFields(r)
              const savedAges = savedAgesFor(r.id)
              const dueAges = cstAgesDueToday(r, savedAges)

              return (
                <tr key={r.id} className="cursor-pointer" onClick={() => onInfoClick(r)}>
                  <td className="whitespace-nowrap tabular-nums">{f.castingDate}</td>
                  <td>{f.concrete ?? '-'}</td>
                  <td>{f.structure ?? '-'}</td>
                  <td>{f.location ?? '-'}</td>
                  <td>{f.structureNo ?? '-'}</td>
                  <td>
                    <MixCodeCell mix={f.mix} />
                  </td>
                  <td className="tabular-nums whitespace-nowrap">{f.volume}</td>
                  {CST_TEST_AGES.map((age) => (
                    <td key={age} className="cst-age-col">
                      <CstAgeColumnCell
                        age={age}
                        testDateLabel={cstTestDateDisplay(r, age)}
                        testDateShort={cstTestDateDisplayShort(r, age)}
                        saved={savedAges.includes(age)}
                        canEdit={canEdit}
                        emphasized={dueAges.includes(age)}
                        onClick={() => onAgeClick(r, age)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function CstListPage() {
  const { role } = useAuthStore()
  const { filter, setFilter } = useFilterStore()
  const canEdit = role === 'admin' || role === 'manager'

  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [dueTodayRequests, setDueTodayRequests] = useState<RequestWithRelations[]>([])
  const [cstAgesByRequestId, setCstAgesByRequestId] = useState<Map<string, number[]>>(new Map())
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogRequest, setDialogRequest] = useState<RequestWithRelations | null>(null)
  const [cstAge, setCstAge] = useState<CstTestAge | null>(null)
  const [infoRequest, setInfoRequest] = useState<RequestWithRelations | null>(null)

  const filterKey = JSON.stringify({
    search: filter.search,
    casting_date_from: filter.casting_date_from,
    casting_date_to: filter.casting_date_to,
  })
  const isFirstFilterEffect = useRef(true)

  const [debouncedSearch, setDebouncedSearch] = useState(() => filter.search)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(filter.search), 280)
    return () => window.clearTimeout(t)
  }, [filter.search])

  useDesktopSearchRegistration({
    placeholder: CST_LIST_SEARCH_PLACEHOLDER,
    ariaLabel: CST_LIST_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  useEffect(() => {
    warmCstReportTemplateCache()
  }, [])

  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false
      return
    }
    setPage(0)
  }, [filterKey])

  const loadData = useCallback(
    async (opts?: { background?: boolean }) => {
      if (!opts?.background) setLoading(true)
      setError(null)
      try {
        if (!isSupabaseConfigured) {
          setRequests([])
          setDueTodayRequests([])
          setTotal(0)
          setCstAgesByRequestId(new Map())
          return
        }
        const [pageResult, dueTodayResult] = await Promise.all([
          fetchCstListPage({
            page,
            pageSize: PAGE_SIZE,
            search: debouncedSearch,
            castingDateFrom: filter.casting_date_from,
            castingDateTo: filter.casting_date_to,
          }),
          fetchCstDueTodayList({ search: debouncedSearch }),
        ])
        setRequests(pageResult.requests)
        setTotal(pageResult.total)
        setDueTodayRequests(dueTodayResult.requests)
        setCstAgesByRequestId(
          mergeCstAgeMaps(pageResult.cstAgesByRequestId, dueTodayResult.cstAgesByRequestId),
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'โหลดรายการ CST ไม่สำเร็จ'
        setError(msg)
        toast.error(msg)
        setRequests([])
        setDueTodayRequests([])
        setTotal(0)
        setCstAgesByRequestId(new Map())
      } finally {
        setLoading(false)
      }
    },
    [page, debouncedSearch, filter.casting_date_from, filter.casting_date_to],
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  usePullToRefreshRegistration(() => loadData({ background: true }))

  const savedAgesFor = useCallback(
    (id: string) => cstAgesByRequestId.get(id) ?? [],
    [cstAgesByRequestId],
  )

  const openCstDialog = useCallback((request: RequestWithRelations, age: CstTestAge) => {
    setDialogRequest(request)
    setCstAge(age)
  }, [])

  const handleCstSaved = useCallback(() => {
    void loadData({ background: true })
  }, [loadData])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])

  const listContentProps = {
    savedAgesFor,
    canEdit,
    onAgeClick: openCstDialog,
    onInfoClick: setInfoRequest,
  }

  if (!canEdit) {
    return <Navigate to={APP_HOME} replace />
  }

  return (
    <div className={rq.page}>
      <header className="space-y-1">
        <h1 className={cn(rq.heroTitle, 'flex items-center gap-2')}>
          <FlaskConical className={cn(icon.md, 'text-[color:var(--pour-accent)]')} strokeWidth={ICON_STROKE} />
          CST — กำลังอัดคอนกรีต
        </h1>
        <p className={rq.sub}>
          กลุ่ม “ต้องบันทึกวันนี้” ดึงจากทั้งระบบ · “รายการทั้งหมด” ตามตัวกรองและแบ่งหน้า
        </p>
      </header>

      {loading && requests.length === 0 && dueTodayRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className={rq.spinner} />
          <p className="mt-3 text-sm text-pour-muted">กำลังโหลด…</p>
        </div>
      ) : error && requests.length === 0 ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-8 text-center text-sm text-rose-800">
          {error}
        </p>
      ) : requests.length === 0 && dueTodayRequests.length === 0 ? (
        <p className={rq.dataRowEmpty}>ไม่พบรายการ Complete ที่ตรงกับตัวกรอง</p>
      ) : (
        <>
          <p className={type.caption}>
            ต้องบันทึกวันนี้ {dueTodayRequests.length} รายการ (ทั้งระบบ)
            {requests.length > 0 || total > 0 ? (
              <>
                {' · '}
                {total} รายการ
                {filter.search.trim() || filter.casting_date_from || filter.casting_date_to
                  ? ' (กรองแล้ว)'
                  : ''}
              </>
            ) : null}
          </p>

          <div className="space-y-3">
            <CstListSection
              title="ต้องบันทึกวันนี้"
              count={dueTodayRequests.length}
              defaultOpen
              emptyMessage="ไม่มีรายการที่ครบกำหนดวันนี้"
            >
              <CstListContent requests={dueTodayRequests} {...listContentProps} />
            </CstListSection>

            <CstListSection title="รายการทั้งหมด" count={total} defaultOpen={false}>
              {requests.length === 0 ? (
                <p className="py-4 text-center text-sm text-pour-muted">
                  ไม่มีรายการในหน้านี้ที่ตรงกับตัวกรอง
                </p>
              ) : (
                <CstListContent requests={requests} {...listContentProps} />
              )}
            </CstListSection>
          </div>

          {total > PAGE_SIZE ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                ก่อนหน้า
              </Button>
              <span className="text-sm text-pour-muted">
                หน้า {page + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </Button>
            </div>
          ) : null}
        </>
      )}

      <CstRequestInfoDialog
        request={infoRequest}
        open={infoRequest != null}
        onOpenChange={(open) => {
          if (!open) setInfoRequest(null)
        }}
      />

      {dialogRequest && (
        <CstFormDialog
          request={dialogRequest}
          age={cstAge}
          open={cstAge != null}
          onOpenChange={(open) => {
            if (!open) {
              setCstAge(null)
              setDialogRequest(null)
            }
          }}
          onSaved={handleCstSaved}
        />
      )}
    </div>
  )
}

