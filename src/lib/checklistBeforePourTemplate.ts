import { formatDate } from '@/lib/utils'
import type { Profile, RequestWithRelations } from '@/types/app.types'

type BookerProfileWithJob = Profile & {
  job?: { job_name?: string | null } | null
}

/** Path under `public/` — served as static file by Vite */
export const CHECKLIST_BEFORE_POUR_TEMPLATE_PATH = '/templates/checklist-before-concrete-placement.html'

/** ค่าท้ายฟอร์มคงที่ — F-INS-ST-DC3-01 */
export const CHECKLIST_TEMPLATE_STATIC_DEFAULTS = {
  documentNo: 'F-INS-ST-DC3-01',
  issueNo: 'Issue No.1',
  issueDate: '25 Feb. 2022',
  contractorUnit: 'JV CKST-DC3',
  consultantUnit: 'CSC C3',
} as const

export interface ChecklistBeforePourTemplateData {
  pageCurrent: string
  pageTotal: string
  /** ชื่อโครงการ (หัวฟอร์ม) */
  clientName: string
  /** ชื่องาน — Concrete work */
  workName: string
  /** ชนิดโครงสร้าง — Structure */
  structureType: string
  locationText: string
  structureNo: string
  /** เทคอนกรีตครั้งที่ */
  pourSequence: string
  /** ชั้นที่ */
  floorLevel: string
  requestDate: string
  /** วันที่ลายเซ็น — ใช้วันที่ตรวจสอบจากคำขอ */
  signDate: string
  /** @deprecated คงไว้เพื่อ backward compat — ชื่อ Structure */
  structureName: string
  concreteGrade: string
  remarks: string
  /** @deprecated ยังไม่ใช้ — ชื่อผู้ตรวจฝั่งผู้รับจ้าง */
  inspectorName: string
  /** @deprecated ยังไม่ใช้ */
  inspectorTitle: string
  /** @deprecated ยังไม่ใช้ — ชื่อผู้ตรวจฝั่งที่ปรึกษา */
  witnessName: string
  /** @deprecated ยังไม่ใช้ */
  witnessTitle: string
  contractorUnit: string
  consultantUnit: string
  /** @deprecated ไม่แสดงบนแบบ F-INS-ST-DC3-01 */
  contractorName: string
  /** @deprecated ไม่แสดงบนแบบ F-INS-ST-DC3-01 */
  consultantName: string
  documentNo: string
  issueNo: string
  issueDate: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** ชื่อโครงการบนหัวฟอร์ม — รวมเป็นบรรทัดเดียว */
export function formatChecklistProjectNameDisplay(name: string): string {
  return name.replace(/\s*\n+\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatLocation(req: RequestWithRelations): string {
  const loc = req.location
  if (!loc) return ''
  const full = loc.full_location?.trim()
  if (full) return full
  return [loc.location1, loc.location2, loc.location3].filter(Boolean).join(' ')
}

/** แสดงบนฟอร์มเป็น "300 ksc." ตามแบบ F-INS-ST-DC3-01 */
export function formatChecklistConcreteGradeDisplay(grade: string): string {
  const g = grade.trim()
  if (!g) return ''
  if (/\bksc\.?/i.test(g)) return g.endsWith('.') ? g : `${g}.`
  return `${g} ksc.`
}

function formatConcreteGrade(req: RequestWithRelations): string {
  const m = req.mixcode
  if (m?.strength != null && !Number.isNaN(m.strength)) {
    const t = m.strength_type?.trim()
    return t ? `${m.strength} ${t}` : String(m.strength)
  }
  if (req.strength != null && !Number.isNaN(req.strength)) return String(req.strength)
  return ''
}

/** โครงการ (Jobs) จากโปรไฟล์ผู้จอง */
function bookerProjectName(req: RequestWithRelations): string {
  const p = req.booked_by_profile as BookerProfileWithJob | undefined
  return p?.job?.job_name?.trim() ?? ''
}

/** วันที่แสดงบนฟอร์ม checklist — รูปแบบ dd/MM/yyyy */
export function formatChecklistDisplayDate(
  date: string | Date | null | undefined,
): string {
  return formatDate(date)
}

/** วันที่ตรวจสอบ — postpone_date แล้ว request_date / casting_date */
export function formatChecklistInspectionDate(req: RequestWithRelations): string {
  const raw =
    req.postpone_date?.trim() || req.request_date?.trim() || req.casting_date?.trim() || ''
  return raw ? formatChecklistDisplayDate(raw) : ''
}

export async function loadChecklistBeforePourTemplate(): Promise<string> {
  const res = await fetch(CHECKLIST_BEFORE_POUR_TEMPLATE_PATH)
  if (!res.ok) throw new Error(`Failed to load checklist template: ${res.status}`)
  return res.text()
}

/** Replace `{{key}}` placeholders in the HTML string. */
export function fillChecklistBeforePourTemplate(
  html: string,
  data: ChecklistBeforePourTemplateData,
): string {
  const map: Record<string, string> = {
    pageCurrent: escapeHtml(data.pageCurrent),
    pageTotal: escapeHtml(data.pageTotal),
    clientName: escapeHtml(formatChecklistProjectNameDisplay(data.clientName)),
    workName: escapeHtml(data.workName),
    structureType: escapeHtml(data.structureType),
    locationText: escapeHtml(data.locationText),
    structureNo: escapeHtml(data.structureNo),
    pourSequence: escapeHtml(data.pourSequence),
    floorLevel: escapeHtml(data.floorLevel),
    requestDate: escapeHtml(data.requestDate),
    signDate: escapeHtml(data.signDate),
    structureName: escapeHtml(data.structureName),
    concreteGrade: escapeHtml(data.concreteGrade),
    concreteGradeDisplay: escapeHtml(formatChecklistConcreteGradeDisplay(data.concreteGrade)),
    remarks: escapeHtml(data.remarks),
    inspectorName: escapeHtml(data.inspectorName),
    inspectorTitle: escapeHtml(data.inspectorTitle),
    witnessName: escapeHtml(data.witnessName),
    witnessTitle: escapeHtml(data.witnessTitle),
    contractorUnit: escapeHtml(data.contractorUnit),
    consultantUnit: escapeHtml(data.consultantUnit),
    contractorName: escapeHtml(data.contractorName),
    consultantName: escapeHtml(data.consultantName),
    documentNo: escapeHtml(data.documentNo),
    issueNo: escapeHtml(data.issueNo),
    issueDate: escapeHtml(data.issueDate),
  }
  let out = html
  for (const [key, val] of Object.entries(map)) {
    out = out.split(`{{${key}}}`).join(val)
  }
  return out
}

export interface ChecklistFromRequestOptions {
  /** วันที่แสดงในฟอร์ม (เช่น format ไทยแล้ว) — ถ้าไม่ส่ง ใช้ `request_date` ดิบ */
  requestDateFormatted?: string
  /** @deprecated ยังไม่ใช้ */
  witnessName?: string
  /** @deprecated ยังไม่ใช้ */
  inspectorNameOverride?: string
  pageCurrent?: string
  pageTotal?: string
}

/** แมปจากคำขอในระบบ → ข้อมูลเทมเพลต */
export function checklistTemplateDataFromRequest(
  req: RequestWithRelations,
  options?: ChecklistFromRequestOptions,
): ChecklistBeforePourTemplateData {
  const concreteWorkName = req.concrete_work?.concrete_work?.trim() ?? ''
  const structureName = req.structure?.structure_name?.trim() ?? ''
  const structureNo = req.structure_no?.trim() ?? ''
  const inspectionDate =
    options?.requestDateFormatted?.trim() || formatChecklistInspectionDate(req)
  return {
    pageCurrent: options?.pageCurrent ?? '1',
    pageTotal: options?.pageTotal ?? '1',
    clientName: bookerProjectName(req),
    workName: concreteWorkName,
    structureType: structureName,
    locationText: formatLocation(req),
    structureNo,
    pourSequence: '',
    floorLevel: '',
    requestDate: inspectionDate,
    signDate: inspectionDate,
    structureName,
    concreteGrade: formatConcreteGrade(req),
    remarks: req.remarks?.trim() ?? '',
    inspectorName: '',
    inspectorTitle: '',
    witnessName: '',
    witnessTitle: '',
    contractorUnit: CHECKLIST_TEMPLATE_STATIC_DEFAULTS.contractorUnit,
    consultantUnit: CHECKLIST_TEMPLATE_STATIC_DEFAULTS.consultantUnit,
    contractorName: '',
    consultantName: '',
    documentNo: CHECKLIST_TEMPLATE_STATIC_DEFAULTS.documentNo,
    issueNo: CHECKLIST_TEMPLATE_STATIC_DEFAULTS.issueNo,
    issueDate: CHECKLIST_TEMPLATE_STATIC_DEFAULTS.issueDate,
  }
}
