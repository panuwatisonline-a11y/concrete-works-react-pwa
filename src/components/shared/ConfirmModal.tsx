import { useRef, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (note?: string) => Promise<void> | void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: 'default' | 'destructive' | 'warning' | 'success'
  showNote?: boolean
  noteLabel?: string
  noteRequired?: boolean
  isLoading?: boolean
  /** ทับ dialog ชั้นล่าง — ส่งคู่กับ dialogContentClassName */
  overlayClassName?: string
  dialogContentClassName?: string
}

export function ConfirmModal({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'ยืนยัน', confirmVariant = 'default',
  showNote = false, noteLabel = 'หมายเหตุ', noteRequired = false, isLoading = false,
  overlayClassName,
  dialogContentClassName,
}: ConfirmModalProps) {
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const confirmLock = useRef(false)

  async function handleConfirm() {
    if (confirmLock.current || pending || isLoading) return
    if (noteRequired && !note.trim()) return
    confirmLock.current = true
    setPending(true)
    try {
      await onConfirm(note.trim() || undefined)
      setNote('')
      onClose()
    } finally {
      confirmLock.current = false
      setPending(false)
    }
  }

  const busy = isLoading || pending

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNote(''); onClose() } }}>
      <DialogContent
        overlayClassName={overlayClassName}
        className={cn('max-w-lg', dialogContentClassName)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {showNote && (
          <div className="space-y-2">
            <Label htmlFor="confirm-note">
              {noteLabel}
              {noteRequired && <span className="ml-1 text-zinc-600">*</span>}
            </Label>
            <Textarea
              id="confirm-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={noteRequired ? 'กรุณาระบุ...' : 'ไม่บังคับ...'}
              rows={3}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="modalAction" onClick={onClose} disabled={busy}>
            ยกเลิก
          </Button>
          <Button
            variant={confirmVariant}
            size="modalAction"
            onClick={handleConfirm}
            disabled={busy || (noteRequired && !note.trim())}
          >
            {busy ? 'กำลังดำเนินการ...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
