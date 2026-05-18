import type { Profile } from '@/types/app.types'

export function readAuthAvatarUrl(meta: Record<string, unknown> | undefined): string | null {
  const url = meta?.avatar_url ?? meta?.picture
  return typeof url === 'string' && url.trim() ? url.trim() : null
}

/** รูปจาก profiles.avatar_url หรือ session ของตัวเองเมื่อยังไม่ซิงค์ */
export function resolveProfileAvatarUrl(
  profile: Profile,
  opts?: { currentUserId?: string | null; sessionAvatarUrl?: string | null },
): string | null {
  if (profile.avatar_url?.trim()) return profile.avatar_url.trim()
  if (opts?.currentUserId && profile.id === opts.currentUserId && opts.sessionAvatarUrl) {
    return opts.sessionAvatarUrl
  }
  return null
}

/** ขยายรูป Google avatar สำหรับ lightbox */
export function profileAvatarPreviewUrl(url: string): string {
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=s\d+(-c)?$/, '=s512-c')
  }
  return url
}
