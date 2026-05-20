import { supabase } from '@/lib/supabase'

const LOCAL_MUTATION_TTL_MS = 8_000
const localMutations = new Map<string, number>()

export interface NotifyRequestPushParams {
  requestId: string
  eventType?: 'INSERT' | 'UPDATE'
  actorUserId?: string | null
}

export function markLocalRequestMutation(requestId: string): void {
  localMutations.set(requestId, Date.now())
}

export function wasLocalRequestMutation(requestId: string): boolean {
  const ts = localMutations.get(requestId)
  if (!ts) return false
  if (Date.now() - ts > LOCAL_MUTATION_TTL_MS) {
    localMutations.delete(requestId)
    return false
  }
  return true
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
