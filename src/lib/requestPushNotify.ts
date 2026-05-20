import { supabase } from '@/lib/supabase'

/** กัน realtime ยิงซ้ำทันทีหลัง mutation บนเครื่องเดียวกัน (ไม่ใช้บล็อกการแจ้งเตือนแล้ว) */
const LOCAL_MUTATION_TTL_MS = 3_000
const LOCAL_MUTATION_STORAGE_PREFIX = 'pour:local-push-mutation:'

const localMutations = new Map<string, number>()

export interface NotifyRequestPushParams {
  requestId: string
  eventType?: 'INSERT' | 'UPDATE'
  actorUserId?: string | null
}

function storageKey(requestId: string): string {
  return `${LOCAL_MUTATION_STORAGE_PREFIX}${requestId}`
}

export function markLocalRequestMutation(requestId: string): void {
  const now = Date.now()
  localMutations.set(requestId, now)
  try {
    sessionStorage.setItem(storageKey(requestId), String(now))
  } catch {
    /* private mode / quota */
  }
}

export function wasLocalRequestMutation(requestId: string): boolean {
  const mem = localMutations.get(requestId)
  if (mem != null) {
    if (Date.now() - mem <= LOCAL_MUTATION_TTL_MS) return true
    localMutations.delete(requestId)
  }

  try {
    const raw = sessionStorage.getItem(storageKey(requestId))
    if (!raw) return false
    const ts = Number(raw)
    if (!Number.isFinite(ts) || Date.now() - ts > LOCAL_MUTATION_TTL_MS) {
      sessionStorage.removeItem(storageKey(requestId))
      return false
    }
    localMutations.set(requestId, ts)
    return true
  } catch {
    return false
  }
}

export async function notifyRequestPushChange(params: NotifyRequestPushParams): Promise<void> {
  const { data, error } = await supabase.functions.invoke('notify-request-change', {
    body: {
      request_id: params.requestId,
      event_type: params.eventType ?? 'UPDATE',
      actor_user_id: params.actorUserId ?? null,
    },
  })

  if (error) throw error
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }
}

/** เรียกหลัง mutation สำเร็จ — mark local + notify (ไม่ throw ถ้า push ล้ม) */
export function triggerRequestPushNotify(params: NotifyRequestPushParams): void {
  markLocalRequestMutation(params.requestId)
  void notifyRequestPushChange(params).catch((e) => {
    console.warn('[push] request notify failed:', e)
  })
}
