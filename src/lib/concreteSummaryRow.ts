import { activeCastingDateIso } from '@/lib/activeCastingDate'
import {
  cstFormatNumber,
  cstGroupStrengthPercent,
  cstPrimaryAverageKsc,
  cstResolveDesignStrength,
} from '@/lib/cstForm'
import { cstMixStrengthText, getCstListRowFields, parseCstListMix } from '@/lib/cstListRow'
import type { RequestWithRelations } from '@/types/app.types'
import type { CstViewRow } from '@/types/database.cst.types'

/** อายุทดสอบที่แสดงในตาราง Concrete Summary */
export const CONCRETE_SUMMARY_TEST_AGES = [1, 7, 14, 28] as const
export type ConcreteSummaryTestAge = (typeof CONCRETE_SUMMARY_TEST_AGES)[number]

export type ConcreteSummaryRowFields = {
  castingDate: string
  concrete: string | null
  structure: string | null
  location: string | null
  structureNo: string | null
  supplier: string | null
  slump: string | null
  mixCode: string | null
  reqStrength: string | null
  avgByAge: Record<ConcreteSummaryTestAge, string>
  result: string
}

export const CONCRETE_SUMMARY_AVG_LABELS: Record<ConcreteSummaryTestAge, string> = {
  1: 'Avg 1 Day',
  7: 'Avg 7 Days',
  14: 'Avg 14 Days',
  28: 'Avg 28 Days',
}

function avgDisplay(view: CstViewRow | undefined): string {
  if (!view) return '—'
  const n = cstPrimaryAverageKsc(view)
  return n != null ? cstFormatNumber(n) : '—'
}

function resolveReqStrength(
  request: RequestWithRelations,
  viewsByAge: Map<number, CstViewRow> | undefined,
): string | null {
  const mix = parseCstListMix(request)
  const fromMix = cstMixStrengthText(mix)
  if (fromMix) return fromMix
  const firstView = viewsByAge ? [...viewsByAge.values()][0] : undefined
  if (!firstView) return null
  const design = cstResolveDesignStrength(firstView, request)
  return design != null ? cstFormatNumber(design) : null
}

function concreteSummaryResult(
  viewsByAge: Map<number, CstViewRow> | undefined,
  request: RequestWithRelations,
): string {
  if (!viewsByAge?.size) return '—'

  const design =
    cstResolveDesignStrength([...viewsByAge.values()][0], request) ??
    (() => {
      const mix = parseCstListMix(request)
      return mix?.strength != null && !Number.isNaN(mix.strength) ? mix.strength : null
    })()

  if (design == null || design <= 0) return '—'

  const priority: ConcreteSummaryTestAge[] = [28, 14, 7, 1]
  let chosen: { age: ConcreteSummaryTestAge; avg: number } | null = null

  for (const age of priority) {
    const view = viewsByAge.get(age)
    if (!view) continue
    const avg = cstPrimaryAverageKsc(view)
    if (avg != null) {
      chosen = { age, avg }
      break
    }
  }

  if (!chosen) return '—'

  const pct = cstGroupStrengthPercent(chosen.avg, design)
  const pass = chosen.avg >= design
  return `${pass ? 'ผ่าน' : 'ไม่ผ่าน'} (${pct}%)`
}

export type ConcreteSummaryStructureOption = {
  id: number
  name: string
}

function relStructureName(
  structure: RequestWithRelations['structure'],
): string | null {
  if (structure == null) return null
  const row = Array.isArray(structure) ? structure[0] : structure
  return (row as { structure_name?: string } | null)?.structure_name?.trim() ?? null
}

/** โครงสร้างที่ปรากฏในชุดคำขอ (ใช้ตัวกรอง Structure) */
export function collectStructureOptionsFromRequests(
  requests: RequestWithRelations[],
): ConcreteSummaryStructureOption[] {
  const map = new Map<number, string>()
  for (const r of requests) {
    const sid = r.structure_id
    if (sid == null) continue
    const name = relStructureName(r.structure) || `Structure #${sid}`
    if (!map.has(sid)) map.set(sid, name)
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
}

export function requestMatchesStructureFilter(
  r: RequestWithRelations,
  structureId: string,
  allValue = 'all',
): boolean {
  if (structureId === allValue) return true
  return r.structure_id != null && String(r.structure_id) === structureId
}

export type ConcreteSummaryPrintRow = {
  item: number
  castingDate: string
  concreteWorks: string
  structure: string
  location: string
  structureNo: string
  supplier: string
  slump: string
  mixCode: string
  reqStrength: string
  avg1: string
  avg7: string
  avg14: string
  avg28: string
  result: string
}

function printCell(v: string | null | undefined): string {
  if (v == null || v === '') return '-'
  return v
}

export function toConcreteSummaryPrintRow(
  item: number,
  fields: ConcreteSummaryRowFields,
): ConcreteSummaryPrintRow {
  return {
    item,
    castingDate: printCell(fields.castingDate === '—' ? null : fields.castingDate),
    concreteWorks: printCell(fields.concrete),
    structure: printCell(fields.structure),
    location: printCell(fields.location),
    structureNo: printCell(fields.structureNo),
    supplier: printCell(fields.supplier),
    slump: printCell(fields.slump),
    mixCode: printCell(fields.mixCode),
    reqStrength: printCell(fields.reqStrength),
    avg1: printCell(fields.avgByAge[1] === '—' ? null : fields.avgByAge[1]),
    avg7: printCell(fields.avgByAge[7] === '—' ? null : fields.avgByAge[7]),
    avg14: printCell(fields.avgByAge[14] === '—' ? null : fields.avgByAge[14]),
    avg28: printCell(fields.avgByAge[28] === '—' ? null : fields.avgByAge[28]),
    result: printCell(fields.result === '—' ? null : fields.result),
  }
}

/** ค่ากำลังออกแบบสำหรับเรียง (ไม่มีค่า → ไปท้ายเมื่อเรียงน้อยไปมาก) */
export function concreteSummarySortStrength(r: RequestWithRelations): number {
  const mix = parseCstListMix(r)
  if (mix?.strength != null && !Number.isNaN(mix.strength)) return mix.strength
  if (r.strength != null && !Number.isNaN(r.strength)) return r.strength
  return Number.POSITIVE_INFINITY
}

function concreteSummarySortSupplierKey(r: RequestWithRelations): string {
  const mix = parseCstListMix(r)
  const name = mix?.supplier?.trim()
  return name ? name.toLocaleLowerCase('th') : '\uffff'
}

/** วันเท ↑ → Req. Strength ↑ → Supplier A–Z */
export function compareConcreteSummaryRequests(
  a: RequestWithRelations,
  b: RequestWithRelations,
): number {
  const da = activeCastingDateIso(a) ?? '9999-12-31'
  const db = activeCastingDateIso(b) ?? '9999-12-31'
  const byDate = da.localeCompare(db)
  if (byDate !== 0) return byDate

  const byStrength = concreteSummarySortStrength(a) - concreteSummarySortStrength(b)
  if (byStrength !== 0) return byStrength

  return concreteSummarySortSupplierKey(a).localeCompare(
    concreteSummarySortSupplierKey(b),
    'th',
  )
}

export function sortConcreteSummaryRequests(
  requests: RequestWithRelations[],
): RequestWithRelations[] {
  return [...requests].sort(compareConcreteSummaryRequests)
}

export function concreteSummaryMatchesSearch(
  r: RequestWithRelations,
  viewsByAge: Map<number, CstViewRow> | undefined,
  q: string,
): boolean {
  if (!q) return true
  const f = buildConcreteSummaryRowFields(r, viewsByAge)
  const blob = [
    f.concrete,
    f.structure,
    f.location,
    f.structureNo,
    f.supplier,
    f.slump,
    f.mixCode,
    f.reqStrength,
    (r.client as { client_name?: string } | null)?.client_name,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return blob.includes(q)
}

export function buildConcreteSummaryRowFields(
  request: RequestWithRelations,
  viewsByAge: Map<number, CstViewRow> | undefined,
): ConcreteSummaryRowFields {
  const base = getCstListRowFields(request)
  const mixRaw = request.mixcode as { slump?: string | null } | null
  const slump = mixRaw?.slump?.trim() || null
  const mix = parseCstListMix(request)

  const avgByAge = {} as Record<ConcreteSummaryTestAge, string>
  for (const age of CONCRETE_SUMMARY_TEST_AGES) {
    avgByAge[age] = avgDisplay(viewsByAge?.get(age))
  }

  return {
    castingDate: base.castingDate,
    concrete: base.concrete,
    structure: base.structure,
    location: base.location,
    structureNo: base.structureNo,
    supplier: mix?.supplier?.trim() || null,
    slump,
    mixCode: mix?.mixcode?.trim() || null,
    reqStrength: resolveReqStrength(request, viewsByAge),
    avgByAge,
    result: concreteSummaryResult(viewsByAge, request),
  }
}
