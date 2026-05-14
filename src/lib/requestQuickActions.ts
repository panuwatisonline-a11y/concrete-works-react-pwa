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

export type RequestListActionItem = {
  key: string
  modal: RequestActionModal
  label: string
  variant: BtnVariant
}

/** สอดคล้องกับปุ่มใน `RequestDetailPage` (Action Panel) */
export function getRequestListQuickActions(opts: {
  statusId: number
  role: string | null | undefined
  userId: string | undefined
  bookedBy: string | null
}): RequestListActionItem[] {
  const { statusId: sid, role, userId, bookedBy } = opts
  const isOwner = Boolean(userId && bookedBy === userId)
  const canAct = role === 'admin' || role === 'manager'
  const showPanel = canAct || (sid === 1 && isOwner) || (sid <= 3 && isOwner)
  if (!showPanel) return []

  const out: RequestListActionItem[] = []
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
    out.push({ key: 'complete', modal: 'complete', label: 'Confirm รายการ', variant: 'success' })
  }
  if (sid === 5 && canAct) {
    out.push({ key: 'reApprove', modal: 'reApprove', label: 'สั่งเทใหม่', variant: 'default' })
  }
  if ([1, 2, 3].includes(sid) && (canAct || isOwner)) {
    out.push({ key: 'cancel', modal: 'cancel', label: 'ยกเลิก', variant: 'outline' })
  }
  return out
}
