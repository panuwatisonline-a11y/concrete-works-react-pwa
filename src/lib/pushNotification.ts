import { supabase } from '@/lib/supabase'
import { getPwaServiceWorkerRegistration } from '@/register-pwa'

export type PushPermission = NotificationPermission | 'unsupported'

export type PushUnavailableReason =
  | 'insecure-context'
  | 'no-api'
  | 'no-vapid-key'
  | 'no-service-worker'

interface PushSubscriptionRow {
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

export function pushNotificationIsSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext
}

export function getPushUnavailableReason(): PushUnavailableReason | null {
  if (typeof window === 'undefined') return 'no-api'
  if (!pushNotificationIsSecureContext()) return 'insecure-context'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'no-api'
  }
  if (!import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim()) return 'no-vapid-key'
  return null
}

export function pushNotificationIsSupported(): boolean {
  return getPushUnavailableReason() === null
}

export function pushUnavailableMessage(reason: PushUnavailableReason): string {
  switch (reason) {
    case 'insecure-context':
      return 'เปิดผ่าน https หรือ http://localhost:3000 เท่านั้น (IP Wi‑Fi เช่น 192.168.x.x ใช้ Push ไม่ได้)'
    case 'no-vapid-key':
      return 'ไม่พบ VITE_WEB_PUSH_PUBLIC_KEY ใน .env'
    case 'no-service-worker':
      return 'Service Worker ยังไม่พร้อม — รอสักครู่แล้ว refresh หรือใช้ npm run preview'
    default:
      return 'เบราว์เซอร์ไม่รองรับ Web Push'
  }
}

export function readPushPermission(): PushPermission {
  if (!pushNotificationIsSupported()) return 'unsupported'
  return Notification.permission
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) {
    view[i] = raw.charCodeAt(i)
  }
  return view
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) throw new Error('Missing subscription key')
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function waitForActiveRegistration(timeoutMs = 12_000): Promise<ServiceWorkerRegistration> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const fromPwa = getPwaServiceWorkerRegistration()
    if (fromPwa?.active && fromPwa.pushManager) return fromPwa

    const reg = await navigator.serviceWorker.getRegistration()
    if (reg?.active && reg.pushManager) return reg

    await new Promise((r) => window.setTimeout(r, 250))
  }

  try {
    const ready = await navigator.serviceWorker.ready
    if (ready.active && ready.pushManager) return ready
  } catch {
    /* ignore */
  }

  throw new Error(pushUnavailableMessage('no-service-worker'))
}

export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  const reason = getPushUnavailableReason()
  if (reason) throw new Error(pushUnavailableMessage(reason))

  return waitForActiveRegistration()
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!pushNotificationIsSupported()) return false
  try {
    const registration = await getServiceWorkerRegistration()
    const sub = await registration.pushManager.getSubscription()
    return !!sub
  } catch {
    return false
  }
}

export async function savePushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
  const p256dh = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  if (!p256dh || !auth) throw new Error('Subscription keys ไม่ครบ')

  const row: PushSubscriptionRow = {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(p256dh),
    auth_key: arrayBufferToBase64(auth),
  }

  const { error: pruneErr } = await supabase
    .from('user_push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .neq('endpoint', subscription.endpoint)

  if (pruneErr) throw pruneErr

  const { error } = await supabase.from('user_push_subscriptions').upsert(row, { onConflict: 'endpoint' })
  if (error) throw error
}

async function ensureBrowserPushSubscription(): Promise<PushSubscription> {
  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim()
  if (!publicKey) throw new Error(pushUnavailableMessage('no-vapid-key'))

  const registration = await getServiceWorkerRegistration()
  await navigator.serviceWorker.ready

  if (!registration.pushManager) {
    throw new Error('Registration failed - push service not available')
  }

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('push service not available')) {
        throw new Error(
          'Push ยังไม่พร้อม — ใช้ http://localhost:3000 (ไม่ใช่ IP Wi‑Fi) หรือ npm run preview แล้วลองใหม่',
        )
      }
      throw e
    }
  }
  return subscription
}

/** ซิงก์ subscription ที่มีอยู่แล้วไป DB — ไม่ถาม permission ใหม่ */
export async function syncPushSubscription(userId: string): Promise<boolean> {
  if (!pushNotificationIsSupported()) return false
  if (Notification.permission !== 'granted') return false

  const subscription = await ensureBrowserPushSubscription()
  await savePushSubscription(userId, subscription)
  return true
}

/** ขอ permission แล้ว subscribe + บันทึก DB */
export async function subscribePushNotifications(userId: string): Promise<boolean> {
  const reason = getPushUnavailableReason()
  if (reason) throw new Error(pushUnavailableMessage(reason))

  const result = await Notification.requestPermission()
  if (result !== 'granted') {
    throw new Error('ผู้ใช้ไม่อนุญาตการแจ้งเตือน')
  }

  const subscription = await ensureBrowserPushSubscription()
  await savePushSubscription(userId, subscription)
  return true
}

export async function unsubscribePushNotifications(userId: string): Promise<boolean> {
  if (!pushNotificationIsSupported()) return false

  const registration = await getServiceWorkerRegistration()
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return true

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()

  await supabase
    .from('user_push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  return true
}

export interface SendPushPayload {
  target_user_id: string
  title: string
  body: string
  url?: string
}

export async function sendPushNotification(payload: SendPushPayload) {
  const { data, error } = await supabase.functions.invoke('send-push', { body: payload })
  if (error) throw error
  return data as {
    sent?: number
    failed?: number
    removed?: number
    error?: string
    message?: string
  }
}
