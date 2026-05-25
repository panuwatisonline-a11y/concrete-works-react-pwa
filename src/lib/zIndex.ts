/** ชั้น z-index กลางแอป — อ้างอิง MUI Modal เริ่มที่ 1300 */

export const Z_INDEX = {
  /** header / sidebar ชั้นบน */
  chrome: 40,
  /** dropdown บนหน้าปกติ (ต่ำกว่า modal) */
  popover: 300,
  /** dropdown ใน MUI Dialog (สูงกว่า modalElevated 1320) */
  popoverInModal: 1330,
  /** Dialog มาตรฐาน (= MUI default) */
  modal: 1300,
  /** workflow / CST form ทับ dialog ทั่วไป */
  modalElevated: 1320,
  /** confirm ทับ form dialog */
  modalConfirm: 1340,
  /** lightbox รูป */
  lightbox: 1400,
} as const

/** Tailwind class สำหรับ Radix Popover / SearchableSelect */
export const Z_TW = {
  popover: `z-[${Z_INDEX.popover}]`,
  popoverInModal: `z-[${Z_INDEX.popoverInModal}]`,
} as const

/** ใช้ใน SearchableSelect ภายใน Dialog (ค่าคงที่ — ชอบใช้ DialogLayerContext แทน) */
export const SELECT_CONTENT_ELEVATED_Z = Z_TW.popoverInModal

/** z-index รายการ dropdown ให้อยู่เหนือเนื้อหา dialog */
export function popoverZIndexAboveDialog(dialogZIndex: number): number {
  return dialogZIndex + 10
}

/** อ่าน z-[26x]/[27x]/[28x]/[29x] จาก legacy overlay class */
export function resolveDialogZIndex(overlayClassName?: string, className?: string): number {
  const s = `${overlayClassName ?? ''} ${className ?? ''}`
  if (/z-\[29\d\]/.test(s)) return Z_INDEX.modalConfirm
  if (/z-\[28\d\]/.test(s)) return Z_INDEX.modalConfirm
  if (/z-\[27\d\]|z-\[26\d\]/.test(s)) return Z_INDEX.modalElevated
  return Z_INDEX.modal
}
