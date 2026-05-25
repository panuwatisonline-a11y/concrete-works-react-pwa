import * as React from 'react'
import MuiPopover, { type PopoverProps as MuiPopoverProps } from '@mui/material/Popover'
import { cn } from '@/lib/utils'

type PopoverContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  anchorEl: HTMLElement | null
  setAnchorEl: (el: HTMLElement | null) => void
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext)
  if (!ctx) throw new Error('Popover components must be used within Popover')
  return ctx
}

function Popover({
  open: openProp,
  onOpenChange,
  modal: _modal,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
  children: React.ReactNode
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = openProp ?? uncontrolledOpen

  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next)
      if (openProp === undefined) setUncontrolledOpen(next)
      if (!next) setAnchorEl(null)
    },
    [onOpenChange, openProp],
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </PopoverContext.Provider>
  )
}

function mergeHandler<T extends React.SyntheticEvent>(
  theirs?: (e: T) => void,
  ours?: (e: T) => void,
) {
  return (e: T) => {
    theirs?.(e)
    ours?.(e)
  }
}

const PopoverTrigger = React.forwardRef<
  HTMLElement,
  { asChild?: boolean; children: React.ReactElement }
>(({ asChild = false, children }, ref) => {
  const { setAnchorEl, setOpen } = usePopoverContext()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: React.MouseEventHandler<HTMLElement>
      ref?: React.Ref<HTMLElement>
    }>
    return React.cloneElement(child, {
      ref,
      onClick: mergeHandler(child.props.onClick, handleClick),
    })
  }

  return (
    <button type="button" ref={ref as React.Ref<HTMLButtonElement>} onClick={handleClick}>
      {children}
    </button>
  )
})
PopoverTrigger.displayName = 'PopoverTrigger'

const PopoverAnchor = () => null

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  {
    className?: string
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'bottom' | 'left' | 'right'
    sideOffset?: number
    collisionPadding?: number
    onOpenAutoFocus?: (event: Event) => void
    onCloseAutoFocus?: (event: Event) => void
    children?: React.ReactNode
  }
>(
  (
    {
      className,
      align = 'start',
      side = 'bottom',
      sideOffset = 4,
      collisionPadding = 12,
      onOpenAutoFocus,
      onCloseAutoFocus,
      children,
    },
    ref,
  ) => {
    const { open, setOpen, anchorEl } = usePopoverContext()

    const horizontal =
      align === 'end' ? 'right' : align === 'center' ? 'center' : ('left' as const)
    const vertical = side === 'top' ? 'top' : side === 'bottom' ? 'bottom' : side === 'left' ? 'left' : 'right'

    const anchorOrigin: MuiPopoverProps['anchorOrigin'] =
      vertical === 'bottom'
        ? { vertical: 'bottom', horizontal }
        : vertical === 'top'
          ? { vertical: 'top', horizontal }
          : vertical === 'left'
            ? { vertical: 'center', horizontal: 'left' }
            : { vertical: 'center', horizontal: 'right' }

    const transformOrigin: MuiPopoverProps['transformOrigin'] =
      vertical === 'bottom'
        ? { vertical: 'top', horizontal }
        : vertical === 'top'
          ? { vertical: 'bottom', horizontal }
          : vertical === 'left'
            ? { vertical: 'center', horizontal: 'right' }
            : { vertical: 'center', horizontal: 'left' }

    return (
      <MuiPopover
        open={open && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setOpen(false)
          onCloseAutoFocus?.(new Event('closeAutoFocus'))
        }}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        marginThreshold={collisionPadding}
        slotProps={{
          paper: {
            ref,
            className: cn('overflow-hidden', className),
            sx: {
              mt: vertical === 'bottom' ? sideOffset / 8 : 0,
              mb: vertical === 'top' ? sideOffset / 8 : 0,
              minWidth: anchorEl?.offsetWidth,
            },
          },
        }}
        disableAutoFocus={Boolean(onOpenAutoFocus)}
        onTransitionEnter={() => onOpenAutoFocus?.(new Event('openAutoFocus'))}
      >
        {children}
      </MuiPopover>
    )
  },
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }
