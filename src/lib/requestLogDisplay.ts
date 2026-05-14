import type { RequestLogWithProfile } from '@/types/app.types'

/** ลบรายการซ้ำใน Timeline (เช่น trigger DB + insert จากแอป) โดยคงลำดับจาก API */
export function dedupeRequestLogsForDisplay(logs: RequestLogWithProfile[]): RequestLogWithProfile[] {
  const seenId = new Set<number>()
  const seenFp = new Set<string>()
  const out: RequestLogWithProfile[] = []
  for (const log of logs) {
    if (seenId.has(log.id)) continue
    const fp = [
      log.action,
      log.status_id ?? '',
      log.action_by ?? '',
      log.created_at,
      log.note ?? '',
      log.postpone_date ?? '',
      log.postpone_time ?? '',
    ].join('\u0000')
    if (seenFp.has(fp)) continue
    seenId.add(log.id)
    seenFp.add(fp)
    out.push(log)
  }
  return out
}
