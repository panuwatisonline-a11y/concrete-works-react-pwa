import { parseISO } from 'date-fns'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchDashboardRequestRows,
  rowClientName,
  rowPrimaryDateIso,
  rowStaffLabel,
  rowStructureName,
  type DashboardRequestRow,
} from '@/lib/adminDashboardAnalytics'

/** สถานะ Complete — รายการที่มี DWG / Confirm / Loss */
export const LOSS_CONCRETE_STATUS_ID = 8

export const LOSS_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export interface LossConcreteRecord {
  timestamp: number
  month: string
  staff: string
  client: string
  structure: string
  dwgVol: number
  confirmVol: number
  lossM3: number
}

function num(v: number | null | undefined): number {
  if (v == null || Number.isNaN(v)) return 0
  return v
}

/** ปริมาณ loss (m³) — ใช้ volume_loss จาก DB หรือ Confirm − DWG */
export function rowLossM3(r: DashboardRequestRow): number | null {
  if (r.volume_loss != null && !Number.isNaN(r.volume_loss)) return r.volume_loss
  const dwg = r.volume_dwg
  const conf = r.volume_confirm
  if (dwg == null || conf == null || Number.isNaN(dwg) || Number.isNaN(conf)) return null
  return conf - dwg
}

function monthLabelFromIso(iso: string): string {
  try {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) return 'Unknown'
    return `${LOSS_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return 'Unknown'
  }
}

export function mapRowsToLossRecords(rows: DashboardRequestRow[]): LossConcreteRecord[] {
  const out: LossConcreteRecord[] = []
  for (const r of rows) {
    if (r.status_id !== LOSS_CONCRETE_STATUS_ID) continue
    const dwgVol = num(r.volume_dwg)
    if (dwgVol <= 0) continue
    const lossM3 = rowLossM3(r)
    if (lossM3 == null) continue
    const iso = rowPrimaryDateIso(r) ?? r.booked_at?.slice(0, 10)
    const ts = iso ? parseISO(iso).getTime() : Date.now()
    const month = iso ? monthLabelFromIso(iso) : 'Unknown'
    out.push({
      timestamp: Number.isNaN(ts) ? Date.now() : ts,
      month,
      staff: rowStaffLabel(r),
      client: rowClientName(r) || 'ไม่ระบุ Sub Contractor',
      structure: rowStructureName(r),
      dwgVol,
      confirmVol: num(r.volume_confirm),
      lossM3,
    })
  }
  return out
}

export async function fetchLossConcreteRecords(supabase: SupabaseClient): Promise<LossConcreteRecord[]> {
  const rows = await fetchDashboardRequestRows(supabase)
  return mapRowsToLossRecords(rows)
}

export function formatMonthAxis(mon: string): string {
  if (mon === 'Unknown') return mon
  const parts = mon.split(' ')
  if (parts.length === 2) return `${parts[0]}/${parts[1].slice(2)}`
  return mon
}
