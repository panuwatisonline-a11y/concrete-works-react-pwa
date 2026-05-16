/** ส่วนกลางเลขที่รายงาน CST — อายุทดสอบกำหนด R1, R3, R7, R14, R28 */
export function cstReportNoPrefix(age: number): string {
  return `LAB-R${age}-CST-`
}

/** @deprecated ใช้ cstReportNoPrefix(age) แทน */
export const CST_REPORT_NO_PREFIX = cstReportNoPrefix(1)

/** นับคำขอเทที่มี CST ตั้งแต่วันที่นี้ (Active Casting Date) */
export const CST_REPORT_NO_CASTING_FROM = '2026-01-01'

/** แปลงจำนวน ref ที่ไม่ซ้ำ → suffix 6 หลัก (COUNT + 1000000 + 1 แล้ว RIGHT 6) */
export function cstReportNoFromSequence(uniqueRefCount: number, age: number): string {
  const n = uniqueRefCount + 1_000_000 + 1
  const suffix = String(n).slice(-6)
  return `${cstReportNoPrefix(age)}${suffix}`
}

export function cstReportNoSuffix(reportNo: string | null | undefined): string | null {
  const t = reportNo?.trim()
  if (!t) return null
  const digits = t.match(/(\d{6})$/)?.[1]
  return digits ?? (t.length >= 6 ? t.slice(-6) : null)
}

export function cstReportNoFromSuffix(suffix: string, age: number): string {
  const six = suffix.replace(/\D/g, '').padStart(6, '0').slice(-6)
  return `${cstReportNoPrefix(age)}${six}`
}

/** เลือกเลขเดิมของคำขอเท (suffix เดียวกัน) หรือออกเลขใหม่ — เปลี่ยน R ตามอายุทดสอบ */
export function suggestCstReportNo(
  existingForRequest: { report_no?: string | null }[],
  uniqueRefCountFrom2026: number,
  age: number,
): string {
  for (const row of existingForRequest) {
    const suffix = cstReportNoSuffix(row.report_no)
    if (suffix) return cstReportNoFromSuffix(suffix, age)
  }
  return cstReportNoFromSequence(uniqueRefCountFrom2026, age)
}
