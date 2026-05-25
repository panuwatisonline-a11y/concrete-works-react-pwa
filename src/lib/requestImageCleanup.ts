import { deleteStoredImage } from '@/lib/imageUpload'

export const REQUEST_IMAGE_FIELDS = [
  'before_image',
  'after_image',
  'eslip_url',
  'checksheet_url',
] as const

export type RequestImageField = (typeof REQUEST_IMAGE_FIELDS)[number]

export type RequestImageRow = Partial<Record<RequestImageField, string | null | undefined>>

export function collectRequestImageUrls(row: RequestImageRow | null | undefined): string[] {
  if (!row) return []
  const out: string[] = []
  for (const field of REQUEST_IMAGE_FIELDS) {
    const u = row[field]?.trim()
    if (u) out.push(u)
  }
  return out
}

/** ลบ URL ที่ไม่ซ้ำ (ไม่บล็อก UI) */
export function deleteStoredImages(urls: Iterable<string | null | undefined>): void {
  const seen = new Set<string>()
  for (const raw of urls) {
    const u = raw?.trim()
    if (!u || seen.has(u)) continue
    seen.add(u)
    deleteStoredImage(u)
  }
}

/**
 * ลบไฟล์ที่ถูกแทนที่หรือล้างออก (เช่น เปลี่ยนรูปก่อนบันทึกฟอร์ม / patch DB)
 */
export function deleteReplacedRequestImages(
  previous: RequestImageRow,
  next: RequestImageRow,
  fields: readonly RequestImageField[] = REQUEST_IMAGE_FIELDS,
): void {
  const toDelete: string[] = []
  for (const field of fields) {
    const oldU = previous[field]?.trim() ?? ''
    const newU = next[field]?.trim() ?? ''
    if (oldU && oldU !== newU) toDelete.push(oldU)
  }
  deleteStoredImages(toDelete)
}

/**
 * อัปโหลดใหม่แต่ยังไม่บันทึกลง DB — ลบเมื่อปิดฟอร์ม/ dialog
 */
export function purgeOrphanUploadedImage(
  currentUrl: string | null | undefined,
  persistedUrl: string | null | undefined,
): void {
  const cur = currentUrl?.trim()
  const saved = persistedUrl?.trim()
  if (cur && cur !== saved) deleteStoredImage(cur)
}
