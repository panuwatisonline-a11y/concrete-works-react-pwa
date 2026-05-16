import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { useActionRequest } from '@/hooks/useActionRequest'
import { UploadBeforePourDialog } from '@/components/requests/UploadBeforePourDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SELECT_CONTENT_ELEVATED_Z,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MixcodePicker } from '@/components/requests/MixcodePicker'
import { useMasterDataStore } from '@/stores/masterDataStore'
import {
  formatDate,
  formatTime,
  shortId,
  cn,
  formatVolumeCuM,
} from '@/lib/utils'
import { parseStructureListTokens, structureListsIntersect, structureHasCompatibleMixcode } from '@/lib/structureListTokens'
import type { RequestWithRelations } from '@/types/app.types'

/** ชั้น overlay / เนื้อหา — สูงกว่า dialog ทั่วไป (z-50) */
const WF_OVERLAY = 'z-[260]'
const WF_CONTENT = '!z-[270]'

export type RequestWorkflowModalProps = {
  request: RequestWithRelations
  modal: string | null
  onClose: () => void
  onCompleted: () => void | Promise<void>
}

export function RequestWorkflowModals({ request, modal, onClose, onCompleted }: RequestWorkflowModalProps) {
  const id = request.id
  const { locations, concreteWorks, structures, mixcodes } = useMasterDataStore()
  const actions = useActionRequest()

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
  const [inspectBeforeUploading, setInspectBeforeUploading] = useState(false)
  const [confirmOrderData, setConfirmOrderData] = useState({ volume_actual: '', note: '' })
  const [completeAfterUploading, setCompleteAfterUploading] = useState(false)

  const [actionBusy, setActionBusy] = useState(false)
  const actionLockRef = useRef(false)

  const requestRef = useRef(request)
  requestRef.current = request

  const mx = request.mixcode as {
    mixcode: string
    strength: number | null
    slump: string | null
    strength_type: string | null
  } | null

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
    return structures.filter((s) => structureHasCompatibleMixcode(s.structure_name, cw, mixcodes))
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
  }, [modal, request.id])

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
    setConfirmOrderData({
      volume_actual:
        r.volume_actual != null
          ? String(r.volume_actual)
          : r.volume_request != null
            ? String(r.volume_request)
            : '',
      note: '',
    })
  }, [modal, request.id])

  async function runCompleted() {
    await Promise.resolve(onCompleted())
  }

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
    const hadBeforeAtOpen = Boolean(requestRef.current?.before_image?.trim())
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
      if (ok) await runCompleted()
      onClose()
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

  async function handleAction(actionType: string, note?: string) {
    if (!id || actionLockRef.current) return
    if (
      actionType === 'complete'
      && (!completeData.after_image?.trim() || completeAfterUploading)
    ) {
      toast.error('กรุณาอัปโหลดรูปหลังเท และรอจนได้ลิงก์จากระบบ')
      return
    }
    actionLockRef.current = true
    setActionBusy(true)
    try {
      let ok = false
      if (actionType === 'approve') ok = await actions.approve(id, note)
      else if (actionType === 'cancel') ok = await actions.cancel(id, note ?? '')
      else if (actionType === 'reject') {
        ok = await actions.reject(id, rejectReason)
        setRejectReason('')
      } else if (actionType === 'postpone') {
        ok = await actions.postpone(id, {
          date: postponeData.date,
          time: postponeData.time,
          reason: postponeData.reason,
        })
      } else if (actionType === 'complete') {
        const url = completeData.after_image.trim()
        ok = await actions.complete(id, {
          volume_confirm: parseFloat(completeData.volume_confirm),
          after_image: url,
          note: completeData.note || undefined,
        })
      } else if (actionType === 'reApprove') ok = await actions.reApprove(id, note)
      if (ok) await runCompleted()
      onClose()
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
      if (ok) await runCompleted()
      onClose()
    } finally {
      actionLockRef.current = false
      setActionBusy(false)
    }
  }

  return (
    <>
      <UploadBeforePourDialog
        open={modal === 'uploadBeforeOnly'}
        onOpenChange={(o) => {
          if (!o) onClose()
        }}
        requestId={id}
        onSuccess={() => void runCompleted()}
        overlayClassName={WF_OVERLAY}
        dialogContentClassName={WF_CONTENT}
      />

      <Dialog open={modal === 'inspect'} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent
          overlayClassName={WF_OVERLAY}
          className={cn('max-h-[min(92dvh,720px)] max-w-lg overflow-y-auto', WF_CONTENT)}
        >
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
                <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
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
                <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
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
                <SelectContent className={SELECT_CONTENT_ELEVATED_Z}>
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
                onUploadingChange={setInspectBeforeUploading}
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
            <Button variant="outline" size="modalAction" onClick={onClose} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              size="modalAction"
              disabled={
                actionBusy ||
                inspectBeforeUploading ||
                (!request?.before_image?.trim() && !(inspectBeforeImage?.trim()))
              }
              onClick={() => void handleInspectConfirm()}
            >
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยันตรวจสอบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'confirmOrder'} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent
          overlayClassName={WF_OVERLAY}
          className={cn('max-h-[min(92dvh,720px)] max-w-lg overflow-y-auto', WF_CONTENT)}
        >
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
                      value: formatVolumeCuM(request.volume_request, '—'),
                    },
                  ]
                  const extra: { label: string; value: ReactNode }[] = []
                  if (request.volume_dwg != null) {
                    extra.push({ label: 'DWG volume (cu.m)', value: formatVolumeCuM(request.volume_dwg, '—') })
                  }
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
            <Button variant="outline" size="modalAction" onClick={onClose} disabled={actionBusy}>ยกเลิก</Button>
            <Button size="modalAction" disabled={actionBusy} onClick={() => void handleConfirmOrder()}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยันสั่งเท'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={modal === 'approve'}
        onClose={onClose}
        onConfirm={(note) => handleAction('approve', note)}
        title="ยืนยันการอนุมัติ"
        confirmVariant="success"
        showNote
        noteLabel="หมายเหตุ"
        isLoading={actionBusy}
        overlayClassName={WF_OVERLAY}
        dialogContentClassName={WF_CONTENT}
      />
      <ConfirmModal
        open={modal === 'cancel'}
        onClose={onClose}
        onConfirm={(note) => handleAction('cancel', note)}
        title="ยืนยันการยกเลิก"
        confirmLabel="ยกเลิกคำขอ"
        confirmVariant="destructive"
        showNote
        noteLabel="เหตุผล"
        noteRequired
        isLoading={actionBusy}
        overlayClassName={WF_OVERLAY}
        dialogContentClassName={WF_CONTENT}
      />
      <ConfirmModal
        open={modal === 'reApprove'}
        onClose={onClose}
        onConfirm={(note) => handleAction('reApprove', note)}
        title="สั่งเทใหม่"
        showNote
        noteLabel="หมายเหตุ"
        isLoading={actionBusy}
        overlayClassName={WF_OVERLAY}
        dialogContentClassName={WF_CONTENT}
      />

      <Dialog open={modal === 'reject'} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent overlayClassName={WF_OVERLAY} className={cn('max-w-md', WF_CONTENT)}>
          <DialogHeader><DialogTitle>ระบุเหตุผล Reject</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>เหตุผล <span className="text-zinc-600">*</span></Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="กรุณาระบุ..." />
          </div>
          <DialogFooter>
            <Button variant="outline" size="modalAction" onClick={onClose} disabled={actionBusy}>ยกเลิก</Button>
            <Button variant="destructive" size="modalAction" disabled={actionBusy || !rejectReason.trim()} onClick={() => void handleAction('reject')}>
              {actionBusy ? 'กำลังดำเนินการ...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'postpone'} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent overlayClassName={WF_OVERLAY} className={cn('max-w-md', WF_CONTENT)}>
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
            <Button variant="outline" size="modalAction" onClick={onClose} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              variant="warning"
              size="modalAction"
              disabled={actionBusy || !postponeData.date || !postponeData.time || !postponeData.reason}
              onClick={() => void handleAction('postpone')}
            >
              {actionBusy ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'complete'} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent overlayClassName={WF_OVERLAY} className={cn('max-w-lg', WF_CONTENT)}>
          <DialogHeader><DialogTitle>Confirm รายการ & ดำเนินการ</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Confirmed volume (cu.m) *</Label>
              <Input type="number" step="0.01" value={completeData.volume_confirm} onChange={(e) => setCompleteData((p) => ({ ...p, volume_confirm: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>รูปหลังเท *</Label>
              <ImageUpload
                value={completeData.after_image}
                onChange={(url) => setCompleteData((p) => ({ ...p, after_image: url ?? '' }))}
                onUploadingChange={setCompleteAfterUploading}
                folder="after"
              />
              <p className="text-xs text-[#6b7280]">ต้องอัปโหลดรูปให้ครบ และรอให้ระบบรับลิงก์ก่อนกด Confirm</p>
            </div>
            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea value={completeData.note} onChange={(e) => setCompleteData((p) => ({ ...p, note: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="modalAction" onClick={onClose} disabled={actionBusy}>ยกเลิก</Button>
            <Button
              variant="success"
              size="modalAction"
              disabled={
                actionBusy
                || completeAfterUploading
                || !(completeData.after_image?.trim())
                || !completeData.volume_confirm
              }
              onClick={() => void handleAction('complete')}
            >
              {actionBusy ? 'กำลังดำเนินการ...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
