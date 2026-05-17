import { supabase } from '@/lib/supabase'
import { activeCastingDateIso } from '@/lib/activeCastingDate'
import { CST_LIST_REQUEST_SELECT, CST_LIST_STATUS_ID } from '@/lib/cstListData'
import type { RequestWithRelations } from '@/types/app.types'
import type { CstViewRow } from '@/types/database.cst.types'

const CST_VIEW_CHUNK = 120
const REQUEST_PAGE_SIZE = 500

export type FetchConcreteSummaryOpts = {
  castingDateFrom: string | null
  castingDateTo: string | null
  structureId: number | null
}

function normalizeDateRange(from: string | null, to: string | null): { from: string; to: string } {
  let f = from?.trim() ?? ''
  let t = to?.trim() ?? ''
  if (f && t && f > t) [f, t] = [t, f]
  return { from: f, to: t }
}

function matchesCastingDateRange(r: RequestWithRelations, from: string, to: string): boolean {
  const d = activeCastingDateIso(r)
  if (!d) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export async function fetchConcreteSummaryRequests(
  opts: FetchConcreteSummaryOpts,
): Promise<RequestWithRelations[]> {
  const { from, to } = normalizeDateRange(opts.castingDateFrom, opts.castingDateTo)
  const all: RequestWithRelations[] = []
  let page = 0

  while (true) {
    const offset = page * REQUEST_PAGE_SIZE
    let query = supabase
      .from('Request')
      .select(CST_LIST_REQUEST_SELECT)
      .eq('status_id', CST_LIST_STATUS_ID)
      .order('casting_date', { ascending: false, nullsFirst: false })
      .order('booked_at', { ascending: true })
      .range(offset, offset + REQUEST_PAGE_SIZE - 1)

    if (opts.structureId != null) query = query.eq('structure_id', opts.structureId)
    if (from) query = query.gte('casting_date', from)
    if (to) query = query.lte('casting_date', to)

    const { data, error } = await query
    if (error) throw error

    const chunk = (data ?? []) as RequestWithRelations[]
    all.push(...chunk)
    if (chunk.length < REQUEST_PAGE_SIZE) break
    page += 1
  }

  if (from || to) {
    return all.filter((r) => matchesCastingDateRange(r, from, to))
  }
  return all
}

export async function fetchCstViewsByRequestIds(requestIds: string[]): Promise<CstViewRow[]> {
  if (!requestIds.length) return []
  const all: CstViewRow[] = []
  for (let i = 0; i < requestIds.length; i += CST_VIEW_CHUNK) {
    const chunk = requestIds.slice(i, i + CST_VIEW_CHUNK)
    const { data, error } = await supabase.from('CST_View').select('*').in('request_id', chunk)
    if (error) throw error
    all.push(...((data ?? []) as CstViewRow[]))
  }
  return all
}

export function indexCstViewsByRequestAndAge(
  views: CstViewRow[],
): Map<string, Map<number, CstViewRow>> {
  const byRequest = new Map<string, Map<number, CstViewRow>>()
  for (const view of views) {
    const requestId = view.request_id?.trim()
    const age = view.age
    if (!requestId || age == null || Number.isNaN(age)) continue
    let ages = byRequest.get(requestId)
    if (!ages) {
      ages = new Map()
      byRequest.set(requestId, ages)
    }
    ages.set(age, view)
  }
  return byRequest
}
