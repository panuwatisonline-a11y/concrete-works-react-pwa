import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { readVapidConfig, sendPushToUsers } from "./_shared/webPush.ts"

interface NotifyRequestBody {
  request_id: string
  event_type?: "INSERT" | "UPDATE"
  actor_user_id?: string | null
}

interface RequestRow {
  id: string
  status_id: number
  structure_no: string | null
  booked_by: string | null
  inspected_by: string | null
  approved_by: string | null
  rejected_by: string | null
  postponed_by: string | null
  cancelled_by: string | null
  confirmed_by: string | null
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-push-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const DEDUP_WINDOW_SEC = 15

const STATUS_PUSH: Record<number, { title: string; body: (structureNo: string | null) => string }> = {
  1: {
    title: "คำขอใหม่",
    body: (no) => `คำขอ ${no ?? "—"} รอตรวจสอบ`,
  },
  2: {
    title: "ตรวจสอบแล้ว",
    body: (no) => `คำขอ ${no ?? "—"} ผ่านการตรวจสอบ`,
  },
  3: {
    title: "อนุมัติแล้ว",
    body: (no) => `คำขอ ${no ?? "—"} ได้รับอนุมัติ`,
  },
  4: {
    title: "สั่งเทแล้ว",
    body: (no) => `คำขอ ${no ?? "—"} ยืนยันการสั่งเทคอนกรีต`,
  },
  5: {
    title: "เลื่อนวันเท",
    body: (no) => `คำขอ ${no ?? "—"} ถูกเลื่อนวันเท`,
  },
  6: {
    title: "ถูก Reject",
    body: (no) => `คำขอ ${no ?? "—"} ถูกปฏิเสธ`,
  },
  7: {
    title: "ยกเลิกแล้ว",
    body: (no) => `คำขอ ${no ?? "—"} ถูกยกเลิก`,
  },
  8: {
    title: "เสร็จสิ้น",
    body: (no) => `คำขอ ${no ?? "—"} ดำเนินการเสร็จสิ้น`,
  },
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function inferActor(row: RequestRow): string | null {
  switch (row.status_id) {
    case 1:
      return row.booked_by
    case 2:
      return row.inspected_by
    case 3:
      return row.approved_by
    case 4:
      return row.confirmed_by
    case 5:
      return row.postponed_by
    case 6:
      return row.rejected_by
    case 7:
      return row.cancelled_by
    case 8:
      return row.confirmed_by
    default:
      return null
  }
}

async function findInspectorPrimariesForBooker(
  supabaseAdmin: ReturnType<typeof createClient>,
  bookedBy: string,
): Promise<string[]> {
  const { data: members, error } = await supabaseAdmin
    .from("Inspector_Member")
    .select("inspector_id")
    .eq("profile_id", bookedBy)

  if (error) throw error

  const inspectorIds = [...new Set((members ?? []).map((m) => m.inspector_id as number))]
  if (inspectorIds.length === 0) return []

  const { data: inspectors, error: inspErr } = await supabaseAdmin
    .from("Inspector")
    .select("primary_profile_id")
    .in("id", inspectorIds)

  if (inspErr) throw inspErr

  const ids = new Set<string>()
  for (const row of inspectors ?? []) {
    const primary = row.primary_profile_id as string | null
    if (primary) ids.add(primary)
  }
  return [...ids]
}

async function resolveRecipients(
  supabaseAdmin: ReturnType<typeof createClient>,
  row: RequestRow,
  eventType: "INSERT" | "UPDATE",
): Promise<string[]> {
  const recipients = new Set<string>()
  const bookedBy = row.booked_by

  if ((eventType === "INSERT" || row.status_id === 1) && bookedBy) {
    const primaries = await findInspectorPrimariesForBooker(supabaseAdmin, bookedBy)
    for (const id of primaries) recipients.add(id)
  }

  if (row.status_id !== 1 && bookedBy) {
    recipients.add(bookedBy)
  }

  return [...recipients]
}

async function shouldSkipDedup(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  statusId: number,
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_WINDOW_SEC * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from("push_notify_events")
    .select("id")
    .eq("request_id", requestId)
    .eq("status_id", statusId)
    .gte("created_at", since)
    .limit(1)

  if (error) throw error
  return (data?.length ?? 0) > 0
}

async function recordNotifyEvent(
  supabaseAdmin: ReturnType<typeof createClient>,
  requestId: string,
  statusId: number,
): Promise<void> {
  const { error } = await supabaseAdmin.from("push_notify_events").insert({
    request_id: requestId,
    status_id: statusId,
  })
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
    const eventType = body.event_type ?? "UPDATE"

    if (!requestId) {
      return jsonResponse({ error: "request_id is required" }, 400)
    }

    const { data: request, error: reqErr } = await supabaseAdmin
      .from("Request")
      .select(
        "id, status_id, structure_no, booked_by, inspected_by, approved_by, rejected_by, postponed_by, cancelled_by, confirmed_by",
      )
      .eq("id", requestId)
      .maybeSingle()

    if (reqErr) throw reqErr
    if (!request) {
      return jsonResponse({ error: "Request not found" }, 404)
    }

    const row = request as RequestRow
    const statusCopy = STATUS_PUSH[row.status_id]
    if (!statusCopy) {
      return jsonResponse({ skipped: true, reason: "unsupported_status" }, 200)
    }

    if (await shouldSkipDedup(supabaseAdmin, row.id, row.status_id)) {
      return jsonResponse({ skipped: true, reason: "dedup" }, 200)
    }

    const actor = body.actor_user_id?.trim() || inferActor(row)
    const recipients = (await resolveRecipients(supabaseAdmin, row, eventType))
      .filter((id) => id !== actor)

    if (recipients.length === 0) {
      return jsonResponse({ skipped: true, reason: "no_recipients" }, 200)
    }

    readVapidConfig()
    await recordNotifyEvent(supabaseAdmin, row.id, row.status_id)

    const result = await sendPushToUsers(supabaseAdmin, recipients, {
      title: statusCopy.title,
      body: statusCopy.body(row.structure_no),
      url: `/requests/${row.id}`,
    })

    return jsonResponse({ ...result, recipients: recipients.length }, 200)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: msg }, 500)
  }
})
