/** คำขอที่บันทึกตรงเป็น Complete (CST shortcut) — ไม่ผ่าน workflow จองในระบบ */
export const NON_SYSTEM_BOOKING_REMARK = '[ไม่ได้จองผ่านระบบ]'

export function isNonSystemBookingRequest(r: { remarks?: string | null }): boolean {
  const t = r.remarks?.trim() ?? ''
  return t.startsWith(NON_SYSTEM_BOOKING_REMARK)
}

/** หมายเหตุสำหรับแสดง — ตัด prefix ระบบออก */
export function remarksForDisplay(remarks: string | null | undefined): string | null {
  const t = remarks?.trim()
  if (!t) return null
  if (t.startsWith(NON_SYSTEM_BOOKING_REMARK)) {
    const rest = t.slice(NON_SYSTEM_BOOKING_REMARK.length).trim()
    return rest || null
  }
  return t
}
