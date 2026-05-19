import type { VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'

type BtnVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>

export type RequestActionModal =
  | 'inspect'
  | 'approve'
  | 'reject'
  | 'cancel'
  | 'confirmOrder'
  | 'postpone'
  | 'complete'
  | 'reApprove'
  | 'uploadBeforeOnly'
  | 'uploadEslipOnly'

export type RequestListActionItem =
  | { key: string; modal: RequestActionModal; label: string; variant: BtnVariant }
  | { key: string; cloneFromRequestId: string; label: string; variant: BtnVariant }
  | { key: string; printChecklist: true; label: string; variant: BtnVariant }
  | { key: string; copyOrderLoad: true; label: string; variant: BtnVariant }

/** พิมพ์ checklist ได้ตั้งแต่รออนุมัติ — ยกเว้น reject/cancel */
export function canPrintChecklistBeforePour(statusId: number): boolean {
  return statusId >= 2 && statusId !== 6 && statusId !== 7
}

/** สอดคล้องกับปุ่มใน `RequestDetailPage` (Action Panel) */
export function getRequestListQuickActions(opts: {
  requestId: string
  statusId: number
  role: string | null | undefined
  userId: string | undefined
  bookedBy: string | null
  beforeImage: string | null | undefined
  eslipUrl?: string | null | undefined
}): RequestListActionItem[] {
  const { requestId, statusId: sid, role, userId, bookedBy, beforeImage, eslipUrl } = opts
  const isOwner = Boolean(userId && bookedBy === userId)
  const canAct = role === 'admin' || role === 'manager'
  const showPanel =
    canAct || (sid === 1 && isOwner) || (sid <= 3 && isOwner) || ((sid === 6 || sid === 7) && isOwner)
  const missingBeforeImage = !beforeImage?.trim()
  const hasEslip = Boolean(eslipUrl?.trim())

  const out: RequestListActionItem[] = []

  if (showPanel && sid === 1 && missingBeforeImage && (canAct || isOwner)) {
    out.push({
      key: 'uploadBefore',
      modal: 'uploadBeforeOnly',
      label: 'อัปโหลดรูปก่อนเท',
      variant: 'secondary',
    })
  }

  if (showPanel) {
    if (sid === 1 && canAct) {
      out.push({ key: 'inspect', modal: 'inspect', label: 'ตรวจสอบ', variant: 'default' })
    }
    if (sid === 2 && canAct) {
      out.push({ key: 'approve', modal: 'approve', label: 'อนุมัติ', variant: 'success' })
      out.push({ key: 'reject', modal: 'reject', label: 'Reject', variant: 'destructive' })
    }
    if (sid === 3 && canAct) {
      out.push({ key: 'confirmOrder', modal: 'confirmOrder', label: 'สั่งเท', variant: 'default' })
      out.push({ key: 'postpone', modal: 'postpone', label: 'เลื่อนวัน', variant: 'warning' })
    }
    if (sid === 4 && canAct) {
      out.push({
        key: 'uploadEslip',
        modal: 'uploadEslipOnly',
        label: hasEslip ? 'Bill Concrete (แนบแล้ว)' : 'อัปโหลด Bill Concrete',
        variant: hasEslip ? 'success' : 'secondary',
      })
      out.push({ key: 'complete', modal: 'complete', label: 'Confirm รายการ', variant: 'success' })
    }
    if (sid === 5 && canAct) {
      out.push({ key: 'reApprove', modal: 'reApprove', label: 'สั่งเทใหม่', variant: 'default' })
    }
    if ([1, 2, 3].includes(sid) && (canAct || isOwner)) {
      out.push({ key: 'cancel', modal: 'cancel', label: 'ยกเลิก', variant: 'outline' })
    }
    if ((sid === 6 || sid === 7) && isOwner) {
      out.push({
        key: 'cloneFrom',
        cloneFromRequestId: requestId,
        label: 'จองใหม่',
        variant: 'default',
      })
    }
  }

  if (canPrintChecklistBeforePour(sid)) {
    out.push({
      key: 'printChecklist',
      printChecklist: true,
      label: 'พิมพ์ Checklist',
      variant: 'outline',
    })
  }

  if (sid === 4 && canAct) {
    out.push({ key: 'copyOrderLoad', copyOrderLoad: true, label: 'คัดลอก', variant: 'outline' })
  }

  return out
}
