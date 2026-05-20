import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { pushNotificationIsSupported, syncPushSubscription } from '@/lib/pushNotification'

/**
 * หลัง login — ถ้าผู้ใช้อนุญาตแจ้งเตือนไว้แล้ว ให้ซิงก์ subscription กลับเข้า DB โดยไม่ถาม permission ซ้ำ
 */
export function usePushNotificationAutoSync(): void {
  const userId = useAuthStore((s) => s.user?.id)
  const syncedForUserRef = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || !pushNotificationIsSupported()) return
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') return
    if (syncedForUserRef.current === userId) return

    syncedForUserRef.current = userId
    void syncPushSubscription(userId).catch((e) => {
      console.warn('[push] auto-sync failed:', e)
      syncedForUserRef.current = null
    })
  }, [userId])
}
