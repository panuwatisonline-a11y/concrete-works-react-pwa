import { formatDate } from '@/lib/utils'
import type { Profile, RequestWithRelations } from '@/types/app.types'

type BookerProfileWithJob = Profile & {
  job?: { job_name?: string | null } | null
}

/** Path under `public/` — served as static file by Vite */
export const CHECKLIST_BEFORE_POUR_TEMPLATE_PATH = '/templates/checklist-before-concrete-placement.html'

export interface ChecklistBeforePourTemplateData {
  pageCurrent: string
  pageTotal: string
  clientName: string
  locationText: string
  structureNo: string
  requestDate: string
  structureName: string
  concreteGrade: string
  remarks: string
  inspectorName: string
  witnessName: string
}

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

/** วันที่ตรวจสอบ — เลื่อนวันก่อน แล้ว request_date / casting_date */
export function formatChecklistInspectionDate(req: RequestWithRelations): string {
  const raw =
    req.postpone_date?.trim() || req.request_date?.trim() || req.casting_date?.trim() || ''
  return raw ? formatDate(raw) : ''
}

function profileDisplayName(p: Profile | undefined): string {
  if (!p) return ''
  const a = p.fname?.trim() ?? ''
  const b = p.lname?.trim() ?? ''
  const name = [a, b].filter(Boolean).join(' ')
  return name || p.employee_id?.trim() || ''
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
    clientName: escapeHtml(data.clientName),
    locationText: escapeHtml(data.locationText),
    structureNo: escapeHtml(data.structureNo),
    requestDate: escapeHtml(data.requestDate),
    structureName: escapeHtml(data.structureName),
    concreteGrade: escapeHtml(data.concreteGrade),
    remarks: escapeHtml(data.remarks),
    inspectorName: escapeHtml(data.inspectorName),
    witnessName: escapeHtml(data.witnessName),
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
  witnessName?: string
  inspectorNameOverride?: string
  pageCurrent?: string
  pageTotal?: string
}

/** แมปจากคำขอในระบบ → ข้อมูลเทมเพลต */
export function checklistTemplateDataFromRequest(
  req: RequestWithRelations,
  options?: ChecklistFromRequestOptions,
): ChecklistBeforePourTemplateData {
  const structureName = req.structure?.structure_name?.trim() ?? ''
  const structureNo = req.structure_no?.trim() ?? ''
  const inspectorName =
    options?.inspectorNameOverride?.trim() ||
    profileDisplayName(req.inspected_by_profile) ||
    profileDisplayName(req.booked_by_profile)

  return {
    pageCurrent: options?.pageCurrent ?? '1',
    pageTotal: options?.pageTotal ?? '1',
    clientName: bookerProjectName(req),
    locationText: formatLocation(req),
    structureNo,
    requestDate:
      options?.requestDateFormatted?.trim() || formatChecklistInspectionDate(req),
    structureName,
    concreteGrade: formatConcreteGrade(req),
    remarks: req.remarks?.trim() ?? '',
    inspectorName,
    witnessName: '',
  }
}
