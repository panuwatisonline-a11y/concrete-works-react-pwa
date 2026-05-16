import { activeCastingDateIso } from '@/lib/activeCastingDate'
import type { CstRecord, CstTestAge, RequestWithRelations } from '@/types/app.types'
import type { CstViewRow } from '@/types/database.cst.types'
import type { CstStrengthReportTemplateData } from '@/lib/cstStrengthReportTemplate'
import {
  cstStrengthReportDataFromRequest,
  cstStrengthUnitLabel,
  formatCstAgeLabel,
} from '@/lib/cstStrengthReportTemplate'
import { format } from 'date-fns'
import { formatDate } from '@/lib/utils'

export const CST_SAMPLE_TYPE_OPTIONS = [
  'Cylinder 15x30 cm.',
  'Cylinder 10x10 cm.',
  'Cylinder 6x10 cm.',
  'Cube 15x15x15 cm.',
  'Cube 10x10x10 cm.',
  'Cube 5x5x5 cm.',
] as const

export const CST_SAMPLE_GROUPS = 5
export const CST_SAMPLES_PER_GROUP = 3
export const CST_MAX_SAMPLES = CST_SAMPLE_GROUPS * CST_SAMPLES_PER_GROUP

/** ทศนิยมมาตรฐานของระบบ CST */
export const CST_DECIMAL_PLACES = 2

export function cstRoundNumber(n: number): number {
  const factor = 10 ** CST_DECIMAL_PLACES
  return Math.round(n * factor) / factor
}

export function cstFormatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return ''
  return cstRoundNumber(n).toFixed(CST_DECIMAL_PLACES)
}

/** จัดรูปแบบค่าในช่องตัวเลข CST เมื่อ blur */
export function formatCstNumericInput(value: string): string {
  const t = value.trim()
  if (!t) return ''
  const n = Number(t)
  if (!Number.isFinite(n)) return value
  return cstFormatNumber(n)
}

/** ป้ายตัวอย่างมาตรฐานในฟอร์ม CST: A1, A2, … */
export function cstDefaultSampleLabel(oneBasedIndex: number): string {
  return `A${oneBasedIndex}`
}

export interface CstSampleInput {
  sampleNo: string
  wt: string
  kn: string
  height: string
  diameter: string
}

export interface CstFormValues {
  id?: string
  report_no: string
  test_date: string
  sample_type: string
  machine_id: string
  samples: CstSampleInput[]
  remarks: string[]
}

export function cstGroupCount(sampleCount: number = CST_MAX_SAMPLES): number {
  return Math.min(CST_SAMPLE_GROUPS, Math.ceil(sampleCount / CST_SAMPLES_PER_GROUP))
}

/** มีข้อมูลที่ผู้ใช้กรอกจริง (ไม่นับ sampleNo เริ่มต้น A1–A15) */
export function cstSampleHasData(s: CstSampleInput): boolean {
  return Boolean(s.wt.trim() || s.kn.trim() || s.height.trim() || s.diameter.trim())
}

/** จำนวนชุดที่ควรเปิดในฟอร์มเมื่อโหลดข้อมูลเดิม (อย่างน้อย 1) */
export function cstInferVisibleGroupCount(
  samples: CstSampleInput[],
  maxGroups: number,
): number {
  const cap = Math.min(CST_SAMPLE_GROUPS, Math.max(1, maxGroups))
  let highest = 1
  for (let g = 0; g < cap; g++) {
    const start = g * CST_SAMPLES_PER_GROUP
    const chunk = samples.slice(start, start + CST_SAMPLES_PER_GROUP)
    if (chunk.some(cstSampleHasData)) highest = g + 1
  }
  return highest
}

export function needsCylinderDimensions(sampleType: string): boolean {
  const t = sampleType.trim()
  return t === 'Cylinder 10x10 cm.' || t === 'Cylinder 6x10 cm.'
}

export function defaultTestDateIso(castingDate: string | null | undefined, age: number): string {
  if (!castingDate?.trim()) return new Date().toISOString().slice(0, 10)
  const d = new Date(`${castingDate.trim()}T12:00:00`)
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  d.setDate(d.getDate() + age)
  return d.toISOString().slice(0, 10)
}

/** วันทดสอบ = Active Casting Date + อายุ (เลื่อนวันก่อน แล้ววันเท) */
export function defaultCstTestDateIso(
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>,
  age: number,
): string {
  return defaultTestDateIso(activeCastingDateIso(request), age)
}

/** วันทดสอบจริง (แสดงในตาราง CST) — dd/MM/yyyy */
export function cstTestDateDisplay(
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>,
  age: number,
): string {
  return formatDate(`${defaultCstTestDateIso(request, age)}T12:00:00`)
}

/** รูปแบบสั้นสำหรับการ์ดคอลัมน์ CST */
export function cstTestDateDisplayShort(
  request: Pick<RequestWithRelations, 'postpone_date' | 'casting_date'>,
  age: number,
): string {
  const iso = defaultCstTestDateIso(request, age)
  return format(new Date(`${iso}T12:00:00`), 'dd/MM/yy')
}

export function emptyCstSampleRow(): CstSampleInput {
  return { sampleNo: '', wt: '', kn: '', height: '', diameter: '' }
}

export function emptyCstSamples(count: number): CstSampleInput[] {
  return Array.from({ length: count }, (_, i) => ({
    sampleNo: i < CST_SAMPLES_PER_GROUP ? cstDefaultSampleLabel(i + 1) : '',
    wt: '',
    kn: '',
    height: '',
    diameter: '',
  }))
}

/** ลบชุดตัวอย่าง (เลื่อนชุดถัดไปขึ้น แล้วล้างช่องท้าย) */
export function removeCstSampleGroup(
  samples: CstSampleInput[],
  groupIndex0: number,
  visibleGroups: number,
): { samples: CstSampleInput[]; visibleGroups: number } {
  const nextVisible = Math.max(1, visibleGroups - 1)
  const next = samples.map((row) => ({ ...row }))
  for (let g = groupIndex0; g < visibleGroups - 1; g++) {
    const to = g * CST_SAMPLES_PER_GROUP
    const from = (g + 1) * CST_SAMPLES_PER_GROUP
    for (let i = 0; i < CST_SAMPLES_PER_GROUP; i++) {
      next[to + i] = { ...next[from + i] }
    }
  }
  const clearStart = nextVisible * CST_SAMPLES_PER_GROUP
  for (let i = 0; i < CST_SAMPLES_PER_GROUP; i++) {
    const idx = clearStart + i
    if (idx < next.length) next[idx] = emptyCstSampleRow()
  }
  return { samples: next, visibleGroups: nextVisible }
}

export function defaultCstFormValues(
  request: RequestWithRelations,
  age: CstTestAge,
): CstFormValues {
  const mix = request.mixcode as { sample_type?: string | null } | null | undefined
  return {
    report_no: '',
    test_date: defaultCstTestDateIso(request, age),
    sample_type: mix?.sample_type?.trim() ?? CST_SAMPLE_TYPE_OPTIONS[0],
    machine_id: '',
    samples: emptyCstSamples(CST_MAX_SAMPLES),
    remarks: Array.from({ length: CST_SAMPLE_GROUPS }, () => ''),
  }
}

function parseOptionalNum(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number(t)
  return Number.isFinite(n) ? cstRoundNumber(n) : null
}

function fieldFromRecord(
  rec: CstRecord,
  prefix: 'sample' | 'wt' | 'kn',
  i: number,
): string {
  const key = `${prefix}${i}` as keyof CstRecord
  const v = rec[key]
  if (v == null) return ''
  if (prefix === 'sample') return String(v)
  if (typeof v === 'number') return cstFormatNumber(v)
  return formatCstNumericInput(String(v))
}

function dimensionFromRecord(rec: CstRecord, key: keyof CstRecord): string {
  const v = rec[key]
  if (v == null) return ''
  if (typeof v === 'number') return cstFormatNumber(v)
  return formatCstNumericInput(String(v))
}

export function cstFormValuesFromRecord(
  rec: CstRecord,
  request: RequestWithRelations,
  age: CstTestAge,
): CstFormValues {
  const samples: CstSampleInput[] = []
  for (let i = 1; i <= CST_MAX_SAMPLES; i++) {
    const hKey = `height${Math.min(i, 6)}` as keyof CstRecord
    const dKey = `diameter${Math.min(i, 6)}` as keyof CstRecord
    samples.push({
      sampleNo: fieldFromRecord(rec, 'sample', i),
      wt: fieldFromRecord(rec, 'wt', i),
      kn: fieldFromRecord(rec, 'kn', i),
      height: dimensionFromRecord(rec, hKey),
      diameter: dimensionFromRecord(rec, dKey),
    })
  }
  return {
    id: rec.id,
    report_no: rec.report_no?.trim() ?? '',
    test_date: rec.test_date?.trim().slice(0, 10) ?? defaultCstTestDateIso(request, age),
    sample_type: rec.sample_type?.trim() ?? CST_SAMPLE_TYPE_OPTIONS[0],
    machine_id: rec.machine_id != null ? String(rec.machine_id) : '',
    samples,
    remarks: Array.from({ length: CST_SAMPLE_GROUPS }, () => ''),
  }
}

export function cstRecordPayloadFromForm(
  values: CstFormValues,
  requestId: string,
  age: number,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ref: requestId,
    age,
    report_no: values.report_no.trim() || null,
    test_date: values.test_date.trim() || null,
    sample_type: values.sample_type.trim() || null,
    machine_id: values.machine_id ? Number(values.machine_id) : null,
    updated_at: new Date().toISOString(),
  }

  for (let i = 1; i <= CST_MAX_SAMPLES; i++) {
    const row = values.samples[i - 1]
    if (row) {
      payload[`sample${i}`] = row.sampleNo.trim() || null
      payload[`wt${i}`] = parseOptionalNum(row.wt)
      payload[`kn${i}`] = parseOptionalNum(row.kn)
    } else {
      payload[`sample${i}`] = null
      payload[`wt${i}`] = null
      payload[`kn${i}`] = null
    }
  }

  for (let i = 1; i <= 6; i++) {
    const row = values.samples[i - 1]
    payload[`height${i}`] = row ? parseOptionalNum(row.height) : null
    payload[`diameter${i}`] = row ? parseOptionalNum(row.diameter) : null
  }

  return payload
}

function kscAt(view: CstViewRow, i: number): number | null {
  const key = `ksc${i}` as keyof CstViewRow
  const v = view[key]
  return typeof v === 'number' ? v : null
}

function groupKscAverage(view: CstViewRow, groupIndex: number): string {
  const start = (groupIndex - 1) * CST_SAMPLES_PER_GROUP + 1
  const vals: number[] = []
  for (let i = start; i < start + CST_SAMPLES_PER_GROUP; i++) {
    const k = kscAt(view, i)
    if (k != null) vals.push(k)
  }
  if (!vals.length) return ''
  return cstFormatNumber(vals.reduce((a, b) => a + b, 0) / vals.length)
}

/** แปลงแถว `CST_View` → ข้อมูลเทมเพลตรายงาน */
export type CstComputedPreviewRow = {
  index: number
  label: string
  density: string
  ksc: string
  adj: string
}

/** แถวผลคำนวณจาก CST_View สำหรับแสดงในฟอร์ม (สูงสุด 15 ตัวอย่าง) */
export function cstComputedPreviewRows(
  view: CstViewRow,
  maxSamples: number = CST_MAX_SAMPLES,
): CstComputedPreviewRow[] {
  const limit = Math.min(CST_MAX_SAMPLES, Math.max(1, maxSamples))
  const rows: CstComputedPreviewRow[] = []
  for (let i = 1; i <= limit; i++) {
    const ksc = view[`ksc${i}` as keyof CstViewRow] as number | null | undefined
    const density = view[`density${i}` as keyof CstViewRow] as number | null | undefined
    const adj = view[`adj${i}` as keyof CstViewRow] as number | null | undefined
    const wt = view[`wt${i}` as keyof CstViewRow] as number | null | undefined
    const kn = view[`kn${i}` as keyof CstViewRow] as number | null | undefined
    if (ksc == null && density == null && adj == null && wt == null && kn == null) continue
    rows.push({
      index: i,
      label: String(view[`sample${i}` as keyof CstViewRow] ?? i),
      density: density != null ? cstFormatNumber(density) : '—',
      ksc: ksc != null ? cstFormatNumber(ksc) : '—',
      adj: adj != null ? cstFormatNumber(adj) : '—',
    })
  }
  return rows
}

/** ค่าเฉลี่ย ksc ต่อชุด (3 ตัวอย่าง) จาก CST_View */
export function cstGroupAveragesFromView(
  view: CstViewRow,
  groupCount: number = CST_SAMPLE_GROUPS,
): { group: number; avg: string }[] {
  const out: { group: number; avg: string }[] = []
  for (let g = 1; g <= groupCount; g++) {
    const start = (g - 1) * CST_SAMPLES_PER_GROUP + 1
    const vals: number[] = []
    for (let i = start; i < start + CST_SAMPLES_PER_GROUP; i++) {
      const k = view[`ksc${i}` as keyof CstViewRow]
      if (typeof k === 'number' && !Number.isNaN(k)) vals.push(k)
    }
    if (vals.length) {
      out.push({ group: g, avg: cstFormatNumber(vals.reduce((a, b) => a + b, 0) / vals.length) })
    }
  }
  return out
}

export function cstViewRowToReportData(
  view: CstViewRow,
  request: RequestWithRelations,
): CstStrengthReportTemplateData {
  const activeCasting = activeCastingDateIso(request)
  const base = cstStrengthReportDataFromRequest(request, {
    castingDateFormatted: activeCasting
      ? formatDate(`${activeCasting}T12:00:00`)
      : view.casting_date
        ? formatDate(`${view.casting_date}T12:00:00`)
        : undefined,
    testDateFormatted: view.test_date ? formatDate(`${view.test_date}T12:00:00`) : undefined,
    age: view.age != null ? String(view.age) : undefined,
    reportNumber: view.report_no?.trim() ?? undefined,
    sampleType: view.sample_type?.trim() ?? undefined,
    testMachine: view.machine_name?.trim() ?? undefined,
    serialNo: view.machine_serial?.trim() ?? undefined,
    factor: view.k_display?.trim() || view.machine_k_formula?.trim() || undefined,
    volumeText:
      view.volume_confirm != null && !Number.isNaN(view.volume_confirm)
        ? cstFormatNumber(view.volume_confirm)
        : undefined,
  })

  const out: CstStrengthReportTemplateData = { ...base }

  const strengthType =
    view.strength_type?.trim() ||
    (request.mixcode as { strength_type?: string | null } | null | undefined)?.strength_type
  out.strengthUnit = cstStrengthUnitLabel(strengthType)
  if (view.age != null) {
    out.age = String(view.age)
    out.ageLabel = formatCstAgeLabel(view.age)
  }

  for (let i = 1; i <= CST_MAX_SAMPLES; i++) {
    const sk = `s${i}` as keyof CstStrengthReportTemplateData
    const wk = `w${i}` as keyof CstStrengthReportTemplateData
    const dk = `d${i}` as keyof CstStrengthReportTemplateData
    const fk = `f${i}` as keyof CstStrengthReportTemplateData
    const ak = `adj${i}` as keyof CstStrengthReportTemplateData
    const kk = `ksc${i}` as keyof CstStrengthReportTemplateData

    out[sk] = String(view[`sample${i}` as keyof CstViewRow] ?? '')
    out[wk] = cstFormatNumber(view[`wt${i}` as keyof CstViewRow] as number | null)
    out[dk] = cstFormatNumber(view[`density${i}` as keyof CstViewRow] as number | null)
    out[fk] = cstFormatNumber(view[`kn${i}` as keyof CstViewRow] as number | null)
    out[ak] = cstFormatNumber(view[`adj${i}` as keyof CstViewRow] as number | null)
    out[kk] = cstFormatNumber(kscAt(view, i))
  }

  for (let g = 1; g <= CST_SAMPLE_GROUPS; g++) {
    const avgKey = `avg${g}` as keyof CstStrengthReportTemplateData
    const rmkKey = `remark${g}` as keyof CstStrengthReportTemplateData
    out[avgKey] = groupKscAverage(view, g)
    out[rmkKey] = ''
  }

  return out
}
