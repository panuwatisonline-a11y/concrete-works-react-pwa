import { activeCastingDateIso } from '@/lib/activeCastingDate'
import type { RequestWithRelations } from '@/types/app.types'

/** Path under `public/` — served as static file by Vite */
export const CST_STRENGTH_REPORT_TEMPLATE_PATH = '/templates/cst-strength-report.html'

function cstTemplateKeys() {
  const row: string[] = []
  for (let i = 1; i <= 15; i++) {
    row.push(`s${i}`, `w${i}`, `d${i}`, `f${i}`, `adj${i}`, `ksc${i}`)
  }
  const grp: string[] = []
  for (let g = 1; g <= 5; g++) {
    grp.push(`avg${g}`, `remark${g}`)
  }
  return [
    'castingDate',
    'testDate',
    'age',
    'ageLabel',
    'strengthUnit',
    'reportNumber',
    'concreteWork',
    'structureName',
    'locationText',
    'structureNo',
    'mixcode',
    'strength',
    'slump',
    'volume',
    'supplier',
    'sampleType',
    'testMachine',
    'serialNo',
    'factor',
    ...row,
    ...grp,
    'testedByUnit',
    'testedByName',
    'testedByRole',
    'reviewedByUnit',
    'reviewedByName',
    'reviewedByRole',
    'approvedByUnit',
    'approvedByName',
    'approvedByRole',
    'documentNo',
    'releaseInfo',
    'pageNo',
  ] as const
}

const CST_STRENGTH_REPORT_KEYS = cstTemplateKeys()

export type CstStrengthReportTemplateKey = (typeof CST_STRENGTH_REPORT_KEYS)[number]
export type CstStrengthReportTemplateData = Record<CstStrengthReportTemplateKey, string>

/** ค่าคงที่ในเทมเพลตรายงาน CST (ลายเซ็น / ท้ายเอกสาร) */
export const CST_REPORT_TEMPLATE_STATIC_DEFAULTS = {
  testedByUnit: 'CKST-DC3',
  testedByName: 'นางสาวบุญเจริญ บุญเลิศ',
  testedByRole: 'Technician Lab Concrete',
  reviewedByUnit: 'CKST-DC3',
  reviewedByName: 'นางสาวไปรดา ลิขิตหัดศิลป',
  reviewedByRole: 'QC Lab Engineer',
  approvedByUnit: 'CSC3',
  approvedByName: 'นายธนวัฒน์ ดาศักดิ์',
  approvedByRole: 'Material Specialist',
  documentNo: 'F-LAB-ST-DC3-01',
  releaseInfo: 'Issue No. 1 Date: 24 Apr. 2026',
  pageNo: 'Page 1 of 1',
} as const satisfies Partial<CstStrengthReportTemplateData>

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatLocation(req: RequestWithRelations): string {
  const loc = req.location
  if (!loc) return ''
  const full = loc.full_location?.trim()
  if (full) return full
  return [loc.location1, loc.location2, loc.location3].filter(Boolean).join(' ')
}

/** 1 Day / 3 Days สำหรับหัวรายงาน */
export function formatCstAgeLabel(age: string | number | null | undefined): string {
  const n = typeof age === 'number' ? age : Number(String(age ?? '').trim())
  if (!Number.isFinite(n)) return ''
  return `${n} ${n === 1 ? 'Day' : 'Days'}`
}

/** หน่วยกำลังอัดจาก Mixed Code (เช่น ksc., MPa.) */
export function cstStrengthUnitLabel(strengthType: string | null | undefined): string {
  const raw = strengthType?.trim() ?? ''
  if (!raw) return 'ksc'
  return raw.replace(/\.+$/, '')
}

function formatStrength(req: RequestWithRelations): string {
  const m = req.mixcode
  if (m?.strength != null && !Number.isNaN(m.strength)) {
    const t = m.strength_type?.trim()
    return t ? `${m.strength} ${t}` : String(m.strength)
  }
  if (req.strength != null && !Number.isNaN(req.strength)) return String(req.strength)
  return ''
}

function formatVolume(req: RequestWithRelations): string {
  const v = req.volume_actual ?? req.volume_request
  if (v == null || Number.isNaN(v)) return ''
  return v.toFixed(2)
}

export function defaultCstStrengthReportTemplateData(): CstStrengthReportTemplateData {
  return {
    ...(Object.fromEntries(CST_STRENGTH_REPORT_KEYS.map((k) => [k, ''])) as CstStrengthReportTemplateData),
    ...CST_REPORT_TEMPLATE_STATIC_DEFAULTS,
  }
}

export async function loadCstStrengthReportTemplate(): Promise<string> {
  const res = await fetch(CST_STRENGTH_REPORT_TEMPLATE_PATH)
  if (!res.ok) throw new Error(`Failed to load CST strength report template: ${res.status}`)
  return res.text()
}

/** Replace `{{key}}` placeholders; merges with empty defaults for omitted keys. */
export function fillCstStrengthReportTemplate(
  html: string,
  data: Partial<CstStrengthReportTemplateData>,
): string {
  const full = { ...defaultCstStrengthReportTemplateData(), ...data }
  let out = html
  for (const key of CST_STRENGTH_REPORT_KEYS) {
    out = out.split(`{{${key}}}`).join(escapeHtml(full[key] ?? ''))
  }
  return out
}

export interface CstStrengthReportFromRequestOptions {
  castingDateFormatted?: string
  testDateFormatted?: string
  age?: string
  reportNumber?: string
  sampleType?: string
  testMachine?: string
  serialNo?: string
  factor?: string
  volumeText?: string
  testedByUnit?: string
  testedByName?: string
  testedByRole?: string
  reviewedByUnit?: string
  reviewedByName?: string
  reviewedByRole?: string
  approvedByUnit?: string
  approvedByName?: string
  approvedByRole?: string
  documentNo?: string
  releaseInfo?: string
  pageNo?: string
}

/** Map คำขอในระบบ → ข้อมูลเทมเพลต (ช่องตารางผลทดสอบให้ว่าง — กรอกจากระบบแล็บภายหลังได้) */
export function cstStrengthReportDataFromRequest(
  req: RequestWithRelations,
  options?: CstStrengthReportFromRequestOptions,
): CstStrengthReportTemplateData {
  const o = options ?? {}
  const mix = req.mixcode
  const sq = req.sample_qty
  const sampleTypeDefault =
    mix?.sample_type?.trim() ||
    (sq != null && !Number.isNaN(sq) ? `จำนวนตัวอย่าง ${sq}` : '')

  const testDate = o.testDateFormatted?.trim() || ''
  const ageStr = o.age?.trim() || '28'
  const strengthUnit = cstStrengthUnitLabel(mix?.strength_type)

  const out: CstStrengthReportTemplateData = {
    ...defaultCstStrengthReportTemplateData(),
    castingDate:
      o.castingDateFormatted?.trim() || activeCastingDateIso(req) || req.casting_date?.trim() || '',
    testDate,
    age: ageStr,
    ageLabel: formatCstAgeLabel(ageStr),
    strengthUnit,
    reportNumber: o.reportNumber?.trim() || req.id?.trim() || '',
    concreteWork: req.concrete_work?.concrete_work?.trim() ?? '',
    structureName: req.structure?.structure_name?.trim() ?? '',
    locationText: formatLocation(req),
    structureNo: req.structure_no?.trim() ?? '',
    mixcode: mix?.mixcode?.trim() ?? '',
    strength: formatStrength(req),
    slump: mix?.slump?.trim() ?? '',
    volume: o.volumeText?.trim() ?? formatVolume(req),
    supplier: mix?.supplier?.trim() ?? '',
    sampleType: o.sampleType?.trim() ?? sampleTypeDefault,
    testMachine: o.testMachine?.trim() ?? '',
    serialNo: o.serialNo?.trim() ?? '',
    factor: o.factor?.trim() ?? '',
  }

  const staticKeys = Object.keys(CST_REPORT_TEMPLATE_STATIC_DEFAULTS) as Array<
    keyof typeof CST_REPORT_TEMPLATE_STATIC_DEFAULTS
  >
  for (const key of staticKeys) {
    const override = o[key as keyof CstStrengthReportFromRequestOptions]
    if (typeof override === 'string' && override.trim()) {
      out[key] = override.trim()
    }
  }

  return out
}
