import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime, formatTime, cn } from '@/lib/utils'
import { buildRequestListSearchOrClause } from '@/lib/requestListSearch'
import {
  REQUEST_LIST_SEARCH_ARIA,
  REQUEST_LIST_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { getRequestListQuickActions } from '@/lib/requestQuickActions'
import {
  ChevronLeft, ChevronRight, Plus,
  Building2, MapPin, Droplets, Ruler, User, FileText, Layers, GitBranch, Beaker,
  Calendar, Package,
} from 'lucide-react'
import type { RequestWithRelations } from '@/types/app.types'
import { rq } from '@/lib/requestUi'

const PAGE_SIZE = 20

function FeedDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: ReactNode
}) {
  if (value == null || value === '' || value === '-') return null
  return (
    <div className="flex gap-2 text-[12px] leading-snug md:text-[13px]">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9ca3af] md:h-4 md:w-4" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <span className="text-[#6b7280]">{label}</span>
        <span className="ml-1.5 font-medium text-[#374151]">{value}</span>
      </div>
    </div>
  )
}

function RequestFeedCard({ r }: { r: RequestWithRelations }) {
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const quickActions = getRequestListQuickActions({
    statusId: r.status_id,
    role,
    userId: user?.id,
    bookedBy: r.booked_by ?? null,
  })

  const structure = (r.structure as { structure_name: string } | null)?.structure_name ?? '-'
  const initial = structure.trim().slice(0, 1).toUpperCase() || '?'
  const client = (r.client as { client_name: string } | null)?.client_name
  const loc = r.location as { full_location: string | null; location1: string } | null
  const locationLine = loc?.full_location ?? loc?.location1 ?? null
  const concrete = (r.concrete_work as { concrete_work: string } | null)?.concrete_work
  const mix = r.mixcode as { mixcode: string; strength: number | null; slump: string | null; strength_type: string | null } | null
  const mixLine = mix
    ? [mix.mixcode, mix.strength != null ? `${mix.strength}${mix.strength_type ? ` ${mix.strength_type}` : ''}` : null, mix.slump]
        .filter(Boolean)
        .join(' · ')
    : null
  const wbs = (r.wbs_code as { full_wbs: string | null } | null)?.full_wbs
  const abc = (r.abc_code as { full_abc: string | null } | null)?.full_abc
  const booker = r.booked_by_profile as { fname: string | null; lname: string | null } | null | undefined
  const bookerName = booker ? [booker.fname, booker.lname].filter(Boolean).join(' ') : null

  const volumeParts = [
    r.volume_request != null ? `ขอเท ${r.volume_request} ลบ.ม.` : null,
    r.volume_dwg != null ? `แบบ ${r.volume_dwg}` : null,
    r.volume_actual != null ? `เทจริง ${r.volume_actual}` : null,
  ].filter(Boolean)
  const volumeLine = volumeParts.length > 0 ? volumeParts.join(' · ') : null

  const castingLine = [formatDate(r.casting_date), formatTime(r.request_time)].filter((x) => x && x !== '-').join(' ')

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2e6ec] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#2563eb]/35 hover:shadow-[0_4px_14px_rgba(37,99,235,0.12)] md:rounded-[14px] md:shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <Link
        to={`/requests/${r.id}`}
        className="block active:scale-[0.998]"
      >
        <div className="flex gap-2.5 px-3 pt-2.5 pb-1.5 md:gap-3 md:px-3.5 md:pt-3.5 md:pb-2">
        <div className="shrink-0 pt-px md:pt-0.5">
          <div className="rounded-full bg-gradient-to-tr from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] p-[1.5px] shadow-sm md:p-[2px]">
            <div className="rounded-full bg-white p-[1.5px] md:p-[2px]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f0f2f5] to-[#e8ebf0] text-sm font-bold text-[#374151] md:h-11 md:w-11 md:text-base">
                {initial}
              </div>
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold leading-tight text-[#111827] md:text-[15px]">
                {structure}
                {r.structure_no ? <span className="font-normal text-[#6b7280]"> · {r.structure_no}</span> : null}
              </p>
              {r.booked_at ? (
                <p className="mt-0.5 text-[11px] text-[#6b7280] md:mt-1 md:text-xs">{formatDateTime(r.booked_at)}</p>
              ) : null}
            </div>
            <StatusBadge statusId={r.status_id} size="sm" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-[#e2e6ec]/80 bg-[#f5f6f8]/50 px-3 py-2 md:space-y-2 md:px-3.5 md:py-3">
        <FeedDetailRow icon={Building2} label="Client" value={client} />
        <FeedDetailRow icon={MapPin} label="Location" value={locationLine} />
        <FeedDetailRow icon={Layers} label="งานคอนกรีต" value={concrete} />
        <FeedDetailRow icon={Calendar} label="วันเท / เวลา" value={castingLine || null} />
        <FeedDetailRow icon={Droplets} label="Mix" value={mixLine} />
        <FeedDetailRow icon={Ruler} label="ปริมาณ" value={volumeLine} />
        {r.sample_qty != null && (
          <FeedDetailRow icon={Beaker} label="ตัวอย่าง" value={`${r.sample_qty} ชุด`} />
        )}
        {r.strength != null && (
          <FeedDetailRow icon={Package} label="ความแรง (คำขอ)" value={String(r.strength)} />
        )}
        <FeedDetailRow icon={FileText} label="ABC" value={abc} />
        <FeedDetailRow icon={GitBranch} label="WBS" value={wbs} />
        <FeedDetailRow icon={User} label="ผู้จอง" value={bookerName} />
        {r.remarks?.trim() ? (
          <div className="rounded-md bg-white/90 px-2 py-1.5 text-[12px] leading-snug text-[#374151] ring-1 ring-[#e2e6ec]/80 md:rounded-lg md:px-2.5 md:py-2 md:text-[13px]">
            <span className="text-[#9ca3af]">หมายเหตุ </span>
            {r.remarks}
          </div>
        ) : null}
        {r.status_id === 5 && (r.postpone_date || r.reason_postpone) ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-2 text-[12px] text-amber-950">
            {r.postpone_date ? <p>เลื่อนเป็น {formatDate(r.postpone_date)} {r.postpone_time ? formatTime(r.postpone_time) : ''}</p> : null}
            {r.reason_postpone ? <p className="mt-0.5 text-amber-900/90">{r.reason_postpone}</p> : null}
          </div>
        ) : null}
      </div>
      </Link>

      <div className="flex flex-col gap-2 border-t border-[#e2e6ec]/80 bg-white px-3 py-2 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-3 md:gap-y-2 md:px-3.5 md:py-2.5">
        {quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((a) => (
              <Button
                key={a.key}
                type="button"
                size="sm"
                variant={a.variant}
                className="h-8 rounded-lg px-2.5 text-[11px] md:h-9 md:px-3 md:text-xs"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  navigate(`/requests/${r.id}`, { state: { initialModal: a.modal } })
                }}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
        <Link
          to={`/requests/${r.id}`}
          className={cn(
            'inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563eb] transition hover:text-[#1d4ed8] md:text-xs',
            quickActions.length > 0 ? 'shrink-0 self-end md:self-auto' : 'w-full justify-between',
          )}
        >
          <span>ดูรายละเอียดและดำเนินการ</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  )
}

export function RequestListPage() {
  const { user, profile } = useAuthStore()
  const { filter, setFilter } = useFilterStore()
  const filterKey = JSON.stringify(filter)
  const isFirstFilterEffect = useRef(true)
  const { statuses, isLoaded: masterLoaded } = useMasterDataStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const mobileView = searchParams.get('view') === 'latest' ? 'latest' : 'summary'
  const scopeMine = searchParams.get('scope') === 'mine'

  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState<Record<number, number>>({})
  const [countsLoading, setCountsLoading] = useState(true)

  useDesktopSearchRegistration({
    placeholder: REQUEST_LIST_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_LIST_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        setRequests([])
        setTotal(0)
        return
      }
      if (scopeMine && !user) {
        setRequests([])
        setTotal(0)
        return
      }
      let query = supabase
        .from('Request')
        .select(`
        *,
        status:Status(id, status_name),
        client:Client(id, client_name),
        location:Location(id, full_location, location1),
        concrete_work:"Concrete Works"(id, concrete_work),
        structure:Structure(id, structure_name),
        mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type),
        abc_code:"ABC Code"(id, full_abc),
        wbs_code:"WBS Code"(id, full_wbs),
        booked_by_profile:profiles!booked_by(fname, lname)
      `, { count: 'exact' })

      if (scopeMine && user) query = query.eq('booked_by', user.id)
      if (scopeMine && profile?.client_id != null) {
        query = query.eq('client_id', profile.client_id)
      }

      if (filter.status_ids.length > 0) query = query.in('status_id', filter.status_ids)
      if (filter.casting_date_from) query = query.gte('casting_date', filter.casting_date_from)
      if (filter.casting_date_to) query = query.lte('casting_date', filter.casting_date_to)
      const searchOr = buildRequestListSearchOrClause(filter.search)
      if (searchOr) query = query.or(searchOr)

      query = query.order('booked_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const { data, count, error } = await query
      if (error) {
        console.error('Request list:', error.message)
        setRequests([])
        setTotal(0)
        return
      }
      setRequests((data ?? []) as RequestWithRelations[])
      setTotal(count ?? 0)
    } catch (e) {
      console.error('Request list fetch:', e)
      setRequests([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [user, profile?.client_id, filter, page, scopeMine])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const statusRowsForSummary = useMemo(
    () => [...statuses].sort((a, b) => a.id - b.id),
    [statuses],
  )

  const loadStatusCounts = useCallback(async () => {
    if (!statusRowsForSummary.length) {
      setCountsLoading(false)
      return
    }
    setCountsLoading(true)
    try {
      const map: Record<number, number> = {}
      await Promise.all(
        statusRowsForSummary.map(async (s) => {
          let q = supabase
            .from('Request')
            .select('*', { count: 'exact', head: true })
            .eq('status_id', s.id)
          if (scopeMine && user) q = q.eq('booked_by', user.id)
          if (scopeMine && profile?.client_id != null) {
            q = q.eq('client_id', profile.client_id)
          }
          const { count } = await q
          map[s.id] = count ?? 0
        }),
      )
      setStatusCounts(map)
    } catch (e) {
      console.error('Status counts:', e)
      setStatusCounts({})
    } finally {
      setCountsLoading(false)
    }
  }, [statusRowsForSummary, user, scopeMine, profile?.client_id])

  useEffect(() => {
    void loadStatusCounts()
  }, [loadStatusCounts])

  useEffect(() => {
    if (isFirstFilterEffect.current) {
      isFirstFilterEffect.current = false
      return
    }
    setPage(0)
  }, [filterKey])

  useEffect(() => {
    setPage(0)
  }, [scopeMine, mobileView])

  const grandTotal = useMemo(
    () => Object.values(statusCounts).reduce((a, b) => a + b, 0),
    [statusCounts],
  )

  /** Same card feed as mobile — desktop shows these cards instead of the old table. */
  const listBlock = (
    <>
      <div className="space-y-3.5">
        {loading ? (
          <p className="rounded-2xl border border-[#e2e6ec]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            กำลังโหลด…
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl border border-[#e2e6ec]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            ไม่พบรายการ
          </p>
        ) : (
          requests.map((r) => <RequestFeedCard key={r.id} r={r} />)
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-[#e2e6ec] pt-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span className="text-sm text-[#6b7280]">หน้า {page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </div>
      )}
    </>
  )

  const mobileLatest = (
    <div className="space-y-3 px-4 pb-4 pt-2">
      <div className="sticky top-0 z-10 -mx-4 border-b border-[#e2e6ec]/70 bg-gradient-to-b from-[#f5f6f8]/95 to-white/90 px-4 pb-3 pt-2 backdrop-blur-md">
        <div className="flex items-start gap-2">
          <Link
            to="/requests"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2e6ec] bg-white text-[#6b7280] shadow-sm shadow-black/[0.04] transition hover:border-[#2563eb]/35 hover:bg-[rgba(37,99,235,0.06)] hover:text-[#2563eb] active:scale-95"
            aria-label="กลับไปหน้าคำขอ"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-[#111827]">
              {scopeMine ? 'รายการของฉัน' : 'รายการจอง'}
            </h1>
            <p className="text-xs text-[#6b7280]">{loading ? 'กำลังโหลด…' : `${total} รายการ`}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <p className="rounded-2xl border border-[#e2e6ec]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            กำลังโหลด…
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl border border-[#e2e6ec]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            ไม่พบรายการ
          </p>
        ) : (
          requests.map((r) => <RequestFeedCard key={r.id} r={r} />)
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 border-t border-[#e2e6ec] pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span className="text-sm text-[#6b7280]">หน้า {page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </div>
      )}
    </div>
  )

  const mobileSummary = (
    <div className="flex flex-col px-4 pb-6 pt-3 md:mx-auto md:max-w-2xl md:px-6 md:pb-10 md:pt-6">
      <Link
        to="/requests/new"
        className="inline-flex w-fit max-w-full items-center gap-2 py-1 text-sm font-semibold text-[#2563eb] transition hover:text-[#1d4ed8] active:opacity-75"
      >
        <Plus className="h-5 w-5 shrink-0" strokeWidth={2} />
        เพิ่มรายการจองคอนกรีต
      </Link>
      <div className="mt-4 space-y-2.5">
        {!masterLoaded ? (
          <p className="rounded-xl border border-[#e2e6ec]/70 bg-white/80 py-8 text-center text-sm text-[#6b7280]">
            กำลังโหลดสถานะ…
          </p>
        ) : statusRowsForSummary.length === 0 ? (
          <p className="rounded-xl border border-[#e2e6ec]/70 bg-white/80 py-8 text-center text-sm text-[#6b7280]">
            ไม่พบข้อมูลสถานะในระบบ
          </p>
        ) : (
          statusRowsForSummary.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setFilter({ ...filter, status_ids: [s.id] })
              setPage(0)
              setSearchParams({ view: 'latest' })
            }}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e2e6ec] bg-white px-4 py-3.5 text-left text-sm font-medium text-[#374151] shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-[#f5f6f8] transition hover:border-[#2563eb]/40 hover:shadow-[0_4px_14px_rgba(37,99,235,0.12)] active:scale-[0.995]"
          >
            <span className="min-w-0 flex-1">{s.status_name}</span>
            <span className="shrink-0 rounded-full bg-[rgba(37,99,235,0.08)] px-2.5 py-1 text-sm font-pour-mono tabular-nums font-semibold text-[#1d4ed8] shadow-inner ring-1 ring-[rgba(37,99,235,0.15)]">
              {countsLoading ? '—' : (statusCounts[s.id] ?? 0)}
            </span>
          </button>
        ))
        )}
      </div>
      <p className="mx-auto mt-6 max-w-fit rounded-full border border-[#e2e6ec] bg-white/80 px-5 py-2 text-center text-xs font-medium text-[#6b7280] shadow-sm shadow-black/[0.04] ring-1 ring-white/80 backdrop-blur-sm">
        — รายการทั้งหมด {countsLoading ? '—' : grandTotal} รายการ —
      </p>
    </div>
  )

  return (
    <>
      {mobileView === 'summary' ? (
        mobileSummary
      ) : (
        <>
          <div className="md:hidden">{mobileLatest}</div>

          <div className="hidden md:block space-y-0 md:space-y-4">
            <div className="border-b border-[#e2e6ec] bg-white px-4 py-3 md:border-0 md:bg-transparent md:px-0 md:py-0">
              <h1 className={cn(rq.heroTitle, 'md:text-xl')}>{scopeMine ? 'รายการของฉัน' : 'รายการคำขอ'}</h1>
              <p className={cn('mt-0.5', rq.sub)}>
                {total} รายการ · เลือกสถานะได้จากไอคอน <span className="font-medium text-[#374151]">ตัวกรอง</span> ในแถบด้านบน
              </p>
            </div>

            <div id="request-filters">{listBlock}</div>
          </div>
        </>
      )}
    </>
  )
}
