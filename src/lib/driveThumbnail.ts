/**
 * Google Drive: ใช้ Thumbnail API สำหรับ <img src> (ลิงก > uc?export=view มัก 403 เมื่อ embed ข้ามเว็บ)
 * @see https://drive.google.com/thumbnail?id=FILE_ID&sz=wNNN
 */

const DRIVE_HOST = /(^|\.)drive\.google\.com$/i
const DOCS_UC_HOST = /(^|\.)docs\.google\.com$/i

function tryParseUrl(raw: string): URL | null {
  const s = raw.trim()
  if (!s) return null
  try {
    return new URL(s)
  } catch {
    try {
      return new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`)
    } catch {
      return null
    }
  }
}

/**
 * ดึง Drive file id จาก URL หลายรูปแบบ (thumbnail, file/d/, open, uc, googleusercontent)
 */
export function extractGoogleDriveFileId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$|\?)/)
  if (fileD?.[1]) return fileD[1]

  const u = tryParseUrl(trimmed)
  if (u) {
    const host = u.hostname.replace(/^www\./i, '')
    const idFromQuery = u.searchParams.get('id')
    if (idFromQuery && /^[a-zA-Z0-9_-]{10,100}$/.test(idFromQuery)) {
      if (DRIVE_HOST.test(host) || DOCS_UC_HOST.test(host)) return idFromQuery
    }
  }

  if (/google\.com/i.test(trimmed)) {
    const m = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,100})/)
    if (m?.[1]) return m[1]
  }

  const guc = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i)
  if (guc?.[1]) return guc[1]

  return null
}

export type DriveThumbSizePreset = 'card' | 'detail' | 'lightbox'

/** ความกว้างขอจาก Drive thumbnail API — เล็กลงจากเดิมเล็กน้อยเพื่อโหลดเร็วขึ้น ยังพอสำหรับจอ retina ในขนาดแสดงจริงของแอป */
const PRESET_WIDTH: Record<DriveThumbSizePreset, number> = {
  card: 240,
  detail: 640,
  lightbox: 1200,
}

/**
 * คืน URL สำหรับแสดงใน <img>: ถ้าเป็น Google Drive จะใช้ thumbnail API; อื่นๆ คืนตามเดิม
 */
export function imageSrcForImgTag(
  raw: string | null | undefined,
  preset: DriveThumbSizePreset = 'card',
): string | null {
  const s = raw?.trim()
  if (!s) return null
  const id = extractGoogleDriveFileId(s)
  if (!id) return s
  const w = PRESET_WIDTH[preset]
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w}`
}
