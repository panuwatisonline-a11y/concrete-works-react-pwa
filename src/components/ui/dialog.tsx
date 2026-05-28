import * as React from 'react'
import MuiDialog from '@mui/material/Dialog'
import DialogTitleMui from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { AppIcon } from '@/components/icons/AppIcon'
import { DialogLayerContext, dialogLayerValue } from '@/lib/dialogLayer'
import { resolveDialogZIndex } from '@/lib/zIndex'
import { cn } from '@/lib/utils'

type DialogContextValue = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue>({})

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DialogClose = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DialogOverlay = () => null

/** ลบ z-[27x] บน paper — ทับ MUI sx แล้ว modal หายไปหลังเนื้อหาหน้า */
function stripLegacyPaperZClass(className: string): string {
  return className
    .split(/\s+/)
    .filter((token) => token && !/^!?z-\[\d+\]$/.test(token))
    .join(' ')
}

function maxWidthFromClassName(className?: string): 'xs' | 'sm' | 'md' | 'lg' | false {
  if (!className) return 'sm'
  if (/\bmax-w-(3xl|4xl|5xl|6xl|7xl)\b/.test(className) || /\bmodal\.xl\b/.test(className)) return 'md'
  if (/\bmax-w-(lg|xl)\b/.test(className) || /\bmodal\.lg\b/.test(className)) return 'md'
  if (/\bmax-w-md\b/.test(className) || /\bmodal\.md\b/.test(className)) return 'sm'
  return 'sm'
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean
    overlayClassName?: string
    dialogContentClassName?: string
  }
>(
  (
    {
      className,
      children,
      showCloseButton = true,
      overlayClassName,
      dialogContentClassName,
    },
    ref,
  ) => {
    const { open, onOpenChange } = React.useContext(DialogContext)
    if (!open) return null

    const usesModalShell = /\bmodal\.shell\b/.test(`${className ?? ''} ${dialogContentClassName ?? ''}`)
    const paperClass = stripLegacyPaperZClass(
      cn(
        usesModalShell ? 'flex flex-col gap-0 p-0' : 'grid gap-4 p-5 sm:p-6',
        className,
        dialogContentClassName,
      ),
    )
    const z = resolveDialogZIndex(overlayClassName, paperClass)
    const layer = dialogLayerValue(z)
    const usesFlexShell =
      usesModalShell || /\bflex\b.*\bflex-col\b/.test(paperClass)

    return (
      <DialogLayerContext.Provider value={layer}>
        <MuiDialog
          open
          onClose={() => onOpenChange?.(false)}
          fullWidth
          maxWidth={maxWidthFromClassName(paperClass)}
          scroll="paper"
          disableEnforceFocus
          disableRestoreFocus
          sx={{ zIndex: z }}
          slotProps={{
            transition: { appear: false },
            backdrop: {
              className: cn('backdrop-blur-sm bg-black/60', overlayClassName),
              sx: { zIndex: z },
            },
            paper: {
              ref,
              className: cn(
                paperClass,
                usesFlexShell && '!grid !grid-rows-[auto_minmax(0,1fr)_auto] !gap-0',
              ),
              sx: { zIndex: z },
            },
          }}
        >
          {showCloseButton && (
            <IconButton
              aria-label="Close"
              onClick={() => onOpenChange?.(false)}
              sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
            >
              <AppIcon icon={CloseIcon} size="sm" />
            </IconButton>
          )}
          {children}
        </MuiDialog>
      </DialogLayerContext.Provider>
    )
  },
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogActions
    className={cn(
      '!flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:pt-4',
      '[&>button]:w-full sm:[&>button]:w-auto',
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <DialogTitleMui
      ref={ref}
      component="h2"
      className={cn('pr-8 text-base font-semibold leading-snug tracking-[-0.01em] sm:text-lg', className)}
      {...props}
    />
  ),
)
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      component="p"
      variant="body2"
      color="text.secondary"
      className={cn('text-pour-base leading-relaxed', className)}
      {...props}
    />
  ),
)
DialogDescription.displayName = 'DialogDescription'

export { DialogLayerContext, useDialogLayer } from '@/lib/dialogLayer'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
