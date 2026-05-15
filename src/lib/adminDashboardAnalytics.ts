import type { SupabaseClient } from '@supabase/supabase-js'
import { format, parseISO, startOfWeek } from 'date-fns'

export type TrendGranularity = 'day' | 'week' | 'month' | 'year'

export interface DashboardRequestRow {
  id: string
  status_id: number
  structure_no: string | null
  volume_request: number | null
  volume_dwg: number | null
  volume_confirm: number | null
  casting_date: string | null
  booked_at: string | null
  postpone_date: string | null
  strength: number | null
  client: { client_name: string }[] | { client_name: string } | null
  structure: { structure_name: string }[] | { structure_name: string } | null
  mixcode:
    | { supplier: string | null; strength: number | null; strength_type: string | null }[]
    | { supplier: string | null; strength: number | null; strength_type: string | null }
    | null
  booked_by_profile: {
    fname: string | null
    lname: string | null
    employee_id: string | null
  } | null
}

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export function rowClientName(r: DashboardRequestRow): string {
  const c = relOne(r.client)
  return c?.client_name?.trim() ?? ''
}

export function rowStructureName(r: DashboardRequestRow): string {
  const s = relOne(r.structure)
  const n = s?.structure_name?.trim()
  return n || 'ไม่ระบุโครงสร้าง'
}

export function rowSupplier(r: DashboardRequestRow): string {
  const m = relOne(r.mixcode)
  const s = m?.supplier?.trim()
  return s || 'ไม่ระบุซัพพลายเออร์'
}

export function rowStaffLabel(r: DashboardRequestRow): string {
  const p = r.booked_by_profile
  if (!p) return 'ไม่ระบุผู้จอง'
  const name = [p.fname, p.lname].filter(Boolean).join(' ').trim()
  if (name) return name
  if (p.employee_id?.trim()) return p.employee_id.trim()
  return 'ไม่ระบุผู้จอง'
}

export function rowStrengthLabel(r: DashboardRequestRow): string {
  const m = relOne(r.mixcode)
  if (m?.strength != null && !Number.isNaN(m.strength)) {
    const t = m.strength_type?.trim()
    return t ? `${m.strength} ${t}` : String(m.strength)
  }
  if (r.strength != null && !Number.isNaN(r.strength)) {
    return String(r.strength)
  }
  return 'ไม่ระบุความแข็งแรง'
}

function num(v: number | null | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  return v
}

function isoDayPrefix(v: string | null | undefined): string | null {
  const s = v?.slice(0, 10)
  if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}

/** yyyy-MM-dd สำหรับตัวกรองและกราฟแนวโน้ม: เลื่อนวัน (postpone) ก่อน แล้ววันเท แล้ววันที่จอง */
export function rowPrimaryDateIso(r: DashboardRequestRow): string | null {
  const p = isoDayPrefix(r.postpone_date)
  if (p) return p
  const c = isoDayPrefix(r.casting_date)
  if (c) return c
  return isoDayPrefix(r.booked_at)
}

/**
 * กรองคำขอตามช่วงวันที่ (การ์ดสรุป กราฟ และคิวรอ)
 * ใช้วันเลื่อน (postpone_date) ก่อน ถ้าไม่มีใช้วันเท แล้วจึงใช้วันที่จอง (booked_at)
 */
export function filterDashboardRowsByDateRange(
  rows: DashboardRequestRow[],
  dateFrom: string,
  dateTo: string,
): DashboardRequestRow[] {
  let from = dateFrom.trim()
  let to = dateTo.trim()
  if (!from && !to) return rows
  if (from && to && from > to) {
    ;[from, to] = [to, from]
  }
  return rows.filter((r) => {
    const d = rowPrimaryDateIso(r)
    if (!d) return false
    if (from && d < from) return false
    if (to && d > to) return false
    return true
  })
}

export function bucketKeyCasting(castingDate: string | null, g: TrendGranularity): string | null {
  if (!castingDate) return null
  const iso = castingDate.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = parseISO(iso)
  if (Number.isNaN(d.getTime())) return null
  switch (g) {
    case 'day':
      return format(d, 'yyyy-MM-dd')
    case 'week':
      return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    case 'month':
      return format(d, 'yyyy-MM')
    case 'year':
      return format(d, 'yyyy')
    default:
      return format(d, 'yyyy-MM-dd')
  }
}

export function formatTrendAxisLabel(key: string, g: TrendGranularity): string {
  if (g === 'month' && /^\d{4}-\d{2}$/.test(key)) {
    const [y, m] = key.split('-')
    return `${m}/${y.slice(2)}`
  }
  if (g === 'year') return key
  if (g === 'week' || g === 'day') {
    try {
      return format(parseISO(key), 'dd/MM/yy')
    } catch {
      return key
    }
  }
  return key
}

const TREND_MAX_POINTS: Record<TrendGranularity, number> = {
  day: 45,
  week: 26,
  month: 24,
  year: 12,
}

export interface TrendPoint {
  key: string
  requestVol: number
  confirmVol: number
}

export function buildVolumeTrend(rows: DashboardRequestRow[], g: TrendGranularity): TrendPoint[] {
  const map = new Map<string, { requestVol: number; confirmVol: number }>()
  for (const r of rows) {
    const d = rowPrimaryDateIso(r)
    const key = d ? bucketKeyCasting(d, g) : null
    if (!key) continue
    const cur = map.get(key) ?? { requestVol: 0, confirmVol: 0 }
    cur.requestVol += num(r.volume_request)
    if (r.volume_confirm != null && !Number.isNaN(r.volume_confirm)) {
      cur.confirmVol += r.volume_confirm
    }
    map.set(key, cur)
  }
  const keys = [...map.keys()].sort()
  const sliceFrom = Math.max(0, keys.length - TREND_MAX_POINTS[g])
  const displayKeys = keys.slice(sliceFrom)
  return displayKeys.map((key) => {
    const v = map.get(key)!
    return { key, requestVol: v.requestVol, confirmVol: v.confirmVol }
  })
}

export interface NamedVolumeSlice {
  label: string
  volume: number
  pct: number
}

function topSlicesWithOther(
  sums: Map<string, number>,
  topN: number,
): NamedVolumeSlice[] {
  const entries = [...sums.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return []
  const head = entries.slice(0, topN)
  const tail = entries.slice(topN)
  const tailSum = tail.reduce((s, [, v]) => s + v, 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  const out: NamedVolumeSlice[] = head.map(([label, volume]) => ({
    label,
    volume,
    pct: total > 0 ? (volume / total) * 100 : 0,
  }))
  if (tailSum > 0) {
    out.push({
      label: `อื่นๆ (${tail.length} รายการ)`,
      volume: tailSum,
      pct: total > 0 ? (tailSum / total) * 100 : 0,
    })
  }
  return out
}

export function aggregateCompleteVolumeByStructure(rows: DashboardRequestRow[]): NamedVolumeSlice[] {
  const sums = new Map<string, number>()
  for (const r of rows) {
    if (r.volume_confirm == null || Number.isNaN(r.volume_confirm) || r.volume_confirm <= 0) continue
    const label = rowStructureName(r)
    sums.set(label, (sums.get(label) ?? 0) + r.volume_confirm)
  }
  return topSlicesWithOther(sums, 10)
}

export function aggregateCompleteVolumeByStrength(rows: DashboardRequestRow[]): NamedVolumeSlice[] {
  const sums = new Map<string, number>()
  for (const r of rows) {
    if (r.volume_confirm == null || Number.isNaN(r.volume_confirm) || r.volume_confirm <= 0) continue
    const label = rowStrengthLabel(r)
    sums.set(label, (sums.get(label) ?? 0) + r.volume_confirm)
  }
  return topSlicesWithOther(sums, 12)
}

export function aggregateConfirmVolumeByStaff(rows: DashboardRequestRow[]): NamedVolumeSlice[] {
  const sums = new Map<string, number>()
  for (const r of rows) {
    if (r.volume_confirm == null || Number.isNaN(r.volume_confirm) || r.volume_confirm <= 0) continue
    const label = rowStaffLabel(r)
    sums.set(label, (sums.get(label) ?? 0) + r.volume_confirm)
  }
  return topSlicesWithOther(sums, 10)
}

export function aggregateConfirmVolumeBySupplier(rows: DashboardRequestRow[]): NamedVolumeSlice[] {
  const sums = new Map<string, number>()
  for (const r of rows) {
    if (r.volume_confirm == null || Number.isNaN(r.volume_confirm) || r.volume_confirm <= 0) continue
    const label = rowSupplier(r)
    sums.set(label, (sums.get(label) ?? 0) + r.volume_confirm)
  }
  return topSlicesWithOther(sums, 10)
}

/** สถานะ Complete — ใช้คู่กับ volume_confirm / volume_dwg สำหรับ loss */
const LOSS_VOLUME_STATUS_ID = 8

export function volumeTotals(rows: DashboardRequestRow[]) {
  let request = 0
  let dwg = 0
  let confirm = 0
  for (const r of rows) {
    request += num(r.volume_request)
    if (r.volume_dwg != null && !Number.isNaN(r.volume_dwg)) dwg += r.volume_dwg
    if (r.volume_confirm != null && !Number.isNaN(r.volume_confirm)) confirm += r.volume_confirm
  }
  let lossDwg = 0
  let lossConfirm = 0
  for (const r of rows) {
    if (r.status_id !== LOSS_VOLUME_STATUS_ID) continue
    if (r.volume_dwg != null && !Number.isNaN(r.volume_dwg)) lossDwg += r.volume_dwg
    if (r.volume_confirm != null && !Number.isNaN(r.volume_confirm)) lossConfirm += r.volume_confirm
  }
  const loss = lossConfirm - lossDwg
  const lossPctOfDwg = lossDwg > 0 ? (loss / lossDwg) * 100 : null
  const lossPctOfConfirm = lossConfirm > 0 ? (loss / lossConfirm) * 100 : null
  return { request, dwg, confirm, loss, lossPctOfDwg, lossPctOfConfirm }
}

export function statusCountsFromRows(rows: DashboardRequestRow[]): Record<number, number> {
  const m: Record<number, number> = {}
  for (const r of rows) {
    m[r.status_id] = (m[r.status_id] ?? 0) + 1
  }
  return m
}

export async function fetchDashboardRequestRows(supabase: SupabaseClient): Promise<DashboardRequestRow[]> {
  const pageSize = 1000
  const all: DashboardRequestRow[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('Request')
      .select(
        `
        id,
        status_id,
        structure_no,
        volume_request,
        volume_dwg,
        volume_confirm,
        casting_date,
        booked_at,
        postpone_date,
        strength,
        client:Client(client_name),
        structure:Structure(structure_name),
        mixcode:"Mixed Code"(supplier, strength, strength_type),
        booked_by_profile:profiles!booked_by(fname, lname, employee_id)
      `,
      )
      .order('booked_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) throw error
    const chunk = (data ?? []) as unknown as DashboardRequestRow[]
    all.push(...chunk)
    if (chunk.length < pageSize) break
  }
  return all
}
