import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { readVapidConfig, sendPushToUsers } from "./_shared/webPush.ts"

interface NotifyRequestBody {
  request_id: string
  event_type?: "INSERT" | "UPDATE"
  actor_user_id?: string | null
}

interface ProfileMini {
  fname: string | null
  lname: string | null
  employee_id: string | null
}

interface MixedCodeRow {
  id?: number
  mixcode: string
  supplier: string | null
  strength: number | null
  slump: string | null
  strength_type: string | null
}

interface RequestRow {
  id: string
  status_id: number
  structure_no: string | null
  mixcode_id: number | null
  booked_by: string | null
  inspected_by: string | null
  approved_by: string | null
  rejected_by: string | null
  postponed_by: string | null
  cancelled_by: string | null
  confirmed_by: string | null
  casting_date: string | null
  request_time: string | null
  strength: number | null
  volume_request: number | null
  volume_actual: number | null
  volume_confirm: number | null
  sample_qty: number | null
  postpone_date: string | null
  reason_postpone: string | null
  reason_reject: string | null
  reason_cancel: string | null
  status?: { status_name: string } | { status_name: string }[] | null
  client?: { client_name: string } | { client_name: string }[] | null
  location?: { full_location: string | null; location1: string } | {
    full_location: string | null
    location1: string
  }[] | null
  structure?: { structure_name: string } | { structure_name: string }[] | null
  concrete_work?: { concrete_work: string } | { concrete_work: string }[] | null
  booked_by_profile?: ProfileMini | ProfileMini[] | null
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const DEDUP_WINDOW_SEC = 15

const STATUS_HEADLINE: Record<number, string> = {
  1: "คำขอใหม่",
  2: "ตรวจสอบแล้ว",
  3: "อนุมัติแล้ว",
  4: "สั่งเทแล้ว",
  5: "เลื่อนวันเท",
  6: "ถูก Reject",
  7: "ยกเลิกแล้ว",
  8: "เสร็จสิ้น",
}

const REQUEST_SELECT = `
  id, status_id, structure_no, mixcode_id, booked_by,
  inspected_by, approved_by, rejected_by, postponed_by, cancelled_by, confirmed_by,
  casting_date, request_time, strength, sample_qty, volume_request, volume_actual, volume_confirm,
  postpone_date, reason_postpone, reason_reject, reason_cancel,
  status:Status(status_name),
  client:Client(client_name),
  location:Location(full_location, location1),
  structure:Structure(structure_name),
  concrete_work:"Concrete Works"(concrete_work),
  booked_by_profile:profiles!booked_by(fname, lname, employee_id)
`

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? v[0] ?? null : v
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1))}…`
}

function shortRequestId(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

function formatDateTh(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso.trim()}T12:00:00`)
    if (Number.isNaN(d.getTime())) return iso.trim()
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return iso.trim()
  }
}

function formatTimeHm(time: string | null | undefined): string | null {
  if (!time?.trim()) return null
  return time.trim().slice(0, 5)
}

function formatVolume(vol: number | null | undefined): string | null {
  if (vol == null || Number.isNaN(vol)) return null
  return `${vol.toFixed(2)} cu.m`
}

function formatProfileName(p: ProfileMini | null): string | null {
  if (!p) return null
  const name = [p.fname, p.lname].filter(Boolean).join(" ").trim()
  const emp = p.employee_id?.trim()
  if (name && emp) return `${name} (${emp})`
  return name || emp || null
}

function dash(value: string | null | undefined): string {
  const v = value?.trim()
  return v ? v : "—"
}

async function loadMixedCodeRow(
  supabaseAdmin: ReturnType<typeof createClient>,
  row: RequestRow,
): Promise<MixedCodeRow | null> {
  const mixcodeId = row.mixcode_id
  if (mixcodeId == null) return null

  const { data, error } = await supabaseAdmin
    .from("Mixed Code")
    .select("id, mixcode, supplier, strength, slump, strength_type")
    .eq("id", mixcodeId)
    .maybeSingle()

  if (error) throw error
  return (data as MixedCodeRow | null) ?? null
}

function formatStrengthPart(
  mix: MixedCodeRow | null,
  requestStrength: number | null,
): string | null {
  if (mix?.strength != null) {
    const type = mix.strength_type?.trim()
    return type ? `${mix.strength} ${type}` : String(mix.strength)
  }
  if (requestStrength != null && !Number.isNaN(requestStrength)) {
    return String(requestStrength)
  }
  return null
}

/** mixcode + strength + supplier ในบรรทัดเดียว */
function formatMixCodeLine(
  mix: MixedCodeRow | null,
  requestStrength: number | null,
): string | null {
  const parts = [
    mix?.mixcode?.trim(),
    formatStrengthPart(mix, requestStrength),
    mix?.supplier?.trim(),
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : null
}

function formatSampleQty(qty: number | null | undefined): string | null {
  if (qty == null || Number.isNaN(qty)) return null
  return `${qty} ก้อน`
}

function pushLabelLine(label: string, value: string | null | undefined): string {
  return `${label}: ${dash(value)}`
}

function formatCastingDateTime(
  castingDate: string | null | undefined,
  requestTime: string | null | undefined,
): string | null {
  const date = formatDateTh(castingDate)
  const time = formatTimeHm(requestTime)
  if (date && time) return `${date} ${time}`
  return date || time || null
}

function buildRequestPushMessage(
  row: RequestRow,
  mix: MixedCodeRow | null,
): { title: string; body: string } {
  const headline = STATUS_HEADLINE[row.status_id] ?? "Request"
  const statusName = relOne(row.status)?.status_name?.trim() || headline
  const loc = relOne(row.location)
  const locationLine = loc?.full_location?.trim() || loc?.location1?.trim() || null
  const structureName = relOne(row.structure)?.structure_name?.trim()
  const structureNo = row.structure_no?.trim()

  const title = "ระบบแจ้งเตือนอัตโนมัติ"

  const lines = [
    pushLabelLine("Status", statusName),
    pushLabelLine("Date / Time", formatCastingDateTime(row.casting_date, row.request_time)),
    pushLabelLine("Concrete Work", relOne(row.concrete_work)?.concrete_work?.trim()),
    pushLabelLine("Location", locationLine),
    pushLabelLine("Structure", structureName),
    pushLabelLine("Structure No.", structureNo),
    pushLabelLine("Mix code", formatMixCodeLine(mix, row.strength)),
    pushLabelLine(
      "Volume",
      formatVolume(row.volume_confirm ?? row.volume_actual ?? row.volume_request),
    ),
    pushLabelLine("เก็บตัวอย่าง", formatSampleQty(row.sample_qty)),
    pushLabelLine("Request by", formatProfileName(relOne(row.booked_by_profile))),
  ]

  if (row.status_id === 5) {
    const pd = formatDateTh(row.postpone_date)
    const reason = row.reason_postpone?.trim()
    if (pd || reason) {
      lines.push(pushLabelLine("Postpone to", pd))
      if (reason) lines.push(pushLabelLine("Reason", truncate(reason, 80)))
    }
  }
  if (row.status_id === 6 && row.reason_reject?.trim()) {
    lines.push(pushLabelLine("Reason", truncate(row.reason_reject.trim(), 80)))
  }
  if (row.status_id === 7 && row.reason_cancel?.trim()) {
    lines.push(pushLabelLine("Reason", truncate(row.reason_cancel.trim(), 80)))
  }

  return { title, body: truncate(lines.join("\n"), 420) }
}

/** ผู้รับ = ทุก user ที่เปิด Push ไว้ (มีแถวใน user_push_subscriptions) */
async function resolveAllPushSubscribers(
  supabaseAdmin: ReturnType<typeof createClient>,
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("user_push_subscriptions")
    .select("user_id")

  if (error) throw error

  const ids = new Set<string>()
  for (const row of data ?? []) {
    const userId = row.user_id as string | null
    if (userId) ids.add(userId)
  }
  return [...ids]
}

/** กันยิงซ้ำแบบ atomic (ต้องมี migration claim_push_notify_event) */
async function claimPushNotifyEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  statusId: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("claim_push_notify_event", {
    p_request_id: requestId,
    p_status_id: statusId,
    p_window_seconds: DEDUP_WINDOW_SEC,
  })

  if (error) throw error
  return data === true
}

/** คืนสิทธิ์ส่งซ้ำถ้า push ล้มเหลว (กัน dedup ค้าง) */
async function releasePushNotifyClaim(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  statusId: number,
): Promise<void> {
  const since = new Date(Date.now() - (DEDUP_WINDOW_SEC + 5) * 1000).toISOString()
  const { error } = await supabaseAdmin
    .from("push_notify_events")
    .delete()
    .eq("request_id", requestId)
    .eq("status_id", statusId)
    .gte("created_at", since)

  if (error) throw error
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const internalSecret = req.headers.get("X-Push-Internal-Secret")?.trim() ?? ""
  const expectedSecret = Deno.env.get("PUSH_INTERNAL_SECRET")?.trim() ?? ""
  const isInternal = Boolean(expectedSecret && internalSecret === expectedSecret)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  if (!isInternal) {
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }
  }

  try {
    const body = (await req.json()) as NotifyRequestBody
    const requestId = body.request_id?.trim()

    if (!requestId) {
      return jsonResponse({ error: "request_id is required" }, 400)
    }

    const { data: request, error: reqErr } = await supabaseAdmin
      .from("Request")
      .select(REQUEST_SELECT)
      .eq("id", requestId)
      .maybeSingle()

    if (reqErr) throw reqErr
    if (!request) {
      return jsonResponse({ error: "Request not found" }, 404)
    }

    const row = request as RequestRow
    if (!STATUS_HEADLINE[row.status_id]) {
      return jsonResponse({ skipped: true, reason: "unsupported_status" }, 200)
    }

    const recipients = await resolveAllPushSubscribers(supabaseAdmin)

    if (recipients.length === 0) {
      return jsonResponse({ skipped: true, reason: "no_push_subscribers" }, 200)
    }

    const claimed = await claimPushNotifyEvent(supabaseAdmin, row.id, row.status_id)
    if (!claimed) {
      return jsonResponse({ skipped: true, reason: "dedup" }, 200)
    }

    try {
      readVapidConfig()

      const mix = await loadMixedCodeRow(supabaseAdmin, row)
      const message = buildRequestPushMessage(row, mix)
      const result = await sendPushToUsers(supabaseAdmin, recipients, {
        title: message.title,
        body: message.body,
        url: `/requests/${row.id}`,
      })

      if ((result.sent ?? 0) === 0) {
        await releasePushNotifyClaim(supabaseAdmin, row.id, row.status_id)
        return jsonResponse({
          ...result,
          recipients: recipients.length,
          skipped: true,
          reason: "push_delivery_failed",
        }, 200)
      }

      return jsonResponse({ ...result, recipients: recipients.length }, 200)
    } catch (e) {
      await releasePushNotifyClaim(supabaseAdmin, row.id, row.status_id).catch(() => {})
      throw e
    }
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: msg }, 500)
  }
})
