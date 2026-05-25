import { AwsClient } from "npm:aws4fetch@1.0.20"

const R2_FOLDER_RE = /^[a-z0-9_-]{1,32}$/i
const DEFAULT_PRESIGN_EXPIRES_SEC = 600

type R2Config = {
  accessKeyId: string
  secretAccessKey: string
  publicBase: string
  /** Full S3 API base including bucket, e.g. https://{account}.r2.cloudflarestorage.com/concrete-works */
  uploadBase: string
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "")
}

function buildUploadBaseFromParts(accountId: string, bucket: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}`
}

function readR2Config(): R2Config {
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID")?.trim() ?? ""
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY")?.trim() ?? ""
  const publicBase = normalizeBaseUrl(
    Deno.env.get("R2_PUBLIC_URL") ?? Deno.env.get("R2_PUBLIC_BASE_URL") ?? "",
  )

  const endpointRaw = Deno.env.get("R2_ENDPOINT")?.trim() ?? ""
  const accountId = Deno.env.get("R2_ACCOUNT_ID")?.trim() ?? ""
  const bucket = Deno.env.get("R2_BUCKET_NAME")?.trim() ?? ""

  let uploadBase = ""
  if (endpointRaw) {
    uploadBase = normalizeBaseUrl(endpointRaw)
  } else if (accountId && bucket) {
    uploadBase = buildUploadBaseFromParts(accountId, bucket)
  }

  if (!uploadBase || !accessKeyId || !secretAccessKey || !publicBase) {
    throw new Error(
      "ตั้ง R2 secrets: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL และ (R2_ENDPOINT หรือ R2_ACCOUNT_ID+R2_BUCKET_NAME)",
    )
  }

  if (accessKeyId.length !== 32) {
    throw new Error(
      `R2_ACCESS_KEY_ID ต้องยาว 32 ตัวอักษร (ตอนนี้ ${accessKeyId.length}) — ใช้ Access Key จาก R2 → Manage R2 API Tokens ไม่ใช่ Cloudflare API token (cfat_...)`,
    )
  }
  if (accessKeyId.startsWith("cfat_") || secretAccessKey.startsWith("cfat_")) {
    throw new Error(
      "อย่าใส่ Cloudflare API token (cfat_...) — สร้าง R2 S3 API token แล้วใส่ Access Key ID (32 ตัว) + Secret Access Key",
    )
  }

  return { accessKeyId, secretAccessKey, publicBase, uploadBase }
}

function encodeObjectKeyForUrl(key: string): string {
  return key.split("/").map((seg) => encodeURIComponent(seg)).join("/")
}

function resolveObjectPrefix(folderRaw: string): string {
  const category = folderRaw.trim().toLowerCase()
  if (category === "before" || category === "after" || category === "bill" || category === "eslip") {
    return category === "eslip" ? "bill" : category
  }
  const safe = category.replace(/[^a-z0-9_-]/gi, "").slice(0, 32)
  if (safe && R2_FOLDER_RE.test(safe)) return safe
  return "upload"
}

export function buildR2ObjectKey(folderRaw: string, safeName: string): string {
  const prefix = resolveObjectPrefix(folderRaw)
  return `${prefix}/${safeName}`
}

export function publicUrlForR2Key(publicBase: string, objectKey: string): string {
  return `${publicBase}/${encodeObjectKeyForUrl(objectKey)}`
}

const ALLOWED_OBJECT_KEY = /^(before|after|bill|upload)\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/

export function isAllowedR2ObjectKey(key: string): boolean {
  return ALLOWED_OBJECT_KEY.test(key)
}

/** แปลง public URL (pub-*.r2.dev) เป็น object key ใน bucket */
export function objectKeyFromPublicUrl(imageUrl: string, publicBase: string): string | null {
  const trimmed = imageUrl.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    const base = new URL(`${normalizeBaseUrl(publicBase)}/`)
    if (parsed.origin !== base.origin) return null
    const path = parsed.pathname.replace(/^\//, "")
    if (!path) return null
    const key = path.split("/").map((seg) => decodeURIComponent(seg)).join("/")
    return isAllowedR2ObjectKey(key) ? key : null
  } catch {
    return null
  }
}

export async function deleteR2ObjectByKey(key: string): Promise<void> {
  if (!isAllowedR2ObjectKey(key)) {
    throw new Error("Invalid object key")
  }
  const config = readR2Config()
  const endpoint = `${config.uploadBase}/${encodeObjectKeyForUrl(key)}`
  const aws = createAwsClient(config)
  const res = await aws.fetch(endpoint, { method: "DELETE" })
  if (res.ok || res.status === 404) return
  const detail = await res.text().catch(() => "")
  throw new Error(detail ? `R2 delete failed: ${detail}` : `R2 delete failed (${res.status})`)
}

export async function deleteR2ObjectByPublicUrl(imageUrl: string): Promise<boolean> {
  const config = readR2Config()
  const key = objectKeyFromPublicUrl(imageUrl, config.publicBase)
  if (!key) return false
  await deleteR2ObjectByKey(key)
  return true
}

function createAwsClient(config: R2Config): AwsClient {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  })
}

/** Presigned PUT — ให้เบราว์เซอร์อัปโหลดตรงไป R2 (ไม่ผ่าน body ของ Edge) */
export async function createR2PresignedPutUrl(options: {
  folderRaw: string
  safeName: string
  mime: string
  fileSize: number
  expiresSec?: number
}): Promise<{ uploadUrl: string; url: string; key: string }> {
  const config = readR2Config()
  const key = buildR2ObjectKey(options.folderRaw, options.safeName)
  const objectUrl = `${config.uploadBase}/${encodeObjectKeyForUrl(key)}`
  const aws = createAwsClient(config)
  const signed = await aws.sign(
    new Request(objectUrl, {
      method: "PUT",
      headers: {
        "Content-Type": options.mime,
        "Content-Length": String(options.fileSize),
      },
    }),
    {
      aws: {
        signQuery: true,
        expires: options.expiresSec ?? DEFAULT_PRESIGN_EXPIRES_SEC,
      },
    },
  )
  return {
    uploadUrl: signed.url,
    url: publicUrlForR2Key(config.publicBase, key),
    key,
  }
}

export async function uploadBytesToR2(
  fileBytes: Uint8Array,
  options: { folderRaw: string; safeName: string; mime: string },
): Promise<{ url: string; key: string }> {
  const { accessKeyId, secretAccessKey, publicBase, uploadBase } = readR2Config()
  const key = buildR2ObjectKey(options.folderRaw, options.safeName)
  const endpoint = `${uploadBase}/${encodeObjectKeyForUrl(key)}`

  const aws = createAwsClient({ accessKeyId, secretAccessKey, publicBase, uploadBase })
  const res = await aws.fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": options.mime,
      "Content-Length": String(fileBytes.byteLength),
    },
    body: fileBytes,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(detail ? `R2 upload failed: ${detail}` : `R2 upload failed (${res.status})`)
  }

  return { url: publicUrlForR2Key(publicBase, key), key }
}
