import type { Profile, RequestWithRelations } from '@/types/app.types'

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
  return String(v)
}

function profileDisplayName(p: Profile | undefined): string {
  if (!p) return ''
  const a = p.fname?.trim() ?? ''
  const b = p.lname?.trim() ?? ''
  const name = [a, b].filter(Boolean).join(' ')
  return name || p.employee_id?.trim() || ''
}

export function defaultCstStrengthReportTemplateData(): CstStrengthReportTemplateData {
  return Object.fromEntries(CST_STRENGTH_REPORT_KEYS.map((k) => [k, ''])) as CstStrengthReportTemplateData
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

  const testDate = o.testDateFormatted?.trim() || req.request_date?.trim() || ''

  return {
    ...defaultCstStrengthReportTemplateData(),
    castingDate: o.castingDateFormatted?.trim() || req.casting_date?.trim() || '',
    testDate,
    age: o.age?.trim() || '28',
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
    testedByUnit: o.testedByUnit?.trim() ?? '',
    testedByName: o.testedByName?.trim() ?? profileDisplayName(req.inspected_by_profile),
    testedByRole: o.testedByRole?.trim() ?? '',
    reviewedByUnit: o.reviewedByUnit?.trim() ?? '',
    reviewedByName: o.reviewedByName?.trim() ?? '',
    reviewedByRole: o.reviewedByRole?.trim() ?? '',
    approvedByUnit: o.approvedByUnit?.trim() ?? '',
    approvedByName: o.approvedByName?.trim() ?? profileDisplayName(req.approved_by_profile),
    approvedByRole: o.approvedByRole?.trim() ?? '',
    documentNo: o.documentNo?.trim() ?? '',
    releaseInfo: o.releaseInfo?.trim() ?? '',
    pageNo: o.pageNo?.trim() ?? '1',
  }
}
