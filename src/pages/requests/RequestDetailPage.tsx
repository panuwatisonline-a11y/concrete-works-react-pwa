import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react'
import { usePullToRefreshOnLoad } from '@/hooks/usePullToRefreshOnLoad'
import { toast } from 'sonner'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useFilterStore } from '@/stores/filterStore'
import { useDesktopSearchRegistration } from '@/hooks/useDesktopSearchRegistration'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { useActionRequest } from '@/hooks/useActionRequest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, formatTime, shortId, cn } from '@/lib/utils'
import { parseStructureListTokens, structureListsIntersect, structureHasCompatibleMixcode } from '@/lib/structureListTokens'
import { dedupeRequestLogsForDisplay } from '@/lib/requestLogDisplay'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import { getRequestListQuickActions } from '@/lib/requestQuickActions'
import { RequestActionBar } from '@/components/requests/RequestActionBar'
import { rq } from '@/lib/requestUi'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import { useMasterDataStore } from '@/stores/masterDataStore'
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
  const { locations, concreteWorks, structures, mixcodes } = useMasterDataStore()
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

  const [postponeData, setPostponeData] = useState({ date: '', time: '', reason: '' })
  const [completeData, setCompleteData] = useState({
    volume_confirm: '',
    after_image: '',
    note: '',
  })
  const [rejectReason, setRejectReason] = useState('')
  const [inspectData, setInspectData] = useState({
    location_id: '',
    concrete_work_id: '',
    structure_id: '',
    structure_no: '',
    mixcode_id: '',
    volume_request: '',
    note: '',
  })
  const [inspectBeforeImage, setInspectBeforeImage] = useState<string | null>(null)
  const [confirmOrderData, setConfirmOrderData] = useState({ volume_actual: '', note: '' })
  const [imageLightbox, setImageLightbox] = useState<{ items: { src: string; label: string }[] } | null>(null)

  const actions = useActionRequest()

  const requestRef = useRef(request)
  requestRef.current = request

  const selectedCWInspect = useMemo(
    () => concreteWorks.find((cw) => String(cw.id) === inspectData.concrete_work_id),
    [concreteWorks, inspectData.concrete_work_id],
  )
  const filteredStructuresInspect = useMemo(() => {
    const cw = selectedCWInspect
    if (!cw) return structures
    if (!mixcodes.length) {
      if (!cw.structure_list?.trim()) return structures
      const names = parseStructureListTokens(cw.structure_list)
      return structures.filter((s) => names.includes(s.structure_name))
    }
    return structures.filter((s) =>
      structureHasCompatibleMixcode(s.structure_name, cw, mixcodes),
    )
  }, [structures, selectedCWInspect, mixcodes])
  const selectedStructureInspect = useMemo(
    () => structures.find((s) => String(s.id) === inspectData.structure_id),
    [structures, inspectData.structure_id],
  )
  const filteredMixcodesInspect = useMemo(() => {
    const cw = selectedCWInspect
    if (!cw) return mixcodes
    return mixcodes.filter((m) => {
      if (!structureListsIntersect(m.structure_list, cw.structure_list)) return false
      if (!selectedStructureInspect) return true
      const allowed = parseStructureListTokens(m.structure_list)
      if (allowed.length === 0) return true
      return allowed.includes(selectedStructureInspect.structure_name)
    })
  }, [mixcodes, selectedCWInspect, selectedStructureInspect])

  useEffect(() => {
    if (modal !== 'inspect') return
    const r = requestRef.current
    if (!r) return
    setInspectData({
      location_id: r.location_id != null ? String(r.location_id) : '',
      concrete_work_id: r.concrete_work_id != null ? String(r.concrete_work_id) : '',
      structure_id: r.structure_id != null ? String(r.structure_id) : '',
      structure_no: r.structure_no ?? '',
      mixcode_id: r.mixcode_id != null ? String(r.mixcode_id) : '',
      volume_request: r.volume_request != null ? String(r.volume_request) : '',
      note: '',
    })
    setInspectBeforeImage(r.before_image?.trim() || null)
  }, [modal])

  useEffect(() => {
    if (modal !== 'inspect') return
    if (!inspectData.mixcode_id) return
    if (!filteredMixcodesInspect.some((m) => String(m.id) === inspectData.mixcode_id)) {
      setInspectData((p) => ({ ...p, mixcode_id: '' }))
    }
  }, [modal, filteredMixcodesInspect, inspectData.mixcode_id])

  useEffect(() => {
    if (modal !== 'inspect') return
    if (!inspectData.structure_id) return
    if (!filteredStructuresInspect.some((s) => String(s.id) === inspectData.structure_id)) {
      setInspectData((p) => ({ ...p, structure_id: '', mixcode_id: '' }))
    }
  }, [modal, filteredStructuresInspect, inspectData.structure_id])

  useEffect(() => {
    if (modal !== 'confirmOrder') return
    const r = requestRef.current
    if (!r) return
    setConfirmOrderData({
      volume_actual:
        r.volume_actual != null
          ? String(r.volume_actual)
          : r.volume_request != null
            ? String(r.volume_request)
            : '',
      note: '',
    })
  }, [modal])

  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const actionLockRef = useRef(false)
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

  async function handleInspectConfirm() {
    if (!id || actionLockRef.current) return
    const vol = parseFloat(inspectData.volume_request)
    if (
      !inspectData.location_id ||
      !inspectData.concrete_work_id ||
      !inspectData.structure_id ||
      !inspectData.mixcode_id ||
      Number.isNaN(vol)
    ) {
      toast.error('กรุณากรอกข้อมูลให้ครบ (Location, Concrete work, Structure, Mixcode, Request Volume (cu.m))')
      return
    }
    const hadBeforeAtOpen = Boolean(request?.before_image?.trim())
    const beforeNow = inspectBeforeImage?.trim() || null
    if (!hadBeforeAtOpen && !beforeNow) {
      toast.error('กรุณาอัปโหลดรูปก่อนเท (ผู้จองยังไม่แนบรูป)')
      return
    }
    actionLockRef.current = true
    setActionBusy(true)
    try {
      const ok = await actions.inspect(id, inspectData.note.trim() || undefined, {
        location_id: Number(inspectData.location_id),
        concrete_work_id: Number(inspectData.concrete_work_id),
        structure_id: Number(inspectData.structure_id),
        structure_no: inspectData.structure_no.trim() || null,
        mixcode_id: Number(inspectData.mixcode_id),
        volume_request: vol,
        before_image: beforeNow,
      })
      if (ok) await loadData()
      setModal(null)
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

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
    const allowed = ['inspect', 'approve', 'reject', 'cancel', 'confirmOrder', 'postpone', 'complete', 'reApprove'] as const
    if (!allowed.includes(m as (typeof allowed)[number])) return
    initialModalConsumedRef.current = true
    setModal(m)
    navigate(`/requests/${id}`, { replace: true, state: {} })
  }, [loading, request, location.state, id, navigate])

  async function handleAction(type: string, note?: string) {
    if (!id || actionLockRef.current) return
    actionLockRef.current = true
    setActionBusy(true)
    try {
      let ok = false
      if (type === 'approve') ok = await actions.approve(id, note)
      else if (type === 'cancel') ok = await actions.cancel(id, note ?? '')
      else if (type === 'reject') { ok = await actions.reject(id, rejectReason); setRejectReason('') }
      else if (type === 'postpone') ok = await actions.postpone(id, { date: postponeData.date, time: postponeData.time, reason: postponeData.reason })
      else if (type === 'complete') {
        ok = await actions.complete(id, {
          volume_confirm: parseFloat(completeData.volume_confirm),
          after_image: completeData.after_image || undefined,
          note: completeData.note || undefined,
        })
      }
      else if (type === 'reApprove') ok = await actions.reApprove(id, note)
      if (ok) loadData()
      setModal(null)
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

  async function handleConfirmOrder() {
    if (!id || actionLockRef.current) return
    const vol = parseFloat(confirmOrderData.volume_actual)
    if (Number.isNaN(vol) || vol <= 0) {
      toast.error('กรุณากรอก Actual volume (cu.m) เป็นตัวเลขมากกว่า 0')
      return
    }
    actionLockRef.current = true
    setActionBusy(true)
    try {
      const ok = await actions.confirmOrder(id, confirmOrderData.note.trim() || undefined, vol)
      if (ok) await loadData()
      setModal(null)
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

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

      {(canAct || (sid === 1 && isOwner) || (sid <= 3 && isOwner) || ([6, 7].includes(sid) && isOwner)) && (
        <RequestActionBar
          items={getRequestListQuickActions({
            requestId: request.id,
            statusId: sid,
            role,
            userId: user?.id,
            bookedBy: request.booked_by,
          })}
          onItemClick={(item, e) => {
            e.stopPropagation()
            if ('cloneFromRequestId' in item) {
              navigate('/requests/new', { state: { cloneFromRequestId: item.cloneFromRequestId } })
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
              ['Request Volume (cu.m)', request.volume_request ? `${request.volume_request} cu.m` : '-'],
              ['DWG volume (cu.m)', request.volume_dwg ? `${request.volume_dwg} cu.m` : '-'],
              ['Actual volume (cu.m)', request.volume_actual != null ? `${request.volume_actual} cu.m` : '-'],
              ...(sid === 8 ? [
                ['Confirmed volume (cu.m)', request.volume_confirm ? `${request.volume_confirm} cu.m` : '-'],
                ['Volume loss (cu.m)', request.volume_loss ? `${request.volume_loss} cu.m` : '-'],
                ['% Loss', request.pct_loss ? `${request.pct_loss.toFixed(2)}%` : '-'],
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

      {/* Modals */}
      <Dialog open={modal === 'inspect'} onOpenChange={(o) => { if (!o) setModal(null) }}>
        <DialogContent className="max-h-[min(92dvh,720px)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ตรวจสอบและแก้ไขข้อมูลงาน</DialogTitle>
            <DialogDescription className="text-left text-sm text-[#6b7280]">
              ตรวจทานข้อมูลที่ผู้จองกรอก แก้ไขได้หากไม่ตรงก่อนยืนยันการตรวจสอบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Select
                value={inspectData.location_id}
                onValueChange={(v) => setInspectData((p) => ({ ...p, location_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="เลือก Location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.full_location ?? l.location1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Concrete work *</Label>
              <Select
                value={inspectData.concrete_work_id}
                onValueChange={(v) => setInspectData((p) => ({
                  ...p,
                  concrete_work_id: v,
                  structure_id: '',
                  mixcode_id: '',
                }))}
              >
                <SelectTrigger><SelectValue placeholder="เลือก Concrete work" /></SelectTrigger>
                <SelectContent>
                  {concreteWorks.map((cw) => (
                    <SelectItem key={cw.id} value={String(cw.id)}>{cw.concrete_work}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Structure *</Label>
              <Select
                value={inspectData.structure_id}
                onValueChange={(v) => setInspectData((p) => ({ ...p, structure_id: v, mixcode_id: '' }))}
              >
                <SelectTrigger><SelectValue placeholder="เลือก Structure" /></SelectTrigger>
                <SelectContent>
                  {filteredStructuresInspect.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.structure_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Structure number</Label>
              <Input
                value={inspectData.structure_no}
                onChange={(e) => setInspectData((p) => ({ ...p, structure_no: e.target.value }))}
                placeholder="เช่น A1, ชั้น 3"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mixcode *</Label>
              <MixcodePicker
                value={inspectData.mixcode_id}
                onChange={(mixcodeId) => setInspectData((p) => ({ ...p, mixcode_id: mixcodeId }))}
                mixcodes={filteredMixcodesInspect}
                emptyMessage="ไม่มี Mixcode ที่ตรงกับงานคอนกรีตและโครงสร้างที่เลือก — ลองเปลี่ยน Structure"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Request Volume (cu.m) *</Label>
              <Input
                type="number"
                step="0.01"
                value={inspectData.volume_request}
                onChange={(e) => setInspectData((p) => ({ ...p, volume_request: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                รูปก่อนเท
                {!request?.before_image?.trim() ? <span className="text-rose-600"> *</span> : null}
              </Label>
              <ImageUpload
                value={inspectBeforeImage ?? undefined}
                onChange={(url) => setInspectBeforeImage(url)}
                folder="before"
                label="อัปโหลดรูปก่อนเท"
              />
              {!request?.before_image?.trim() ? (
                <p className="text-xs text-[#6b7280]">ผู้จองยังไม่แนบรูป — ต้องอัปโหลดในนี้ก่อนยืนยันตรวจสอบ</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={inspectData.note}
                onChange={(e) => setInspectData((p) => ({ ...p, note: e.target.value }))}
                rows={2}
                placeholder="ไม่บังคับ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="action" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              size="action"
              disabled={
                actionBusy ||
                (!request?.before_image?.trim() && !(inspectBeforeImage?.trim()))
              }
              onClick={() => void handleInspectConfirm()}
            >
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยันตรวจสอบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'confirmOrder'} onOpenChange={(o) => { if (!o) setModal(null) }}>
        <DialogContent className="max-h-[min(92dvh,720px)] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ยืนยันการสั่งเทคอนกรีต</DialogTitle>
            <DialogDescription className="text-left text-sm text-[#6b7280]">
              ตรวจทานปริมาณก่อนสั่งเท ระบุ Actual volume (cu.m) ตามที่สั่งผลิต/เทจริง
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-[#ccf0ed] bg-[#f0fdf4] px-3 py-2.5 text-[#374151]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">สรุปคำขอ</p>
              <dl className="mt-2 space-y-2 text-sm">
                {(() => {
                  const client = (request.client as { client_name: string } | null)?.client_name
                  const loc = request.location as { full_location: string | null; location1?: string } | null
                  const locationLine = loc?.full_location ?? loc?.location1 ?? null
                  const cw = (request.concrete_work as { concrete_work: string } | null)?.concrete_work
                  const structureName = (request.structure as { structure_name: string } | null)?.structure_name
                  const structureLine = [structureName, request.structure_no?.trim() ? `(${request.structure_no})` : null].filter(Boolean).join(' ')
                  const castingLine = [formatDate(request.casting_date), formatTime(request.request_time)].filter((x) => x && x !== '-').join(' · ')
                  const strengthSlump = mx
                    ? [mx.strength != null ? `${mx.strength} ${mx.strength_type ?? ''}`.trim() : null, mx.slump].filter(Boolean).join(' · ') || null
                    : null
                  const abcWbs = [
                    (request.abc_code as { full_abc: string | null } | null)?.full_abc?.trim(),
                    (request.wbs_code as { full_wbs: string | null } | null)?.full_wbs?.trim(),
                  ].filter(Boolean).join(' · ') || null

                  const core: { label: string; value: ReactNode }[] = [
                    { label: 'รหัสคำขอ', value: <span className="font-mono font-semibold">{shortId(request.id)}</span> },
                    { label: 'Client', value: client ?? '—' },
                    { label: 'Location', value: locationLine ?? '—' },
                    { label: 'งานคอนกรีต', value: cw ?? '—' },
                    { label: 'Structure', value: structureLine || '—' },
                    { label: 'วันเท / เวลา', value: castingLine || '—' },
                    { label: 'Mixcode', value: mx?.mixcode ?? '—' },
                    { label: 'กำลังอัด / Slump', value: strengthSlump ?? '—' },
                    {
                      label: 'Request volume (cu.m)',
                      value: request.volume_request != null ? `${request.volume_request} cu.m` : '—',
                    },
                  ]
                  const extra: { label: string; value: ReactNode }[] = []
                  if (request.volume_dwg != null) extra.push({ label: 'DWG volume (cu.m)', value: `${request.volume_dwg} cu.m` })
                  if (abcWbs) extra.push({ label: 'ABC / WBS', value: abcWbs })
                  if (request.sample_qty != null) extra.push({ label: 'จำนวนตัวอย่าง', value: `${request.sample_qty} ก้อน` })
                  if (request.remarks?.trim()) extra.push({ label: 'หมายเหตุผู้จอง', value: request.remarks.trim() })

                  return [...core, ...extra].map((row) => (
                    <div key={row.label} className="min-w-0 border-b border-[#ccf0ed]/60 pb-2 last:border-0 last:pb-0">
                      <dt className="text-[11px] font-medium leading-tight text-[#6b7280]">{row.label}</dt>
                      <dd className="mt-0.5 break-words text-[13px] font-medium leading-snug text-[#111827]">{row.value}</dd>
                    </div>
                  ))
                })()}
              </dl>
            </div>
            <div className="space-y-1.5">
              <Label>Actual volume (cu.m) *</Label>
              <Input
                type="number"
                step="0.01"
                value={confirmOrderData.volume_actual}
                onChange={(e) => setConfirmOrderData((p) => ({ ...p, volume_actual: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea
                value={confirmOrderData.note}
                onChange={(e) => setConfirmOrderData((p) => ({ ...p, note: e.target.value }))}
                rows={2}
                placeholder="ไม่บังคับ..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="action" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button size="action" disabled={actionBusy} onClick={() => void handleConfirmOrder()}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยันสั่งเท'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal open={modal === 'approve'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('approve', note)} title="ยืนยันการอนุมัติ" confirmVariant="success" showNote noteLabel="หมายเหตุ" isLoading={actionBusy} />
      <ConfirmModal open={modal === 'cancel'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('cancel', note)} title="ยืนยันการยกเลิก" confirmLabel="ยกเลิกคำขอ" confirmVariant="destructive" showNote noteLabel="เหตุผล" noteRequired isLoading={actionBusy} />
      <ConfirmModal open={modal === 'reApprove'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('reApprove', note)} title="สั่งเทใหม่" showNote noteLabel="หมายเหตุ" isLoading={actionBusy} />

      {/* Reject Modal */}
      <Dialog open={modal === 'reject'} onOpenChange={(o) => { if (!o) setModal(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ระบุเหตุผล Reject</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>เหตุผล <span className="text-zinc-600">*</span></Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="กรุณาระบุ..." />
          </div>
          <DialogFooter>
            <Button variant="outline" size="action" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button variant="destructive" size="action" disabled={actionBusy || !rejectReason.trim()} onClick={() => handleAction('reject')}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Postpone Modal */}
      <Dialog open={modal === 'postpone'} onOpenChange={(o) => { if (!o) setModal(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>เลื่อนวันเทคอนกรีต</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>วันที่ใหม่ *</Label>
              <Input type="date" value={postponeData.date} onChange={(e) => setPostponeData((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เวลา *</Label>
              <Input type="time" value={postponeData.time} onChange={(e) => setPostponeData((p) => ({ ...p, time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>เหตุผล *</Label>
              <Textarea value={postponeData.reason} onChange={(e) => setPostponeData((p) => ({ ...p, reason: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="action" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              variant="warning"
              size="action"
              disabled={actionBusy || !postponeData.date || !postponeData.time || !postponeData.reason}
              onClick={() => handleAction('postpone')}
            >
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={modal === 'complete'} onOpenChange={(o) => { if (!o) setModal(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Confirm รายการ & ดำเนินการ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Confirmed volume (cu.m) *</Label>
              <Input type="number" step="0.01" value={completeData.volume_confirm} onChange={(e) => setCompleteData((p) => ({ ...p, volume_confirm: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รูปหลังเท</Label>
              <ImageUpload value={completeData.after_image} onChange={(url) => setCompleteData((p) => ({ ...p, after_image: url ?? '' }))} folder="after" />
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea value={completeData.note} onChange={(e) => setCompleteData((p) => ({ ...p, note: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="action" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button variant="success" size="action" disabled={actionBusy || !completeData.volume_confirm} onClick={() => handleAction('complete')}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
