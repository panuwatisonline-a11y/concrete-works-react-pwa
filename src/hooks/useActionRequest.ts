import { runOrQueueMutation } from '@/lib/offline/actions'
import {
  runApproveMutation,
  runCancelMutation,
  runCompleteMutation,
  runConfirmOrderMutation,
  runInspectMutation,
  runPostponeMutation,
  runRejectMutation,
} from '@/lib/requestMutations'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { markLocalRequestMutation, triggerRequestPushNotify } from '@/lib/requestPushNotify'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

async function afterRequestMutation(requestId: string, actorUserId?: string | null): Promise<void> {
  await notifyRequestListChanged()
  triggerRequestPushNotify({ requestId, eventType: 'UPDATE', actorUserId })
}

export function useActionRequest() {
  const { user } = useAuthStore()
  const uid = user?.id ?? ''

  async function inspect(
    requestId: string,
    note?: string,
    corrections?: {
      location_id: number
      concrete_work_id: number
      structure_id: number
      structure_no: string | null
      mixcode_id: number
      volume_request: number
      before_image: string | null
    },
  ) {
    return runOrQueueMutation({
      kind: 'workflow_inspect',
      requestId,
      userId: uid,
      payload: { note, corrections },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runInspectMutation(requestId, uid, { note, corrections })
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('ตรวจสอบเรียบร้อย')
        return true
      },
    })
  }

  async function approve(requestId: string, note?: string) {
    return runOrQueueMutation({
      kind: 'workflow_approve',
      requestId,
      userId: uid,
      payload: { note },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runApproveMutation(requestId, uid, { note })
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('อนุมัติเรียบร้อย')
        return true
      },
    })
  }

  async function reject(requestId: string, reason: string) {
    return runOrQueueMutation({
      kind: 'workflow_reject',
      requestId,
      userId: uid,
      payload: { reason },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runRejectMutation(requestId, uid, { reason })
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.warning('Reject เรียบร้อย')
        return true
      },
    })
  }

  async function postpone(requestId: string, data: { date: string; time: string; reason: string }) {
    return runOrQueueMutation({
      kind: 'workflow_postpone',
      requestId,
      userId: uid,
      payload: data,
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runPostponeMutation(requestId, uid, data)
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('เลื่อนวันเรียบร้อย')
        return true
      },
    })
  }

  async function confirmOrder(requestId: string, note?: string, volumeActual?: number) {
    return runOrQueueMutation({
      kind: 'workflow_confirm_order',
      requestId,
      userId: uid,
      payload: { note, volumeActual },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runConfirmOrderMutation(requestId, uid, { note, volumeActual })
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('สั่งเทคอนกรีตแล้ว')
        return true
      },
    })
  }

  async function complete(
    requestId: string,
    data: {
      volume_confirm: number
      volume_actual?: number
      strength?: number
      after_image?: string
      eslip_url?: string
      checksheet_url?: string
      note?: string
    },
  ) {
    return runOrQueueMutation({
      kind: 'workflow_complete',
      requestId,
      userId: uid,
      payload: data,
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runCompleteMutation(requestId, uid, data)
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('Confirm เรียบร้อย — ดำเนินการสำเร็จ')
        return true
      },
    })
  }

  async function cancel(requestId: string, reason: string) {
    return runOrQueueMutation({
      kind: 'workflow_cancel',
      requestId,
      userId: uid,
      payload: { reason },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runCancelMutation(requestId, uid, { reason })
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.warning('ยกเลิกเรียบร้อย')
        return true
      },
    })
  }

  async function reApprove(requestId: string, note?: string) {
    return runOrQueueMutation({
      kind: 'workflow_re_approve',
      requestId,
      userId: uid,
      payload: { note },
      online: async () => {
        markLocalRequestMutation(requestId)
        const r = await runApproveMutation(requestId, uid, { note }, 're_approved')
        if (!r.ok) {
          toast.error('เกิดข้อผิดพลาด')
          return false
        }
        await afterRequestMutation(requestId, uid)
        toast.success('อนุมัติสั่งเทใหม่เรียบร้อย')
        return true
      },
    })
  }

  return { inspect, approve, reject, postpone, confirmOrder, complete, cancel, reApprove }
}
