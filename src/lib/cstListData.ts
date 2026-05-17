import { supabase } from '@/lib/supabase'
import { fetchCstAgesByRequestIds } from '@/lib/cstData'
import { isCstDueToday } from '@/lib/cstListDue'
import { collectRequestIdsMatchingSearch } from '@/lib/requestListSearch'
import type { RequestWithRelations } from '@/types/app.types'

/** สถานะ Complete — รายการที่เทเสร็จแล้ว ใช้เป็นต้นทางหน้า CST */
export const CST_LIST_STATUS_ID = 8

export const CST_LIST_REQUEST_SELECT = `
  *,
  status:Status(id, status_name),
  client:Client(id, client_name),
  location:Location(id, full_location, location1),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, supplier, strength, slump, strength_type, sample_type),
  abc_code:"ABC Code"(id, full_abc),
  wbs_code:"WBS Code"(id, full_wbs),
  booked_by_profile:profiles!booked_by(fname, lname, employee_id, phone)
`

export interface FetchCstListPageOpts {
  page: number
  pageSize: number
  search: string
  castingDateFrom: string | null
  castingDateTo: string | null
}

export interface CstListPageResult {
  requests: RequestWithRelations[]
  total: number
  cstAgesByRequestId: Map<string, number[]>
}

export async function fetchCstListPage(opts: FetchCstListPageOpts): Promise<CstListPageResult> {
  const { page, pageSize, search, castingDateFrom, castingDateTo } = opts

  const searchIds = await collectRequestIdsMatchingSearch(supabase, search)
  if (searchIds !== null && searchIds.length === 0) {
    return { requests: [], total: 0, cstAgesByRequestId: new Map() }
  }

  let query = supabase
    .from('Request')
    .select(CST_LIST_REQUEST_SELECT, { count: 'exact' })
    .eq('status_id', CST_LIST_STATUS_ID)

  if (castingDateFrom) query = query.gte('casting_date', castingDateFrom)
  if (castingDateTo) query = query.lte('casting_date', castingDateTo)
  if (searchIds !== null) query = query.in('id', searchIds)

  query = query
    .order('casting_date', { ascending: false, nullsFirst: false })
    .order('booked_at', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  const { data, count, error } = await query
  if (error) throw error

  const requests = (data ?? []) as RequestWithRelations[]
  const cstAgesByRequestId = await fetchCstAgesByRequestIds(requests.map((r) => r.id))

  return {
    requests,
    total: count ?? 0,
    cstAgesByRequestId,
  }
}

const CST_LIST_FETCH_CHUNK = 500

export type FetchCstListAllOpts = {
  search: string
  castingDateFrom: string | null
  castingDateTo: string | null
}

/** โหลดรายการ Complete ทั้งหมดที่ตรงตัวกรอง (ไม่แบ่งหน้า) */
export async function fetchAllCstListRequests(opts: FetchCstListAllOpts): Promise<RequestWithRelations[]> {
  const all: RequestWithRelations[] = []
  let page = 0
  let total = Infinity

  while (all.length < total) {
    const result = await fetchCstListPage({
      ...opts,
      page,
      pageSize: CST_LIST_FETCH_CHUNK,
    })
    all.push(...result.requests)
    total = result.total
    if (result.requests.length < CST_LIST_FETCH_CHUNK) break
    page += 1
  }

  return all
}

export type FetchCstDueTodayOpts = {
  search: string
}

/** รายการที่วันทดสอบ = วันนี้ และยังไม่บันทึกผล — ทั้งระบบ (ไม่ใช้ตัวกรองวันเท) */
export async function fetchCstDueTodayList(opts: FetchCstDueTodayOpts): Promise<{
  requests: RequestWithRelations[]
  cstAgesByRequestId: Map<string, number[]>
}> {
  const all = await fetchAllCstListRequests({
    search: opts.search,
    castingDateFrom: null,
    castingDateTo: null,
  })
  const cstAgesByRequestId = await fetchCstAgesByRequestIds(all.map((r) => r.id))
  const requests = all.filter((r) => isCstDueToday(r, cstAgesByRequestId.get(r.id) ?? []))
  return { requests, cstAgesByRequestId }
}

function mergeCstAgeMaps(...maps: Map<string, number[]>[]): Map<string, number[]> {
  const merged = new Map<string, number[]>()
  for (const map of maps) {
    for (const [id, ages] of map) merged.set(id, ages)
  }
  return merged
}

export { mergeCstAgeMaps }
