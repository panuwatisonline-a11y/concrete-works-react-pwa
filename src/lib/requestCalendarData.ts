import { getAllCachedRequests } from '@/lib/offline/cache'
import { REQUEST_LIST_SELECT } from '@/lib/requestQueries'
import { isFullyOnline } from '@/stores/connectivityStore'
import { supabase } from '@/lib/supabase'
import type { RequestWithRelations } from '@/types/app.types'

export type CalendarDayBucket = {
  dateKey: string
  requests: RequestWithRelations[]
  count: number
  volumeRequest: number
  byStatus: Record<number, number>
}

/** ช่วงวันที่ YYYY-MM-DD ของเดือน (ท้องถิ่น) */
export function calendarMonthRange(month: Date): { from: string; to: string } {
  const y = month.getFullYear()
  const m = month.getMonth()
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const last = new Date(y, m + 1, 0).getDate()
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { from, to }
}

function castingDateKey(r: RequestWithRelations): string | null {
  const raw = r.casting_date?.trim() || r.postpone_date?.trim()
  if (!raw) return null
  return raw.length >= 10 ? raw.slice(0, 10) : raw
}

export function groupRequestsByCastingDate(
  requests: RequestWithRelations[],
): Map<string, CalendarDayBucket> {
  const map = new Map<string, CalendarDayBucket>()
  for (const r of requests) {
    const key = castingDateKey(r)
    if (!key) continue
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { dateKey: key, requests: [], count: 0, volumeRequest: 0, byStatus: {} }
      map.set(key, bucket)
    }
    bucket.requests.push(r)
    bucket.count += 1
    bucket.volumeRequest += r.volume_request ?? 0
    bucket.byStatus[r.status_id] = (bucket.byStatus[r.status_id] ?? 0) + 1
  }
  for (const b of map.values()) {
    b.requests.sort((a, b) => (a.request_time ?? '').localeCompare(b.request_time ?? ''))
  }
  return map
}

export type FetchCalendarMonthOpts = {
  month: Date
  scopeMine: boolean
  userId?: string
  clientId?: number | null
}

export async function fetchRequestsForCalendarMonth(
  opts: FetchCalendarMonthOpts,
): Promise<RequestWithRelations[]> {
  const { from, to } = calendarMonthRange(opts.month)

  if (!isFullyOnline()) {
    const all = await getAllCachedRequests()
    return filterMonthScope(all, opts, from, to)
  }

  let query = supabase
    .from('Request')
    .select(REQUEST_LIST_SELECT)
    .gte('casting_date', from)
    .lte('casting_date', to)
    .not('casting_date', 'is', null)
    .order('casting_date', { ascending: true })
    .order('request_time', { ascending: true, nullsFirst: false })

  if (opts.scopeMine && opts.userId) query = query.eq('booked_by', opts.userId)
  if (opts.scopeMine && opts.clientId != null) query = query.eq('client_id', opts.clientId)

  const { data, error } = await query
  if (error) throw error
  return filterMonthScope((data ?? []) as RequestWithRelations[], opts, from, to)
}

function filterMonthScope(
  rows: RequestWithRelations[],
  opts: FetchCalendarMonthOpts,
  from: string,
  to: string,
): RequestWithRelations[] {
  return rows.filter((r) => {
    const key = castingDateKey(r)
    if (!key || key < from || key > to) return false
    if (opts.scopeMine && opts.userId && r.booked_by !== opts.userId) return false
    if (opts.scopeMine && opts.clientId != null && r.client_id !== opts.clientId) return false
    return true
  })
}

/** จำนวนวันในเดือน + offset วันแรกของเดือน (จันทร์ = 0) */
export function buildMonthGridCells(month: Date): (Date | null)[] {
  const y = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(y, m, 1)
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const startPad = (first.getDay() + 6) % 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function dateToIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const TH_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export function formatCalendarMonthTitle(month: Date): string {
  const y = month.getFullYear() + 543
  return `${TH_MONTHS[month.getMonth()]} ${y}`
}
