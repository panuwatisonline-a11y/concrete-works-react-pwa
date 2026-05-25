import * as React from 'react'
import { popoverZIndexAboveDialog } from '@/lib/zIndex'

export type DialogLayerValue = {
  dialogZIndex: number
  popoverZIndex: number
}

export const DialogLayerContext = React.createContext<DialogLayerValue | null>(null)

export function useDialogLayer(): DialogLayerValue | null {
  return React.useContext(DialogLayerContext)
}

export function dialogLayerValue(dialogZIndex: number): DialogLayerValue {
  return {
    dialogZIndex,
    popoverZIndex: popoverZIndexAboveDialog(dialogZIndex),
  }
}

/** สำหรับ Radix Popover ที่ portal ไป document — อยู่เหนือ MUI Dialog paper */
export function usePopoverLayerStyle(): React.CSSProperties | undefined {
  const layer = useDialogLayer()
  return layer ? { zIndex: layer.popoverZIndex } : undefined
}
