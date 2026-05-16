import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type UploadBeforePourDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  /** เรียกหลังบันทึกสำเร็จ — เช่น reload รายการหรือรายละเอียด */
  onSuccess?: () => void
  overlayClassName?: string
  dialogContentClassName?: string
}

export function UploadBeforePourDialog({
  open,
  onOpenChange,
  requestId,
  onSuccess,
  overlayClassName,
  dialogContentClassName,
}: UploadBeforePourDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setImageUrl(null)
    setFileUploading(false)
  }, [open, requestId])

  async function handleSave() {
    const trimmed = imageUrl?.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('Request').update({ before_image: trimmed }).eq('id', requestId)
      if (error) throw error
      toast.success('บันทึกรูปก่อนเทแล้ว')
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn('max-h-[min(92dvh,560px)] max-w-lg overflow-y-auto', dialogContentClassName)}
      >
        <DialogHeader>
          <DialogTitle>อัปโหลดรูปก่อนเท</DialogTitle>
          <DialogDescription className="text-left text-sm text-[#6b7280]">
            แนบรูปภาพบริเวณงานก่อนเทคอนกรีต — บันทึกเมื่ออัปโหลดเสร็จและได้ลิงก์จากระบบ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <ImageUpload
            value={imageUrl ?? undefined}
            onChange={setImageUrl}
            onUploadingChange={setFileUploading}
            folder="before"
            label="อัปโหลดรูปก่อนเท"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="modalAction" type="button" disabled={saving} onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            size="modalAction"
            type="button"
            disabled={saving || fileUploading || !imageUrl?.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? 'กำลังบันทึก…' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
