import webpush from "https://esm.sh/web-push@3.6.7"
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

export interface PushSubscriptionRow {
  id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

export interface PushMessage {
  title: string
  body: string
  url?: string
}

interface WebPushError extends Error {
  statusCode?: number
}

export function readVapidConfig(): void {
  const publicKey = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY")?.trim() ?? ""
  const privateKey = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY")?.trim() ?? ""
  const subject = Deno.env.get("WEB_PUSH_VAPID_SUBJECT")?.trim() ?? ""

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "ตั้ง secrets: WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY, WEB_PUSH_VAPID_SUBJECT",
    )
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

function isExpiredPushError(err: unknown): boolean {
  const e = err as WebPushError
  return e?.statusCode === 404 || e?.statusCode === 410
}

export async function sendPushToUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  message: PushMessage,
): Promise<{ sent: number; failed: number; removed: number }> {
  const { data: rows, error: fetchErr } = await supabaseAdmin
    .from("user_push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("user_id", userId)

  if (fetchErr) throw fetchErr

  const subscriptions = (rows ?? []) as PushSubscriptionRow[]
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, removed: 0 }
  }

  const pushPayload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? "/",
  })

  let sent = 0
  let failed = 0
  let removed = 0

  await Promise.all(
    subscriptions.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth_key },
      }

      try {
        await webpush.sendNotification(subscription, pushPayload)
        sent++
      } catch (err) {
        failed++
        if (isExpiredPushError(err)) {
          const { error: delErr } = await supabaseAdmin
            .from("user_push_subscriptions")
            .delete()
            .eq("id", row.id)

          if (!delErr) removed++
        }
      }
    }),
  )

  return { sent, failed, removed }
}

export async function sendPushToUsers(
  supabaseAdmin: SupabaseClient,
  userIds: Iterable<string>,
  message: PushMessage,
): Promise<{ sent: number; failed: number; removed: number; targets: number }> {
  const unique = [...new Set([...userIds].filter(Boolean))]
  if (unique.length === 0) {
    return { sent: 0, failed: 0, removed: 0, targets: 0 }
  }

  const results = await Promise.all(
    unique.map((userId) => sendPushToUser(supabaseAdmin, userId, message)),
  )

  let sent = 0
  let failed = 0
  let removed = 0
  for (const result of results) {
    sent += result.sent
    failed += result.failed
    removed += result.removed
  }

  return { sent, failed, removed, targets: unique.length }
}
