import * as React from 'react'
import MuiDialog from '@mui/material/Dialog'
import DialogTitleMui from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { AppIcon } from '@/components/icons/AppIcon'
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

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean
    overlayClassName?: string
  }
>(({ className, children, showCloseButton = true, overlayClassName, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(DialogContext)

  return (
    <MuiDialog
      open={Boolean(open)}
      onClose={() => onOpenChange?.(false)}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      slotProps={{
        backdrop: { className: cn('backdrop-blur-sm bg-black/60', overlayClassName) },
        paper: {
          ref,
          className: cn('grid gap-4 p-5 sm:p-6', className),
          ...props,
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
  )
})
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <DialogActions
    className={cn(
      '!flex flex-col-reverse gap-3 border-t border-[color:var(--mui-palette-divider)] pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:pt-6',
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
      className={cn('text-[13px] leading-relaxed', className)}
      {...props}
    />
  ),
)
DialogDescription.displayName = 'DialogDescription'

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
