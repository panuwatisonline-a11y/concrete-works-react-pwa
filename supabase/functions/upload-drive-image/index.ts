import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * อัปโหลดไฟล์ไป Google Drive (OAuth 2.0 + Refresh Token)
 * - Cache access token ใน memory (ลด latency จาก Google token endpoint)
 * - Promise.all สำหรับงานที่ทำคู่ขนานได้
 * - Multipart body ผ่าน Blob (ลดการ copy buffer ขนาดใหญ่)
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const DRIVE_MULTIPART_UPLOAD =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true"
const DRIVE_PERMISSION_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`

const MAX_BYTES = 10 * 1024 * 1024
const DRIVE_FOLDER_ID_RE = /^[a-zA-Z0-9_-]{10,100}$/
/** ขอ token ใหม่ก่อนหมดอายุจริง (วินาที) */
const TOKEN_EXPIRY_BUFFER_MS = 60_000
const DEFAULT_TOKEN_TTL_SEC = 3600

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const textEncoder = new TextEncoder()

/** Cache ระดับ isolate — ใช้ซ้ำระหว่าง request ใน instance เดียวกัน */
let cachedAccessToken: string | null = null
let cachedAccessTokenExpiresAt = 0
/** กันยิง refresh พร้อมกันหลาย request */
let inFlightTokenRefresh: Promise<string> | null = null

let cachedOAuthCreds: { clientId: string; clientSecret: string; refreshToken: string } | null = null

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function driveThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=s1200`
}

function readGoogleOAuthFromEnv() {
  if (cachedOAuthCreds) return cachedOAuthCreds

  const clientId =
    Deno.env.get("GOOGLE_CLIENT_ID")?.trim() ??
    Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")?.trim() ??
    ""
  const clientSecret =
    Deno.env.get("GOOGLE_CLIENT_SECRET")?.trim() ??
    Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")?.trim() ??
    ""
  const refreshToken =
    Deno.env.get("GOOGLE_REFRESH_TOKEN")?.trim() ??
    Deno.env.get("GOOGLE_OAUTH_REFRESH_TOKEN")?.trim() ??
    ""

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "ตั้ง secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN",
    )
  }

  cachedOAuthCreds = { clientId, clientSecret, refreshToken }
  return cachedOAuthCreds
}

async function refreshGoogleAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = readGoogleOAuthFromEnv()

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })

  const data = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }

  if (!res.ok || !data.access_token) {
    const detail = data.error_description ?? data.error ?? "token refresh failed"
    throw new Error(`Google OAuth: ${detail}`)
  }

  const ttlSec = typeof data.expires_in === "number" && data.expires_in > 0
    ? data.expires_in
    : DEFAULT_TOKEN_TTL_SEC
  cachedAccessToken = data.access_token
  cachedAccessTokenExpiresAt = Date.now() + ttlSec * 1000

  return data.access_token
}

/** ใช้ token จาก cache ถ้ายังไม่หมดอายุ */
async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedAccessToken && cachedAccessTokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS > now) {
    return cachedAccessToken
  }

  if (inFlightTokenRefresh) {
    return inFlightTokenRefresh
  }

  inFlightTokenRefresh = refreshGoogleAccessToken().finally(() => {
    inFlightTokenRefresh = null
  })
  return inFlightTokenRefresh
}

function parseFolderId(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null
  const s = raw.trim()
  if (!s || !DRIVE_FOLDER_ID_RE.test(s)) return null
  return s
}

function envFolderId(key: string): string | null {
  const v = Deno.env.get(key)?.trim() ?? ""
  return v && DRIVE_FOLDER_ID_RE.test(v) ? v : null
}

function resolveParentFolderId(formData: FormData): string | null {
  const fromForm =
    parseFolderId(formData.get("folder_id")) ??
    parseFolderId(formData.get("parentFolderId"))
  if (fromForm) return fromForm

  const category = String(formData.get("folder") ?? "").trim().toLowerCase()
  const byCategory: Record<string, string | null> = {
    before: envFolderId("GOOGLE_DRIVE_FOLDER_ID_BEFORE"),
    after: envFolderId("GOOGLE_DRIVE_FOLDER_ID_AFTER"),
    bill: envFolderId("GOOGLE_DRIVE_FOLDER_ID_BILL"),
    eslip: envFolderId("GOOGLE_DRIVE_FOLDER_ID_BILL"),
  }
  if (category && byCategory[category]) {
    return byCategory[category]
  }

  return (
    envFolderId("GOOGLE_DRIVE_FOLDER_ID") ??
    envFolderId("GOOGLE_DRIVE_PARENT_FOLDER_ID")
  )
}

function safeFileName(prefix: string, originalName: string): string {
  const ext = (originalName.split(".").pop() || "jpg").slice(0, 8).toLowerCase()
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "") || "upload"
  return `${safePrefix}-${crypto.randomUUID()}.${ext}`
}

/** สร้าง multipart body ด้วย Blob — ไม่ต้อง allocate Uint8Array ก้อนเดียวขนาดไฟล์เต็ม */
function buildMultipartUploadBody(
  boundary: string,
  metadata: Record<string, unknown>,
  mime: string,
  fileBytes: Uint8Array,
): Blob {
  const metaJson = JSON.stringify(metadata)
  const preamble = textEncoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`,
  )
  const closing = textEncoder.encode(`\r\n--${boundary}--`)
  return new Blob([preamble, fileBytes, closing], {
    type: `multipart/related; boundary=${boundary}`,
  })
}

async function uploadBytesToGoogleDrive(
  accessToken: string,
  fileBytes: Uint8Array,
  options: { parentFolderId: string | null; safeName: string; mime: string },
): Promise<string> {
  const metadata: Record<string, unknown> = { name: options.safeName }
  if (options.parentFolderId) {
    metadata.parents = [options.parentFolderId]
  }

  const boundary = `drive_${crypto.randomUUID().replace(/-/g, "")}`
  const body = buildMultipartUploadBody(boundary, metadata, options.mime, fileBytes)

  const uploadRes = await fetch(DRIVE_MULTIPART_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  const uploadJson = (await uploadRes.json()) as {
    id?: string
    error?: { message?: string }
  }

  if (!uploadRes.ok) {
    throw new Error(uploadJson?.error?.message ?? "Drive upload failed")
  }

  const fileId = uploadJson.id
  if (!fileId) throw new Error("No file id returned from Drive")
  return fileId
}

function setAnyoneReaderPermission(accessToken: string, fileId: string): Promise<void> {
  return fetch(DRIVE_PERMISSION_URL(fileId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "anyone", role: "reader" }),
  }).then(async (permRes) => {
    if (permRes.ok) return
    const permJson = (await permRes.json()) as { error?: { message?: string } }
    throw new Error(permJson?.error?.message ?? "Failed to set public read on file")
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
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  )

  try {
    const [{ data: { user }, error: userErr }, formData] = await Promise.all([
      supabase.auth.getUser(),
      req.formData(),
    ])

    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401)
    }

    const file = formData.get("file")
    if (!(file instanceof File)) {
      return jsonResponse({ error: "Missing file field" }, 400)
    }

    if (file.type && !file.type.startsWith("image/")) {
      return jsonResponse({ error: "Only image uploads are allowed" }, 400)
    }

    if (file.size > MAX_BYTES) {
      return jsonResponse({ error: "File too large (max 10 MB)" }, 413)
    }

    const namePrefix = String(formData.get("folder") ?? "upload").trim() || "upload"
    const parentFolderId = resolveParentFolderId(formData)
    const mime = file.type || "application/octet-stream"
    const safeName = safeFileName(namePrefix, file.name)

    const [accessToken, fileBytes] = await Promise.all([
      getGoogleAccessToken(),
      file.arrayBuffer().then((ab) => new Uint8Array(ab)),
    ])

    const fileId = await uploadBytesToGoogleDrive(accessToken, fileBytes, {
      parentFolderId,
      safeName,
      mime,
    })

    await setAnyoneReaderPermission(accessToken, fileId)

    return jsonResponse({ url: driveThumbnailUrl(fileId), fileId }, 200)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    const status = msg.startsWith("Google OAuth:") ? 502 : 500
    return jsonResponse({ error: msg }, status)
  }
})
