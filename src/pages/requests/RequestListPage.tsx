import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { flushOfflineMutationQueue } from '@/lib/offline/flush'
import {
  buildListCacheKey,
  cacheRequestRows,
  countCachedByStatus,
  filterCachedRequests,
  getAllCachedRequests,
  getListSnapshot,
  saveListSnapshot,
} from '@/lib/offline/cache'
import { isFullyOnline } from '@/stores/connectivityStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { REQUEST_LIST_SELECT } from '@/lib/requestQueries'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useMasterDataStore } from '@/stores/masterDataStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { usePullToRefreshRegistration } from '@/hooks/usePullToRefreshRegistration'
import { useRequestListScrollRestore } from '@/hooks/useRequestListScrollRestore'
import { usePourDesktop } from '@/lib/pourLayout'
import { afterPageTransition } from '@/stores/pageTransitionStore'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ImageLightboxDialog } from '@/components/shared/ImageLightboxDialog'
import { formatDate, formatDateTime, formatTime, cn, formatVolumeNumber } from '@/lib/utils'
import { collectRequestIdsMatchingSearch } from '@/lib/requestListSearch'
import { REQUEST_LIST_INVALIDATED_EVENT } from '@/lib/requestListInvalidate'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import {
  REQUEST_LIST_SEARCH_ARIA,
  REQUEST_LIST_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import type { InspectorBookerScope } from '@/lib/inspectorScope'
import { useInspectorBookerScope } from '@/hooks/useInspectorBookerScope'
import { useJobScope } from '@/hooks/useJobScope'
import { applyScopeToQuery } from '@/lib/jobScopeQueries'
import { canBookConcrete } from '@/lib/permissions'
import { getRequestListQuickActions, type RequestListActionItem } from '@/lib/requestQuickActions'
import { localPrintChecklist, warmChecklistTemplateCache } from '@/lib/checklistPrint'
import { copyRequestOrderLoadToClipboard } from '@/lib/requestOrderClipboard'
import { toast } from 'sonner'
import { RequestActionBar } from '@/components/requests/RequestActionBar'
import { RequestWorkflowModals } from '@/components/requests/RequestWorkflowModals'
import type { SvgIconComponent } from '@mui/icons-material'
import Business from '@mui/icons-material/Business'
import Place from '@mui/icons-material/Place'
import WaterDrop from '@mui/icons-material/WaterDrop'
import Straighten from '@mui/icons-material/Straighten'
import Description from '@mui/icons-material/Description'
import Layers from '@mui/icons-material/Layers'
import AccountTree from '@mui/icons-material/AccountTree'
import Science from '@mui/icons-material/Science'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import AccountBalance from '@mui/icons-material/AccountBalance'
import Tag from '@mui/icons-material/Tag'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { AppIcon } from '@/components/icons/AppIcon'
import type { RequestWithRelations } from '@/types/app.types'
import { StaggerItem } from '@/components/motion/StaggerItem'
import { StatusSummaryCard } from '@/components/requests/StatusSummaryCard'
import { RequestBookingCalendar } from '@/components/requests/RequestBookingCalendar'
import { RequestListPageHeader, RequestListTabs } from '@/components/requests/RequestListChrome'
import { NonSystemBookingBadge } from '@/components/requests/NonSystemBookingBadge'
import { JobScopeBadge } from '@/components/shared/JobScopeBadge'
import { isNonSystemBookingRequest } from '@/lib/nonSystemBooking'
import { rq, theme, type, anim } from '@/lib/requestUi'

const LIST_LAYOUT_KEY = 'cw-request-list-layout'

function readListLayout(): 'grid' | 'list' {
  try {
    return localStorage.getItem(LIST_LAYOUT_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

const listEmptyClass = cn(
  'rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass-bg)] py-16 text-center text-sm text-[color:var(--pour-ink-3)]',
)

const PAGE_SIZE = 20

type RequestFeedSection = {
  dateKey: string
  heading: string
  items: RequestWithRelations[]
  staggerStart: number
}

/** คีย์ yyyy-mm-dd สำหรับจัดกลุ่มตามวันเท */
function castingDateKey(r: RequestWithRelations): string | null {
  const raw = r.casting_date?.trim()
  if (!raw) return null
  return raw.length >= 10 ? raw.slice(0, 10) : raw
}

/** วันเทใหม่สุดก่อน ภายในวันเดียวกันเรียงตามเวลาที่จอง (booked_at) จากเก่าไปใหม่ */
function compareRequestsForGroupedFeed(a: RequestWithRelations, b: RequestWithRelations): number {
  const ka = castingDateKey(a)
  const kb = castingDateKey(b)
  if (ka !== kb) {
    if (!ka && !kb) return (a.booked_at ?? '').localeCompare(b.booked_at ?? '')
    if (!ka) return 1
    if (!kb) return -1
    return kb.localeCompare(ka)
  }
  return (a.booked_at ?? '').localeCompare(b.booked_at ?? '')
}

function buildGroupedRequestSections(requests: RequestWithRelations[]): RequestFeedSection[] {
  const sorted = [...requests].sort(compareRequestsForGroupedFeed)
  const chunks: Omit<RequestFeedSection, 'staggerStart'>[] = []
  for (const r of sorted) {
    const dk = castingDateKey(r) ?? '__none'
    const heading = dk === '__none' ? 'ไม่ระบุวันเท' : `วันเท ${formatDate(`${dk}T12:00:00`)}`
    const last = chunks[chunks.length - 1]
    if (!last || last.dateKey !== dk) {
      chunks.push({ dateKey: dk, heading, items: [r] })
    } else {
      last.items.push(r)
    }
  }
  let start = 0
  return chunks.map((s) => {
    const row: RequestFeedSection = { ...s, staggerStart: start }
    start += s.items.length
    return row
  })
}

function RequestGroupedFeedBody({
  sections,
  onRequestUpdated,
  layoutMode = 'list',
  bookerScope,
}: {
  sections: RequestFeedSection[]
  onRequestUpdated?: () => void
  layoutMode?: 'grid' | 'list'
  bookerScope: InspectorBookerScope
}) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (sections.length === 0) return
    const valid = new Set(sections.map((s) => s.dateKey))
    const firstKey = sections[0].dateKey
    setOpenMap((prev) => {
      const next: Record<string, boolean> = { ...prev }
      for (const k of Object.keys(next)) {
        if (!valid.has(k)) delete next[k]
      }
      for (const s of sections) {
        if (next[s.dateKey] === undefined) {
          next[s.dateKey] = s.dateKey === firstKey
        }
      }
      return next
    })
  }, [sections])

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isOpen = openMap[section.dateKey] ?? false
        const headingId = `feed-section-h-${section.dateKey}`
        const panelId = `feed-section-p-${section.dateKey}`
        return (
          <section
            key={section.dateKey}
            className="overflow-hidden rounded-xl border border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)]"
            aria-label={section.heading}
          >
            <button
              type="button"
              id={headingId}
              className={cn(
                'pour-interactive flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--pour-nav-hover-bg)]',
              )}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() =>
                setOpenMap((m) => ({
                  ...m,
                  [section.dateKey]: !isOpen,
                }))
              }
            >
              <AppIcon
                icon={ExpandMore}
                size="sm"
                className={cn(
                  'text-pour-subtle transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
              <span className={cn('min-w-0 flex-1 font-semibold leading-snug text-[color:var(--pour-ink-0)]')}>
                {section.heading}
              </span>
              <span className={cn('shrink-0 tabular-nums text-xs font-medium text-pour-muted')}>
                {section.items.length} รายการ
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                className="border-t border-[color:var(--glass-border-subtle)] px-3 pb-3 pt-3 sm:px-4"
              >
                <div
                  className={cn(
                    layoutMode === 'grid'
                      ? 'space-y-3.5 pour-desktop:grid pour-desktop:grid-cols-2 pour-desktop:gap-3 pour-wide:grid-cols-3'
                      : 'space-y-3.5',
                  )}
                >
                  {section.items.map((r, i) => (
                    <StaggerItem key={r.id} index={section.staggerStart + i}>
                      <RequestFeedCard
                        r={r}
                        variant={layoutMode}
                        onRequestUpdated={onRequestUpdated}
                        bookerScope={bookerScope}
                      />
                    </StaggerItem>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

function FeedDetailRow({
  icon: IconComp,
  label,
  value,
}: {
  icon: SvgIconComponent
  label: string
  value: ReactNode
}) {
  if (value == null || value === '' || value === '-') return null
  return (
    <div className={cn('flex gap-2.5', type.detail)}>
      <AppIcon icon={IconComp} size="sm" className="mt-0.5 text-pour-subtle" />
      <div className="min-w-0 flex-1">
        <span className={type.caption}>{label}</span>
        <span className={cn('ml-1.5', type.bodyStrong)}>{value}</span>
      </div>
    </div>
  )
}

function handleFeedQuickAction(
  a: RequestListActionItem,
  r: RequestWithRelations,
  navigate: ReturnType<typeof useNavigate>,
  setWorkflowModal: (modal: string | null) => void,
) {
  if ('cloneFromRequestId' in a) {
    navigate('/requests/new', { state: { cloneFromRequestId: a.cloneFromRequestId } })
    return
  }
  if ('printChecklist' in a) {
    try {
      localPrintChecklist(r)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'พิมพ์ Checklist ไม่สำเร็จ')
    }
    return
  }
  if ('copyOrderLoad' in a) {
    void copyRequestOrderLoadToClipboard(r)
      .then(() => toast.success('คัดลอกรายการแล้ว'))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'คัดลอกไม่สำเร็จ'))
    return
  }
  setWorkflowModal(a.modal)
}

function RequestFeedCard({
  r,
  variant = 'list',
  onRequestUpdated,
  bookerScope,
}: {
  r: RequestWithRelations
  variant?: 'grid' | 'list'
  onRequestUpdated?: () => void
  bookerScope: InspectorBookerScope
}) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [workflowModal, setWorkflowModal] = useState<string | null>(null)
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
    beforeImage: r.before_image,
    eslipUrl: r.eslip_url,
    bookerScope,
  })

  const structureNameRaw = (r.structure as { structure_name: string } | null)?.structure_name?.trim() ?? ''
  const structure = structureNameRaw || '-'
  const structureDetailName = structureNameRaw || null
  const structureNoDetail = r.structure_no?.trim() || null
  const initial = (structureNameRaw || structureNoDetail || '?').slice(0, 1).toUpperCase()
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
  const nonSystemBooking = isNonSystemBookingRequest(r)

  const volumeFeed =
    r.volume_confirm != null
      ? { label: 'Confirm volume (cu.m)', value: `${formatVolumeNumber(r.volume_confirm)} cu.m` }
      : r.volume_actual != null
        ? { label: 'Actual volume (cu.m)', value: `${formatVolumeNumber(r.volume_actual)} cu.m` }
        : r.volume_request != null
          ? { label: 'Request volume (cu.m)', value: `${formatVolumeNumber(r.volume_request)} cu.m` }
          : null

  const castingLine = [formatDate(r.casting_date), formatTime(r.request_time)].filter((x) => x && x !== '-').join(' ')
  const metaLine = client ?? locationLine ?? mixLine ?? concrete ?? '—'
  const editedLine = castingLine || (r.booked_at ? formatDateTime(r.booked_at) : '—')

  if (variant === 'grid') {
    return (
      <>
        <div className={cn(rq.card, 'flex flex-col overflow-hidden p-0', anim.cardLift)}>
          <Link to={`/requests/${r.id}`} className="pour-interactive block outline-none">
            <div className="pour-file-card-preview relative flex items-center justify-center overflow-hidden">
              {thumbUrl && !thumbFailed ? (
                <img
                  src={thumbUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={() => setThumbFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-white/85">{initial}</span>
              )}
              <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
                <StatusBadge statusId={r.status_id} size="sm" compact className="shrink-0 shadow-sm" />
                <JobScopeBadge jobId={r.job_id} />
                {nonSystemBooking ? <NonSystemBookingBadge /> : null}
              </div>
            </div>
            <div className="pour-file-card-footer px-3.5 py-3">
              <p className={cn(type.bodyStrong, 'truncate leading-tight')}>
                {structure}
                {structureNoDetail ? (
                  <span className={cn(type.caption, 'font-normal')}> · {structureNoDetail}</span>
                ) : null}
              </p>
              <p className={cn('mt-1 truncate', type.caption)}>{metaLine}</p>
              {nonSystemBooking ? (
                <p className="mt-1.5">
                  <NonSystemBookingBadge />
                </p>
              ) : null}
              <p className={cn('mt-1.5 text-[color:var(--pour-ink-3)]', type.caption)}>แก้ไขล่าสุด · {editedLine}</p>
            </div>
          </Link>
          {quickActions.length > 0 ? (
            <RequestActionBar
              layout="strip"
              items={quickActions}
              onItemClick={(a, e) => {
                e.stopPropagation()
                handleFeedQuickAction(a, r, navigate, setWorkflowModal)
              }}
            />
          ) : null}
        </div>
        <RequestWorkflowModals
          request={r}
          modal={workflowModal}
          onClose={() => setWorkflowModal(null)}
          onCompleted={() => {
            void onRequestUpdated?.()
          }}
        />
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          rq.card,
          'transition hover:border-[color:var(--glass-edge)] hover:shadow-[var(--glass-shadow-sm)]',
        )}
      >
        <div className="flex gap-3 px-4 pt-4 pb-2 pour-desktop:gap-3 pour-desktop:px-5 pour-desktop:pt-5 pour-desktop:pb-3">
          {thumbUrl && !thumbFailed ? (
            <button
              type="button"
              className="shrink-0 cursor-zoom-in rounded-full pt-px text-left outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/45 pour-desktop:pt-0.5"
              aria-label="ขยายรูป"
              onClick={() => {
                const src = imageSrcForImgTag(rawThumb, 'lightbox')
                if (src) setLightboxSrc(src)
              }}
            >
              <div className="rounded-full bg-gradient-to-tr from-neutral-400 via-neutral-600 to-neutral-900 p-[1.5px] shadow-sm pour-desktop:p-[2px]">
                <div className="rounded-full bg-[color:var(--glass-bg-strong)] p-[1.5px] pour-desktop:p-[2px]">
                  <img
                    src={thumbUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={() => setThumbFailed(true)}
                    className="h-9 w-9 rounded-full object-cover pour-desktop:h-11 pour-desktop:w-11"
                  />
                </div>
              </div>
            </button>
          ) : null}
          <Link
            to={`/requests/${r.id}`}
            className="pour-interactive flex min-w-0 flex-1 gap-2.5 rounded-md outline-none"
          >
            {(!thumbUrl || thumbFailed) && (
              <div className="shrink-0 pt-px pour-desktop:pt-0.5">
                <div className="rounded-full bg-gradient-to-tr from-neutral-400 via-neutral-600 to-neutral-900 p-[1.5px] shadow-sm pour-desktop:p-[2px]">
                  <div className="rounded-full bg-[color:var(--glass-bg-strong)] p-[1.5px] pour-desktop:p-[2px]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#525252] to-[#262626] text-sm font-bold text-white pour-desktop:h-11 pour-desktop:w-11 pour-desktop:text-base">
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
                    {structureNoDetail ? (
                      <span className={cn(type.caption, 'font-normal')}> · {structureNoDetail}</span>
                    ) : null}
                  </p>
                  {r.booked_at ? (
                    <p className={cn('mt-0.5 pour-desktop:mt-1', type.caption)}>{formatDateTime(r.booked_at)}</p>
                  ) : null}
                  <p className={cn('mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug', type.caption)}>
                    <span className={cn('shrink-0', type.caption)}>{nonSystemBooking ? 'บันทึกโดย' : 'จองโดย'}</span>
                    <span className={cn('min-w-0', type.bodyStrong)}>{bookerDisplay}</span>
                    {nonSystemBooking ? <NonSystemBookingBadge /> : null}
                    {isMyBooking ? (
                      <span className="shrink-0 rounded-md bg-[var(--pour-accent-muted)] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--pour-accent-hover)]">
                        คุณ
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge statusId={r.status_id} size="sm" compact className="shrink-0" />
                  <JobScopeBadge jobId={r.job_id} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        <Link to={`/requests/${r.id}`} className="pour-interactive block">
          <div className="grid grid-cols-1 gap-y-2 border-t border-[color:var(--glass-border-subtle)] bg-[color:var(--glass-bg-muted)] px-4 py-3 pour-desktop:gap-y-2.5 pour-desktop:px-5 pour-desktop:py-4 pour-wide:grid-cols-2 pour-wide:gap-x-8 pour-wide:gap-y-3">
            <FeedDetailRow icon={Business} label="User Group" value={client} />
            <FeedDetailRow icon={Place} label="Location" value={locationLine} />
            <FeedDetailRow icon={Layers} label="งานคอนกรีต" value={concrete} />
            <FeedDetailRow icon={AccountBalance} label="Structure" value={structureDetailName} />
            <FeedDetailRow icon={Tag} label="Structure No." value={structureNoDetail} />
            <FeedDetailRow icon={CalendarMonth} label="วันเท / เวลา" value={castingLine || null} />
            <FeedDetailRow icon={WaterDrop} label="Mix Code" value={mixLine} />
            {volumeFeed ? (
              <FeedDetailRow icon={Straighten} label={volumeFeed.label} value={volumeFeed.value} />
            ) : null}
            {r.sample_qty != null && (
              <FeedDetailRow icon={Science} label="ตัวอย่าง" value={`${r.sample_qty} ก้อน`} />
            )}
            <FeedDetailRow icon={Description} label="ABC" value={abc} />
            <FeedDetailRow icon={AccountTree} label="WBS" value={wbs} />
            {r.remarks?.trim() ? (
              <div className={cn('rounded-lg bg-[color:var(--pour-bg-2)] px-3 py-2.5 leading-relaxed ring-1 ring-[color:var(--glass-border)] pour-desktop:px-3.5 pour-desktop:py-3 pour-wide:col-span-2', type.detail)}>
                <span className="text-pour-subtle">หมายเหตุ </span>
                {r.remarks}
              </div>
            ) : null}
            {r.status_id === 5 && (r.postpone_date || r.reason_postpone) ? (
              <div className={cn('rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2.5 leading-relaxed text-amber-200 pour-wide:col-span-2', type.detail)}>
                {r.postpone_date ? <p>เลื่อนเป็น {formatDate(r.postpone_date)} {r.postpone_time ? formatTime(r.postpone_time) : ''}</p> : null}
                {r.reason_postpone ? <p className="mt-0.5 text-amber-300/90">{r.reason_postpone}</p> : null}
              </div>
            ) : null}
          </div>
        </Link>

      {quickActions.length > 0 ? (
        <RequestActionBar
          layout="strip"
          items={quickActions}
          onItemClick={(a, e) => {
            e.stopPropagation()
            handleFeedQuickAction(a, r, navigate, setWorkflowModal)
          }}
        />
      ) : null}
    </div>

      <RequestWorkflowModals
        request={r}
        modal={workflowModal}
        onClose={() => setWorkflowModal(null)}
        onCompleted={() => {
          void onRequestUpdated?.()
        }}
      />

      <ImageLightboxDialog
        open={lightboxSrc != null}
        onOpenChange={(open) => {
          if (!open) setLightboxSrc(null)
        }}
        src={lightboxSrc}
        title="รูปภาพรายการ"
      />
    </>
  )
}

export function RequestListPage() {
  const { user, profile, role } = useAuthStore()
  const { bookerScope } = useInspectorBookerScope()
  const { queryJobScope } = useJobScope()
  const location = useLocation()
  const isDesktop = usePourDesktop()
  const { filter, setFilter } = useFilterStore()
  const filterKey = JSON.stringify(filter)
  const isFirstFilterEffect = useRef(true)
  const skipReturnRefresh = useRef(true)
  const { statuses, isLoaded: masterLoaded } = useMasterDataStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const viewParam = searchParams.get('view')
  const mobileView =
    viewParam === 'summary' ? 'summary' : viewParam === 'calendar' ? 'calendar' : 'latest'
  const scopeMine = searchParams.get('scope') === 'mine'
  const [listLayout, setListLayout] = useState<'grid' | 'list'>(readListLayout)

  const persistListLayout = useCallback((mode: 'grid' | 'list') => {
    setListLayout(mode)
    try {
      localStorage.setItem(LIST_LAYOUT_KEY, mode)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    warmChecklistTemplateCache()
  }, [])

  useEffect(() => {
    if (viewParam === 'summary' || viewParam === 'latest' || viewParam === 'calendar') return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('view', 'summary')
        return next
      },
      { replace: true },
    )
  }, [viewParam, setSearchParams])

  useEffect(() => {
    const from = searchParams.get('casting_from')
    const to = searchParams.get('casting_to')
    if (!from && !to) return
    setFilter({
      casting_date_from: from,
      casting_date_to: to ?? from,
    })
  }, [searchParams, setFilter])

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

  const loadRequestsFromOfflineCache = useCallback(async (): Promise<boolean> => {
    const cacheKey = buildListCacheKey({
      scopeMine,
      userId: user?.id,
      jobScope: queryJobScope,
      filterKey,
      page,
      search: debouncedSearch,
    })
    const snap = await getListSnapshot(cacheKey)
    if (snap) {
      setRequests(snap.requests)
      setTotal(snap.total)
      useConnectivityStore.getState().setUsingOfflineCache(true)
      return true
    }
    const all = await getAllCachedRequests()
    const filtered = filterCachedRequests({
      requests: all,
      filter,
      search: debouncedSearch,
      scopeMine,
      userId: user?.id,
      jobScope: queryJobScope,
      page,
      pageSize: PAGE_SIZE,
    })
    if (all.length === 0) return false
    setRequests(filtered.requests)
    setTotal(filtered.total)
    useConnectivityStore.getState().setUsingOfflineCache(true)
    return true
  }, [scopeMine, user?.id, queryJobScope, filterKey, page, debouncedSearch, filter])

  const fetchRequests = useCallback(async (opts?: { background?: boolean }) => {
    if (!opts?.background) setLoading(true)
    try {
      if (!isSupabaseConfigured) {
        setRequests([])
        setTotal(0)
        useConnectivityStore.getState().setUsingOfflineCache(false)
        return
      }
      if (scopeMine && !user) {
        setRequests([])
        setTotal(0)
        useConnectivityStore.getState().setUsingOfflineCache(false)
        return
      }

      if (!isFullyOnline()) {
        const ok = await loadRequestsFromOfflineCache()
        if (!ok) {
          setRequests([])
          setTotal(0)
        }
        return
      }

      const searchIds = isFullyOnline()
        ? await collectRequestIdsMatchingSearch(supabase, debouncedSearch)
        : null
      if (searchIds !== null && searchIds.length === 0) {
        setRequests([])
        setTotal(0)
        useConnectivityStore.getState().setUsingOfflineCache(false)
        return
      }

      let query = applyScopeToQuery(
        supabase.from('Request').select(REQUEST_LIST_SELECT, { count: 'exact' }),
      )

      if (scopeMine && user) query = query.eq('booked_by', user.id)

      if (filter.status_ids.length > 0) query = query.in('status_id', filter.status_ids)
      if (filter.casting_date_from) query = query.gte('casting_date', filter.casting_date_from)
      if (filter.casting_date_to) query = query.lte('casting_date', filter.casting_date_to)
      if (searchIds !== null) query = query.in('id', searchIds)

      query = query
        .order('casting_date', { ascending: false, nullsFirst: false })
        .order('booked_at', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      const { data, count, error } = await query
      if (error) {
        console.error('Request list:', error.message)
        const ok = await loadRequestsFromOfflineCache()
        if (!ok) {
          setRequests([])
          setTotal(0)
        }
        return
      }
      const rows = (data ?? []) as RequestWithRelations[]
      setRequests(rows)
      setTotal(count ?? 0)
      useConnectivityStore.getState().setUsingOfflineCache(false)
      const cacheKey = buildListCacheKey({
        scopeMine,
        userId: user?.id,
        jobScope: queryJobScope,
        filterKey,
        page,
        search: debouncedSearch,
      })
      await cacheRequestRows(rows)
      await saveListSnapshot(cacheKey, rows, count ?? 0)
    } catch (e) {
      console.error('Request list fetch:', e)
      const ok = await loadRequestsFromOfflineCache()
      if (!ok) {
        setRequests([])
        setTotal(0)
      }
    } finally {
      setLoading(false)
    }
  }, [user, queryJobScope, filter, debouncedSearch, page, scopeMine, filterKey, loadRequestsFromOfflineCache])

  useEffect(() => {
    if (mobileView === 'calendar') return
    void fetchRequests()
  }, [fetchRequests, mobileView])

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
      if (!isFullyOnline()) {
        const all = await getAllCachedRequests()
        setStatusCounts(countCachedByStatus(all, scopeMine, user?.id, queryJobScope))
        return
      }
      const map: Record<number, number> = {}
      await Promise.all(
        statusRowsForSummary.map(async (s) => {
          let q = applyScopeToQuery(
            supabase.from('Request').select('*', { count: 'exact', head: true }).eq('status_id', s.id),
          )
          if (scopeMine && user) q = q.eq('booked_by', user.id)
          const { count } = await q
          map[s.id] = count ?? 0
        }),
      )
      setStatusCounts(map)
    } catch (e) {
      console.error('Status counts:', e)
      const all = await getAllCachedRequests()
      setStatusCounts(countCachedByStatus(all, scopeMine, user?.id, queryJobScope))
    } finally {
      setCountsLoading(false)
    }
  }, [statusRowsForSummary, user, scopeMine, queryJobScope])

  useEffect(() => {
    void loadStatusCounts()
  }, [loadStatusCounts])

  const refreshPage = useCallback(async () => {
    if (isFullyOnline()) await flushOfflineMutationQueue()
    await Promise.all([
      fetchRequests({ background: true }),
      loadStatusCounts({ background: true }),
    ])
  }, [fetchRequests, loadStatusCounts])

  usePullToRefreshRegistration(
    mobileView === 'calendar' ? async () => {} : refreshPage,
  )

  useEffect(() => {
    const onInvalidate = () => {
      void refreshPage()
    }
    window.addEventListener(REQUEST_LIST_INVALIDATED_EVENT, onInvalidate)
    return () => window.removeEventListener(REQUEST_LIST_INVALIDATED_EVENT, onInvalidate)
  }, [refreshPage])

  /** กลับจาก detail — รีเฟรชหลัง transition จบ เพื่อไม่ให้ list กระตุกระหว่าง slide */
  useEffect(() => {
    if (location.pathname !== '/requests') return
    if (skipReturnRefresh.current) {
      skipReturnRefresh.current = false
      return
    }
    const run = () => void refreshPage()
    if (isDesktop) {
      run()
      return
    }
    return afterPageTransition(run)
  }, [location.pathname, location.key, refreshPage, isDesktop])

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

  const feedSections = useMemo(() => buildGroupedRequestSections(requests), [requests])

  const listContentReady =
    mobileView === 'summary'
      ? !countsLoading && masterLoaded
      : mobileView === 'calendar'
        ? true
        : !loading
  useRequestListScrollRestore(listContentReady)

  const listTitle = scopeMine ? 'รายการของฉัน' : 'รายการคำขอ'
  const listSubtitle = loading ? 'กำลังโหลด…' : `${total} รายการ`

  const pagination = total > PAGE_SIZE ? (
    <div className="mt-4 flex items-center justify-center gap-2 border-t border-[color:var(--pour-line)] pt-4">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button>
      <span className={type.caption}>หน้า {page + 1} / {Math.ceil(total / PAGE_SIZE)}</span>
      <Button variant="outline" size="sm" disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>ถัดไป</Button>
    </div>
  ) : null

  const feedBody = loading ? (
    <p className={listEmptyClass}>กำลังโหลด…</p>
  ) : requests.length === 0 ? (
    <p className={listEmptyClass}>ไม่พบรายการ</p>
  ) : (
    <RequestGroupedFeedBody
      sections={feedSections}
      layoutMode={listLayout}
      onRequestUpdated={() => void refreshPage()}
      bookerScope={bookerScope}
    />
  )

  return (
    <div className={cn(rq.page, 'flex flex-col')}>
      <RequestListPageHeader
        title={
          mobileView === 'summary'
            ? 'สถานะการจอง'
            : mobileView === 'calendar'
              ? 'ปฏิทินจอง'
              : listTitle
        }
        subtitle={
          mobileView === 'summary'
            ? countsLoading
              ? 'กำลังโหลด…'
              : `รายการทั้งหมด ${grandTotal} รายการ`
            : mobileView === 'calendar'
              ? 'แตะวันเพื่อดูรายการ'
              : listSubtitle
        }
        showCreate={canBookConcrete(role)}
      />

      <div className="mt-5">
        <RequestListTabs
          layoutMode={mobileView === 'latest' ? listLayout : undefined}
          onLayoutModeChange={mobileView === 'latest' ? persistListLayout : undefined}
        />
      </div>

      {mobileView === 'calendar' ? (
        <div className="mt-6">
          <RequestBookingCalendar
            scopeMine={scopeMine}
            userId={user?.id}
            jobScope={queryJobScope}
          />
        </div>
      ) : mobileView === 'summary' ? (
        <div className="mt-6 grid w-full min-w-0 grid-cols-1 gap-3">
          {!masterLoaded ? (
            <p className={cn(rq.cardMuted, 'col-span-full py-8 text-center text-sm', rq.sub)}>กำลังโหลดสถานะ…</p>
          ) : statusRowsForSummary.length === 0 ? (
            <p className={cn(rq.cardMuted, 'col-span-full py-8 text-center text-sm', rq.sub)}>ไม่พบข้อมูลสถานะในระบบ</p>
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
      ) : (
        <div id="request-filters" className="mt-6 space-y-4">
          {feedBody}
          {pagination}
        </div>
      )}
    </div>
  )
}
