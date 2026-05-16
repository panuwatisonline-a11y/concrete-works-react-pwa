import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { toast } from 'sonner'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, formatTime, shortId, cn, formatVolumeCuM, formatPercentNumber } from '@/lib/utils'
import { dedupeRequestLogsForDisplay } from '@/lib/requestLogDisplay'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import { canPrintChecklistBeforePour, getRequestListQuickActions } from '@/lib/requestQuickActions'
import { localPrintChecklist } from '@/lib/checklistPrint'
import { RequestActionBar } from '@/components/requests/RequestActionBar'
import { RequestWorkflowModals } from '@/components/requests/RequestWorkflowModals'
import { rq } from '@/lib/requestUi'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { Edit, History } from 'lucide-react'
import type { RequestWithRelations, RequestLogWithProfile } from '@/types/app.types'

/** อายุตัวอย่าง (วัน) สำหรับ CST — ปุ่ม placeholder รอเชื่อมฟังก์ชัน */
const CST_PLACEHOLDER_DAYS = [1, 3, 7, 14, 28] as const

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role } = useAuthStore()
  const { filter, setFilter } = useFilterStore()
  const [request, setRequest] = useState<RequestWithRelations | null>(null)
  const [logs, setLogs] = useState<RequestLogWithProfile[]>([])
  const displayLogs = useMemo(() => dedupeRequestLogsForDisplay(logs), [logs])

  const filteredLogs = useMemo(() => {
    const q = filter.search.trim().toLowerCase()
    if (!q) return displayLogs
    return displayLogs.filter((log) => {
      const p = log.profile as { fname: string | null; lname: string | null } | null
      const name = p ? `${p.fname ?? ''} ${p.lname ?? ''}`.trim() : ''
      const blob = [log.action, log.note ?? '', name, formatDateTime(log.created_at)].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [displayLogs, filter.search])

  useDesktopSearchRegistration({
    placeholder: REQUEST_DETAIL_SEARCH_PLACEHOLDER,
    ariaLabel: REQUEST_DETAIL_SEARCH_ARIA,
    showRequestFilterButton: true,
    search: filter.search,
    onSearchChange: (v) => setFilter({ search: v }),
  })

  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<string | null>(null)
  const [imageLightbox, setImageLightbox] = useState<{ items: { src: string; label: string }[] } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const initialModalConsumedRef = useRef(false)

  useEffect(() => {
    initialModalConsumedRef.current = false
  }, [id])

  const loadData = useCallback(async (opts?: { background?: boolean }) => {
    if (!id) return
    if (!opts?.background) setLoading(true)
    setError(null)
    try {
      const [{ data: req, error: reqErr }, { data: logData, error: logErr }] = await Promise.all([
        supabase.from('Request').select(`
          *,
          status:Status(id, status_name),
          client:Client(id, client_name),
          location:Location(id, full_location),
          concrete_work:"Concrete Works"(id, concrete_work),
          structure:Structure(id, structure_name),
          mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type),
          abc_code:"ABC Code"(id, full_abc),
          wbs_code:"WBS Code"(id, full_wbs)
        `).eq('id', id).single(),
        supabase.from('Request_Log').select(`
          *,
          profile:profiles!action_by(fname, lname)
        `).eq('request_id', id).order('created_at', { ascending: false }),
      ])
      if (reqErr) throw reqErr
      if (logErr) throw logErr
      setRequest(req as RequestWithRelations)
      setLogs((logData ?? []) as RequestLogWithProfile[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void loadData() }, [loadData])

  usePullToRefreshOnLoad(() => loadData({ background: true }))

  const openPourImagesLightbox = useCallback(() => {
    if (!request) return
    const before = request.before_image?.trim()
    const after = request.after_image?.trim()
    const items: { src: string; label: string }[] = []
    if (before && after) {
      items.push(
        { src: imageSrcForImgTag(before, 'lightbox') ?? before, label: 'ก่อนเท' },
        { src: imageSrcForImgTag(after, 'lightbox') ?? after, label: 'หลังเท' },
      )
    } else if (before) {
      items.push({ src: imageSrcForImgTag(before, 'lightbox') ?? before, label: 'ก่อนเท' })
    } else if (after) {
      items.push({ src: imageSrcForImgTag(after, 'lightbox') ?? after, label: 'หลังเท' })
    }
    if (items.length) setImageLightbox({ items })
  }, [request])

  useEffect(() => {
    if (loading || !request || initialModalConsumedRef.current) return
    const m = (location.state as { initialModal?: string } | null)?.initialModal
    if (!m) return
    const allowed = ['inspect', 'approve', 'reject', 'cancel', 'confirmOrder', 'postpone', 'complete', 'reApprove', 'uploadBeforeOnly'] as const
    if (!allowed.includes(m as (typeof allowed)[number])) return
    initialModalConsumedRef.current = true
    setModal(m)
    navigate(`/requests/${id}`, { replace: true, state: {} })
  }, [loading, request, location.state, id, navigate])

  if (loading) {
    return (
      <div className={rq.page}>
        <div className="flex flex-col items-center justify-center py-20">
          <div className={rq.spinner} />
          <p className="mt-3 text-sm text-[#6b7280]">กำลังโหลด…</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className={rq.page}>
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-8 text-center text-sm text-rose-800">{error}</p>
      </div>
    )
  }
  if (!request) {
    return (
      <div className={rq.page}>
        <p className="py-16 text-center text-sm text-[#6b7280]">ไม่พบข้อมูล</p>
      </div>
    )
  }

  const sid = request.status_id
  const isOwner = request.booked_by === user?.id
  const canAct = role === 'admin' || role === 'manager'

  const mx = request.mixcode as { mixcode: string; strength: number | null; slump: string | null; strength_type: string | null } | null

  return (
    <div className={rq.page}>
      <RequestScreenHeader
        onBack={() => navigate(-1)}
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-pour-mono text-base font-bold tracking-tight text-[#374151] md:text-lg">{shortId(request.id)}</span>
            <StatusBadge statusId={sid} size="lg" />
          </span>
        }
        subtitle={<>วันเท {formatDate(request.casting_date)} · {formatTime(request.request_time)}</>}
        right={
          sid === 1 && isOwner ? (
            <Button variant="outline" size="action" asChild>
              <Link to={`/requests/${id}/edit`}>
                <Edit className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                แก้ไข
              </Link>
            </Button>
          ) : null
        }
      />

      {(canAct ||
        (sid === 1 && isOwner) ||
        (sid <= 3 && isOwner) ||
        ([6, 7].includes(sid) && isOwner) ||
        canPrintChecklistBeforePour(sid)) && (
        <RequestActionBar
          items={getRequestListQuickActions({
            requestId: request.id,
            statusId: sid,
            role,
            userId: user?.id,
            bookedBy: request.booked_by,
            beforeImage: request.before_image,
          })}
          onItemClick={(item, e) => {
            e.stopPropagation()
            if ('cloneFromRequestId' in item) {
              navigate('/requests/new', { state: { cloneFromRequestId: item.cloneFromRequestId } })
              return
            }
            if ('printChecklist' in item) {
              try {
                localPrintChecklist(request)
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'พิมพ์ Checklist ไม่สำเร็จ')
              }
              return
            }
            setModal(item.modal)
          }}
        >
          {sid === 8 && canAct ? (
            <>
              <p className={rq.actions.sectionLabel}>CST — กำลังอัดคอนกรีต (วันทดสอบ)</p>
              <div className={rq.actions.buttonRow}>
                {CST_PLACEHOLDER_DAYS.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="action"
                    variant="outline"
                    className="tabular-nums"
                    disabled
                    title="เร็วๆ นี้ — บันทึกผล CST"
                    aria-label={`CST วันที่ +${d} (ยังไม่เปิดใช้งาน)`}
                  >
                    +{d}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </RequestActionBar>
      )}

      {/* Sections */}
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Card className={rq.card}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>ข้อมูลงาน</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.cardContent, 'space-y-1.5')}>
            {[
              {
                id: 'req-id',
                label: 'รหัสคำขอ',
                value: (
                  <span className="min-w-0">
                    <span className="font-mono font-semibold text-[#374151]">{shortId(request.id)}</span>
                    <span className="mt-1 block break-all font-mono text-[10px] leading-snug text-[#9ca3af]">{request.id}</span>
                  </span>
                ),
              },
              { id: 'client', label: 'Client', value: (request.client as { client_name: string } | null)?.client_name },
              { id: 'location', label: 'Location', value: (request.location as { full_location: string | null } | null)?.full_location },
              { id: 'cw', label: 'Concrete Work', value: (request.concrete_work as { concrete_work: string } | null)?.concrete_work },
              {
                id: 'structure',
                label: 'Structure',
                value: `${(request.structure as { structure_name: string } | null)?.structure_name ?? '-'} ${request.structure_no ? `(${request.structure_no})` : ''}`,
              },
              { id: 'abc', label: 'ABC Code', value: (request.abc_code as { full_abc: string | null } | null)?.full_abc },
              { id: 'wbs', label: 'WBS Code', value: (request.wbs_code as { full_wbs: string | null } | null)?.full_wbs },
            ].map((row) => (
              <div key={row.id} className={rq.detailRow}>
                <span className={rq.detailLabel}>{row.label}</span>
                <span className={rq.value}>{row.value ?? '-'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className={rq.card}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>ข้อมูลการเท</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.cardContent, 'space-y-1.5')}>
            {[
              ['วันเท', formatDate(request.casting_date)],
              ['เวลา', formatTime(request.request_time)],
              ['Mixcode', mx?.mixcode],
              ['กำลังอัด', mx ? `${mx.strength} ${mx.strength_type}` : '-'],
              ['Slump', mx?.slump],
              ['Request Volume (cu.m)', formatVolumeCuM(request.volume_request)],
              ['DWG volume (cu.m)', formatVolumeCuM(request.volume_dwg)],
              ['Actual volume (cu.m)', formatVolumeCuM(request.volume_actual)],
              ...(sid === 8 ? [
                ['Confirmed volume (cu.m)', formatVolumeCuM(request.volume_confirm)],
                ['Volume loss (cu.m)', formatVolumeCuM(request.volume_loss)],
                ['% Loss', request.pct_loss != null && !Number.isNaN(request.pct_loss) ? `${formatPercentNumber(request.pct_loss)}%` : '-'],
              ] : []),
              ['จำนวนตัวอย่าง', request.sample_qty ? `${request.sample_qty} ก้อน` : '-'],
            ].map(([label, value]) => (
              <div key={label} className={rq.detailRow}>
                <span className={rq.detailLabel}>{label}</span>
                <span className={rq.value}>{value ?? '-'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      {(request.before_image || request.after_image || request.eslip_url || request.checksheet_url) && (
        <Card className={rq.card}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>รูปภาพ & ไฟล์</CardTitle>
          </CardHeader>
          <CardContent className={cn(rq.cardContent, 'space-y-5')}>
            {(request.before_image || request.after_image) && (
              <div
                className={cn(
                  'grid w-full gap-5',
                  request.before_image && request.after_image && 'sm:grid-cols-2 sm:items-stretch sm:gap-6',
                )}
              >
                {request.before_image && (
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <p className={cn('mb-1.5', rq.label)}>ก่อนเท</p>
                    <button
                      type="button"
                      className="group flex min-h-0 w-full flex-1 rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40 cursor-zoom-in"
                      aria-label={request.after_image?.trim() ? 'ขยายรูปก่อนเทและหลังเท' : 'ขยายรูปก่อนเท'}
                      onClick={openPourImagesLightbox}
                    >
                      <span className="flex min-h-[9.5rem] w-full flex-1 items-center justify-center rounded-xl border border-[#ccf0ed] bg-[#dcfce7] p-2 shadow-sm sm:min-h-[11rem]">
                        <img
                          src={imageSrcForImgTag(request.before_image, 'detail') ?? request.before_image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="max-h-44 w-auto max-w-full object-contain object-center pointer-events-none sm:max-h-52"
                        />
                      </span>
                    </button>
                  </div>
                )}
                {request.after_image && (
                  <div className="flex min-h-0 min-w-0 flex-col">
                    <p className={cn('mb-1.5', rq.label)}>หลังเท</p>
                    <button
                      type="button"
                      className="group flex min-h-0 w-full flex-1 rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.97] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/40 cursor-zoom-in"
                      aria-label={request.before_image?.trim() ? 'ขยายรูปก่อนเทและหลังเท' : 'ขยายรูปหลังเท'}
                      onClick={openPourImagesLightbox}
                    >
                      <span className="flex min-h-[9.5rem] w-full flex-1 items-center justify-center rounded-xl border border-[#ccf0ed] bg-[#dcfce7] p-2 shadow-sm sm:min-h-[11rem]">
                        <img
                          src={imageSrcForImgTag(request.after_image, 'detail') ?? request.after_image}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="max-h-44 w-auto max-w-full object-contain object-center pointer-events-none sm:max-h-52"
                        />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {(request.eslip_url || request.checksheet_url) && (
              <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-[#ccf0ed]/70 pt-4">
                {request.eslip_url && <a href={request.eslip_url} target="_blank" rel="noreferrer" className={rq.link}>E-Slip</a>}
                {request.checksheet_url && <a href={request.checksheet_url} target="_blank" rel="noreferrer" className={rq.link}>Checksheet</a>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {request.remarks && (
        <Card className={rq.card}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent className={rq.cardContent}>
            <p className="whitespace-pre-wrap rounded-xl bg-[#f5f6f8]/80 px-3 py-2.5 text-sm leading-relaxed text-[#374151] ring-1 ring-[#ccf0ed]/80">{request.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card className={rq.card}>
        <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
          <CardTitle className={cn(rq.cardTitle, 'flex items-center gap-2')}>
            <History className="h-4 w-4 shrink-0 text-[#6b7280]" strokeWidth={1.75} aria-hidden />
            History
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.cardContent, 'space-y-4')}>
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-[#6b7280]">ไม่พบรายการที่ตรงกับคำค้น</p>
          ) : (
            filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <div className={rq.timelineDot} />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-[#374151]">
                  <StatusBadge statusId={log.status_id ?? 0} size="sm" />
                </p>
                <p className={cn('mt-0.5', rq.sub)}>
                  {(log.profile as { fname: string | null; lname: string | null } | null)
                    ? `${(log.profile as { fname: string | null }).fname ?? ''} ${(log.profile as { lname: string | null }).lname ?? ''}`.trim()
                    : '-'} · {formatDateTime(log.created_at)}
                </p>
                {log.note && <p className="mt-1 text-[#6b7280] italic">"{log.note}"</p>}
              </div>
            </div>
          ))
          )}
        </CardContent>
      </Card>

      <RequestWorkflowModals
        request={request}
        modal={modal}
        onClose={() => setModal(null)}
        onCompleted={() => void loadData({ background: true })}
      />

      <Dialog open={imageLightbox != null} onOpenChange={(open) => { if (!open) setImageLightbox(null) }}>
        <DialogContent
          className={cn(
            'flex h-[calc(100dvh-10px)] max-h-none w-[calc(100vw-10px)] max-w-none flex-col overflow-hidden gap-0 rounded-2xl border-0 bg-zinc-950/96 p-0 shadow-none sm:h-[calc(100dvh-16px)] sm:w-[calc(100vw-16px)]',
            'pt-12 pb-[max(10px,env(safe-area-inset-bottom,0px))] pl-[max(6px,env(safe-area-inset-left,0px))] pr-[max(6px,env(safe-area-inset-right,0px))]',
            '[&>button]:right-3 [&>button]:top-3 [&>button]:text-white [&>button]:opacity-95 [&>button]:hover:bg-white/12 [&>button]:hover:opacity-100 [&>button]:focus-visible:ring-white/45',
          )}
        >
          <DialogTitle className="sr-only">
            {imageLightbox?.items.map((i) => i.label).join(' · ') || 'รูปภาพ'}
          </DialogTitle>
          {imageLightbox ? (
            <div
              className={cn(
                'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-1 sm:gap-4 sm:px-2',
                imageLightbox.items.length > 1 && 'sm:flex-row sm:items-stretch sm:gap-3 sm:overflow-hidden',
              )}
            >
              {imageLightbox.items.map((item) => (
                <figure
                  key={item.label}
                  className="flex min-h-0 min-w-0 flex-1 flex-col items-center sm:max-w-[50%]"
                >
                  <figcaption className="mb-1 shrink-0 text-center text-xs font-medium text-white/90 sm:text-sm">
                    {item.label}
                  </figcaption>
                  <div className="flex min-h-0 w-full flex-1 items-center justify-center sm:min-h-0">
                    <img
                      src={item.src}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-auto max-h-full w-auto max-w-full object-contain object-center"
                    />
                  </div>
                </figure>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
