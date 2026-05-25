import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import Image from '@mui/icons-material/Image'
import Close from '@mui/icons-material/Close'
import { AppIcon } from '@/components/icons/AppIcon'
import { supabase, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { compressImage, UPLOAD_MAX_BYTES } from '@/lib/compressImage'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import type { DriveUploadCategory } from '@/lib/driveUploadCategory'
import { toast } from 'sonner'

function invokeUploadDriveImageWithProgress(
  formData: FormData,
  accessToken: string,
  onProgress: (percent: number) => void,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const base = supabaseUrl.replace(/\/$/, '')
  const url = `${base}/functions/v1/upload-drive-image`
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    xhr.setRequestHeader('apikey', supabaseAnonKey)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)))
      }
    }
    xhr.upload.addEventListener('load', () => {
      onProgress(100)
    })
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

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  /** เรียกเมื่อเข้า/ออกช่วงอัปโหลด (ใช้กับปุ่มส่งฟอร์ม: ระหว่างอัปโหลดยังไม่มี URL — ควรปิดการกด) */
  onUploadingChange?: (uploading: boolean) => void
  bucket?: string
  /** before | after | bill — Edge Function อัปโหลดเข้าโฟลเดอร์ Drive ที่ตรงกัน */
  folder?: DriveUploadCategory | string
  label?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onUploadingChange,
  folder = 'uploads',
  label = 'อัปโหลดรูป',
  disabled = false,
}: ImageUploadProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  useEffect(() => {
    onUploadingChange?.(uploading)
  }, [uploading, onUploadingChange])

  useEffect(() => {
    return () => onUploadingChange?.(false)
  }, [onUploadingChange])

  function setLocalPreviewFromFile(file: File) {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    const url = URL.createObjectURL(file)
    previewObjectUrlRef.current = url
    setLocalPreviewUrl(url)
  }

  function clearLocalPreview() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setLocalPreviewUrl(null)
  }

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
    }
  }, [])

  /** ปล่อย blob หลัง parent ตั้ง `value` แล้ว — กันเฟรมว่างถ้า state ไม่ batch พร้อมกัน */
  useEffect(() => {
    if (value == null || value === '') return
    if (previewObjectUrlRef.current == null) return
    URL.revokeObjectURL(previewObjectUrlRef.current)
    previewObjectUrlRef.current = null
    setLocalPreviewUrl(null)
  }, [value])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (!isSupabaseConfigured) {
      toast.error('ยังไม่ได้ตั้งค่า Supabase')
      return
    }
    const trimmedValue = typeof value === 'string' ? value.trim() : ''
    const previousUrl = trimmedValue !== '' ? trimmedValue : null

    let fileToUpload = file
    try {
      fileToUpload = await compressImage(file)
    } catch {
      fileToUpload = file
    }

    if (fileToUpload.size > UPLOAD_MAX_BYTES) {
      toast.error('รูปใหญ่เกินไป (สูงสุด 10 MB) — ลองถ่ายใหม่หรือเลือกรูปอื่น')
      return
    }

    setLocalPreviewFromFile(fileToUpload)
    /** ล้าง URL ที่บันทึกไว้ทันที จนได้ URL จากรอบอัปโหลดนี้คืนมา — ป้องกันส่งฟอร์มด้วยลิงก์เก่าระหว่างอัปโหลด */
    onChange(null)
    setUploading(true)
    setUploadPercent(0)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป')
        clearLocalPreview()
        if (previousUrl) onChange(previousUrl)
        return
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('folder', folder)

      const result = await invokeUploadDriveImageWithProgress(
        formData,
        session.access_token,
        setUploadPercent,
      )
      if (!result.ok) {
        toast.error(result.message)
        clearLocalPreview()
        if (previousUrl) onChange(previousUrl)
        return
      }
      onChange(result.url)
    } finally {
      setUploading(false)
      setUploadPercent(0)
    }
  }

  const displaySrc =
    value != null && value !== ''
      ? (imageSrcForImgTag(value, 'detail') ?? value)
      : localPreviewUrl
  const showPreview = Boolean(displaySrc)
  const pickDisabled = disabled || uploading

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  const pickButtonClass = cn(
    'flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50',
    pickDisabled && 'pointer-events-none opacity-50',
  )

  return (
    <div className="space-y-2">
      {showPreview ? (
        <div className="relative inline-block max-w-full">
          <img
            src={displaySrc ?? undefined}
            alt="preview"
            referrerPolicy="no-referrer"
            className="h-40 w-auto max-w-full rounded-lg border border-gray-200 object-cover"
          />
          {uploading && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/45 px-3"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="text-sm font-medium text-white">กำลังอัปโหลด {uploadPercent}%</span>
              <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-[color:var(--glass-bg-muted)]">
                <div
                  className="h-full rounded-full bg-[color:var(--glass-bg)] transition-[width] duration-150 ease-out"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
            </div>
          )}
          {!disabled && !uploading && (
            <button
              type="button"
              aria-label="ลบรูป"
              onClick={() => onChange(null)}
              className="absolute -right-2 -top-2 rounded-full bg-zinc-900 p-1 text-white hover:bg-zinc-800"
            >
              <AppIcon icon={Close} size="xs" sx={{ fontSize: 12 }} />
            </button>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-200 px-4 text-zinc-500',
            pickDisabled && 'opacity-50',
          )}
        >
          <span className="text-sm font-medium text-zinc-600">{label}</span>
          <div className="flex w-full max-w-sm gap-2">
            <button
              type="button"
              disabled={pickDisabled}
              onClick={() => cameraInputRef.current?.click()}
              className={pickButtonClass}
            >
              <AppIcon icon={PhotoCamera} size="lg" />
              <span>ถ่ายรูป</span>
            </button>
            <button
              type="button"
              disabled={pickDisabled}
              onClick={() => galleryInputRef.current?.click()}
              className={pickButtonClass}
            >
              <AppIcon icon={Image} size="lg" />
              <span>เลือกรูป</span>
            </button>
          </div>
        </div>
      )}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        title="เลือกรูปจากอัลบั้ม"
        className="hidden"
        onChange={onFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        title="ถ่ายรูปด้วยกล้อง"
        className="hidden"
        onChange={onFileInputChange}
      />
    </div>
  )
}
