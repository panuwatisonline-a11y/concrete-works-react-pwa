const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const DRIVE_MULTIPART_UPLOAD =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true"
const DRIVE_PERMISSION_URL = (fileId: string) =>
  `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?supportsAllDrives=true`

const DRIVE_FOLDER_ID_RE = /^[a-zA-Z0-9_-]{10,100}$/
const TOKEN_EXPIRY_BUFFER_MS = 60_000
const DEFAULT_TOKEN_TTL_SEC = 3600

const textEncoder = new TextEncoder()

let cachedAccessToken: string | null = null
let cachedAccessTokenExpiresAt = 0
let inFlightTokenRefresh: Promise<string> | null = null
let cachedOAuthCreds: { clientId: string; clientSecret: string; refreshToken: string } | null = null

export function driveThumbnailUrl(fileId: string): string {
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

export function resolveParentFolderId(formData: FormData): string | null {
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

export async function uploadImageToGoogleDrive(
  fileBytes: Uint8Array,
  formData: FormData,
  options: { safeName: string; mime: string },
): Promise<{ url: string; fileId: string }> {
  const parentFolderId = resolveParentFolderId(formData)
  const accessToken = await getGoogleAccessToken()
  const fileId = await uploadBytesToGoogleDrive(accessToken, fileBytes, {
    parentFolderId,
    safeName: options.safeName,
    mime: options.mime,
  })
  await setAnyoneReaderPermission(accessToken, fileId)
  return { url: driveThumbnailUrl(fileId), fileId }
}

export function isGoogleOAuthError(message: string): boolean {
  return message.startsWith("Google OAuth:")
}
