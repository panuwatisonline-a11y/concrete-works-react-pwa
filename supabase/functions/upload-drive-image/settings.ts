import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2"

export type ImageUploadProvider = "google_drive" | "r2"

const DEFAULT_PROVIDER: ImageUploadProvider = "r2"
const PROVIDER_CACHE_TTL_MS = 60_000

let cachedProvider: ImageUploadProvider | null = null
let cachedProviderExpiresAt = 0

function providerFromEnv(): ImageUploadProvider | null {
  const raw = Deno.env.get("IMAGE_UPLOAD_PROVIDER")?.trim().toLowerCase() ?? ""
  if (raw === "r2" || raw === "google_drive") return raw
  return null
}

function normalizeProvider(raw: unknown): ImageUploadProvider | null {
  if (raw === "r2" || raw === "google_drive") return raw
  return null
}

export async function resolveImageUploadProvider(
  serviceClient: SupabaseClient,
): Promise<ImageUploadProvider> {
  const fromEnv = providerFromEnv()
  if (fromEnv) return fromEnv

  const now = Date.now()
  if (cachedProvider && cachedProviderExpiresAt > now) {
    return cachedProvider
  }

  const { data, error } = await serviceClient
    .from("platform_settings")
    .select("image_upload_provider")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    console.warn("platform_settings read failed, defaulting to google_drive:", error.message)
    return cachedProvider ?? DEFAULT_PROVIDER
  }

  const next = normalizeProvider(data?.image_upload_provider) ?? DEFAULT_PROVIDER
  cachedProvider = next
  cachedProviderExpiresAt = now + PROVIDER_CACHE_TTL_MS
  return next
}

export function createServiceRoleClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")?.trim()
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim()
  if (!url || !key) {
    throw new Error("ตั้ง SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY สำหรับ Edge Function")
  }
  return createClient(url, key)
}
