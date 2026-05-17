import { supabase } from '@/lib/supabase'
import { bookingSummaryMatchesCastingDate } from '@/lib/bookingSummaryRow'
import { CST_LIST_REQUEST_SELECT } from '@/lib/cstListData'
import type { RequestWithRelations } from '@/types/app.types'

/** ไม่แสดง Reject / Cancel ในรายการสรุปการจอง */
export const BOOKING_SUMMARY_EXCLUDED_STATUS_IDS = [6, 7] as const

const FETCH_CHUNK = 500

export type FetchBookingSummaryOpts = {
  castingDateIso: string
  clientId?: number | null
}

export async function fetchBookingSummaryForDate(
  opts: FetchBookingSummaryOpts,
): Promise<RequestWithRelations[]> {
  const { castingDateIso, clientId } = opts
  const date = castingDateIso.trim()
  if (!date) return []

  let query = supabase
    .from('Request')
    .select(CST_LIST_REQUEST_SELECT)
    .or(`and(casting_date.eq.${date},postpone_date.is.null),postpone_date.eq.${date}`)
    .not('status_id', 'in', `(${BOOKING_SUMMARY_EXCLUDED_STATUS_IDS.join(',')})`)

  if (clientId != null) query = query.eq('client_id', clientId)

  query = query
    .order('request_time', { ascending: true, nullsFirst: false })
    .order('booked_at', { ascending: true })

  const all: RequestWithRelations[] = []
  let from = 0

  while (true) {
    const { data, error } = await query.range(from, from + FETCH_CHUNK - 1)
    if (error) throw error
    const chunk = (data ?? []) as RequestWithRelations[]
    all.push(...chunk)
    if (chunk.length < FETCH_CHUNK) break
    from += FETCH_CHUNK
  }

  return all.filter((r) => bookingSummaryMatchesCastingDate(r, date))
}
