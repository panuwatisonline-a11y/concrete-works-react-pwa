import { extractGoogleDriveFileId } from '@/lib/driveThumbnail'
import { supabase, supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import { UPLOAD_MAX_BYTES } from '@/lib/compressImage'

export type ImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

type PresignResponse = {
  uploadUrl?: string
  url?: string
  mime?: string
  error?: string
  provider?: string
}

function edgeFunctionUrl(): string {
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/upload-drive-image`
}

function xhrPutWithProgress(
  url: string,
  file: File,
  mime: string,
  onProgress: (percent: number) => void,
): Promise<{ ok: boolean; status: number; message?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', mime)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)))
      }
    }
    xhr.upload.addEventListener('load', () => onProgress(100))
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true, status: xhr.status })
        return
      }
      resolve({
        ok: false,
        status: xhr.status,
        message: xhr.status === 403
          ? 'R2 ปฏิเสธการอัปโหลด — ตั้ง CORS บน bucket (ดู docs/r2-cors.md)'
          : `อัปโหลด R2 ไม่สำเร็จ (${xhr.status})`,
      })
    }
    xhr.onerror = () =>
      resolve({
        ok: false,
        status: 0,
        message: 'อัปโหลด R2 ไม่สำเร็จ — ตรวจ CORS บน bucket หรือเครือข่าย',
      })
    xhr.onabort = () => resolve({ ok: false, status: 0, message: 'ยกเลิกการอัปโหลด' })
    xhr.send(file)
  })
}

function xhrPostFormWithProgress(
  formData: FormData,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<ImageUploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', edgeFunctionUrl())
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)))
      }
    }
    xhr.upload.addEventListener('load', () => onProgress(100))
    xhr.onload = () => {
      let parsed: { url?: unknown; error?: unknown }
      try {
        parsed = JSON.parse(xhr.responseText) as { url?: unknown; error?: unknown }
      } catch {
        resolve({ ok: false, message: 'อัปโหลดไม่สำเร็จ' })
        return
      }
      const err =
        typeof parsed.error === 'string' && parsed.error.trim() !== '' ? parsed.error : null
      if (xhr.status >= 200 && xhr.status < 300 && typeof parsed.url === 'string' && parsed.url) {
        resolve({ ok: true, url: parsed.url })
        return
      }
      resolve({ ok: false, message: err ?? 'อัปโหลดไม่สำเร็จ' })
    }
    xhr.onerror = () => resolve({ ok: false, message: 'เครือข่ายผิดพลาด' })
    xhr.onabort = () => resolve({ ok: false, message: 'ยกเลิกการอัปโหลด' })
    xhr.send(formData)
  })
}

async function requestR2Presign(
  accessToken: string,
  folder: string,
  file: File,
): Promise<PresignResponse | null> {
  const res = await fetch(edgeFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'presign',
      folder,
      mime: file.type || 'image/jpeg',
      fileName: file.name,
      fileSize: file.size,
    }),
  })

  let parsed: PresignResponse
  try {
    parsed = (await res.json()) as PresignResponse
  } catch {
    return null
  }

  if (!res.ok) {
    if (parsed.error === 'presign_not_available') return null
    return { error: parsed.error ?? 'ขอ presign ไม่สำเร็จ' }
  }

  if (typeof parsed.uploadUrl === 'string' && typeof parsed.url === 'string') {
    return parsed
  }
  return null
}

/**
 * อัปโหลดรูป: R2 → presign + PUT ตรง (เร็ว) · ไม่ได้ presign / Drive → multipart ผ่าน Edge
 */
export async function uploadImageFile(opts: {
  file: File
  folder: string
  accessToken: string
  onProgress: (percent: number) => void
}): Promise<ImageUploadResult> {
  const { file, folder, accessToken, onProgress } = opts

  if (file.size > UPLOAD_MAX_BYTES) {
    return { ok: false, message: 'รูปใหญ่เกินไป (สูงสุด 10 MB)' }
  }

  const presign = await requestR2Presign(accessToken, folder, file)
  if (presign && 'error' in presign && presign.error) {
    return { ok: false, message: presign.error }
  }

  if (presign?.uploadUrl && presign.url) {
    const mime = presign.mime ?? file.type ?? 'image/jpeg'
    onProgress(0)
    const put = await xhrPutWithProgress(presign.uploadUrl, file, mime, onProgress)
    if (put.ok) return { ok: true, url: presign.url }
    // CORS / เครือข่ายล้ม → ลองส่งผ่าน Edge (ช้ากว่าแต่ยังใช้ได้)
    onProgress(0)
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  return xhrPostFormWithProgress(formData, accessToken, onProgress)
}

/** URL ที่เก็บบน R2 public bucket */
export function isR2StoredImageUrl(url: string | null | undefined): boolean {
  const s = url?.trim()
  if (!s) return false
  try {
    const host = new URL(s).hostname.toLowerCase()
    return host.endsWith('.r2.dev') || host.includes('r2.cloudflarestorage.com')
  } catch {
    return false
  }
}

/** URL ที่ชี้ไป Google Drive (thumbnail / file / open) */
export function isGoogleDriveStoredImageUrl(url: string | null | undefined): boolean {
  const s = url?.trim()
  if (!s) return false
  return extractGoogleDriveFileId(s) != null
}

export function isDeletableStoredImageUrl(url: string | null | undefined): boolean {
  return isR2StoredImageUrl(url) || isGoogleDriveStoredImageUrl(url)
}

/**
 * ลบรูปบน R2 หรือ Drive เมื่อผู้ใช้ลบหรือแทนที่รูป (ไม่บล็อก UI · ไม่แจ้ง error ถ้าล้ม)
 */
export function deleteStoredImage(url: string | null | undefined): void {
  const trimmed = url?.trim()
  if (!trimmed || !isDeletableStoredImageUrl(trimmed)) return

  void (async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    try {
      const res = await fetch(edgeFunctionUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'delete', url: trimmed }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        console.warn('deleteStoredImage:', body.error ?? res.status)
      }
    } catch (e) {
      console.warn('deleteStoredImage:', e)
    }
  })()
}
