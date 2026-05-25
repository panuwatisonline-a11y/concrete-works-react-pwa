import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"
import {
  deleteGoogleDriveFileByUrl,
  isGoogleOAuthError,
  uploadImageToGoogleDrive,
} from "./drive.ts"
import {
  createR2PresignedPutUrl,
  deleteR2ObjectByPublicUrl,
  uploadBytesToR2,
} from "./r2.ts"
import { createServiceRoleClient, resolveImageUploadProvider } from "./settings.ts"

/**
 * อัปโหลดรูป — Google Drive หรือ Cloudflare R2
 * - POST multipart: proxy ผ่าน Edge (Drive หรือ R2 fallback)
 * - POST JSON { action: "presign", ... }: presigned PUT ตรงไป R2 (เร็วกว่า)
 * - POST JSON { action: "delete", url }: ลบรูปบน R2 หรือ Google Drive เมื่อผู้ใช้ลบ/เปลี่ยนรูป
 */

export const MAX_BYTES = 10 * 1024 * 1024

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type JsonBody = {
  action?: string
  folder?: string
  mime?: string
  fileName?: string
  fileSize?: number
  url?: string
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function safeFileName(prefix: string, originalName: string): string {
  const ext = (originalName.split(".").pop() || "jpg").slice(0, 8).toLowerCase()
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, "") || "upload"
  return `${safePrefix}-${crypto.randomUUID()}.${ext}`
}

async function requireUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

async function handleDelete(body: JsonBody): Promise<Response> {
  const imageUrl = String(body.url ?? "").trim()
  if (!imageUrl) {
    return jsonResponse({ error: "Missing url" }, 400)
  }

  if (await deleteR2ObjectByPublicUrl(imageUrl)) {
    return jsonResponse({ ok: true, deleted: true, provider: "r2" }, 200)
  }

  if (await deleteGoogleDriveFileByUrl(imageUrl)) {
    return jsonResponse({ ok: true, deleted: true, provider: "google_drive" }, 200)
  }

  return jsonResponse({ error: "Not a deletable R2 or Google Drive image URL" }, 400)
}

async function handleJson(req: Request, supabase: SupabaseClient): Promise<Response> {
  const user = await requireUser(supabase)
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401)

  let body: JsonBody
  try {
    body = (await req.json()) as JsonBody
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  if (body.action === "warm") {
    return jsonResponse({ ok: true }, 200)
  }

  if (body.action === "delete") {
    return await handleDelete(body)
  }

  if (body.action !== "presign") {
    return jsonResponse({ error: "Unknown action" }, 400)
  }

  const folderRaw = String(body.folder ?? "upload").trim() || "upload"
  const mime = String(body.mime ?? "image/jpeg").trim() || "image/jpeg"
  const fileName = String(body.fileName ?? "image.jpg").trim() || "image.jpg"
  const fileSize = typeof body.fileSize === "number" ? body.fileSize : NaN

  if (!mime.startsWith("image/")) {
    return jsonResponse({ error: "Only image uploads are allowed" }, 400)
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_BYTES) {
    return jsonResponse({ error: "Invalid or too large fileSize (max 10 MB)" }, 413)
  }

  const serviceClient = createServiceRoleClient()
  const provider = await resolveImageUploadProvider(serviceClient)
  if (provider !== "r2") {
    return jsonResponse({
      error: "presign_not_available",
      provider,
      message: "Direct R2 upload is only available when provider is r2",
    }, 400)
  }

  const safeName = safeFileName(folderRaw, fileName)
  const { uploadUrl, url, key } = await createR2PresignedPutUrl({
    folderRaw,
    safeName,
    mime,
    fileSize,
  })

  return jsonResponse({
    uploadUrl,
    url,
    key,
    mime,
    provider: "r2",
    method: "PUT",
  }, 200)
}

async function handleMultipart(req: Request, supabase: SupabaseClient): Promise<Response> {
  const user = await requireUser(supabase)
  if (!user) return jsonResponse({ error: "Unauthorized" }, 401)

  const formData = await req.formData()
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

  const folderRaw = String(formData.get("folder") ?? "upload").trim() || "upload"
  const mime = file.type || "application/octet-stream"
  const safeName = safeFileName(folderRaw, file.name)

  const serviceClient = createServiceRoleClient()
  const [fileBytes, provider] = await Promise.all([
    file.arrayBuffer().then((ab) => new Uint8Array(ab)),
    resolveImageUploadProvider(serviceClient),
  ])

  if (provider === "r2") {
    const { url, key } = await uploadBytesToR2(fileBytes, {
      folderRaw,
      safeName,
      mime,
    })
    return jsonResponse({ url, provider: "r2", key, mode: "proxy" }, 200)
  }

  const { url, fileId } = await uploadImageToGoogleDrive(fileBytes, formData, {
    safeName,
    mime,
  })
  return jsonResponse({ url, provider: "google_drive", fileId, mode: "proxy" }, 200)
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
    const contentType = req.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      return await handleJson(req, supabase)
    }
    return await handleMultipart(req, supabase)
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    const status = isGoogleOAuthError(msg) ? 502 : 500
    return jsonResponse({ error: msg }, status)
  }
})
