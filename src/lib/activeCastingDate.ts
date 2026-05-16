/** วันเทที่ใช้คำนวณ (เทียบ AppSheet Active Casting Date) */

function isoDayPrefix(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? ''
  if (!raw) return null
  const s = raw.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(`${s}T12:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export type ActiveCastingDateSource = {
  postpone_date?: string | null
  casting_date?: string | null
}

/** เลื่อนวันก่อน แล้วจึงวันเท */
export function activeCastingDateIso(source: ActiveCastingDateSource): string | null {
  return isoDayPrefix(source.postpone_date) ?? isoDayPrefix(source.casting_date)
}
