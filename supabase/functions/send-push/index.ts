import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { readVapidConfig, sendPushToUser } from "./_shared/webPush.ts"

interface SendPushBody {
  target_user_id: string
  title: string
  body: string
  url?: string
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  })
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  try {
    readVapidConfig()

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }

    const payload = (await req.json()) as SendPushBody
    const { target_user_id, title, body, url = "/" } = payload

    if (!target_user_id || !title || !body) {
      return jsonResponse({ error: "target_user_id, title, body are required" }, 400)
    }

    if (target_user_id !== user.id) {
      const { data: profile } = await supabaseAuth
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (profile?.role !== "admin") {
        return jsonResponse({ error: "Forbidden" }, 403)
      }
    }

    const result = await sendPushToUser(supabaseAdmin, target_user_id, { title, body, url })
    if (result.sent === 0 && result.failed === 0) {
      return jsonResponse({ ...result, message: "No subscriptions" }, 200)
    }

    return jsonResponse(result, 200)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: msg }, 500)
  }
})
