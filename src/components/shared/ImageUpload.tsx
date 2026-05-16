import { useEffect, useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { supabase, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
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
  folder?: string
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
  const inputRef = useRef<HTMLInputElement>(null)
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

    setLocalPreviewFromFile(file)
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
      formData.append('file', file)
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
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            'flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800',
            (disabled || uploading) && 'cursor-not-allowed opacity-50'
          )}
        >
          <Upload className="h-8 w-8" />
          <span className="text-sm">{label}</span>
          <ImageIcon className="h-4 w-4 opacity-50" />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        title="เลือกรูปภาพ"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
