import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { JWT } from "npm:google-auth-library@9.14.2"

/**
 * Upload an image; return a URL for <img src> and DB text fields (e.g. before_image).
 *
 * **Mode A — Google Apps Script (แนะนำถ้าไม่อยากใช้ Service Account / Shared drive quota)**
 *   Set secrets: GAS_UPLOAD_URL (web app /exec URL), GAS_UPLOAD_SECRET (same as Script property UPLOAD_SECRET)
 *   GAS runs as the account that deployed the web app (Drive quota ของคนนั้น / โฟลเดอร์ที่เข้าถึงได้)
 *   Script: `google-apps-script/upload-to-drive/Code.gs`
 *
 * **Mode B — Service Account + Drive API v3**
 *   GOOGLE_SERVICE_ACCOUNT_JSON, optional GOOGLE_DRIVE_PARENT_FOLDER_ID (Shared drive folder)
 *
 * Client: FormData `file` + optional `folder` filename prefix + optional `parentFolderId` (Drive folder id).
 *   When `parentFolderId` is valid, uploads there instead of GOOGLE_DRIVE_PARENT_FOLDER_ID / default.
 * Auth: Supabase user JWT.
 */

/** Default Drive folder when parent not sent to GAS / not set for SA mode */
const DEFAULT_DRIVE_PARENT_FOLDER_ID = "1u-Srk6yn3mSOOZd0Lpl6gVC45XO60OPY"

/** Optional client `parentFolderId` — จำกัดรูปแบบกันส่งขยะ (Drive id มักเป็น a-z A-Z 0-9 _ -) */
const DRIVE_FOLDER_ID_RE = /^[a-zA-Z0-9_-]{10,100}$/

function parseOptionalParentFolderId(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim()
  if (!s || !DRIVE_FOLDER_ID_RE.test(s)) return null
  return s
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunk = 0x8000
  let binary = ""
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** GAS web app บางครั้งคืนค่ามี BOM หรือมีตัวอื่นห่อ JSON — ดึง object ให้ได้มากที่สุด */
function parseGasJsonBody(raw: string): Record<string, unknown> | null {
  const trimmed = raw.replace(/^\uFEFF/, "").trim()
  if (!trimmed) return null
  const attempt = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s) as unknown
      return typeof v === "object" && v !== null && !Array.isArray(v) ? v as Record<string, unknown> : null
    } catch {
      return null
    }
  }
  const direct = attempt(trimmed)
  if (direct) return direct
  const i = trimmed.indexOf("{")
  const j = trimmed.lastIndexOf("}")
  if (i >= 0 && j > i) return attempt(trimmed.slice(i, j + 1))
  return null
}

/** URL สำหรับแสดงใน <img> จากนอก google.com — uc?export=view มักโหลดไม่ขึ้น */
function driveThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=s1200`
}

function normalizeGasResult(obj: Record<string, unknown>): {
  url?: string
  fileId?: string
  error?: string
} {
  const error = typeof obj.error === "string" ? obj.error : undefined
  const fileId = typeof obj.fileId === "string" ? obj.fileId : undefined
  const rawUrl = typeof obj.url === "string" ? obj.url : undefined
  const url = fileId ? driveThumbnailUrl(fileId) : rawUrl
  return { url, fileId, error }
}

async function getDriveAccessToken(): Promise<string> {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret is not set")
  const sa = JSON.parse(raw) as { client_email: string; private_key: string }
  const jwt = new JWT({
    email: sa.client_email,
    key: sa.private_key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  })
  const token = await jwt.getAccessToken()
  if (!token?.token) throw new Error("Failed to obtain Google access token")
  return token.token
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return new Response(JSON.stringify({ error: "Expected multipart form data" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Missing file field" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  if (!file.type.startsWith("image/")) {
    return new Response(JSON.stringify({ error: "Only image uploads are allowed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
  const MAX_BYTES = 10 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File too large (max 10 MB)" }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const folderHint = String(formData.get("folder") ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "") || "upload"
  const ext = (file.name.split(".").pop() || "jpg").slice(0, 8).toLowerCase()
  const safeName = `${folderHint}-${crypto.randomUUID()}.${ext}`
  const requestedParent = parseOptionalParentFolderId(formData.get("parentFolderId"))
  const parentFolder =
    requestedParent ??
    (Deno.env.get("GOOGLE_DRIVE_PARENT_FOLDER_ID")?.trim() || DEFAULT_DRIVE_PARENT_FOLDER_ID)

  const gasUrl = Deno.env.get("GAS_UPLOAD_URL")?.trim()
  const gasSecret = Deno.env.get("GAS_UPLOAD_SECRET")?.trim()

  try {
    const mime = file.type || "application/octet-stream"
    const fileBytes = new Uint8Array(await file.arrayBuffer())

    if (gasUrl && gasSecret) {
      const gasRes = await fetch(gasUrl, {
        method: "POST",
        redirect: "follow",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          secret: gasSecret,
          parentFolderId: parentFolder,
          name: safeName,
          mimeType: mime,
          base64: bytesToBase64(fileBytes),
        }),
      })
      const gasText = await gasRes.text()
      const gasObj = parseGasJsonBody(gasText)
      if (!gasObj) {
        console.error("GAS non-JSON", gasRes.status, gasText.slice(0, 500))
        return new Response(JSON.stringify({ error: "GAS returned non-JSON" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      const gasJson = normalizeGasResult(gasObj)
      if (gasJson.error && !gasJson.url) {
        console.error("GAS error", gasRes.status, gasJson.error)
        return new Response(JSON.stringify({ error: gasJson.error }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
      if (!gasRes.ok || !gasJson.url) {
        console.error("GAS upload", gasRes.status, gasText.slice(0, 500))
        return new Response(
          JSON.stringify({ error: gasJson.error ?? "GAS upload failed" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
      }
      return new Response(JSON.stringify({ url: gasJson.url, fileId: gasJson.fileId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const accessToken = await getDriveAccessToken()

    const metadata: Record<string, unknown> = { name: safeName }
    if (parentFolder) metadata.parents = [parentFolder]

    const boundary = `batch_drive_${crypto.randomUUID()}`
    const metaJson = JSON.stringify(metadata)
    const enc = new TextEncoder()
    const part1 = enc.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
    )
    const part2 = enc.encode(`\r\n--${boundary}--`)
    const body = new Uint8Array(part1.length + fileBytes.length + part2.length)
    body.set(part1, 0)
    body.set(fileBytes, part1.length)
    body.set(part2, part1.length + fileBytes.length)

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    )

    const uploadJson = await uploadRes.json()
    if (!uploadRes.ok) {
      console.error("Drive multipart upload", uploadJson)
      let errMsg = uploadJson?.error?.message ?? "Drive upload failed"
      if (
        typeof errMsg === "string" &&
        errMsg.includes("Service Accounts do not have storage quota")
      ) {
        errMsg +=
          " — ถ้าต้องการใช้ Google Apps Script: ตั้ง Supabase Edge secrets GAS_UPLOAD_URL และ GAS_UPLOAD_SECRET (ไม่ใช่แค่ไฟล์ .env ในเครื่อง) แล้วรัน supabase functions deploy upload-drive-image อีกครั้ง"
      }
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const fileId = uploadJson.id as string | undefined
    if (!fileId) {
      return new Response(JSON.stringify({ error: "No file id returned from Drive" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "anyone", role: "reader" }),
      },
    )
    if (!permRes.ok) {
      const permJson = await permRes.json()
      console.error("Drive permissions", permJson)
      return new Response(
        JSON.stringify({ error: permJson?.error?.message ?? "Failed to set public read on file" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      )
    }

    const url = driveThumbnailUrl(fileId)

    return new Response(JSON.stringify({ url, fileId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
