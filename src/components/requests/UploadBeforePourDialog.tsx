import { useEffect, useState } from 'react'
import { runOrQueueMutation } from '@/lib/offline/actions'
import { runPatchImageMutation } from '@/lib/requestMutations'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Button } from '@/components/ui/button'
import { purgeOrphanUploadedImage } from '@/lib/requestImageCleanup'
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
  const { user } = useAuthStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOnClose, setSavedOnClose] = useState(false)

  useEffect(() => {
    if (!open) return
    setImageUrl(null)
    setFileUploading(false)
    setSavedOnClose(false)
  }, [open, requestId])

  function handleOpenChange(next: boolean) {
    if (!next) {
      if (!savedOnClose) purgeOrphanUploadedImage(imageUrl, null)
    }
    onOpenChange(next)
  }

  async function handleSave() {
    const trimmed = imageUrl?.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      const ok = await runOrQueueMutation({
        kind: 'patch_before_image',
        requestId,
        userId: user?.id ?? '',
        payload: { url: trimmed },
        online: async () => {
          const r = await runPatchImageMutation(requestId, 'before_image', trimmed)
          if (!r.ok) {
            toast.error(r.message)
            return false
          }
          toast.success('บันทึกรูปก่อนเทแล้ว')
          await notifyRequestListChanged()
          return true
        },
      })
      if (!ok) return
      setSavedOnClose(true)
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn('max-h-[min(92dvh,560px)] max-w-lg overflow-y-auto', dialogContentClassName)}
      >
        <DialogHeader>
          <DialogTitle>อัปโหลดรูปก่อนเท</DialogTitle>
          <DialogDescription className="text-left">
            แนบรูปภาพบริเวณงานก่อนเทคอนกรีต — บันทึกเมื่ออัปโหลดเสร็จและได้ลิงก์จากระบบ
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ImageUpload
            value={imageUrl ?? undefined}
            onChange={setImageUrl}
            onUploadingChange={setFileUploading}
            folder="before"
            label="อัปโหลดรูปก่อนเท"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" size="modalAction" type="button" disabled={saving} onClick={() => handleOpenChange(false)}>
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
