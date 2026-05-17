import { activeCastingDateIso } from '@/lib/activeCastingDate'
import { cstMixStrengthText, parseCstListMix } from '@/lib/cstListRow'
import { formatTime, formatVolumeNumber } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

export type BookingSummaryRowFields = {
  time: string
  booker: string | null
  bookerPhone: string | null
  concrete: string | null
  location: string | null
  structure: string | null
  structureNo: string | null
  mixcode: string | null
  strength: string | null
  slump: string | null
  volume: string
  supplier: string | null
  remark: string | null
}

/** ลำดับคอลัมน์ตารางสรุปการจอง — เวลา/ผู้ติดต่อ → งาน/ที่ตั้ง/โครงสร้าง → สเปกคอนกรีต → ปริมาณ/ซัพพลายเออร์ → หมายเหตุ */
export const BOOKING_SUMMARY_COLUMNS: {
  key: keyof BookingSummaryRowFields
  label: string
  className?: string
  /** การ์ดมือถือ: ไม่แสดงถ้าค่าว่างหรือ '-' */
  hideOnMobileIfEmpty?: boolean
  /** การ์ดมือถือ: แสดงในหัวการ์ดแล้ว ไม่ซ้ำในรายการ */
  skipMobileCard?: boolean
}[] = [
  {
    key: 'time',
    label: 'Time',
    className: 'tabular-nums whitespace-nowrap',
    hideOnMobileIfEmpty: true,
    skipMobileCard: true,
  },
  { key: 'booker', label: 'Request by', className: 'whitespace-nowrap', skipMobileCard: true },
  { key: 'bookerPhone', label: 'Phone', className: 'tabular-nums whitespace-nowrap', skipMobileCard: true },
  { key: 'concrete', label: 'Concrete Work' },
  { key: 'location', label: 'Location' },
  { key: 'structure', label: 'Structure' },
  { key: 'structureNo', label: 'Structure No.' },
  { key: 'mixcode', label: 'Mix code' },
  { key: 'strength', label: 'Strength', className: 'whitespace-nowrap' },
  { key: 'slump', label: 'Slump' },
  { key: 'volume', label: 'Volume', className: 'tabular-nums whitespace-nowrap', hideOnMobileIfEmpty: true },
  { key: 'supplier', label: 'Supplier' },
  { key: 'remark', label: 'Remark', className: 'max-w-[12rem] truncate' },
]

/** ค่า Select — รายการที่ไม่มี Supplier */
export const BOOKING_SUMMARY_SUPPLIER_NONE = '__none__' as const

export function collectBookingSummarySuppliers(requests: RequestWithRelations[]): {
  suppliers: string[]
  hasUnspecified: boolean
} {
  const names = new Set<string>()
  let hasUnspecified = false
  for (const r of requests) {
    const s = getBookingSummaryRowFields(r).supplier
    if (s) names.add(s)
    else hasUnspecified = true
  }
  return {
    suppliers: [...names].sort((a, b) => a.localeCompare(b, 'th')),
    hasUnspecified,
  }
}

export function bookingSummaryMatchesSupplierFilter(
  r: RequestWithRelations,
  supplierFilter: string,
): boolean {
  if (!supplierFilter) return true
  const s = getBookingSummaryRowFields(r).supplier
  if (supplierFilter === BOOKING_SUMMARY_SUPPLIER_NONE) return !s
  return s === supplierFilter
}

export function bookingSummarySearchBlob(
  f: BookingSummaryRowFields,
  clientName?: string | null,
): string {
  return [...BOOKING_SUMMARY_COLUMNS.map((c) => f[c.key]), clientName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function bookerName(r: RequestWithRelations): string | null {
  const p = r.booked_by_profile as { fname?: string | null; lname?: string | null } | null | undefined
  if (!p) return null
  const name = [p.fname, p.lname].filter(Boolean).join(' ').trim()
  return name || null
}

function bookerPhone(r: RequestWithRelations): string | null {
  const p = r.booked_by_profile as { phone?: string | null } | null | undefined
  return p?.phone?.trim() || null
}

function bookingVolume(r: RequestWithRelations): string {
  if (r.volume_request != null) return formatVolumeNumber(r.volume_request)
  if (r.volume_confirm != null) return formatVolumeNumber(r.volume_confirm)
  if (r.volume_actual != null) return formatVolumeNumber(r.volume_actual)
  return '-'
}

function bookingStrength(r: RequestWithRelations): string | null {
  const mix = parseCstListMix(r)
  const fromMix = cstMixStrengthText(mix)
  if (fromMix) return fromMix
  if (r.strength != null && !Number.isNaN(r.strength)) return String(r.strength)
  return null
}

export function getBookingSummaryRowFields(r: RequestWithRelations): BookingSummaryRowFields {
  const structure = (r.structure as { structure_name: string } | null)?.structure_name?.trim() || null
  const structureNo = r.structure_no?.trim() || null
  const location =
    (r.location as { full_location: string | null; location1: string } | null)?.full_location ??
    (r.location as { location1: string } | null)?.location1 ??
    null
  const concrete = (r.concrete_work as { concrete_work: string } | null)?.concrete_work ?? null
  const mix = parseCstListMix(r)
  const rawMix = r.mixcode as { slump?: string | null } | null
  const slump = rawMix?.slump?.trim() || null

  return {
    concrete,
    structure,
    structureNo,
    location,
    mixcode: mix?.mixcode?.trim() || null,
    strength: bookingStrength(r),
    slump,
    volume: bookingVolume(r),
    time: formatTime(r.request_time),
    booker: bookerName(r),
    bookerPhone: bookerPhone(r),
    supplier: mix?.supplier?.trim() || null,
    remark: r.remarks?.trim() || null,
  }
}

/** วันเทที่ใช้แสดงในรายการสรุป (รองรับเลื่อนวัน) */
export function bookingSummaryMatchesCastingDate(
  r: RequestWithRelations,
  castingDateIso: string,
): boolean {
  return activeCastingDateIso(r) === castingDateIso
}
