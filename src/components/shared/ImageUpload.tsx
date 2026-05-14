import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string | null) => void
  bucket?: string
  folder?: string
  label?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  label = 'อัปโหลดรูป',
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (!isSupabaseConfigured) {
      toast.error('ยังไม่ได้ตั้งค่า Supabase')
      return
    }
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('กรุณาเข้าสู่ระบบก่อนอัปโหลดรูป')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const { data, error } = await supabase.functions.invoke('upload-drive-image', { body: formData })
      if (error) {
        let message = error.message
        if (error instanceof FunctionsHttpError) {
          try {
            const body = await error.context.json() as { error?: string }
            if (body?.error) message = body.error
          } catch {
            /* use message */
          }
        }
        toast.error(message)
        return
      }
      const url = data && typeof data === 'object' && 'url' in data && typeof (data as { url: unknown }).url === 'string'
        ? (data as { url: string }).url
        : null
      if (!url) {
        toast.error('อัปโหลดไม่สำเร็จ')
        return
      }
      onChange(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="preview" className="h-40 w-auto rounded-lg border border-gray-200 object-cover" />
          {!disabled && (
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
          {uploading ? (
            <span className="text-sm">กำลังอัปโหลด...</span>
          ) : (
            <>
              <Upload className="h-8 w-8" />
              <span className="text-sm">{label}</span>
              <ImageIcon className="h-4 w-4 opacity-50" />
            </>
          )}
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
