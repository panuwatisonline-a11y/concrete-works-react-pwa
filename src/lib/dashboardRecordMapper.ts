import { parseISO } from 'date-fns'
import {
  rowClientName,
  rowPrimaryDateIso,
  rowStaffLabel,
  rowStrengthLabel,
  rowStructureName,
  rowSupplier,
  type DashboardRequestRow,
} from '@/lib/adminDashboardAnalytics'
import { DASHBOARD_COMPLETE_STATUS, DASHBOARD_MONTHS } from '@/lib/dashboardConstants'
import { rowLossM3 } from '@/lib/lossConcreteAnalytics'
import { formatDate } from '@/lib/utils'

function relOne<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function monthLabelFromIso(iso: string): string {
  try {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) return 'Unknown'
    return `${DASHBOARD_MONTHS[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return 'Unknown'
  }
}

export interface DashboardConcreteRecord {
  ID: string
  Timestamp: number
  Month: string
  'Current Status': string
  'Request by': string
  'Concrete Works': string
  Structure: string
  Location: string
  'Structure No. or Grid Line': string
  Strength: string
  'Request Volume': number
  'DWG. Volume': number
  'Confirm Volume': number
  'Loss Concrete': number | null
  Supplier: string
  'Mix code': string
  Slump: string
  'Casting date': string
}

export type DashboardFilters = {
  status: string | null
  strength: string | null
  structure: string | null
  staff: string | null
  supplier: string | null
}

export const EMPTY_DASHBOARD_FILTERS: DashboardFilters = {
  status: null,
  strength: null,
  structure: null,
  staff: null,
  supplier: null,
}

export function mapDashboardRow(r: DashboardRequestRow): DashboardConcreteRecord {
  const iso = rowPrimaryDateIso(r) ?? r.booked_at?.slice(0, 10) ?? ''
  const ts = iso ? parseISO(iso).getTime() : 0
  const m = relOne(r.mixcode)
  const loc = relOne(r.location)
  const cw = relOne(r.concrete_work)
  const statusKey = String(r.status_id)
  const loss =
    statusKey === DASHBOARD_COMPLETE_STATUS ? rowLossM3(r) : null

  return {
    ID: r.id,
    Timestamp: Number.isNaN(ts) ? 0 : ts,
    Month: iso ? monthLabelFromIso(iso) : 'Unknown',
    'Current Status': statusKey,
    'Request by': rowStaffLabel(r),
    'Concrete Works': cw?.concrete_work?.trim() || '—',
    Structure: rowStructureName(r),
    Location: loc?.full_location?.trim() || loc?.location1?.trim() || '—',
    'Structure No. or Grid Line': r.structure_no?.trim() || '—',
    Strength: rowStrengthLabel(r),
    'Request Volume': r.volume_request ?? 0,
    'DWG. Volume': r.volume_dwg ?? 0,
    'Confirm Volume': r.volume_confirm ?? 0,
    'Loss Concrete': loss,
    Supplier: rowSupplier(r),
    'Mix code': m?.mixcode?.trim() || '—',
    Slump: m?.slump?.trim() || '—',
    'Casting date': iso ? formatDate(`${iso}T12:00:00`) : '—',
  }
}

export function mapDashboardRows(rows: DashboardRequestRow[]): DashboardConcreteRecord[] {
  return rows.map(mapDashboardRow)
}

/** ปริมาณสำหรับกราฟ DWG — ถ้าไม่มี DWG ใช้ Request volume แทน */
export function recordChartDwgVolume(rec: DashboardConcreteRecord): number {
  const dwg = Number(rec['DWG. Volume']) || 0
  if (dwg > 0) return dwg
  return Number(rec['Request Volume']) || 0
}

export function filterDashboardRows(
  rows: DashboardRequestRow[],
  filters: DashboardFilters,
): DashboardRequestRow[] {
  return rows.filter((r) => {
    const rec = mapDashboardRow(r)
    if (filters.status && rec['Current Status'] !== filters.status) return false
    if (filters.strength && rec.Strength !== filters.strength) return false
    if (filters.structure && rec.Structure !== filters.structure) return false
    if (filters.staff && rec['Request by'] !== filters.staff) return false
    if (filters.supplier && rec.Supplier !== filters.supplier) return false
    return true
  })
}
