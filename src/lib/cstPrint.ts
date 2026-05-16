import {
  fillCstStrengthReportTemplate,
  loadCstStrengthReportTemplate,
} from '@/lib/cstStrengthReportTemplate'
import { cstViewRowToReportData } from '@/lib/cstForm'
import { fetchCstViewByRequestAndAge } from '@/lib/cstData'
import { injectPreviewScreenStyles } from '@/lib/localPrintChecklist'
import { supabase } from '@/lib/supabase'
import { shortId } from '@/lib/utils'
import type { RequestWithRelations } from '@/types/app.types'

export const CST_PREVIEW_PATH = '/print/cst'

const REQUEST_FOR_CST_PRINT_SELECT = `
  *,
  client:Client(id, client_name),
  location:Location(id, full_location, location1, location2, location3),
  concrete_work:"Concrete Works"(id, concrete_work),
  structure:Structure(id, structure_name),
  mixcode:"Mixed Code"(id, mixcode, strength, slump, strength_type, sample_type, supplier)
`

let templateCache: string | null = null

export function warmCstReportTemplateCache(): void {
  if (templateCache) return
  void loadCstStrengthReportTemplate().then((raw) => {
    templateCache = raw
  })
}

export async function fetchRequestForCstPrint(requestId: string): Promise<RequestWithRelations> {
  const { data, error } = await supabase
    .from('Request')
    .select(REQUEST_FOR_CST_PRINT_SELECT)
    .eq('id', requestId)
    .single()
  if (error) throw error
  if (!data) throw new Error('ไม่พบคำขอ')
  return data as RequestWithRelations
}

export async function buildCstReportHtml(
  request: RequestWithRelations,
  age: number,
): Promise<{ html: string; title: string }> {
  const view = await fetchCstViewByRequestAndAge(request.id, age)
  if (!view) throw new Error('ยังไม่มีผล CST — บันทึกก่อนพิมพ์รายงาน')

  const raw = templateCache ?? (await loadCstStrengthReportTemplate())
  templateCache = raw
  const data = cstViewRowToReportData(view, request)
  const filled = fillCstStrengthReportTemplate(raw, data)
  const label = view.report_no?.trim() || `+${age}d`

  return {
    html: injectPreviewScreenStyles(filled),
    title: `CST · ${shortId(request.id)} · ${label}`,
  }
}

export async function loadCstPreviewForRequest(
  requestId: string,
  age: number,
): Promise<{ html: string; title: string }> {
  const [req] = await Promise.all([
    fetchRequestForCstPrint(requestId),
    loadCstStrengthReportTemplate().then((raw) => {
      templateCache = raw
    }),
  ])
  return buildCstReportHtml(req, age)
}

export function openCstPrintPreview(requestId: string, age: number): void {
  const url = `${window.location.origin}${CST_PREVIEW_PATH}?requestId=${encodeURIComponent(requestId)}&age=${encodeURIComponent(String(age))}`
  const win = window.open(url, '_blank')
  if (!win) {
    throw new Error('ไม่สามารถเปิดแท็บใหม่ได้ — กรุณาอนุญาตป๊อปอัป/แท็บใหม่')
  }
}

/** เปิดแท็บพรีวิวรายงาน CST จากเทมเพลต `public/templates/cst-strength-report.html` */
export function localPrintCstReport(request: RequestWithRelations, age: number): void {
  openCstPrintPreview(request.id, age)
}
