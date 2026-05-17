import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import { ImageLightboxDialog } from '@/components/shared/ImageLightboxDialog'
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

type UploadBillConcreteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  initialUrl?: string | null
  onSuccess?: () => void
  overlayClassName?: string
  dialogContentClassName?: string
}

export function UploadBillConcreteDialog({
  open,
  onOpenChange,
  requestId,
  initialUrl,
  onSuccess,
  overlayClassName,
  dialogContentClassName,
}: UploadBillConcreteDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const trimmedUrl = imageUrl?.trim() || null
  const displaySrc = trimmedUrl ? (imageSrcForImgTag(trimmedUrl, 'lightbox') ?? trimmedUrl) : null
  const detailSrc = trimmedUrl ? (imageSrcForImgTag(trimmedUrl, 'detail') ?? trimmedUrl) : null
  const savedOnOpen = Boolean(initialUrl?.trim())
  const dirty = trimmedUrl !== (initialUrl?.trim() || null)

  useEffect(() => {
    if (!open) return
    const url = initialUrl?.trim() || null
    setImageUrl(url)
    setReplacing(!url)
    setFileUploading(false)
    setLightboxOpen(false)
  }, [open, requestId, initialUrl])

  async function handleSave() {
    if (!trimmedUrl || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('Request').update({ eslip_url: trimmedUrl }).eq('id', requestId)
      if (error) throw error
      toast.success('บันทึก Bill Concrete แล้ว')
      await notifyRequestListChanged()
      setReplacing(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const showViewer = Boolean(displaySrc) && !replacing

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          overlayClassName={overlayClassName}
          className={cn(
            showViewer ? 'max-h-[min(92dvh,900px)] max-w-3xl overflow-y-auto' : 'max-h-[min(92dvh,560px)] max-w-lg overflow-y-auto',
            dialogContentClassName,
          )}
        >
          <DialogHeader>
            <DialogTitle>{showViewer ? 'Bill Concrete' : 'อัปโหลด Bill Concrete'}</DialogTitle>
            <DialogDescription className="text-left">
              {showViewer
                ? 'แตะรูปเพื่อขยายเต็มจอ — หรือกดเปลี่ยนรูปหากต้องการอัปโหลดใหม่'
                : 'แนบรูปใบสั่ง/บิลคอนกรีต — บันทึกลิงก์ไปที่ E-Slip ของรายการนี้'}
            </DialogDescription>
          </DialogHeader>

          {showViewer && detailSrc ? (
            <button
              type="button"
              className="group w-full rounded-xl p-0 text-left outline-none ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-[color:var(--pour-accent)]/45 cursor-zoom-in"
              aria-label="ขยายรูป Bill Concrete"
              onClick={() => setLightboxOpen(true)}
            >
              <span className="flex min-h-[12rem] w-full items-center justify-center rounded-xl border border-[color:var(--pour-surface-border)] bg-[color:var(--pour-accent-muted)]/40 p-3 shadow-sm sm:min-h-[16rem]">
                <img
                  src={detailSrc}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="max-h-[min(65dvh,640px)] w-auto max-w-full object-contain object-center pointer-events-none"
                />
              </span>
              <p className="mt-2 text-center text-xs text-pour-muted">แตะรูปเพื่อดูขนาดใหญ่</p>
            </button>
          ) : (
            <div className="space-y-4">
              <ImageUpload
                value={imageUrl ?? undefined}
                onChange={setImageUrl}
                onUploadingChange={setFileUploading}
                folder="eslip"
                label="อัปโหลด Bill Concrete"
              />
            </div>
          )}

          <DialogFooter className={cn(showViewer && 'flex-col gap-2 sm:flex-row sm:justify-end')}>
            {showViewer ? (
              <>
                <Button
                  variant="outline"
                  size="modalAction"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => onOpenChange(false)}
                >
                  ปิด
                </Button>
                <Button
                  variant="secondary"
                  size="modalAction"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => setReplacing(true)}
                >
                  เปลี่ยนรูป
                </Button>
                {dirty ? (
                  <Button
                    size="modalAction"
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={saving || fileUploading}
                    onClick={() => void handleSave()}
                  >
                    {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="modalAction"
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (savedOnOpen && trimmedUrl) {
                      setReplacing(false)
                      setImageUrl(initialUrl?.trim() || null)
                    } else {
                      onOpenChange(false)
                    }
                  }}
                >
                  ยกเลิก
                </Button>
                <Button
                  size="modalAction"
                  type="button"
                  disabled={saving || fileUploading || !trimmedUrl}
                  onClick={() => void handleSave()}
                >
                  {saving ? 'กำลังบันทึก…' : 'บันทึก'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLightboxDialog
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        src={displaySrc}
        title="Bill Concrete"
      />
    </>
  )
}
