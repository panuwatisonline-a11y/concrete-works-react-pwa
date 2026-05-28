import { useEffect, useState } from 'react'
import { runOrQueueMutation } from '@/lib/offline/actions'
import { runPatchImageMutation } from '@/lib/requestMutations'
import { useAuthStore } from '@/stores/authStore'
import { notifyRequestListChanged } from '@/lib/requestListInvalidate'
import { imageSrcForImgTag } from '@/lib/driveThumbnail'
import { ImageLightboxDialog } from '@/components/shared/ImageLightboxDialog'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/shared/ImageUpload'
import { Button } from '@/components/ui/button'
import { purgeOrphanUploadedImage } from '@/lib/requestImageCleanup'
import { cn } from '@/lib/utils'
import { modal, modalForm } from '@/lib/requestUi'
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
  const { user } = useAuthStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [savedOnClose, setSavedOnClose] = useState(false)

  const trimmedUrl = imageUrl?.trim() || null
  const persistedUrl = initialUrl?.trim() || null
  const displaySrc = trimmedUrl ? (imageSrcForImgTag(trimmedUrl, 'lightbox') ?? trimmedUrl) : null
  const detailSrc = trimmedUrl ? (imageSrcForImgTag(trimmedUrl, 'detail') ?? trimmedUrl) : null
  const savedOnOpen = Boolean(persistedUrl)
  const dirty = trimmedUrl !== persistedUrl

  useEffect(() => {
    if (!open) return
    setImageUrl(persistedUrl)
    setReplacing(!persistedUrl)
    setFileUploading(false)
    setLightboxOpen(false)
    setSavedOnClose(false)
  }, [open, requestId, initialUrl, persistedUrl])

  function handleOpenChange(next: boolean) {
    if (!next && !savedOnClose) {
      purgeOrphanUploadedImage(trimmedUrl, persistedUrl)
    }
    onOpenChange(next)
  }

  async function handleSave() {
    if (!trimmedUrl || saving) return
    setSaving(true)
    try {
      const ok = await runOrQueueMutation({
        kind: 'patch_eslip_url',
        requestId,
        userId: user?.id ?? '',
        payload: { url: trimmedUrl },
        online: async () => {
          const r = await runPatchImageMutation(requestId, 'eslip_url', trimmedUrl)
          if (!r.ok) {
            toast.error(r.message)
            return false
          }
          toast.success('บันทึก Bill Concrete แล้ว')
          await notifyRequestListChanged()
          return true
        },
      })
      if (!ok) return
      setSavedOnClose(true)
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
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayClassName={overlayClassName}
          className={cn(modal.shell, showViewer ? modal.xl : modal.md, dialogContentClassName)}
        >
          <DialogHeader className={modal.header}>
            <DialogTitle className={modal.title}>{showViewer ? 'Bill Concrete' : 'อัปโหลด Bill Concrete'}</DialogTitle>
            <DialogDescription className="text-left">
              {showViewer
                ? 'แตะรูปเพื่อขยายเต็มจอ — หรือกดเปลี่ยนรูปหากต้องการอัปโหลดใหม่'
                : 'แนบรูปใบสั่ง/บิลคอนกรีต — บันทึกลิงก์ไปที่รายการนี้'}
            </DialogDescription>
          </DialogHeader>

          <div className={modal.body}>
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
            <div className={modalForm.stack}>
            <div className={modalForm.field}>
              <ImageUpload
                value={imageUrl ?? undefined}
                onChange={setImageUrl}
                onUploadingChange={setFileUploading}
                folder="bill"
                label="อัปโหลด Bill Concrete"
              />
            </div>
            </div>
          )}
          </div>

          <DialogFooter className={modal.footer}>
            {showViewer ? (
              <>
                <Button
                  variant="outline"
                  size="modalAction"
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => handleOpenChange(false)}
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
                      purgeOrphanUploadedImage(trimmedUrl, persistedUrl)
                      setReplacing(false)
                      setImageUrl(persistedUrl)
                    } else {
                      handleOpenChange(false)
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
