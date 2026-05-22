import { dispatchVisibilityResync } from '@/lib/dataSyncEvents'
import { fetchRequestById } from '@/lib/requestQueries'
import { executeOfflineMutation } from '@/lib/requestMutations'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { markLocalRequestMutation, triggerRequestPushNotify } from '@/lib/requestPushNotify'
import { getPendingMutations, removeMutation, refreshPendingMutationCount } from '@/lib/offline/queue'
import { isFullyOnline } from '@/stores/connectivityStore'
import { useConnectivityStore } from '@/stores/connectivityStore'
import { toast } from 'sonner'

const EXPECTED_STATUS: Partial<Record<string, number[]>> = {
  workflow_inspect: [1],
  workflow_approve: [2],
  workflow_reject: [1, 2],
  workflow_postpone: [2, 3, 4],
  workflow_confirm_order: [4],
  workflow_complete: [4],
  workflow_cancel: [1, 2, 3, 4, 5],
  workflow_re_approve: [5, 6, 7],
}

async function validateBeforeFlush(
  mutation: Awaited<ReturnType<typeof getPendingMutations>>[number],
): Promise<string | null> {
  if (mutation.kind === 'create_request' || mutation.kind === 'patch_before_image' || mutation.kind === 'patch_eslip_url' || mutation.kind === 'update_request') {
    return null
  }
  const req = await fetchRequestById(mutation.requestId)
  if (!req) return 'ไม่พบคำขอในระบบ'
  const allowed = EXPECTED_STATUS[mutation.kind]
  if (allowed && !allowed.includes(req.status_id)) {
    return `สถานะเปลี่ยนเป็น ${req.status_id} แล้ว — ยกเลิกรายการในคิว`
  }
  return null
}

export async function flushOfflineMutationQueue(): Promise<{ sent: number; failed: number }> {
  if (!isFullyOnline()) return { sent: 0, failed: 0 }

  const store = useConnectivityStore.getState()
  if (store.flushingQueue) return { sent: 0, failed: 0 }

  store.setFlushingQueue(true)
  let sent = 0
  let failed = 0

  try {
    const pending = await getPendingMutations()
    if (pending.length === 0) return { sent: 0, failed: 0 }

    for (const m of pending) {
      const conflict = await validateBeforeFlush(m)
      if (conflict) {
        await removeMutation(m.id)
        failed += 1
        toast.warning(conflict)
        continue
      }

      if (m.kind !== 'create_request') {
        markLocalRequestMutation(m.requestId)
      }

      const result = await executeOfflineMutation(m)
      if (!result.ok) {
        failed += 1
        toast.error(`ส่งคิวไม่สำเร็จ: ${result.message}`)
        continue
      }

      await removeMutation(m.id)
      sent += 1

      const rid: string =
        result.ok && result.requestId ? result.requestId : m.requestId

      triggerRequestPushNotify({
        requestId: rid,
        eventType: m.kind === 'create_request' ? 'INSERT' : 'UPDATE',
        actorUserId: m.userId,
      })
    }

    if (sent > 0) {
      await notifyRequestListChanged()
      dispatchVisibilityResync()
      toast.success(`ส่งคิวออฟไลน์สำเร็จ ${sent} รายการ`)
    }
    if (failed > 0 && sent === 0) {
      toast.error(`ส่งคิวไม่สำเร็จ ${failed} รายการ`)
    }

    return { sent, failed }
  } finally {
    useConnectivityStore.getState().setFlushingQueue(false)
    await refreshPendingMutationCount()
  }
}
