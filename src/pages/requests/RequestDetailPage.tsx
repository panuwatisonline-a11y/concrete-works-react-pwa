import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, formatTime, shortId, cn } from '@/lib/utils'
import { dedupeRequestLogsForDisplay } from '@/lib/requestLogDisplay'
import { rq } from '@/lib/requestUi'
import {
  REQUEST_DETAIL_SEARCH_ARIA,
  REQUEST_DETAIL_SEARCH_PLACEHOLDER,
} from '@/lib/desktopTopBarSearch'
import { RequestScreenHeader } from '@/components/requests/RequestScreenHeader'
import { Edit } from 'lucide-react'
import type { RequestWithRelations, RequestLogWithProfile } from '@/types/app.types'

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

  const [postponeData, setPostponeData] = useState({ date: '', time: '', reason: '' })
  const [completeData, setCompleteData] = useState({
    volume_confirm: '', volume_actual: '', strength: '',
    after_image: '', eslip_url: '', checksheet_url: '', note: '',
  })
  const [rejectReason, setRejectReason] = useState('')

  const actions = useActionRequest()

  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const actionLockRef = useRef(false)
  const initialModalConsumedRef = useRef(false)

  useEffect(() => {
    initialModalConsumedRef.current = false
  }, [id])

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
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

  useEffect(() => { loadData() }, [loadData])

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
      if (type === 'inspect') ok = await actions.inspect(id, note)
      else if (type === 'approve') ok = await actions.approve(id, note)
      else if (type === 'cancel') ok = await actions.cancel(id, note ?? '')
      else if (type === 'reject') { ok = await actions.reject(id, rejectReason); setRejectReason('') }
      else if (type === 'confirmOrder') ok = await actions.confirmOrder(id, note)
      else if (type === 'postpone') ok = await actions.postpone(id, { date: postponeData.date, time: postponeData.time, reason: postponeData.reason })
      else if (type === 'complete') {
        ok = await actions.complete(id, {
          volume_confirm: parseFloat(completeData.volume_confirm),
          volume_actual: completeData.volume_actual ? parseFloat(completeData.volume_actual) : undefined,
          strength: completeData.strength ? parseFloat(completeData.strength) : undefined,
          after_image: completeData.after_image || undefined,
          eslip_url: completeData.eslip_url || undefined,
          checksheet_url: completeData.checksheet_url || undefined,
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
            <Button variant="outline" size="sm" className="rounded-xl border-[#e2e6ec] shadow-sm" asChild>
              <Link to={`/requests/${id}/edit`}>
                <Edit className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                แก้ไข
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Action Panel */}
      {(canAct || (sid === 1 && isOwner) || (sid <= 3 && isOwner)) && (
        <Card id="request-actions" className={rq.card}>
          <CardContent className={cn(rq.cardContentTight, 'flex flex-wrap gap-2')}>
            {sid === 1 && canAct && <Button size="sm" className="rounded-lg" onClick={() => setModal('inspect')}>ตรวจสอบ</Button>}
            {sid === 2 && canAct && <Button size="sm" className="rounded-lg" variant="success" onClick={() => setModal('approve')}>อนุมัติ</Button>}
            {sid === 2 && canAct && <Button size="sm" className="rounded-lg" variant="destructive" onClick={() => setModal('reject')}>Reject</Button>}
            {sid === 3 && canAct && <Button size="sm" className="rounded-lg" onClick={() => setModal('confirmOrder')}>สั่งเท</Button>}
            {sid === 3 && canAct && <Button size="sm" className="rounded-lg" variant="warning" onClick={() => setModal('postpone')}>เลื่อนวัน</Button>}
            {sid === 4 && canAct && <Button size="sm" className="rounded-lg" variant="success" onClick={() => setModal('complete')}>Confirm รายการ</Button>}
            {sid === 5 && canAct && <Button size="sm" className="rounded-lg" onClick={() => setModal('reApprove')}>สั่งเทใหม่</Button>}
            {[1, 2, 3].includes(sid) && (canAct || isOwner) && (
              <Button size="sm" className="rounded-lg" variant="outline" onClick={() => setModal('cancel')}>ยกเลิก</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
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
              <div key={row.id} className="flex gap-2">
                <span className={cn('w-28 shrink-0', rq.label)}>{row.label}</span>
                <span className={cn('min-w-0', rq.value)}>{row.value ?? '-'}</span>
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
              ['ปริมาณขอ', request.volume_request ? `${request.volume_request} ลบ.ม.` : '-'],
              ['ปริมาณ DWG', request.volume_dwg ? `${request.volume_dwg} ลบ.ม.` : '-'],
              ...(sid === 8 ? [
                ['ปริมาณจริง', request.volume_actual ? `${request.volume_actual} ลบ.ม.` : '-'],
                ['ปริมาณ Confirm', request.volume_confirm ? `${request.volume_confirm} ลบ.ม.` : '-'],
                ['Volume Loss', request.volume_loss ? `${request.volume_loss} ลบ.ม.` : '-'],
                ['% Loss', request.pct_loss ? `${request.pct_loss.toFixed(2)}%` : '-'],
              ] : []),
              ['จำนวนตัวอย่าง', request.sample_qty ? `${request.sample_qty} ก้อน` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className={cn('w-28 shrink-0', rq.label)}>{label}</span>
                <span className={cn('min-w-0', rq.value)}>{value ?? '-'}</span>
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
          <CardContent className={cn(rq.cardContent, 'flex flex-wrap gap-4')}>
            {request.before_image && (
              <div>
                <p className={cn('mb-1', rq.label)}>ก่อนเท</p>
                <a href={request.before_image} target="_blank" rel="noreferrer">
                  <img src={request.before_image} alt="before" className="h-32 w-auto rounded-xl border border-[#e2e6ec] object-cover shadow-sm transition hover:opacity-90" />
                </a>
              </div>
            )}
            {request.after_image && (
              <div>
                <p className={cn('mb-1', rq.label)}>หลังเท</p>
                <a href={request.after_image} target="_blank" rel="noreferrer">
                  <img src={request.after_image} alt="after" className="h-32 w-auto rounded-xl border border-[#e2e6ec] object-cover shadow-sm transition hover:opacity-90" />
                </a>
              </div>
            )}
            {request.eslip_url && <a href={request.eslip_url} target="_blank" rel="noreferrer" className={rq.link}>E-Slip</a>}
            {request.checksheet_url && <a href={request.checksheet_url} target="_blank" rel="noreferrer" className={rq.link}>Checksheet</a>}
          </CardContent>
        </Card>
      )}

      {request.remarks && (
        <Card className={rq.card}>
          <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
            <CardTitle className={rq.cardTitle}>หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent className={rq.cardContent}>
            <p className="whitespace-pre-wrap rounded-xl bg-[#f5f6f8]/80 px-3 py-2.5 text-sm leading-relaxed text-[#374151] ring-1 ring-[#e2e6ec]/80">{request.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className={rq.card}>
        <CardHeader className={cn(rq.cardHeader, 'space-y-0')}>
          <CardTitle className={rq.cardTitle}>Timeline</CardTitle>
        </CardHeader>
        <CardContent className={cn(rq.cardContent, 'space-y-4')}>
          {filteredLogs.length === 0 ? (
            <p className="text-sm text-[#6b7280]">ไม่พบรายการ Timeline ที่ตรงกับคำค้น</p>
          ) : (
            filteredLogs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <div className={rq.timelineDot} />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-[#374151]">
                  {log.action}{' '}
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
      <ConfirmModal open={modal === 'inspect'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('inspect', note)} title="ยืนยันการตรวจสอบ" showNote noteLabel="หมายเหตุ" isLoading={actionBusy} />
      <ConfirmModal open={modal === 'approve'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('approve', note)} title="ยืนยันการอนุมัติ" confirmVariant="success" showNote noteLabel="หมายเหตุ" isLoading={actionBusy} />
      <ConfirmModal open={modal === 'confirmOrder'} onClose={() => setModal(null)} onConfirm={(note) => handleAction('confirmOrder', note)} title="ยืนยันการสั่งเทคอนกรีต" showNote noteLabel="หมายเหตุ" isLoading={actionBusy} />
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
            <Button variant="outline" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button variant="destructive" disabled={actionBusy || !rejectReason.trim()} onClick={() => handleAction('reject')}>
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
            <Button variant="outline" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              variant="warning"
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ปริมาณ Confirm *</Label>
                <Input type="number" step="0.01" value={completeData.volume_confirm} onChange={(e) => setCompleteData((p) => ({ ...p, volume_confirm: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>ปริมาณจริง</Label>
                <Input type="number" step="0.01" value={completeData.volume_actual} onChange={(e) => setCompleteData((p) => ({ ...p, volume_actual: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>กำลังอัด (ksc)</Label>
              <Input type="number" value={completeData.strength} onChange={(e) => setCompleteData((p) => ({ ...p, strength: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รูปหลังเท</Label>
              <ImageUpload value={completeData.after_image} onChange={(url) => setCompleteData((p) => ({ ...p, after_image: url ?? '' }))} folder="after" />
            </div>
            <div className="space-y-1.5">
              <Label>E-Slip URL</Label>
              <Input value={completeData.eslip_url} onChange={(e) => setCompleteData((p) => ({ ...p, eslip_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Checksheet URL</Label>
              <Input value={completeData.checksheet_url} onChange={(e) => setCompleteData((p) => ({ ...p, checksheet_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea value={completeData.note} onChange={(e) => setCompleteData((p) => ({ ...p, note: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={actionBusy}>ยกเลิก</Button>
            <Button variant="success" disabled={actionBusy || !completeData.volume_confirm} onClick={() => handleAction('complete')}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
