import type { RequestLogWithProfile } from '@/types/app.types'

/** ฟิงเกอร์พรินต์สำหรับจับ "เหตุการณ์เดียวกัน" ไม่รวมเวลา (ใช้คู่กับช่วงเวลา) */
function logSemanticFingerprint(log: RequestLogWithProfile): string {
  return [
    log.action,
    log.status_id ?? '',
    log.action_by ?? '',
    log.note ?? '',
    log.postpone_date ?? '',
    log.postpone_time ?? '',
  ].join('\u0000')
}

/**
 * ลบรายการซ้ำใน Timeline
 * - แถว id ซ้ำ (กรณี API ผิดปกติ)
 * - แถวเหมือนกัน (action / ผู้ทำ / หมายเหตุ / status) ที่เวลาใกล้กัน (double-submit / กดซ้ำ) — เช่น inspected สองแถวต่าง id
 *   ไม่ใช้แค่ "แถวก่อนหน้า" เพราะอาจมี log อื่น (เช่น booked) คั่นระหว่างซ้ำจาก client
 *   ต่างจาก booked ที่ DB มี partial unique index กันไว้แล้ว
 */
export function dedupeRequestLogsForDisplay(logs: RequestLogWithProfile[]): RequestLogWithProfile[] {
  /** มิลลิวินาที: เหตุการณ์เดียวกันที่ห่างกันไม่เกินนี้ถือเป็น burst ซ้ำ */
  const BURST_WINDOW_MS = 5000

  const seenId = new Set<number>()
  const chrono = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const outChrono: RequestLogWithProfile[] = []

  for (const log of chrono) {
    if (seenId.has(log.id)) continue

    const fp = logSemanticFingerprint(log)
    const t = new Date(log.created_at).getTime()

    const isBurstDuplicate = outChrono.some((e) => {
      if (logSemanticFingerprint(e) !== fp) return false
      const te = new Date(e.created_at).getTime()
      return Math.abs(t - te) < BURST_WINDOW_MS
    })
    if (isBurstDuplicate) continue

    seenId.add(log.id)
    outChrono.push(log)
  }

  return outChrono.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
