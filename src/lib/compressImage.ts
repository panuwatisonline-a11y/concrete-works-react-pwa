/**
 * บีบอัดรูปบนเครื่องก่อนอัปโหลด (มือถือ / เน็ตช้า)
 * อัปโหลดไป Supabase Edge Function → Google Drive โดยตรง ไม่ผ่าน Vercel (Vercel แค่ serve ไฟล์ static)
 */

/** ตรงกับ `MAX_BYTES` ใน upload-drive-image */
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024

/** ด้านยาวสูงสุด — พอสำหรับ preview ในแอป (~640px แสดงจริง) */
const DEFAULT_MAX_DIMENSION = 1024
const DEFAULT_QUALITY = 0.75
/** เป้าหมายหลังบีบอัด — ลดเวลาอัปโหลด (ผ่าน Edge → R2 สอง hop) */
const DEFAULT_MAX_OUTPUT_BYTES = 550_000
/** ไฟล์เล็กและความละเอียดไม่สูง — ไม่บีบอัด */
const DEFAULT_SKIP_BELOW_BYTES = 280_000
const MIN_QUALITY = 0.52
const QUALITY_STEP = 0.07

export type CompressImageOptions = {
  maxDimension?: number
  quality?: number
  maxOutputBytes?: number
  skipBelowBytes?: number
}

function toJpegFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image'
  return `${base}.jpg`
}

function scaleDimensions(
  width: number,
  height: number,
  maxDimension: number,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height }
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

async function loadDrawable(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('decode failed'))
      el.src = url
    })
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      cleanup: () => URL.revokeObjectURL(url),
    }
  } catch (e) {
    URL.revokeObjectURL(url)
    throw e
  }
}

async function renderCompressedBlob(
  file: File,
  maxDimension: number,
  initialQuality: number,
  maxOutputBytes: number,
): Promise<Blob | null> {
  const drawable = await loadDrawable(file)
  try {
    const { width, height } = scaleDimensions(drawable.width, drawable.height, maxDimension)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(drawable.source, 0, 0, width, height)

    let quality = initialQuality
    let blob: Blob | null = null
    while (quality >= MIN_QUALITY) {
      blob = await canvasToJpegBlob(canvas, quality)
      if (!blob) return null
      if (blob.size <= maxOutputBytes) return blob
      quality -= QUALITY_STEP
    }
    return blob
  } finally {
    drawable.cleanup()
  }
}

/**
 * บีบอัดรูปก่อนอัปโหลด: ย่อด้านยาว + JPEG + ลด quality จนใกล้เป้าหมายขนาด
 * คืนไฟล์เดิมถ้าบีบอัดไม่ได้ / ไม่เล็กลง / เป็น GIF หรือ SVG
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = options.quality ?? DEFAULT_QUALITY
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES
  const skipBelowBytes = options.skipBelowBytes ?? DEFAULT_SKIP_BELOW_BYTES

  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (file.size <= skipBelowBytes) return file

  const blob = await renderCompressedBlob(file, maxDimension, quality, maxOutputBytes)
  if (!blob || blob.size >= file.size) return file

  return new File([blob], toJpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
