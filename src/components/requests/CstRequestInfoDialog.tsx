import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CstRequestPourInfo } from '@/components/requests/CstRequestPourInfo'
import { modal, rq } from '@/lib/requestUi'
import { cn } from '@/lib/utils'
import { shortId } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

type CstRequestInfoDialogProps = {
  request: RequestWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CstRequestInfoDialog({ request, open, onOpenChange }: CstRequestInfoDialogProps) {
  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(modal.lg)} showCloseButton>
        <DialogHeader>
          <DialogTitle className={rq.cardTitle}>ข้อมูลการเท</DialogTitle>
          <p className="font-mono text-xs font-semibold text-pour-muted">{shortId(request.id)}</p>
        </DialogHeader>
        <CstRequestPourInfo request={request} embedded className="px-0 pt-0" />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
          <Button type="button" variant="default" asChild>
            <Link to={`/requests/${request.id}`}>ดูรายละเอียดคำขอ</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
