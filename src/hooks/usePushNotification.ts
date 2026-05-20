import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import {
  hasActivePushSubscription,
  pushNotificationIsSupported,
  readPushPermission,
  subscribePushNotifications,
  syncPushSubscription,
  unsubscribePushNotifications,
  type PushPermission,
} from '@/lib/pushNotification'

export function usePushNotification() {
  const user = useAuthStore((s) => s.user)
  const [permission, setPermission] = useState<PushPermission>(readPushPermission)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = pushNotificationIsSupported()

  const syncSubscriptionState = useCallback(async () => {
    if (!isSupported || !user) {
      setIsSubscribed(false)
      return
    }
    setIsSubscribed(await hasActivePushSubscription())
    setPermission(readPushPermission())
  }, [isSupported, user])

  useEffect(() => {
    void syncSubscriptionState()
  }, [syncSubscriptionState])

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('เบราว์เซอร์ไม่รองรับ Web Push')
      return false
    }
    if (!user) {
      setError('ต้องล็อกอินก่อน')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await subscribePushNotifications(user.id)
      setPermission(readPushPermission())
      setIsSubscribed(true)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'ลงทะเบียนแจ้งเตือนไม่สำเร็จ'
      setError(message)
      setPermission(readPushPermission())
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, user])

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !user) return false
    setLoading(true)
    setError(null)

    try {
      await unsubscribePushNotifications(user.id)
      setIsSubscribed(false)
      return true
    } catch (e) {
      const message = e instanceof Error ? e.message : 'ยกเลิกการแจ้งเตือนไม่สำเร็จ'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, user])

  const syncSubscription = useCallback(async () => {
    if (!isSupported || !user) return false
    setLoading(true)
    setError(null)

    try {
      const ok = await syncPushSubscription(user.id)
      setPermission(readPushPermission())
      setIsSubscribed(ok || (await hasActivePushSubscription()))
      return ok
    } catch (e) {
      const message = e instanceof Error ? e.message : 'ซิงก์การแจ้งเตือนไม่สำเร็จ'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported, user])

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    syncSubscription,
  }
}
