import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { formatDate, formatDateTime, formatTime, cn } from '@/lib/utils'
import { collectRequestIdsMatchingSearch } from '@/lib/requestListSearch'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import {
  REQUEST_LIST_SEARCH_ARIA,
  REQUEST_LIST_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { getRequestListQuickActions } from '@/lib/requestQuickActions'
import { RequestActionBar } from '@/components/requests/RequestActionBar'
import {
  Plus,
  Building2, MapPin, Droplets, Ruler, FileText, Layers, GitBranch, Beaker, Calendar,
} from 'lucide-react'
import type { RequestWithRelations } from '@/types/app.types'
import { StaggerItem } from '@/components/motion/StaggerItem'
import { StatusSummaryCard } from '@/components/requests/StatusSummaryCard'
import { rq, theme, icon, ICON_STROKE, type, anim } from '@/lib/requestUi'

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
    <div className={cn('flex gap-2.5', type.detail)}>
      <Icon className={cn(icon.sm, 'mt-0.5 text-pour-subtle')} strokeWidth={ICON_STROKE} />
      <div className="min-w-0 flex-1">
        <span className={type.caption}>{label}</span>
        <span className={cn('ml-1.5', type.bodyStrong)}>{value}</span>
      </div>
    </div>
  )
}

function RequestFeedCard({ r }: { r: RequestWithRelations }) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const rawThumb = r.after_image?.trim() || r.before_image?.trim() || null
  const thumbUrl = imageSrcForImgTag(rawThumb, 'card')
  useEffect(() => {
    setThumbFailed(false)
  }, [r.id, thumbUrl])
  const navigate = useNavigate()
  const { user, role } = useAuthStore()
  const quickActions = getRequestListQuickActions({
    requestId: r.id,
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
  const booker = r.booked_by_profile as { fname: string | null; lname: string | null; employee_id?: string | null } | null | undefined
  const bookerName = booker ? [booker.fname, booker.lname].filter(Boolean).join(' ') : null
  const bookerEmp = booker?.employee_id?.trim() || null
  const bookerDisplay = [bookerName || null, bookerEmp].filter(Boolean).join(' · ') || 'ไม่ระบุ'
  const isMyBooking = Boolean(user?.id && r.booked_by === user.id)

  const volumeParts = [
    r.volume_request != null ? `Request vol. ${r.volume_request} cu.m` : null,
    r.volume_dwg != null ? `DWG ${r.volume_dwg} cu.m` : null,
    r.volume_actual != null ? `Actual ${r.volume_actual} cu.m` : null,
  ].filter(Boolean)
  const volumeLine = volumeParts.length > 0 ? volumeParts.join(' · ') : null

  const castingLine = [formatDate(r.casting_date), formatTime(r.request_time)].filter((x) => x && x !== '-').join(' ')

  return (
    <>
      <div className={cn(rq.card, 'transition hover:border-[color:var(--glass-edge)] hover:shadow-[var(--glass-shadow-sm)]')}>
        <div className="flex gap-3 px-4 pt-4 pb-2 md:gap-3 md:px-5 md:pt-5 md:pb-3">
          {thumbUrl && !thumbFailed ? (
            <button
              type="button"
              className="shrink-0 cursor-zoom-in rounded-full pt-px text-left outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/45 md:pt-0.5"
              aria-label="ขยายรูป"
              onClick={() => {
                const src = imageSrcForImgTag(rawThumb, 'lightbox')
                if (src) setLightboxSrc(src)
              }}
            >
              <div className="rounded-full bg-gradient-to-tr from-neutral-400 via-neutral-600 to-neutral-900 p-[1.5px] shadow-sm md:p-[2px]">
                <div className="rounded-full bg-white p-[1.5px] md:p-[2px]">
                  <img
                    src={thumbUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={() => setThumbFailed(true)}
                    className="h-9 w-9 rounded-full object-cover md:h-11 md:w-11"
                  />
                </div>
              </div>
            </button>
          ) : null}
          <Link
            to={`/requests/${r.id}`}
            className="flex min-w-0 flex-1 gap-2.5 rounded-md outline-none active:scale-[0.998]"
          >
            {(!thumbUrl || thumbFailed) && (
              <div className="shrink-0 pt-px md:pt-0.5">
                <div className="rounded-full bg-gradient-to-tr from-neutral-400 via-neutral-600 to-neutral-900 p-[1.5px] shadow-sm md:p-[2px]">
                  <div className="rounded-full bg-white p-[1.5px] md:p-[2px]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f0f2f5] to-[#e8ebf0] text-sm font-bold text-[#374151] md:h-11 md:w-11 md:text-base">
                      {initial}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn(type.bodyStrong, 'leading-tight')}>
                    {structure}
                    {r.structure_no ? <span className={cn(type.caption, 'font-normal')}> · {r.structure_no}</span> : null}
                  </p>
                  {r.booked_at ? (
                    <p className={cn('mt-0.5 md:mt-1', type.caption)}>{formatDateTime(r.booked_at)}</p>
                  ) : null}
                  <p className={cn('mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug', type.caption)}>
                    <span className={cn('shrink-0', type.caption)}>จองโดย</span>
                    <span className={cn('min-w-0', type.bodyStrong)}>{bookerDisplay}</span>
                    {isMyBooking ? (
                      <span className="shrink-0 rounded-md bg-[var(--pour-accent-muted)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--pour-accent-hover)]">
                        คุณ
                      </span>
                    ) : null}
                  </p>
                </div>
                <StatusBadge statusId={r.status_id} size="sm" compact className="shrink-0" />
              </div>
            </div>
          </Link>
        </div>

        <Link to={`/requests/${r.id}`} className="block active:scale-[0.998]">
          <div className="space-y-2 border-t border-[color:var(--glass-border)] bg-white/20 px-4 py-3 backdrop-blur-md md:space-y-2.5 md:px-5 md:py-4">
            <FeedDetailRow icon={Building2} label="Client" value={client} />
            <FeedDetailRow icon={MapPin} label="Location" value={locationLine} />
            <FeedDetailRow icon={Layers} label="งานคอนกรีต" value={concrete} />
            <FeedDetailRow icon={Calendar} label="วันเท / เวลา" value={castingLine || null} />
            <FeedDetailRow icon={Droplets} label="Mix" value={mixLine} />
            <FeedDetailRow icon={Ruler} label="Volume (cu.m)" value={volumeLine} />
            {r.sample_qty != null && (
              <FeedDetailRow icon={Beaker} label="ตัวอย่าง" value={`${r.sample_qty} ก้อน`} />
            )}
            <FeedDetailRow icon={FileText} label="ABC" value={abc} />
            <FeedDetailRow icon={GitBranch} label="WBS" value={wbs} />
            {r.remarks?.trim() ? (
              <div className={cn('rounded-lg bg-white px-3 py-2.5 leading-relaxed ring-1 ring-[color:var(--glass-border)] md:px-3.5 md:py-3', type.detail)}>
                <span className="text-pour-subtle">หมายเหตุ </span>
                {r.remarks}
              </div>
            ) : null}
            {r.status_id === 5 && (r.postpone_date || r.reason_postpone) ? (
              <div className={cn('rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 leading-relaxed text-amber-950', type.detail)}>
                {r.postpone_date ? <p>เลื่อนเป็น {formatDate(r.postpone_date)} {r.postpone_time ? formatTime(r.postpone_time) : ''}</p> : null}
                {r.reason_postpone ? <p className="mt-0.5 text-amber-900/90">{r.reason_postpone}</p> : null}
              </div>
            ) : null}
          </div>
        </Link>

      {quickActions.length > 0 ? (
        <RequestActionBar
          layout="strip"
          items={quickActions}
          onItemClick={(a, e) => {
            e.preventDefault()
            e.stopPropagation()
            if ('cloneFromRequestId' in a) {
              navigate('/requests/new', { state: { cloneFromRequestId: a.cloneFromRequestId } })
            } else {
              navigate(`/requests/${r.id}`, { state: { initialModal: a.modal } })
            }
          }}
        />
      ) : null}
    </div>

      <Dialog open={lightboxSrc != null} onOpenChange={(open) => { if (!open) setLightboxSrc(null) }}>
        <DialogContent
          className={cn(
            'flex h-[calc(100dvh-10px)] max-h-none w-[calc(100vw-10px)] max-w-none flex-col overflow-hidden gap-0 rounded-2xl border-0 bg-zinc-950/96 p-0 shadow-none sm:h-[calc(100dvh-16px)] sm:w-[calc(100vw-16px)]',
            'pt-12 pb-[max(10px,env(safe-area-inset-bottom,0px))] pl-[max(6px,env(safe-area-inset-left,0px))] pr-[max(6px,env(safe-area-inset-right,0px))]',
            '[&>button]:right-3 [&>button]:top-3 [&>button]:text-white [&>button]:opacity-95 [&>button]:hover:bg-white/12 [&>button]:hover:opacity-100 [&>button]:focus-visible:ring-white/45',
          )}
        >
          <DialogTitle className="sr-only">รูปภาพรายการ</DialogTitle>
          <div className="flex min-h-0 flex-1 items-center justify-center px-1 sm:px-2">
            {lightboxSrc ? (
              <img
                src={lightboxSrc}
                alt=""
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain object-center"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function RequestListPage() {
  const { user, profile } = useAuthStore()
  const { filter, setFilter, setMobileRequestListChrome } = useFilterStore()
  const filterKey = JSON.stringify(filter)
  const isFirstFilterEffect = useRef(true)
  const { statuses, isLoaded: masterLoaded } = useMasterDataStore()
  const [searchParams, setSearchParams] = useSearchParams()
  /** ค่าเริ่มต้นของแอป = สถานะ (summary) — ถ้าไม่มี ?view= จะถูก normalize เป็น summary */
  const mobileView = searchParams.get('view') === 'summary' ? 'summary' : 'latest'
  const scopeMine = searchParams.get('scope') === 'mine'

  const viewParam = searchParams.get('view')
  useEffect(() => {
    if (viewParam === 'summary' || viewParam === 'latest') return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', 'summary')
        return next
      },
      { replace: true },
    )
  }, [viewParam, setSearchParams])

  const [requests, setRequests] = useState<RequestWithRelations[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusCounts, setStatusCounts] = useState<Record<number, number>>({})
  const [countsLoading, setCountsLoading] = useState(true)

  /** PostgREST cannot OR across FK tables in one clause; merged-ID search is debounced to avoid request storms. */
  const [debouncedSearch, setDebouncedSearch] = useState(() => filter.search)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(filter.search), 280)
    return () => window.clearTimeout(t)
  }, [filter.search])

  useDesktopSearchRegistration({
    placeholder: REQUEST_LIST_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_LIST_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const fetchRequests = useCallback(async (opts?: { background?: boolean }) => {
    if (!opts?.background) setLoading(true)
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

      const searchIds = await collectRequestIdsMatchingSearch(supabase, debouncedSearch)
      if (searchIds !== null && searchIds.length === 0) {
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
        booked_by_profile:profiles!booked_by(fname, lname, employee_id)
      `, { count: 'exact' })

      if (scopeMine && user) query = query.eq('booked_by', user.id)
      if (scopeMine && profile?.client_id != null) {
        query = query.eq('client_id', profile.client_id)
      }

      if (filter.status_ids.length > 0) query = query.in('status_id', filter.status_ids)
      if (filter.casting_date_from) query = query.gte('casting_date', filter.casting_date_from)
      if (filter.casting_date_to) query = query.lte('casting_date', filter.casting_date_to)
      if (searchIds !== null) query = query.in('id', searchIds)

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
  }, [user, profile?.client_id, filter, debouncedSearch, page, scopeMine])

  useEffect(() => { void fetchRequests() }, [fetchRequests])

  const statusRowsForSummary = useMemo(
    () => [...statuses].sort((a, b) => a.id - b.id),
    [statuses],
  )

  const loadStatusCounts = useCallback(async (opts?: { background?: boolean }) => {
    if (!statusRowsForSummary.length) {
      setCountsLoading(false)
      return
    }
    if (!opts?.background) setCountsLoading(true)
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

  const refreshPage = useCallback(async () => {
    await Promise.all([
      fetchRequests({ background: true }),
      loadStatusCounts({ background: true }),
    ])
  }, [fetchRequests, loadStatusCounts])

  usePullToRefreshRegistration(refreshPage)

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

  useEffect(() => {
    if (mobileView !== 'latest') {
      setMobileRequestListChrome(null)
      return
    }
    setMobileRequestListChrome({
      title: scopeMine ? 'รายการของฉัน' : 'รายการจอง',
      subtitle: loading ? 'กำลังโหลด…' : `${total} รายการ`,
    })
    return () => setMobileRequestListChrome(null)
  }, [mobileView, scopeMine, loading, total, setMobileRequestListChrome])

  const grandTotal = useMemo(
    () => Object.values(statusCounts).reduce((a, b) => a + b, 0),
    [statusCounts],
  )

  /** Same card feed as mobile — desktop shows these cards instead of the old table. */
  const listBlock = (
    <>
      <div className="space-y-3.5">
        {loading ? (
          <p className="rounded-2xl border border-[#ccf0ed]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            กำลังโหลด…
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl border border-[#ccf0ed]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            ไม่พบรายการ
          </p>
        ) : (
          requests.map((r, i) => (
            <StaggerItem key={r.id} index={i}>
              <RequestFeedCard r={r} />
            </StaggerItem>
          ))
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-center gap-2 border-t border-[#ccf0ed] pt-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span className="text-sm text-[#6b7280]">หน้า {page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </div>
      )}
    </>
  )

  const mobileLatest = (
    <div className={theme.mobileListBody}>
      <div className="space-y-3.5">
        {loading ? (
          <p className="rounded-2xl border border-[#ccf0ed]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            กำลังโหลด…
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl border border-[#ccf0ed]/70 bg-white/90 py-16 text-center text-sm text-[#6b7280] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            ไม่พบรายการ
          </p>
        ) : (
          requests.map((r, i) => (
            <StaggerItem key={r.id} index={i}>
              <RequestFeedCard r={r} />
            </StaggerItem>
          ))
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 border-t border-[#ccf0ed] pt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
          <span className="text-sm text-[#6b7280]">หน้า {page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button>
        </div>
      )}
    </div>
  )

  const mobileSummary = (
    <div className={cn(rq.page, 'flex flex-col md:mx-auto md:max-w-2xl')}>
      <Link
        to="/requests/new"
        className={cn('pour-interactive inline-flex w-fit max-w-full items-center gap-2 py-1 text-[color:var(--pour-accent)] hover:text-[color:var(--pour-accent-hover)]', type.bodyStrong, anim.fadeIn)}
      >
        <Plus className={icon.md} strokeWidth={ICON_STROKE} />
        เพิ่มรายการจองคอนกรีต
      </Link>
      <div className="mt-4 space-y-2.5">
        {!masterLoaded ? (
          <p className={cn(rq.cardMuted, 'py-8 text-center text-sm', rq.sub)}>กำลังโหลดสถานะ…</p>
        ) : statusRowsForSummary.length === 0 ? (
          <p className={cn(rq.cardMuted, 'py-8 text-center text-sm', rq.sub)}>ไม่พบข้อมูลสถานะในระบบ</p>
        ) : (
          statusRowsForSummary.map((s, i) => (
            <StaggerItem key={s.id} index={i}>
              <StatusSummaryCard
                statusId={s.id}
                statusName={s.status_name}
                count={countsLoading ? '—' : (statusCounts[s.id] ?? 0)}
                onClick={() => {
                  setFilter({ ...filter, status_ids: [s.id] })
                  setPage(0)
                  setSearchParams({ view: 'latest' })
                }}
              />
            </StaggerItem>
          ))
        )}
      </div>
      <p className={cn('mx-auto mt-6 max-w-fit rounded-full px-5 py-2 text-center text-xs font-medium', rq.cardMuted, rq.sub, anim.fadeIn)}>
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
            <div className="border-b border-[#ccf0ed] bg-white px-4 py-3 md:border-0 md:bg-transparent md:px-0 md:py-0">
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
