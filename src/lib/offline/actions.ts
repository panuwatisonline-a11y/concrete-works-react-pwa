import { toast } from 'sonner'
import { enqueueOfflineMutation } from '@/lib/offline/queue'
import type { OfflineMutationKind } from '@/lib/offline/types'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { isFullyOnline, useConnectivityStore } from '@/stores/connectivityStore'

export function canQueueOfflineActions(): boolean {
  const phase = useConnectivityStore.getState().phase
  return phase === 'offline' || phase === 'degraded'
}

/** รัน online ทันที หรือเข้าคิวเมื่อออฟไลน์ */
export async function runOrQueueMutation(opts: {
  kind: OfflineMutationKind
  requestId: string
  userId: string
  payload: Record<string, unknown>
  online: () => Promise<boolean>
  queuedMessage?: string
}): Promise<boolean> {
  if (isFullyOnline()) {
    return opts.online()
  }

  const phase = useConnectivityStore.getState().phase
  if (phase === 'syncing') {
    toast.message('กำลังซิงค์ข้อมูล…')
    return false
  }

  if (!canQueueOfflineActions()) {
    toast.error('ยังเชื่อมต่อระบบไม่ได้ — ลองใหม่อีกครั้ง')
    return false
  }

  if (!opts.userId) {
    toast.error('ไม่พบผู้ใช้')
    return false
  }

  await enqueueOfflineMutation({
    kind: opts.kind,
    requestId: opts.requestId,
    userId: opts.userId,
    payload: opts.payload,
  })

  await notifyRequestListChanged()
  toast.success(opts.queuedMessage ?? 'บันทึกในคิว — จะส่งเมื่อเชื่อมต่อได้')
  return true
}

export function isOfflineReadMode(): boolean {
  return useConnectivityStore.getState().usingOfflineCache
}
