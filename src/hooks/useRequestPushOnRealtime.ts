import { useEffect } from 'react'
import { DATA_SYNC_EVENT, type DataSyncDetail } from '@/lib/dataSyncEvents'
import { useAuthStore } from '@/stores/authStore'
import { notifyRequestPushChange, wasLocalRequestMutation } from '@/lib/requestPushNotify'

/**
 * เมื่อได้รับ Realtime เปลี่ยนแปลง Request จากผู้ใช้อื่น — เรียก notify-request-change
 * (dedup 15 วินาที ที่ server กันยิงซ้ำจากหลาย client)
 */
export function useRequestPushOnRealtime(): void {
  const userId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!userId) return

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DataSyncDetail>).detail
      if (detail.table !== 'Request') return
      if (detail.eventType !== 'INSERT' && detail.eventType !== 'UPDATE') return
      if (!detail.requestId) return
      if (wasLocalRequestMutation(detail.requestId)) return

      void notifyRequestPushChange({
        requestId: detail.requestId,
        eventType: detail.eventType,
      }).catch((e) => {
        console.warn('[push] realtime notify failed:', e)
      })
    }

    window.addEventListener(DATA_SYNC_EVENT, handler)
    return () => window.removeEventListener(DATA_SYNC_EVENT, handler)
  }, [userId])
}
