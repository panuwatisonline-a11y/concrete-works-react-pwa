import {
  fillChecklistBeforePourTemplate,
  loadChecklistBeforePourTemplate,
  checklistTemplateDataFromRequest,
} from '@/lib/checklistBeforePourTemplate'
import { supabase } from '@/lib/supabase'
import { shortId } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'
import { injectChecklistDocumentStyles } from '@/lib/localPrintChecklist'

export const CHECKLIST_PREVIEW_PATH = '/print/checklist'

const REQUEST_FOR_CHECKLIST_SELECT = `
  *,
  client:Client(id, client_name),
  location:Location(id, full_location, location1, location2, location3),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type),
  booked_by_profile:profiles!booked_by(fname, lname, employee_id, job_id, job:Jobs(job_name)),
  inspected_by_profile:profiles!inspected_by(fname, lname, employee_id)
`

let templateCache: string | null = null

export function warmChecklistTemplateCache(): void {
  if (templateCache) return
  void loadChecklistBeforePourTemplate().then((raw) => {
    templateCache = raw
  })
}

export async function fetchRequestForChecklist(requestId: string): Promise<RequestWithRelations> {
  const { data, error } = await supabase
    .from('Request')
    .select(REQUEST_FOR_CHECKLIST_SELECT)
    .eq('id', requestId)
    .single()
  if (error) throw error
  if (!data) throw new Error('ไม่พบคำขอ')
  return data as RequestWithRelations
}

export async function loadChecklistPreviewForRequest(
  requestId: string,
): Promise<{ html: string; title: string }> {
  const [req] = await Promise.all([
    fetchRequestForChecklist(requestId),
    loadChecklistBeforePourTemplate().then((raw) => {
      templateCache = raw
    }),
  ])
  return buildChecklistPreviewDoc(req)
}

export async function buildChecklistPreviewDoc(
  req: RequestWithRelations,
): Promise<{ html: string; title: string }> {
  const raw = templateCache ?? (await loadChecklistBeforePourTemplate())
  templateCache = raw
  const filled = fillChecklistBeforePourTemplate(raw, checklistTemplateDataFromRequest(req))
  return {
    html: injectChecklistDocumentStyles(filled),
    title: `Checklist · ${shortId(req.id)}`,
  }
}

export function openChecklistPrintPreview(requestId: string): void {
  const url = `${window.location.origin}${CHECKLIST_PREVIEW_PATH}?requestId=${encodeURIComponent(requestId)}`
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

/** เปิดแท็บพรีวิว — แท็บใหม่โหลดข้อมูลเองจาก requestId */
export function localPrintChecklist(req: RequestWithRelations): void {
  openChecklistPrintPreview(req.id)
}
