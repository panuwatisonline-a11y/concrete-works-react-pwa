import type { SupabaseClient } from '@supabase/supabase-js'
import { applyJobScope } from '@/lib/jobScope'
import { scopeFromAuth } from '@/lib/jobScopeQueries'
import type { MixedCode } from '@/types/app.types'

const REQ_PAGE_SIZE = 1000

/** Complete — ยอด used จาก volume_confirm */
export const MIXCODE_BALANCE_COMPLETE_STATUS_ID = 8

/** สถานะที่ยังไม่จบ — ยอด pending จาก volume_request */
export const MIXCODE_BALANCE_PENDING_STATUS_IDS = [1, 2, 3, 4, 5] as const

export interface MixcodeUsageById {
  used: number
  pending: number
}

export interface MixcodeBalanceRow {
  id: number
  mixcode: string
  supplier: string
  strengthLabel: string
  sampleType: string
  slump: string
  structureList: string
  poQty: number
  used: number
  pending: number
  balance: number
  usedPct: number
}

function num(v: number | null | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  return v
}

export async function fetchMixcodeUsageByMixcodeId(
  supabase: SupabaseClient,
): Promise<Record<number, MixcodeUsageById>> {
  const sums: Record<number, MixcodeUsageById> = {}
  const scope = scopeFromAuth()
  for (let from = 0; ; from += REQ_PAGE_SIZE) {
    let query = supabase
      .from('Request')
      .select('mixcode_id, status_id, volume_request, volume_confirm')
      .not('mixcode_id', 'is', null)
      .range(from, from + REQ_PAGE_SIZE - 1)
    query = applyJobScope(query, scope)
    const { data, error } = await query
    if (error) throw error
    const chunk = data ?? []
    for (const row of chunk) {
      const mid = row.mixcode_id
      if (mid == null) continue
      if (!sums[mid]) sums[mid] = { used: 0, pending: 0 }
      const sid = row.status_id
      if (sid === MIXCODE_BALANCE_COMPLETE_STATUS_ID) {
        sums[mid].used += num(row.volume_confirm)
      } else if (
        (MIXCODE_BALANCE_PENDING_STATUS_IDS as readonly number[]).includes(sid)
      ) {
        sums[mid].pending += num(row.volume_request)
      }
    }
    if (chunk.length < REQ_PAGE_SIZE) break
  }
  return sums
}

export function buildMixcodeBalanceRows(
  mixcodes: MixedCode[],
  usageByMixcodeId: Record<number, MixcodeUsageById>,
): MixcodeBalanceRow[] {
  return mixcodes.map((mc) => {
    const usage = usageByMixcodeId[mc.id] ?? { used: 0, pending: 0 }
    const poQty = num(mc.qty)
    const used = +usage.used.toFixed(2)
    const pending = +usage.pending.toFixed(2)
    const balance = +(poQty - used - pending).toFixed(2)
    const usedPct = poQty > 0 ? +(((used + pending) / poQty) * 100).toFixed(2) : 0
    const strengthLabel = [mc.strength, mc.strength_type].filter((v) => v != null && v !== '').join(' ')
    return {
      id: mc.id,
      mixcode: mc.mixcode?.trim() ?? '',
      supplier: mc.supplier?.trim() ?? '',
      strengthLabel: strengthLabel || '—',
      sampleType: mc.sample_type?.trim() ?? '',
      slump: mc.slump?.trim() ?? '',
      structureList: mc.structure_list?.trim() ?? '',
      poQty,
      used,
      pending,
      balance,
      usedPct,
    }
  })
}
